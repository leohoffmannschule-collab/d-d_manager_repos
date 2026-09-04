import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { db, mediaDir } from '../db.js';
import { requireDm } from '../auth.js';
import { aktiviereSzene } from './scenes.js';
import { klangAuflegen } from './ambience.js';

const router = Router();

// Die Bibliothek ist Vorbereitung. Was dort liegt, hat die Runde noch nicht
// gesehen – und soll es auch nicht, bevor die Karte auf dem Tisch liegt.
router.use(requireDm);

const toNumber = (wert, ersatz) => (Number.isFinite(Number(wert)) ? Number(wert) : ersatz);
const clamp = (wert, min, max) => Math.min(max, Math.max(min, wert));

function rowToMap(row) {
  return {
    id: row.id,
    name: row.name,
    mediaId: row.media_id,
    thumbMediaId: row.thumb_media_id,
    width: row.width,
    height: row.height,
    gridSize: row.grid_size,
    gridOffsetX: row.grid_offset_x,
    gridOffsetY: row.grid_offset_y,
    ambienceId: row.ambience_id,
    tags: JSON.parse(row.tags),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

const holen = (id) => db.prepare('SELECT * FROM maps WHERE id = ?').get(id);

const sauberesSchlagwort = (t) => typeof t === 'string' && t.trim();
const schlagworte = (liste) =>
  Array.isArray(liste) ? liste.filter(sauberesSchlagwort).map((t) => t.trim().slice(0, 40)).slice(0, 12) : [];

/**
 * Ein Bild löschen, aber nur, wenn es sonst niemand mehr braucht. Eine Szene,
 * die aus der Karte gelegt wurde, zeigt auf dasselbe Bild – wer die Karte aus
 * der Bibliothek nimmt, soll damit nicht die Karte vom Tisch reißen.
 */
function bildFreigeben(mediaId) {
  if (!mediaId) return;
  const nochBenutzt =
    db.prepare('SELECT 1 FROM scenes WHERE media_id = ? LIMIT 1').get(mediaId) ||
    db.prepare('SELECT 1 FROM tokens WHERE media_id = ? LIMIT 1').get(mediaId) ||
    db.prepare('SELECT 1 FROM combatants WHERE media_id = ? LIMIT 1').get(mediaId) ||
    db.prepare('SELECT 1 FROM library WHERE media_id = ? LIMIT 1').get(mediaId) ||
    db.prepare('SELECT 1 FROM maps WHERE media_id = ? OR thumb_media_id = ? LIMIT 1').get(mediaId, mediaId);
  if (nochBenutzt) return;

  const bild = db.prepare('SELECT * FROM media WHERE id = ?').get(mediaId);
  if (!bild) return;
  fs.rmSync(path.join(mediaDir, bild.filename), { force: true });
  db.prepare('DELETE FROM media WHERE id = ?').run(mediaId);
}

// GET /api/maps
router.get('/', (req, res) => {
  const karten = db.prepare('SELECT * FROM maps ORDER BY name COLLATE NOCASE').all().map(rowToMap);
  // Wie oft liegt diese Karte schon als Szene vor?
  const szenen = db.prepare('SELECT map_id, COUNT(*) AS n FROM scenes WHERE map_id IS NOT NULL GROUP BY map_id').all();
  const zahl = new Map(szenen.map((z) => [z.map_id, z.n]));
  res.json(karten.map((k) => ({ ...k, szenen: zahl.get(k.id) ?? 0 })));
});

// POST /api/maps
router.post('/', (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO maps (id, name, media_id, thumb_media_id, width, height, grid_size,
                       grid_offset_x, grid_offset_y, tags, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 120),
    body.mediaId ?? null,
    body.thumbMediaId ?? null,
    toNumber(body.width, 0),
    toNumber(body.height, 0),
    clamp(toNumber(body.gridSize, 70), 10, 500),
    JSON.stringify(schlagworte(body.tags)),
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '',
    new Date().toISOString()
  );
  res.status(201).json(rowToMap(holen(id)));
});

// PUT /api/maps/:id – umbenennen, verschlagworten, Raster nachjustieren
router.put('/:id', (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'karte_nicht_gefunden', error: 'Karte nicht gefunden.' });
  const body = req.body ?? {};

  db.prepare(
    `UPDATE maps SET name = ?, tags = ?, notes = ?, grid_size = ?, grid_offset_x = ?, grid_offset_y = ?,
                     ambience_id = ?
       WHERE id = ?`
  ).run(
    typeof body.name === 'string' && body.name.trim() ? body.name.trim().slice(0, 120) : row.name,
    'tags' in body ? JSON.stringify(schlagworte(body.tags)) : row.tags,
    typeof body.notes === 'string' ? body.notes.slice(0, 2000) : row.notes,
    'gridSize' in body ? clamp(toNumber(body.gridSize, row.grid_size), 10, 500) : row.grid_size,
    'gridOffsetX' in body ? clamp(toNumber(body.gridOffsetX, row.grid_offset_x), -500, 500) : row.grid_offset_x,
    'gridOffsetY' in body ? clamp(toNumber(body.gridOffsetY, row.grid_offset_y), -500, 500) : row.grid_offset_y,
    'ambienceId' in body ? (body.ambienceId || null) : row.ambience_id,
    row.id
  );
  res.json(rowToMap(holen(row.id)));
});

