/**
 * Wege zum Spieltisch und seiner Ausstattung: Szenen, Figuren und Nebel,
 * Bilder, die Kartenbibliothek und der Klangteppich.
 */
import { API_BASE, del, patch, post, put, request } from './anfrage.js';

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
