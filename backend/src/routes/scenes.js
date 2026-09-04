import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient } from '../events.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

const toNumber = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/* --- Umwandlung ---------------------------------------------------------- */

function rowToScene(row) {
  return {
    id: row.id,
    name: row.name,
    mediaId: row.media_id,
    width: row.width,
    height: row.height,
    gridSize: row.grid_size,
    gridOffsetX: row.grid_offset_x,
    gridOffsetY: row.grid_offset_y,
    gridVisible: !!row.grid_visible,
    fogEnabled: !!row.fog_enabled,
    mapId: row.map_id,
    fog: JSON.parse(row.fog),
    createdAt: row.created_at,
  };
}

function rowToToken(row) {
  return {
    id: row.id,
    sceneId: row.scene_id,
    name: row.name,
    x: row.x,
    y: row.y,
    size: row.size,
    color: row.color,
    mediaId: row.media_id,
    characterId: row.character_id,
    combatantId: row.combatant_id,
    hidden: !!row.hidden,
  };
}

const holeSzene = (id) => db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
const holeFigur = (id) => db.prepare('SELECT * FROM tokens WHERE id = ?').get(id);
const aktiveSzeneId = () => getState('szene', null);

function figuren(sceneId) {
  return db.prepare('SELECT * FROM tokens WHERE scene_id = ? ORDER BY created_at').all(sceneId).map(rowToToken);
}

/**
 * Die Runde bekommt nur die aktive Szene zu sehen, ohne versteckte Figuren.
 * Der Nebel wird nicht weggerechnet, sondern mitgeschickt – der Browser malt
 * daraus die schwarze Decke. Was darunter liegt, ist ohnehin nur das Bild,
 * das ohne Nebel niemand zuordnen kann.
 */
function szenenSicht(user) {
  const id = aktiveSzeneId();
  if (!id) return null;
  const row = holeSzene(id);
  if (!row) return null;
  const szene = rowToScene(row);
  const alle = figuren(szene.id);
  return {
    ...szene,
    tokens: isDm(user) ? alle : alle.filter((t) => !t.hidden),
    aktiv: true,
  };
}

export function sendeSzene() {
  broadcast('szene', szenenSicht({ role: 'sl' }), { role: 'sl' });
  broadcast('szene', szenenSicht({ role: 'spieler' }), { role: 'spieler' });
}

/** Darf diese Person die Figur bewegen? */
function darfBewegen(user, tokenRow) {
  if (isDm(user)) return true;
  if (tokenRow.hidden) return false;
  if (!tokenRow.character_id) return false;
  const character = db.prepare('SELECT owner_id FROM characters WHERE id = ?').get(tokenRow.character_id);
  return character?.owner_id === user.id;
}

function meldeFigur(row, req) {
  const token = rowToToken(row);
  const optionen = { exceptClient: originClient(req) };
  if (token.hidden) {
    // Für die Runde ist eine versteckte Figur nicht bloß unsichtbar, sie darf
    // gar nicht erst im Datenstrom auftauchen.
    broadcast('figur', token, { ...optionen, role: 'sl' });
    broadcast('figur:entfernt', { id: token.id }, { ...optionen, role: 'spieler' });
  } else {
    broadcast('figur', token, optionen);
  }
}

/* --- Szenen -------------------------------------------------------------- */

// GET /api/scenes – die Spielleitung sieht alle, die Runde nur die aktive
router.get('/', (req, res) => {
  if (!isDm(req.user)) return res.json(szenenSicht(req.user) ? [szenenSicht(req.user)] : []);
  const aktiv = aktiveSzeneId();
  res.json(
    db
      .prepare('SELECT * FROM scenes ORDER BY created_at DESC')
      .all()
      .map((row) => ({ ...rowToScene(row), aktiv: row.id === aktiv, tokenCount: figuren(row.id).length }))
  );
});

// GET /api/scenes/aktiv – was gerade auf dem Tisch liegt
router.get('/aktiv', (req, res) => {
  res.json(szenenSicht(req.user));
});

