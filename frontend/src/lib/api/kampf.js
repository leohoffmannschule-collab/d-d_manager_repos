/**
 * Wege rund um den Kampf: der laufende Kampf, das Bestiarium, vorbereitete
 * Begegnungen und die Beutekiste, in der landet, was danach übrig bleibt.
 */
import { del, post, put, request } from './anfrage.js';

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
