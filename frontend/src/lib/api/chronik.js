/**
 * Wege für das, was am Tisch gesagt und festgehalten wird: Chronik, Notizen
 * und Handzettel, der Chat.
 */
import { API_BASE, del, patch, post, put, request } from './anfrage.js';

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

/** Der Chat am Tisch, samt Flüstern an einzelne. */
export const chatApi = {
  history: (limit = 100) => request(`/chat?limit=${limit}`),
  send: (text, an = null) => post('/chat', an ? { text, an } : { text }),
  wer: () => request('/chat/wer'),
  clear: () => del('/chat'),
};