router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, '[]', ?)`
  ).run(
    id,
    body.name.trim().slice(0, 100),
    body.mediaId ?? null,
    toNumber(body.width, 0),
    toNumber(body.height, 0),
    clamp(toNumber(body.gridSize, 70), 10, 500),
    body.fogEnabled === false ? 0 : 1,
    new Date().toISOString()
  );
  // Die erste Szene kommt gleich auf den Tisch.
  if (!aktiveSzeneId()) setState('szene', id);
  sendeSzene();
  res.status(201).json(rowToScene(holeSzene(id)));
});

router.put('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const body = req.body ?? {};

  db.prepare(
    `UPDATE scenes SET name = ?, media_id = ?, width = ?, height = ?, grid_size = ?,
            grid_offset_x = ?, grid_offset_y = ?, grid_visible = ?, fog_enabled = ? WHERE id = ?`
  ).run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 100) : row.name,
    'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    'width' in body ? toNumber(body.width, row.width) : row.width,
    'height' in body ? toNumber(body.height, row.height) : row.height,
    'gridSize' in body ? clamp(toNumber(body.gridSize, row.grid_size), 10, 500) : row.grid_size,
    'gridOffsetX' in body ? clamp(toNumber(body.gridOffsetX, row.grid_offset_x), -500, 500) : row.grid_offset_x,
    'gridOffsetY' in body ? clamp(toNumber(body.gridOffsetY, row.grid_offset_y), -500, 500) : row.grid_offset_y,
    'gridVisible' in body ? (body.gridVisible ? 1 : 0) : row.grid_visible,
    'fogEnabled' in body ? (body.fogEnabled ? 1 : 0) : row.fog_enabled,
    row.id
  );
  sendeSzene();
  res.json(rowToScene(holeSzene(row.id)));
});

router.delete('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  db.prepare('DELETE FROM scenes WHERE id = ?').run(row.id);
  if (aktiveSzeneId() === row.id) {
    setState('szene', db.prepare('SELECT id FROM scenes ORDER BY created_at DESC').get()?.id ?? null);
  }
  sendeSzene();
  res.status(204).end();
});

/** Eine Szene auf den Tisch legen – auch aus der Kartenbibliothek heraus. */
export function aktiviereSzene(row) {
  setState('szene', row.id);
  chronik.log({ kind: 'szene', text: `Die Runde erreicht: ${row.name}.`, meta: { sceneId: row.id, name: row.name } });
  sendeSzene();
}

// POST /api/scenes/:id/aktivieren – Szene auf den Tisch legen
router.post('/:id/aktivieren', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  aktiviereSzene(row);
  res.json(rowToScene(row));
});

/* --- Nebel des Krieges --------------------------------------------------- */

const MAX_FELDER = 40000;

// POST /api/scenes/:id/nebel  { cells: ['3,4', …], revealed: true }
router.post('/:id/nebel', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const cells = Array.isArray(req.body?.cells)
    ? req.body.cells.filter((c) => typeof c === 'string' && /^-?\d+,-?\d+$/.test(c)).slice(0, 4000)
    : [];
  if (cells.length === 0) return res.json({ ok: true });

  const revealed = req.body?.revealed !== false;
  const offen = new Set(JSON.parse(row.fog));
  for (const cell of cells) {
    if (revealed) offen.add(cell);
    else offen.delete(cell);
  }

  const naechste = [...offen].slice(0, MAX_FELDER);
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(naechste), row.id);

  // Nur die Änderung wandert übers Netz, nicht die ganze Karte.
  broadcast('nebel', { sceneId: row.id, cells, revealed }, { exceptClient: originClient(req) });
  res.json({ ok: true, offen: naechste.length });
});

// POST /api/scenes/:id/nebel/alles  { revealed: true|false }
router.post('/:id/nebel/alles', requireDm, (req, res) => {
  const row = holeSzene(req.params.id);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const revealed = req.body?.revealed === true;

  let fog = [];
  if (revealed) {
    // Dieselbe Feldrechnung wie im Browser: Bei verschobenem Raster fängt
    // das erste Feld links oben bei einem negativen Index an.
    const g = row.grid_size;
    const minX = Math.floor(-row.grid_offset_x / g);
    const minY = Math.floor(-row.grid_offset_y / g);
    const maxX = Math.floor((Math.max(1, row.width) - 1 - row.grid_offset_x) / g);
    const maxY = Math.floor((Math.max(1, row.height) - 1 - row.grid_offset_y) / g);
    for (let y = minY; y <= maxY && fog.length < MAX_FELDER; y++) {
      for (let x = minX; x <= maxX && fog.length < MAX_FELDER; x++) fog.push(`${x},${y}`);
    }
  }
  db.prepare('UPDATE scenes SET fog = ? WHERE id = ?').run(JSON.stringify(fog), row.id);
  sendeSzene();
  res.json({ ok: true, offen: fog.length });
});

/* --- Figuren ------------------------------------------------------------- */

router.post('/:id/figuren', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const body = req.body ?? {};
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    szene.id,
    typeof body.name === 'string' ? body.name.slice(0, 60) : '',
    toNumber(body.x, 0),
    toNumber(body.y, 0),
    clamp(toNumber(body.size, 1), 1, 6),
    /^#[0-9a-f]{6}$/i.test(body.color ?? '') ? body.color : '#9a2b22',
    body.mediaId ?? null,
    body.characterId ?? null,
    body.combatantId ?? null,
    body.hidden ? 1 : 0,
    new Date().toISOString()
  );
  const row = holeFigur(id);
  meldeFigur(row, req);
  res.status(201).json(rowToToken(row));
});

// PATCH /api/scenes/figuren/:id – Bewegen darf auch, wem die Figur gehört
router.patch('/figuren/:id', (req, res) => {
  const row = holeFigur(req.params.id);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  if (!darfBewegen(req.user, row)) return res.status(403).json({ code: 'figur_fremd', error: 'Diese Figur gehört jemand anderem.' });

  const body = req.body ?? {};
  const nurBewegen = !isDm(req.user);

  db.prepare(
    `UPDATE tokens SET x = ?, y = ?, name = ?, size = ?, color = ?, media_id = ?, hidden = ? WHERE id = ?`
  ).run(
    'x' in body ? toNumber(body.x, row.x) : row.x,
    'y' in body ? toNumber(body.y, row.y) : row.y,
    !nurBewegen && typeof body.name === 'string' ? body.name.slice(0, 60) : row.name,
    !nurBewegen && 'size' in body ? clamp(toNumber(body.size, row.size), 1, 6) : row.size,
    !nurBewegen && /^#[0-9a-f]{6}$/i.test(body.color ?? '') ? body.color : row.color,
    !nurBewegen && 'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    !nurBewegen && 'hidden' in body ? (body.hidden ? 1 : 0) : row.hidden,
    row.id
  );

  const next = holeFigur(row.id);
  meldeFigur(next, req);
  // Eine Figur, die eben noch versteckt war, muss bei der Runde neu auftauchen.
  if (row.hidden && !next.hidden) broadcast('figur', rowToToken(next), { role: 'spieler' });
  res.json(rowToToken(next));
});

router.delete('/figuren/:id', requireDm, (req, res) => {
  const row = holeFigur(req.params.id);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  db.prepare('DELETE FROM tokens WHERE id = ?').run(row.id);
  broadcast('figur:entfernt', { id: row.id });
  res.status(204).end();
});

// POST /api/scenes/:id/figuren/aus-kampf – alle Kämpfer als Figuren auslegen
router.post('/:id/figuren/aus-kampf', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const vorhanden = new Set(
    db
      .prepare('SELECT combatant_id FROM tokens WHERE scene_id = ? AND combatant_id IS NOT NULL')
      .all(szene.id)
      .map((r) => r.combatant_id)
  );
  const kaempfer = db.prepare('SELECT * FROM combatants ORDER BY initiative DESC').all();
  const now = new Date().toISOString();
  const raster = szene.grid_size;

  let platz = 0;
  const einfuegen = db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id, hidden, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`
  );

  for (const k of kaempfer) {
    if (vorhanden.has(k.id)) continue;
    // In einer Reihe am oberen Rand ablegen; die Spielleitung schiebt sie
    // dann an ihren Platz.
    einfuegen.run(
      randomUUID(),
      szene.id,
      k.name,
      (platz % 12) * raster,
      Math.floor(platz / 12) * raster,
      k.type === 'pc' ? '#2d4f7c' : k.type === 'npc' ? '#2f6b4f' : '#9a2b22',
      // Wer eine Figur gegossen hat, steht damit auf der Karte.
      k.media_id ?? null,
      k.character_id,
      k.id,
      k.hidden,
      now
    );
    platz += 1;
  }

  sendeSzene();
  res.status(201).json({ created: platz });
});

/* --- Zeigen -------------------------------------------------------------- */

// POST /api/scenes/ping – ein kurzes Aufleuchten für alle, nichts wird gespeichert
router.post('/ping', (req, res) => {
  const body = req.body ?? {};
  broadcast('ping', {
    x: toNumber(body.x, 0),
    y: toNumber(body.y, 0),
    color: req.user.color,
    name: req.user.name,
    at: Date.now(),
  });
  res.status(204).end();
});

export default router;
