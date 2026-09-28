/**
 * Der einzige Ort, an dem diese Oberfläche den Server anspricht.
 *
 * Jede Funktion hier ist ein Weg des Servers, eins zu eins. Kein Bauteil
 * ruft `fetch` selbst auf – das hat zwei handfeste Gründe: Ändert sich ein
 * Weg, ist diese Datei die einzige Baustelle; und die Fehlerbehandlung
 * unten gilt damit für alle Aufrufe gleichermaßen.
 *
 * Wer wissen will, was der Server zu einem Weg sagt, findet die Beschreibung
 * in docs/API.md und den Code in backend/src/routes/.
 */
const API_BASE = '/api';

// Kennung des eigenen Fensters am Live-Kanal. Der Server schickt Änderungen
// mit dieser Kennung nicht an uns zurück – sonst würde eine gezogene Figur
// kurz zurückspringen, weil das eigene Echo eintrifft.
let clientId = null;
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
async function request(path, options = {}) {
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

const post = senden('POST');
const put = senden('PUT');
const patch = senden('PATCH');
// Löschen trägt in der Regel nichts bei sich – außer dort, wo der Server eine
// ausdrückliche Bestätigung verlangt (etwa den abgetippten Kampagnennamen).
const del = senden('DELETE');

/* --- Die Wege, nach Sachgebieten sortiert -------------------------------- */

/** Anmelden, Konten, Einladungscodes. */
export const authApi = {
  status: () => request('/auth/status'),
  login: (name, password) => post('/auth/login', { name, password }),
  register: (payload) => post('/auth/register', payload),
  logout: () => post('/auth/logout'),
  changePassword: (current, next) => post('/auth/password', { current, next }),
  users: () => request('/auth/users'),
  updateUser: (id, payload) => patch(`/auth/users/${id}`, payload),
  removeUser: (id) => del(`/auth/users/${id}`),
  invites: () => request('/auth/invites'),
  createInvite: (note) => post('/auth/invites', { note }),
  removeInvite: (code) => del(`/auth/invites/${code}`),
};

/** Kampagnen: anlegen, wechseln, umbenennen, wegräumen, übernehmen. */
export const campaignsApi = {
  list: () => request('/campaigns'),
  create: (name) => post('/campaigns', { name }),
  activate: (id) => post(`/campaigns/${id}/aktiv`),
  rename: (id, name) => patch(`/campaigns/${id}`, { name }),
  members: (id) => request(`/campaigns/${id}/mitglieder`),
  addMember: (id, userId) => post(`/campaigns/${id}/mitglieder`, { userId }),
  removeMember: (id, userId) => del(`/campaigns/${id}/mitglieder/${userId}`),
  // Der Name wandert als Bestätigung mit – ohne ihn weist der Server ab.
  remove: (id, name) => del(`/campaigns/${id}`, { name }),
  papierkorb: () => request('/campaigns/papierkorb'),
  // Was liegt in dieser Kampagne – und alles davon in eine andere legen.
  umfang: () => request('/campaigns/umfang'),
  uebernehmen: (campaignId, arten) => post('/campaigns/uebernehmen', { campaignId, arten }),
  restore: (id) => post(`/campaigns/${id}/wiederherstellen`),
  purge: (id, name) => del(`/campaigns/${id}/endgueltig`, { name }),
};

/** Charakterblätter. `all` ist die Verwaltungsansicht der Spielleitung. */
export const charactersApi = {
  list: () => request('/characters'),
  get: (id) => request(`/characters/${id}`),
  create: (payload) => post('/characters', payload),
  update: (id, payload) => put(`/characters/${id}`, payload),
  patch: (id, payload) => patch(`/characters/${id}`, payload),
  remove: (id) => del(`/characters/${id}`),
  duplicate: (id) => post(`/characters/${id}/duplicate`),
  kopieren: (id, campaignId) => post(`/characters/${id}/kopieren`, { campaignId }),
  all: () => request('/characters/verwaltung/alle'),
};

/** Das Nachschlagewerk – ein zwischengespeicherter Spiegel der offenen 5e-API. */
export const compendiumApi = {
  list: (category) => request(`/compendium/${category}`),
  detail: (category, index) => request(`/compendium/${category}/${index}`),
};

/** Der *laufende* Kampf. Nicht zu verwechseln mit encountersApi unten. */
export const encounterApi = {
  get: () => request('/encounter'),
  add: (payload) => post('/encounter/combatants', payload),
  update: (id, payload) => put(`/encounter/combatants/${id}`, payload),
  damage: (id, amount) => post(`/encounter/combatants/${id}/damage`, { amount }),
  remove: (id) => del(`/encounter/combatants/${id}`),
  nextTurn: () => post('/encounter/next-turn'),
  prevTurn: () => post('/encounter/prev-turn'),
  reset: () => post('/encounter/reset'),
  rollInitiative: (onlyEmpty = true) => post('/encounter/roll-initiative', { onlyEmpty }),
  addParty: () => post('/encounter/party'),
  setInitiative: (id, value) => post(`/encounter/combatants/${id}/initiative`, { value }),
};

/** Die Beutekiste: Gefundenes, Münzen, Teilen und Auszahlen. */
export const stashApi = {
  get: () => request('/stash'),
  addItem: (payload) => post('/stash/items', payload),
  updateItem: (id, payload) => put(`/stash/items/${id}`, payload),
  removeItem: (id) => del(`/stash/items/${id}`),
  kopieren: (id, campaignId) => post(`/stash/items/${id}/kopieren`, { campaignId }),
  setCoins: (coins) => put('/stash/coins', coins),
  teilung: (anteile) => request(`/stash/teilung?anteile=${anteile}`),
  auszahlen: (characterIds) => post('/stash/auszahlen', { characterIds }),
};

/** Das Bestiarium – Statblöcke, aus denen Kämpfer werden. */
export const libraryApi = {
  list: () => request('/library'),
  create: (payload) => post('/library', payload),
  update: (id, payload) => put(`/library/${id}`, payload),
  remove: (id) => del(`/library/${id}`),
  addToEncounter: (id, payload) => post(`/library/${id}/add-to-encounter`, payload),
  fromCompendium: (monster) => post('/library/aus-kompendium', monster),
};

/** *Vorbereitete* Begegnungen, die sich mit einem Klick stellen lassen. */
export const encountersApi = {
  list: () => request('/encounters'),
  create: (payload) => post('/encounters', payload),
  update: (id, payload) => put(`/encounters/${id}`, payload),
  remove: (id) => del(`/encounters/${id}`),
  stellen: (id, rollInitiative = true) => post(`/encounters/${id}/stellen`, { rollInitiative }),
  ausKampf: (name) => post('/encounters/aus-kampf', { name }),
};

/** Die Chronik: Sitzungen, Einträge, Protokoll und KI-Rückblick. */
export const chronicleApi = {
  sessions: () => request('/chronicle/sessions'),
  session: (id) => request(`/chronicle/sessions/${id}`),
  start: (title) => post('/chronicle/sessions', { title }),
  end: (id) => post(`/chronicle/sessions/${id}/ende`),
  rename: (id, title) => patch(`/chronicle/sessions/${id}`, { title }),
  removeSession: (id) => del(`/chronicle/sessions/${id}`),
  addEntry: (text, secret = false) => post('/chronicle/eintrag', { text, secret }),
  removeEntry: (id) => del(`/chronicle/eintrag/${id}`),
  kiStatus: () => request('/chronicle/ki'),
  rueckblick: (id) => post(`/chronicle/sessions/${id}/rueckblick`),
  async protokoll(id) {
    const res = await fetch(`${API_BASE}/chronicle/sessions/${id}/protokoll`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('Das Protokoll ließ sich nicht holen.');
    return res.text();
  },
};

/** Notizen und Handzettel. */
export const notesApi = {
  list: () => request('/notes'),
  create: (payload) => post('/notes', payload),
  update: (id, payload) => put(`/notes/${id}`, payload),
  remove: (id) => del(`/notes/${id}`),
  kopieren: (id, campaignId) => post(`/notes/${id}/kopieren`, { campaignId }),
};

/** Der Würfelbeutel. Gewürfelt wird auf dem Server – siehe lib/wuerfeln.js. */
export const diceApi = {
  history: (limit = 50) => request(`/dice/history?limit=${limit}`),
  roll: (payload) => post('/dice/roll', payload),
  clear: () => del('/dice/history'),
};

/** Der Chat am Tisch, samt Flüstern an einzelne. */
export const chatApi = {
  history: (limit = 100) => request(`/chat?limit=${limit}`),
  send: (text, an = null) => post('/chat', an ? { text, an } : { text }),
  wer: () => request('/chat/wer'),
  clear: () => del('/chat'),
};

/** Der Spieltisch: Szenen, Figuren, Nebel, Vorhang, Zeigefinger. */
export const scenesApi = {
  list: () => request('/scenes'),
  active: () => request('/scenes/aktiv'),
  create: (payload) => post('/scenes', payload),
  update: (id, payload) => put(`/scenes/${id}`, payload),
  remove: (id) => del(`/scenes/${id}`),
  kopieren: (id, campaignId) => post(`/scenes/${id}/kopieren`, { campaignId }),
  activate: (id, verdeckt = false) => post(`/scenes/${id}/aktivieren`, { verdeckt }),
  vorhang: (zu) => post('/scenes/vorhang', { zu }),
  fog: (id, cells, revealed) => post(`/scenes/${id}/nebel`, { cells, revealed }),
  fogAll: (id, revealed) => post(`/scenes/${id}/nebel/alles`, { revealed }),
  addToken: (id, payload) => post(`/scenes/${id}/figuren`, payload),
  moveToken: (tokenId, payload) => patch(`/scenes/figuren/${tokenId}`, payload),
  removeToken: (tokenId) => del(`/scenes/figuren/${tokenId}`),
  tokensFromEncounter: (id) => post(`/scenes/${id}/figuren/aus-kampf`),
  ping: (x, y) => post('/scenes/ping', { x, y }),
  nscSicht: (tokenId) => post('/scenes/nsc-sicht', { tokenId }),
};

/**
 * Bilder. `url` baut nur die Adresse zusammen – sie landet in einem
 * `<img src=…>`, der Browser holt das Bild dann selbst.
 */
export const mediaApi = {
  upload: (dataUrl, filename) => post('/media', { dataUrl, filename }),
  url: (id) => (id ? `${API_BASE}/media/${id}` : null),
  remove: (id) => del(`/media/${id}`),
};

/** Die Kartenbibliothek: vorbereitete Karten samt eingestelltem Raster. */
export const mapsApi = {
  list: () => request('/maps'),
  create: (payload) => post('/maps', payload),
  update: (id, payload) => put(`/maps/${id}`, payload),
  remove: (id) => del(`/maps/${id}`),
  auflegen: (id, payload) => post(`/maps/${id}/auflegen`, payload),
};

/** Der Klangteppich – hinterlegte Spotify-Links, mehr nicht. */
export const ambienceApi = {
  aktiv: () => request('/ambience/aktiv'),
  list: () => request('/ambience'),
  create: (payload) => post('/ambience', payload),
  update: (id, payload) => put(`/ambience/${id}`, payload),
  remove: (id) => del(`/ambience/${id}`),
  auflegen: (id) => post(`/ambience/${id}/auflegen`),
  steuerung: (payload) => post('/ambience/steuerung', payload),
  stille: () => post('/ambience/stille'),
};
