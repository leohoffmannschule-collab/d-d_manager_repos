const API_BASE = '/api';

// Kennung des eigenen Fensters am Live-Kanal. Der Server schickt Änderungen
// mit dieser Kennung nicht an uns zurück – sonst würde eine gezogene Figur
// kurz zurückspringen, weil das eigene Echo eintrifft.
let clientId = null;
export function setClientId(id) {
  clientId = id;
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) };
  if (clientId) headers['X-Fenster'] = String(clientId);

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    ...options,
    headers,
  });

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
  if (res.status === 204) return null;
  return res.json();
}

const senden = (method) => (path, payload) =>
  request(path, { method, body: payload === undefined ? undefined : JSON.stringify(payload) });

const post = senden('POST');
const put = senden('PUT');
const patch = senden('PATCH');
const del = (path) => request(path, { method: 'DELETE' });

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

export const charactersApi = {
  list: () => request('/characters'),
  get: (id) => request(`/characters/${id}`),
  create: (payload) => post('/characters', payload),
  update: (id, payload) => put(`/characters/${id}`, payload),
  patch: (id, payload) => patch(`/characters/${id}`, payload),
  remove: (id) => del(`/characters/${id}`),
  duplicate: (id) => post(`/characters/${id}/duplicate`),
  all: () => request('/characters/verwaltung/alle'),
};

export const compendiumApi = {
  list: (category) => request(`/compendium/${category}`),
  detail: (category, index) => request(`/compendium/${category}/${index}`),
};

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

export const stashApi = {
  get: () => request('/stash'),
  addItem: (payload) => post('/stash/items', payload),
  updateItem: (id, payload) => put(`/stash/items/${id}`, payload),
  removeItem: (id) => del(`/stash/items/${id}`),
  setCoins: (coins) => put('/stash/coins', coins),
  teilung: (anteile) => request(`/stash/teilung?anteile=${anteile}`),
  auszahlen: (characterIds) => post('/stash/auszahlen', { characterIds }),
};

export const libraryApi = {
  list: () => request('/library'),
  create: (payload) => post('/library', payload),
  update: (id, payload) => put(`/library/${id}`, payload),
  remove: (id) => del(`/library/${id}`),
  addToEncounter: (id, payload) => post(`/library/${id}/add-to-encounter`, payload),
  fromCompendium: (monster) => post('/library/aus-kompendium', monster),
};

export const encountersApi = {
  list: () => request('/encounters'),
  create: (payload) => post('/encounters', payload),
  update: (id, payload) => put(`/encounters/${id}`, payload),
  remove: (id) => del(`/encounters/${id}`),
  stellen: (id, rollInitiative = true) => post(`/encounters/${id}/stellen`, { rollInitiative }),
  ausKampf: (name) => post('/encounters/aus-kampf', { name }),
};

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

export const notesApi = {
  list: () => request('/notes'),
  create: (payload) => post('/notes', payload),
  update: (id, payload) => put(`/notes/${id}`, payload),
  remove: (id) => del(`/notes/${id}`),
};

export const diceApi = {
  history: (limit = 50) => request(`/dice/history?limit=${limit}`),
  roll: (payload) => post('/dice/roll', payload),
  clear: () => del('/dice/history'),
};

export const scenesApi = {
  list: () => request('/scenes'),
  active: () => request('/scenes/aktiv'),
  create: (payload) => post('/scenes', payload),
  update: (id, payload) => put(`/scenes/${id}`, payload),
  remove: (id) => del(`/scenes/${id}`),
  activate: (id) => post(`/scenes/${id}/aktivieren`),
  fog: (id, cells, revealed) => post(`/scenes/${id}/nebel`, { cells, revealed }),
  fogAll: (id, revealed) => post(`/scenes/${id}/nebel/alles`, { revealed }),
  addToken: (id, payload) => post(`/scenes/${id}/figuren`, payload),
  moveToken: (tokenId, payload) => patch(`/scenes/figuren/${tokenId}`, payload),
  removeToken: (tokenId) => del(`/scenes/figuren/${tokenId}`),
  tokensFromEncounter: (id) => post(`/scenes/${id}/figuren/aus-kampf`),
  ping: (x, y) => post('/scenes/ping', { x, y }),
};

export const mediaApi = {
  upload: (dataUrl, filename) => post('/media', { dataUrl, filename }),
  url: (id) => (id ? `${API_BASE}/media/${id}` : null),
  remove: (id) => del(`/media/${id}`),
};
