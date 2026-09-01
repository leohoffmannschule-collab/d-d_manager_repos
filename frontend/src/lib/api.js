const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    let message = `Anfrage fehlgeschlagen (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const charactersApi = {
  list: () => request('/characters'),
  get: (id) => request(`/characters/${id}`),
  create: (payload) => request('/characters', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/characters/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/characters/${id}`, { method: 'DELETE' }),
  duplicate: (id) => request(`/characters/${id}/duplicate`, { method: 'POST' }),
};

export const compendiumApi = {
  list: (category) => request(`/compendium/${category}`),
  detail: (category, index) => request(`/compendium/${category}/${index}`),
};
