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

/**
 * Ein Fenster an den Kanal hängen.
 *
 * `user` und `campaignId` werden beim Verbinden *festgehalten*, nicht bei
 * jedem Ereignis neu nachgeschlagen – das ist billig, heißt aber auch: Ändert
 * sich danach, wer jemand ist (Rolle entzogen, abgemeldet, aus der Kampagne
 * genommen), hört das offene Fenster mit dem alten Stand weiter mit. Wer so
 * etwas ändert, muss deshalb `trenne()` rufen; auth.js und die Wege der
 * Kampagnen tun das. Der Browser klopft danach von selbst wieder an und
 * bekommt den neuen Stand – oder, ohne gültige Sitzung, gar keinen Kanal.
 */
export function addClient(req, res, user, campaignId) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Falls doch einmal ein Proxy dazwischensteht, der puffern möchte.
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const client = { id: nextClientId++, res, user, campaignId, sitzung: req.sessionToken ?? null };
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
    broadcast('anwesenheit', presence(campaignId), { campaignId });
  };
  // Am Antwortstrom horchen, nicht an der Anfrage: `req` meldet sein 'close'
  // je nach Node-Fassung schon, wenn der (leere) Rumpf gelesen ist, `res`
  // erst, wenn die Verbindung wirklich weg ist.
  res.on('close', close);
  res.on('error', close);

  broadcast('anwesenheit', presence(campaignId), { campaignId });
  return client;
}

/**
 * Schickt ein Ereignis an alle passenden Fenster.
 *
 * @param {string} event Name des Ereignisses, z. B. 'charakter:aktualisiert'
 * @param {unknown} data Nutzlast
 * @param {object} [options]
 * @param {boolean} [options.dmOnly] nur an die Spielleitung
 * @param {'sl'|'spieler'} [options.role] nur an eine Rolle
 * @param {string[]} [options.userIds] nur an bestimmte Konten
 * @param {number} [options.exceptClient] ein Fenster auslassen (der Auslöser)
 * @param {string} [options.campaignId] nur an Fenster in dieser Kampagne
 */
export function broadcast(event, data, options = {}) {
  const { dmOnly = false, role = null, userIds = null, exceptClient = null, campaignId = undefined } = options;
  for (const client of clients) {
    if (dmOnly && client.user?.role !== 'sl') continue;
    if (role && client.user?.role !== role) continue;
    if (userIds && !userIds.includes(client.user?.id)) continue;
    if (exceptClient && client.id === exceptClient) continue;
    // Kein campaignId angegeben heißt: rundenweites Ereignis (Konten, Einladungen) –
    // das geht an alle, unabhängig davon, wer gerade in welcher Kampagne steckt.
    if (campaignId !== undefined && client.campaignId !== campaignId) continue;
    write(client, event, data);
  }
}

/**
 * Offene Fenster schließen, auf die die Auswahl passt – alle Angaben müssen
 * zutreffen.
 *
 * @param {object} auswahl
 * @param {string} [auswahl.userId]     alle Fenster dieses Kontos
 * @param {string} [auswahl.sitzung]    alle Fenster dieser einen Anmeldung
 * @param {string} [auswahl.campaignId] alle Fenster in dieser Kampagne
 * @returns {number} wie viele geschlossen wurden
 */
export function trenne({ userId, sitzung, campaignId } = {}) {
  // Ohne jede Angabe würde alles getrennt – das ist nie gemeint.
  if (userId === undefined && sitzung === undefined && campaignId === undefined) return 0;
  let getrennt = 0;
  // Gestrichen wird im 'close'-Handler. Selbst wenn der schon während dieser
  // Schleife liefe: Ein Set verträgt das Löschen beim Durchlaufen.
  for (const client of clients) {
    if (userId !== undefined && client.user?.id !== userId) continue;
    if (sitzung !== undefined && client.sitzung !== sitzung) continue;
    if (campaignId !== undefined && client.campaignId !== campaignId) continue;
    // Das Aufräumen (Menge, Anwesenheit) erledigt der 'close'-Handler oben.
    client.res.end();
    getrennt += 1;
  }
  return getrennt;
}

/** Wer ist gerade in dieser Kampagne am Tisch? Mehrere Fenster einer Person zählen einmal. */
export function presence(campaignId) {
  const byUser = new Map();
  for (const client of clients) {
    if (!client.user) continue;
    if (client.campaignId !== campaignId) continue;
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
