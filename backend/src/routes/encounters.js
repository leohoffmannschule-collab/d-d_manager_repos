import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireDm } from '../auth.js';
import { rollD20 } from '../dice.js';
import * as chronik from '../chronicle.js';
import { sendeKampf } from './encounter.js';

const router = Router();

// Vorbereitete Begegnungen sind die halbe Vorbereitung eines Abends – und
// gehen die Runde nichts an.
router.use(requireDm);

const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

function rowToEncounter(row) {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    entries: JSON.parse(row.entries),
    createdAt: row.created_at,
  };
}

/**
 * Ein Eintrag hält alles Nötige selbst fest und verweist nur nebenbei auf das
 * Bestiarium. So lässt sich eine Begegnung auch dann noch stellen, wenn der
 * Statblock dahinter längst gelöscht wurde.
 */
function saubereEintraege(liste) {
  if (!Array.isArray(liste)) return [];
  return liste.slice(0, 50).map((e) => ({
    libraryId: typeof e.libraryId === 'string' ? e.libraryId : null,
    name: String(e.name ?? 'Namenlos').slice(0, 100),
    type: ['pc', 'npc', 'monster'].includes(e.type) ? e.type : 'monster',
    hp: toNumber(e.hp, 0),
    ac: toNumber(e.ac, 10),
    count: Math.min(Math.max(parseInt(e.count, 10) || 1, 1), 20),
    hidden: !!e.hidden,
    mediaId: typeof e.mediaId === 'string' ? e.mediaId : null,
  }));
}

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM encounters ORDER BY name COLLATE NOCASE').all().map(rowToEncounter));
});

router.post('/', (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare('INSERT INTO encounters (id, name, notes, entries, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    body.name.trim().slice(0, 100),
    typeof body.notes === 'string' ? body.notes.slice(0, 4000) : '',
    JSON.stringify(saubereEintraege(body.entries)),
    new Date().toISOString()
  );
  res.status(201).json(rowToEncounter(db.prepare('SELECT * FROM encounters WHERE id = ?').get(id)));
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'begegnung_nicht_gefunden', error: 'Begegnung nicht gefunden.' });
  const body = req.body ?? {};
  db.prepare('UPDATE encounters SET name = ?, notes = ?, entries = ? WHERE id = ?').run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : row.name,
    typeof body.notes === 'string' ? body.notes.slice(0, 4000) : row.notes,
    'entries' in body ? JSON.stringify(saubereEintraege(body.entries)) : row.entries,
    row.id
  );
  res.json(rowToEncounter(db.prepare('SELECT * FROM encounters WHERE id = ?').get(row.id)));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM encounters WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ code: 'begegnung_nicht_gefunden', error: 'Begegnung nicht gefunden.' });
  res.status(204).end();
});

// POST /api/encounters/:id/stellen – die ganze Begegnung in den Kampf setzen
router.post('/:id/stellen', (req, res) => {
  const row = db.prepare('SELECT * FROM encounters WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'begegnung_nicht_gefunden', error: 'Begegnung nicht gefunden.' });

  const wuerfeln = req.body?.rollInitiative !== false;
  const eintraege = JSON.parse(row.entries);
  const now = new Date().toISOString();
  const einfuegen = db.prepare(
    `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, media_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '', NULL, ?, ?, ?)`
  );

  let gestellt = 0;
  for (const e of eintraege) {
    for (let i = 0; i < e.count; i++) {
      einfuegen.run(
        randomUUID(),
        e.count > 1 ? `${e.name} ${i + 1}` : e.name,
        e.type,
        wuerfeln ? rollD20() : 0,
        e.hp,
        e.hp,
        e.ac,
        e.mediaId ?? null,
        e.hidden ? 1 : 0,
        now
      );
      gestellt += 1;
    }
  }

  // Verborgene Gegner tauchen nicht in der für alle sichtbaren Chronik auf.
  const offenkundig = eintraege.filter((e) => !e.hidden);
  chronik.log({
    kind: 'auftritt',
    text: offenkundig.length
      ? `Begegnung „${row.name}“: ${offenkundig.map((e) => `${e.count}× ${e.name}`).join(', ')}.`
      : `Begegnung „${row.name}“ wird gestellt.`,
    meta: {
      encounterId: row.id,
      name: row.name,
      count: gestellt,
      gruppen: offenkundig.map((e) => ({ name: e.name, count: e.count })),
    },
    secret: offenkundig.length === 0,
  });

  sendeKampf();
  res.status(201).json({ created: gestellt });
});

// POST /api/encounters/aus-kampf – den laufenden Kampf als Begegnung sichern
router.post('/aus-kampf', (req, res) => {
  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : 'Gesicherter Kampf';
  const kaempfer = db.prepare("SELECT * FROM combatants WHERE type != 'pc'").all();
  if (kaempfer.length === 0) {
    return res.status(400).json({ code: 'kampf_ohne_gegner', error: 'Im Kampf steht gerade kein Gegner, den man sichern könnte.' });
  }

  // Gleichnamige Gegner („Goblin 1“, „Goblin 2“) wieder zu einer Gruppe fassen.
  const gruppen = new Map();
  for (const k of kaempfer) {
    const grundname = k.name.replace(/\s+\d+$/, '');
    const schluessel = `${grundname}|${k.type}|${k.max_hp}|${k.ac}|${k.hidden}`;
    const vorhanden = gruppen.get(schluessel);
    if (vorhanden) {
      vorhanden.count += 1;
      continue;
    }
    gruppen.set(schluessel, {
      libraryId: null,
      name: grundname,
      type: k.type,
      hp: k.max_hp,
      ac: k.ac,
      count: 1,
      hidden: !!k.hidden,
      mediaId: k.media_id ?? null,
    });
  }

  const id = randomUUID();
  db.prepare('INSERT INTO encounters (id, name, notes, entries, created_at) VALUES (?, ?, ?, ?, ?)').run(
    id,
    name.slice(0, 100),
    '',
    JSON.stringify([...gruppen.values()]),
    new Date().toISOString()
  );
  res.status(201).json(rowToEncounter(db.prepare('SELECT * FROM encounters WHERE id = ?').get(id)));
});

export default router;
