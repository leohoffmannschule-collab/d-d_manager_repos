import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';

const router = Router();

function rowToCharacter(row) {
  return {
    id: row.id,
    name: row.name,
    system: row.system,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// GET /api/characters - list summaries
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, name, system, data, created_at, updated_at FROM characters ORDER BY updated_at DESC')
    .all();
  const summaries = rows.map((row) => {
    const character = rowToCharacter(row);
    const className = character.data?.className ?? '';
    const level = character.data?.level;
    return {
      id: character.id,
      name: character.name,
      system: character.system,
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
      classLevel: [className, className && level ? level : ''].filter(Boolean).join(' '),
      race: character.data?.race ?? '',
      portrait: character.data?.portrait ?? '',
      hp: character.data?.combat?.hp ?? null,
    };
  });
  res.json(summaries);
});

// GET /api/characters/:id
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Charakter nicht gefunden' });
  res.json(rowToCharacter(row));
});

// POST /api/characters - create
router.post('/', (req, res) => {
  const { name, system = 'dnd5e', data = {} } = req.body ?? {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name ist erforderlich' });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO characters (id, name, system, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, name.trim(), system, JSON.stringify(data), now, now);
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
  res.status(201).json(rowToCharacter(row));
});

// PUT /api/characters/:id - full update (autosave from the sheet editor)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Charakter nicht gefunden' });

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
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  res.json(rowToCharacter(row));
});

// DELETE /api/characters/:id
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Charakter nicht gefunden' });
  res.status(204).end();
});

// POST /api/characters/:id/duplicate
router.post('/:id/duplicate', (req, res) => {
  const existing = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Charakter nicht gefunden' });
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO characters (id, name, system, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, `${existing.name} (Kopie)`, existing.system, existing.data, now, now);
  const row = db.prepare('SELECT * FROM characters WHERE id = ?').get(id);
  res.status(201).json(rowToCharacter(row));
});

export default router;
