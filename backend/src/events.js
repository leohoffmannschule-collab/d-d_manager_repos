/**
 * Live-Übertragung an alle offenen Fenster – per Server-Sent Events.
 *
 * Warum SSE und nicht WebSockets? Es braucht keine zusätzliche Bibliothek,
 * es ist gewöhnliches HTTP (geht also ohne Sonderbehandlung durch den
 * Cloudflare-Tunnel) und der Browser baut die Verbindung nach einem
 * Funkloch von allein wieder auf. Geschrieben wird ohnehin über die
 * normalen REST-Aufrufe – dieser Kanal trägt nur Änderungen zurück.
 */

let nextClientId = 1;
const clients = new Set();

const HEARTBEAT_MS = 25_000;

function write(client, event, data) {
  try {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Verbindung ist weg; das Aufräumen übernimmt der 'close'-Handler.
  }
}

export function addClient(req, res, user) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Falls doch einmal ein Proxy dazwischensteht, der puffern möchte.
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const client = { id: nextClientId++, res, user };
  clients.add(client);

  // Ein erster Datensatz, damit der Browser die Verbindung als offen ansieht,
  // und der Wunsch, nach 3 Sekunden erneut anzuklopfen.
  res.write('retry: 3000\n\n');
  write(client, 'willkommen', { clientId: client.id, user });

  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      /* siehe oben */
    }
  }, HEARTBEAT_MS);

  const close = () => {
    clearInterval(heartbeat);
    clients.delete(client);
    broadcast('anwesenheit', presence());
  };
  req.on('close', close);
  req.on('error', close);

  broadcast('anwesenheit', presence());
  return client;
}

/**
 * Schickt ein Ereignis an alle passenden Fenster.
 *
 * @param {string} event Name des Ereignisses, z. B. 'kampf:aktualisiert'
 * @param {unknown} data Nutzlast
 * @param {object} [options]
 * @param {boolean} [options.dmOnly] nur an die Spielleitung
 * @param {'sl'|'spieler'} [options.role] nur an eine Rolle
 * @param {string[]} [options.userIds] nur an bestimmte Konten
 * @param {number} [options.exceptClient] ein Fenster auslassen (der Auslöser)
 */
export function broadcast(event, data, options = {}) {
  const { dmOnly = false, role = null, userIds = null, exceptClient = null } = options;
  for (const client of clients) {
    if (dmOnly && client.user?.role !== 'sl') continue;
    if (role && client.user?.role !== role) continue;
    if (userIds && !userIds.includes(client.user?.id)) continue;
    if (exceptClient && client.id === exceptClient) continue;
    write(client, event, data);
  }
}

/** Wer ist gerade am Tisch? Mehrere Fenster einer Person zählen einmal. */
export function presence() {
  const byUser = new Map();
  for (const client of clients) {
    if (!client.user) continue;
    const existing = byUser.get(client.user.id);
    if (existing) {
      existing.fenster += 1;
      continue;
    }
    byUser.set(client.user.id, { ...client.user, fenster: 1 });
  }
  return [...byUser.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}

/**
 * Die auslösende Person schickt ihre Fensterkennung im Kopf `X-Fenster` mit,
 * damit sie ihr eigenes Echo nicht noch einmal einspielt (sichtbar z. B.
 * beim Ziehen einer Figur, die sonst kurz zurückspringt).
 */
export function originClient(req) {
  const raw = req.get?.('X-Fenster') ?? req.headers['x-fenster'];
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
