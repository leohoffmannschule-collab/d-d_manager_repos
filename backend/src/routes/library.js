import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireDm } from '../auth.js';
import { rollD20 } from '../dice.js';
import { sendeKampf } from './encounter.js';
import * as chronik from '../chronicle.js';

const router = Router();

// Das Bestiarium ist Sache der Spielleitung – die Runde soll die Statblöcke
// des heutigen Abends schließlich nicht vorab lesen können.
router.use(requireDm);

const KATEGORIEN = new Set(['npc', 'monster']);
const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const toNumberOrNull = (value, fallback) => (value === '' || value == null ? fallback : toNumber(value, fallback));

function rowToEntry(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    ac: row.ac,
    hp: row.hp,
    speed: row.speed,
    stats: JSON.parse(row.stats),
    abilities: row.abilities,
    actions: row.actions,
    notes: row.notes,
    tags: JSON.parse(row.tags),
    mini: JSON.parse(row.mini || '{}'),
    mediaId: row.media_id,
    createdAt: row.created_at,
  };
}

function statsAus(quelle, vorgabe = {}) {
  const feld = (key) => toNumberOrNull(quelle?.[key], vorgabe[key] ?? null);
  return { str: feld('str'), dex: feld('dex'), con: feld('con'), int: feld('int'), wis: feld('wis'), cha: feld('cha') };
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM library ORDER BY name COLLATE NOCASE').all().map(rowToEntry));
});

router.post('/', (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO library (id, name, category, ac, hp, speed, stats, abilities, actions, notes, tags, mini, media_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 100),
    KATEGORIEN.has(body.category) ? body.category : 'monster',
    toNumberOrNull(body.ac, null),
    toNumberOrNull(body.hp, null),
    typeof body.speed === 'string' ? body.speed.slice(0, 100) : '',
    JSON.stringify(statsAus(body.stats)),
    typeof body.abilities === 'string' ? body.abilities.slice(0, 4000) : '',
    typeof body.actions === 'string' ? body.actions.slice(0, 4000) : '',
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '',
    JSON.stringify(Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string').slice(0, 20) : []),
    JSON.stringify(body.mini && typeof body.mini === 'object' ? body.mini : {}),
    body.mediaId ?? null,
    new Date().toISOString()
  );
  res.status(201).json(rowToEntry(db.prepare('SELECT * FROM library WHERE id = ?').get(id)));
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM library WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'eintrag_nicht_gefunden', error: 'Eintrag nicht gefunden.' });

  const body = req.body ?? {};
  db.prepare(
    `UPDATE library SET name = ?, category = ?, ac = ?, hp = ?, speed = ?, stats = ?,
            abilities = ?, actions = ?, notes = ?, tags = ?, mini = ?, media_id = ? WHERE id = ?`
  ).run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : row.name,
    KATEGORIEN.has(body.category) ? body.category : row.category,
    'ac' in body ? toNumberOrNull(body.ac, row.ac) : row.ac,
    'hp' in body ? toNumberOrNull(body.hp, row.hp) : row.hp,
    typeof body.speed === 'string' ? body.speed.slice(0, 100) : row.speed,
    'stats' in body ? JSON.stringify(statsAus(body.stats, JSON.parse(row.stats))) : row.stats,
    typeof body.abilities === 'string' ? body.abilities.slice(0, 4000) : row.abilities,
    typeof body.actions === 'string' ? body.actions.slice(0, 4000) : row.actions,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    Array.isArray(body.tags)
      ? JSON.stringify(body.tags.filter((t) => typeof t === 'string').slice(0, 20))
      : row.tags,
    'mini' in body && body.mini && typeof body.mini === 'object' ? JSON.stringify(body.mini) : row.mini,
    'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    row.id
  );
  res.json(rowToEntry(db.prepare('SELECT * FROM library WHERE id = ?').get(row.id)));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM library WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ code: 'eintrag_nicht_gefunden', error: 'Eintrag nicht gefunden.' });
  res.status(204).end();
});

// POST /api/library/:id/add-to-encounter – „3 Goblins“ mit einem Klick
router.post('/:id/add-to-encounter', (req, res) => {
  const row = db.prepare('SELECT * FROM library WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'eintrag_nicht_gefunden', error: 'Eintrag nicht gefunden.' });

  const body = req.body ?? {};
  const anzahl = Math.min(Math.max(parseInt(body.count, 10) || 1, 1), 20);
  const wuerfeln = !!body.rollInitiative;
  const basis = toNumber(body.initiative, 0);
  const now = new Date().toISOString();

  const einfuegen = db.prepare(
    `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, media_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '', NULL, ?, ?, ?)`
  );

  for (let i = 0; i < anzahl; i++) {
    einfuegen.run(
      randomUUID(),
      anzahl > 1 ? `${row.name} ${i + 1}` : row.name,
      row.category,
      wuerfeln ? rollD20() : basis,
      row.hp ?? 0,
      row.hp ?? 0,
      row.ac ?? 10,
      row.media_id ?? null,
      body.hidden ? 1 : 0,
      now
    );
  }

  chronik.log({
    kind: 'auftritt',
    text: `${anzahl > 1 ? `${anzahl}× ` : ''}${row.name} ${anzahl > 1 ? 'treten' : 'tritt'} auf.`,
    meta: { libraryId: row.id, name: row.name, count: anzahl },
    secret: !!body.hidden,
  });

  sendeKampf();
  res.status(201).json({ created: anzahl });
});

// POST /api/library/aus-kompendium – Monster aus dem Kompendium übernehmen
router.post('/aus-kompendium', (req, res) => {
  const m = req.body ?? {};
  if (!m.name) return res.status(400).json({ code: 'monster_fehlt', error: 'Kein Monster übergeben.' });

  const beschreibe = (liste) =>
    (Array.isArray(liste) ? liste : [])
      .map((eintrag) => `${eintrag.name}: ${eintrag.desc ?? ''}`.trim())
      .join('\n\n')
      .slice(0, 4000);

  const id = randomUUID();
  db.prepare(
    `INSERT INTO library (id, name, category, ac, hp, speed, stats, abilities, actions, notes, tags, created_at)
     VALUES (?, ?, 'monster', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    String(m.name).slice(0, 100),
    toNumberOrNull(Array.isArray(m.armor_class) ? m.armor_class[0]?.value : m.armor_class, null),
    toNumberOrNull(m.hit_points, null),
    Object.entries(m.speed ?? {})
      .map(([art, wert]) => `${art}: ${wert}`)
      .join(', ')
      .slice(0, 100),
    JSON.stringify({
      str: toNumberOrNull(m.strength, null),
      dex: toNumberOrNull(m.dexterity, null),
      con: toNumberOrNull(m.constitution, null),
      int: toNumberOrNull(m.intelligence, null),
      wis: toNumberOrNull(m.wisdom, null),
      cha: toNumberOrNull(m.charisma, null),
    }),
    beschreibe(m.special_abilities),
    beschreibe(m.actions),
    `Herausforderungsgrad ${m.challenge_rating ?? '?'} · ${[m.size, m.type].filter(Boolean).join(' ')}`.slice(0, 2000),
    JSON.stringify([m.type, m.size].filter(Boolean).map(String)),
    new Date().toISOString()
  );
  res.status(201).json(rowToEntry(db.prepare('SELECT * FROM library WHERE id = ?').get(id)));
});

export default router;
