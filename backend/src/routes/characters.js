import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient } from '../events.js';

const router = Router();

router.use(requireAuth);

function rowToCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    system: row.system,
    data: JSON.parse(row.data),
    ownerId: row.owner_id,
    ownerName: row.owner_name ?? null,
    shared: !!row.shared,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Kurzfassung für Übersichten, Spieltisch und Kampfliste. */
function summary(row) {
  const character = rowToCharacter(row);
  const className = character.data?.className ?? '';
  const level = character.data?.level;
  return {
    id: character.id,
    name: character.name,
    system: character.system,
    ownerId: character.ownerId,
    ownerName: character.ownerName,
    shared: character.shared,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
    classLevel: [className, className && level ? level : ''].filter(Boolean).join(' '),
    race: character.data?.race ?? '',
    portrait: character.data?.portrait ?? '',
    hp: character.data?.combat?.hp ?? null,
    ac: character.data?.combat?.armorClass ?? null,
    initiative:
      Math.floor(((Number(character.data?.abilities?.dex) || 10) - 10) / 2) +
      (Number(character.data?.combat?.initiativeBonus) || 0),
  };
}

const SELECT = `SELECT c.*, u.name AS owner_name FROM characters c LEFT JOIN users u ON u.id = c.owner_id`;

const holen = (id) => db.prepare(`${SELECT} WHERE c.id = ?`).get(id);

// Charaktere ohne Besitzer stammen aus der Zeit vor den Konten – sie gehören
// der Spielleitung, bis sie jemandem zugewiesen werden.
const darfBearbeiten = (user, row) => isDm(user) || row.owner_id === user.id;
const darfSehen = (user, row) => darfBearbeiten(user, row) || !!row.shared;

function meldeAenderung(row, req) {
  broadcast('charakter:aktualisiert', summary(row), { exceptClient: originClient(req) });
}

// GET /api/characters – eigene Charaktere, dazu die geteilten der Mitspieler
router.get('/', (req, res) => {
  const rows = isDm(req.user)
    ? db.prepare(`${SELECT} ORDER BY c.updated_at DESC`).all()
    : db
        .prepare(`${SELECT} WHERE c.owner_id = ? OR c.shared = 1 ORDER BY c.updated_at DESC`)
        .all(req.user.id);
  res.json(rows.map(summary));
});

// GET /api/characters/:id
router.get('/:id', (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, row)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });
  res.json({ ...rowToCharacter(row), editable: darfBearbeiten(req.user, row) });
});

// POST /api/characters – create
router.post('/', (req, res) => {
  const { name, system = 'dnd5e', data = {} } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(id, name.trim(), system, JSON.stringify(data), req.user.id, now, now);
  const row = holen(id);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

// PUT /api/characters/:id – full update (autosave from the sheet editor)
router.put('/:id', (req, res) => {
  const existing = holen(req.params.id);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { name, data } = req.body ?? {};
  const nextName = typeof name === 'string' && name.trim() ? name.trim() : existing.name;
  const nextData = data !== undefined ? JSON.stringify(data) : existing.data;
  const now = new Date().toISOString();

  db.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?').run(
    nextName,
    nextData,
    now,
    req.params.id
  );
  const row = holen(req.params.id);

  // Trefferpunkte im Kampf mitziehen, damit die Spielleitung sofort sieht,
  // wenn jemand Schaden einträgt.
  const hp = JSON.parse(row.data)?.combat?.hp;
  if (hp && Number.isFinite(Number(hp.current))) {
    const linked = db.prepare('SELECT id FROM combatants WHERE character_id = ?').all(row.id);
    for (const combatant of linked) {
      db.prepare('UPDATE combatants SET hp = ?, max_hp = ? WHERE id = ?').run(
        Number(hp.current) || 0,
        Number(hp.max) || 0,
        combatant.id
      );
    }
    if (linked.length) broadcast('kampf:aktualisiert', {});
  }

  meldeAenderung(row, req);
  res.json(rowToCharacter(row));
});

// PATCH /api/characters/:id – Besitz und Sichtbarkeit
router.patch('/:id', (req, res) => {
  const existing = holen(req.params.id);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }

  const { ownerId, shared } = req.body ?? {};

  if (ownerId !== undefined) {
    // Nur die Spielleitung teilt Charaktere zu.
    if (!isDm(req.user)) return res.status(403).json({ code: 'nur_spielleitung', error: 'Das darf nur die Spielleitung.' });
    if (ownerId !== null && !db.prepare('SELECT id FROM users WHERE id = ?').get(ownerId)) {
      return res.status(400).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
    }
    db.prepare('UPDATE characters SET owner_id = ? WHERE id = ?').run(ownerId, existing.id);
  }
  if (shared !== undefined) {
    db.prepare('UPDATE characters SET shared = ? WHERE id = ?').run(shared ? 1 : 0, existing.id);
  }

  const row = holen(existing.id);
  meldeAenderung(row, req);
  res.json(rowToCharacter(row));
});

// DELETE /api/characters/:id
router.delete('/:id', (req, res) => {
  const existing = holen(req.params.id);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfBearbeiten(req.user, existing)) {
    return res.status(403).json({ code: 'blatt_fremd', error: 'Dieses Blatt gehört jemand anderem.' });
  }
  db.prepare('DELETE FROM characters WHERE id = ?').run(existing.id);
  broadcast('charakter:entfernt', { id: existing.id });
  res.status(204).end();
});

// POST /api/characters/:id/duplicate
router.post('/:id/duplicate', (req, res) => {
  const existing = holen(req.params.id);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, existing)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });

  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, `${existing.name} (Kopie)`, existing.system, existing.data, req.user.id, existing.shared, now, now);
  const row = holen(id);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

// GET /api/characters/:id/all – Rohdaten aller Blätter für die Spielleitung
router.get('/verwaltung/alle', requireDm, (req, res) => {
  res.json(db.prepare(`${SELECT} ORDER BY c.name COLLATE NOCASE`).all().map(summary));
});

export default router;