// DELETE /api/maps/:id
router.delete('/:id', (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'karte_nicht_gefunden', error: 'Karte nicht gefunden.' });

  db.prepare('DELETE FROM maps WHERE id = ?').run(row.id);
  // Szenen aus dieser Karte bleiben liegen – sie zeigen nur nicht mehr auf ein
  // Blatt, das es nicht mehr gibt.
  db.prepare('UPDATE scenes SET map_id = NULL WHERE map_id = ?').run(row.id);
  // Erst nach dem Löschen prüfen, sonst zählt die Karte sich selbst mit.
  bildFreigeben(row.media_id);
  bildFreigeben(row.thumb_media_id);
  res.status(204).end();
});

/**
 * POST /api/maps/:id/auflegen
 *
 * Bringt die Karte auf den Tisch. Gab es aus ihr schon eine Szene, kommt
 * diese zurück – samt Nebel, den die Runde sich erspielt hat. Wer wirklich
 * von vorn anfangen will, schickt `frisch: true`; sonst würde zweimaliges
 * Auflegen die Bibliothek mit halbaufgedeckten Zwillingen zumüllen.
 *
 * Das Raster wandert in jedem Fall mit: einmal ausgerichtet, immer richtig.
 */
router.post('/:id/auflegen', (req, res) => {
  const row = holen(req.params.id);
  if (!row) return res.status(404).json({ code: 'karte_nicht_gefunden', error: 'Karte nicht gefunden.' });

  if (req.body?.frisch !== true) {
    const vorhanden = db
      .prepare('SELECT * FROM scenes WHERE map_id = ? ORDER BY created_at DESC LIMIT 1')
      .get(row.id);
    if (vorhanden) {
      aktiviereSzene(vorhanden);
      if (row.ambience_id) klangAuflegen(row.ambience_id);
      return res.json({ sceneId: vorhanden.id, name: vorhanden.name, neu: false });
    }
  }

  const id = randomUUID();
  const name = typeof req.body?.name === 'string' && req.body.name.trim() ? req.body.name.trim() : row.name;

  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, map_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, '[]', ?, ?)`
  ).run(
    id,
    name.slice(0, 100),
    row.media_id,
    row.width,
    row.height,
    row.grid_size,
    row.grid_offset_x,
    row.grid_offset_y,
    req.body?.fogEnabled === false ? 0 : 1,
    row.id,
    new Date().toISOString()
  );

  const szene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(id);
  aktiviereSzene(szene);
  // Hängt an der Karte eine Ambiente, legt sie sich mit auf.
  if (row.ambience_id) klangAuflegen(row.ambience_id);
  res.status(201).json({ sceneId: id, name: szene.name, neu: true });
});

export default router;
