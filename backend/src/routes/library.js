/**
 * Das Bestiarium: Statblöcke für Monster und NSC, aus denen mit einem Klick
 * Kämpfer werden.
 *
 * Es ist Sache der Spielleitung – die Runde soll die Statblöcke des heutigen
 * Abends schließlich nicht vorab lesen können. Deshalb gilt `requireDm` für
 * jeden Weg hier.
 *
 * Es gehört der ganzen Runde, nicht einer Kampagne: Ein Goblin bleibt ein
 * Goblin, gleich in welcher Geschichte er auftritt. Was daraus im Kampf wird –
 * der einzelne Kämpfer mit seinen Trefferpunkten – gehört dagegen zu genau
 * einer Kampagne.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, transaktion } from '../db.js';
import { requireDm } from '../auth.js';
import { rollD20 } from '../dice.js';
import { sendeKampf } from '../kampf/sicht.js';
import * as chronik from '../chronicle.js';
import { hatText, texte, toNumber, zahlOderLeer } from '../werte.js';

const router = Router();
router.use(requireDm);

const KATEGORIEN = new Set(['npc', 'monster']);

/** Ein Statblock aus `library` so, wie ihn die Oberfläche bekommt. */
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
  const feld = (key) => zahlOderLeer(quelle?.[key], vorgabe[key] ?? null);
  return { str: feld('str'), dex: feld('dex'), con: feld('con'), int: feld('int'), wis: feld('wis'), cha: feld('cha') };
}

// GET /api/library – das Bestiarium: alle Statblöcke, nach Namen.
router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM library ORDER BY name COLLATE NOCASE').all().map(rowToEntry));
});

// POST /api/library – einen Statblock von Hand anlegen. Zahlen, die sich
// nicht lesen lassen, bleiben leer statt 0 – ein Monster ohne bekannte RK
// ist etwas anderes als eines mit RK 0.
router.post('/', (req, res) => {
  const body = req.body ?? {};
  if (!hatText(body.name)) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO library (id, name, category, ac, hp, speed, stats, abilities, actions, notes, tags, mini, media_id, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 100),
    KATEGORIEN.has(body.category) ? body.category : 'monster',
    zahlOderLeer(body.ac, null),
    zahlOderLeer(body.hp, null),
    typeof body.speed === 'string' ? body.speed.slice(0, 100) : '',
    JSON.stringify(statsAus(body.stats)),
    typeof body.abilities === 'string' ? body.abilities.slice(0, 4000) : '',
    typeof body.actions === 'string' ? body.actions.slice(0, 4000) : '',
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '',
    JSON.stringify(texte(body.tags)),
    // `mini` stammt aus der Zeit der Figurenschmiede (siehe
    // datenbank/nachruesten.js) und wird nur noch durchgereicht.
    JSON.stringify(body.mini && typeof body.mini === 'object' ? body.mini : {}),
    body.mediaId ?? null,
    req.campaignId,
    new Date().toISOString()
  );
  res.status(201).json(rowToEntry(db.prepare('SELECT * FROM library WHERE id = ?').get(id)));
});

// PUT /api/library/:id – ändern; nur, was mitgeschickt wird.
router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM library WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'eintrag_nicht_gefunden', error: 'Eintrag nicht gefunden.' });

  const body = req.body ?? {};
  db.prepare(
    `UPDATE library SET name = ?, category = ?, ac = ?, hp = ?, speed = ?, stats = ?,
            abilities = ?, actions = ?, notes = ?, tags = ?, mini = ?, media_id = ? WHERE id = ?`
  ).run(
    hatText(body.name) ? body.name.trim().slice(0, 100) : row.name,
    KATEGORIEN.has(body.category) ? body.category : row.category,
    'ac' in body ? zahlOderLeer(body.ac, row.ac) : row.ac,
    'hp' in body ? zahlOderLeer(body.hp, row.hp) : row.hp,
    typeof body.speed === 'string' ? body.speed.slice(0, 100) : row.speed,
    'stats' in body ? JSON.stringify(statsAus(body.stats, JSON.parse(row.stats))) : row.stats,
    typeof body.abilities === 'string' ? body.abilities.slice(0, 4000) : row.abilities,
    typeof body.actions === 'string' ? body.actions.slice(0, 4000) : row.actions,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    Array.isArray(body.tags) ? JSON.stringify(texte(body.tags)) : row.tags,
    'mini' in body && body.mini && typeof body.mini === 'object' ? JSON.stringify(body.mini) : row.mini,
    'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    row.id
  );
  res.json(rowToEntry(db.prepare('SELECT * FROM library WHERE id = ?').get(row.id)));
});

// DELETE /api/library/:id – löschen. Vorbereitete Begegnungen behalten ihre
// Werte, denn jeder Posten hat eine eigene Abschrift.
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
    `INSERT INTO combatants (id, name, type, initiative, hp, max_hp, ac, conditions, notes, character_id, media_id, hidden, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, '[]', '', NULL, ?, ?, ?, ?)`
  );

  // Die Kategorie des Statblocks ('npc' oder 'monster') ist zugleich die Art
  // des Kämpfers – beide Mengen sind so gewählt, dass das passt.
  transaktion(() => {
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
        req.campaignId,
        now
      );
    }
  });

  chronik.log(
    {
      kind: 'auftritt',
      text: `${anzahl > 1 ? `${anzahl}× ` : ''}${row.name} ${anzahl > 1 ? 'treten' : 'tritt'} auf.`,
      meta: { libraryId: row.id, name: row.name, count: anzahl },
      secret: !!body.hidden,
    },
    req.campaignId
  );

  sendeKampf(req.campaignId);
  res.status(201).json({ created: anzahl });
});

/**
 * POST /api/library/aus-kompendium – ein Monster aus dem Kompendium übernehmen.
 *
 * Der Rumpf ist ein Monster, wie es die 5e-API liefert (`hit_points`,
 * `armor_class`, `special_abilities` …). Übernommen wird eine Abschrift, kein
 * Verweis: Danach gehört der Statblock der Spielleitung und darf abweichen.
 */
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
    `INSERT INTO library (id, name, category, ac, hp, speed, stats, abilities, actions, notes, tags, campaign_id, created_at)
     VALUES (?, ?, 'monster', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    String(m.name).slice(0, 100),
    zahlOderLeer(Array.isArray(m.armor_class) ? m.armor_class[0]?.value : m.armor_class, null),
    zahlOderLeer(m.hit_points, null),
    Object.entries(m.speed ?? {})
      .map(([art, wert]) => `${art}: ${wert}`)
      .join(', ')
      .slice(0, 100),
    JSON.stringify({
      str: zahlOderLeer(m.strength, null),
      dex: zahlOderLeer(m.dexterity, null),
      con: zahlOderLeer(m.constitution, null),
      int: zahlOderLeer(m.intelligence, null),
      wis: zahlOderLeer(m.wisdom, null),
      cha: zahlOderLeer(m.charisma, null),
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
