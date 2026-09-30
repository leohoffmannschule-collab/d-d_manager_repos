/**
 * Wege zu Konten und Kampagnen: anmelden, Konten verwalten, Einladungen,
 * Kampagnen anlegen, wechseln, umbenennen, wegräumen und übernehmen.
 */
import { del, patch, post, request } from './anfrage.js';

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
