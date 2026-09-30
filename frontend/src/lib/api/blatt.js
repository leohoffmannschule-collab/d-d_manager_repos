/**
 * Wege rund ums Charakterblatt: die Blätter selbst, das Kompendium zum
 * Nachschlagen und der Würfelbeutel.
 */
import { del, patch, post, put, request } from './anfrage.js';

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

/** Der Würfelbeutel. Gewürfelt wird auf dem Server – siehe lib/wuerfeln.js. */
export const diceApi = {
  history: (limit = 50) => request(`/dice/history?limit=${limit}`),
  roll: (payload) => post('/dice/roll', payload),
  clear: () => del('/dice/history'),
};
