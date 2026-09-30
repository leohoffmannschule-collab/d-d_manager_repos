/**
 * Der gemeinsame Unterbau aller Aufrufe an den Server: `request` und die
 * vier Kurzformen `post`, `put`, `patch`, `del`.
 *
 * Hier und nur hier wird `fetch` aufgerufen. Hier wird das Anmelde-Cookie
 * mitgeschickt, die Kennung des eigenen Fensters angeheftet und aus einer
 * Absage des Servers ein Fehler mit `status` und `code` gemacht – für alle
 * Wege gleich.
 */

/** Wo die Schnittstelle liegt – relativ, damit sie hinter jedem Tunnel stimmt. */
export const API_BASE = '/api';

// Kennung des eigenen Fensters am Live-Kanal. Der Server schickt Änderungen
// mit dieser Kennung nicht an uns zurück – sonst würde eine gezogene Figur
// kurz zurückspringen, weil das eigene Echo eintrifft.
let clientId = null;
/** Die eigene Kennung setzen – einmal, sobald der Live-Kanal sie mitteilt (lib/live.jsx). */
export function setClientId(id) {
  clientId = id;
}

/**
 * Der gemeinsame Unterbau aller Aufrufe.
 *
 * `credentials: 'same-origin'` ist die wichtigste Zeile: Nur damit schickt
 * der Browser das Anmelde-Cookie mit. Ohne sie käme von jedem Weg ein 401
 * zurück, obwohl man angemeldet ist – ein Fehler, den man lange sucht.
 */
export async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  if (clientId) headers['X-Fenster'] = String(clientId);

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers,
  });

  // fetch wirft nur, wenn gar keine Antwort kommt. Ein 404 oder 403 gilt
  // ihm als erfolgreich zugestellt – deshalb wird der Status hier von Hand
  // geprüft und in einen Fehler verwandelt, den ein `catch` auffängt.
  if (!res.ok) {
    let message = `Anfrage fehlgeschlagen (${res.status})`;
    let code = null;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      if (body?.code) code = body.code;
    } catch {
      // ignore
    }
    // Der Schlüssel ist das Verlässliche: Er bleibt, auch wenn der Text sich
    // ändert oder übersetzt wird. Siehe lib/beschriftung.js.
    const error = new Error(message);
    error.status = res.status;
    error.code = code;
    throw error;
  }
  // 204 heißt „hat geklappt, es gibt nichts zurückzugeben“ – der Rumpf ist
  // leer, und res.json() würde daran scheitern.
  if (res.status === 204) return null;
  return res.json();
}

// Eine Funktion, die Funktionen baut: `senden('POST')` gibt eine Funktion
// zurück, die mit POST schickt. Spart vier fast gleiche Fassungen.
const senden = (method) => (path, payload) =>
  request(path, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });

/** Schicken mit POST – anlegen und auslösen. */
export const post = senden('POST');
/** Schicken mit PUT – einen Eintrag als Ganzes ersetzen. */
export const put = senden('PUT');
/** Schicken mit PATCH – einzelne Felder ändern. */
export const patch = senden('PATCH');
// Löschen trägt in der Regel nichts bei sich – außer dort, wo der Server eine
// ausdrückliche Bestätigung verlangt (etwa den abgetippten Kampagnennamen).
export const del = senden('DELETE');
