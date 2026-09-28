/**
 * Die Wege des Spieltisches: Szenen, Nebel, Figuren, Vorhang, Zeigen.
 *
 * Nur noch die Wege – gerechnet und verschickt wird nebenan:
 *
 *   ../spieltisch/umwandlung.js    Zeilen in Objekte, und die Nachschlagefragen
 *   ../spieltisch/sichtbarkeit.js  wer sieht was (die Kernfrage)
 *   ../spieltisch/melden.js        wer erfährt wann davon
 *
 * Die Aufteilung ist keine Ordnungsliebe: Die Sichtbarkeit wird auch von
 * anderen Wegen gebraucht (ein Nebelstrich kann eine Figur aufdecken, ein
 * geändertes Charakterblatt die Sichtweite ändern), und eine Rechnung, die
 * an zwei Stellen steht, ist an einer davon irgendwann falsch. In diesem
 * Fall hieße „falsch“: Die Runde sieht den Hinterhalt.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient, presence } from '../events.js';
import * as chronik from '../chronicle.js';
import { kopiereSzene, zielPruefen } from '../uebernehmen.js';
import {
  aktiveSzeneId,
  clamp,
  figuren,
  holeFigur,
  holeSzene,
  rowToScene,
  rowToToken,
  toNumber,
  vorhangZu,
} from '../spieltisch/umwandlung.js';
import { durchAugenVon, meineFiguren, szenenSicht } from '../spieltisch/sichtbarkeit.js';
import {
  aktiviereSzene,
  darfBewegen,
  meldeFigur,
  sendeFigurenWennGeaendert,
  sendeSzene,
} from '../spieltisch/melden.js';

const router = Router();
router.use(requireAuth);

/* --- Szenen -------------------------------------------------------------- */

// GET /api/scenes – die Spielleitung sieht alle, die Runde nur die aktive
router.get('/', (req, res) => {
  if (!isDm(req.user)) {
    const sicht = szenenSicht(req.user, req.campaignId);
    return res.json(sicht ? [sicht] : []);
  }
  const aktiv = aktiveSzeneId(req.campaignId);
  res.json(
    db
      .prepare('SELECT * FROM scenes WHERE campaign_id = ? ORDER BY created_at DESC')
      .all(req.campaignId)
      .map((row) => ({ ...rowToScene(row), aktiv: row.id === aktiv, tokenCount: figuren(row.id).length }))
  );
});

// GET /api/scenes/aktiv – was gerade auf dem Tisch liegt
router.get('/aktiv', (req, res) => {
  res.json(szenenSicht(req.user, req.campaignId));
});

router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return res.status(400).json({ code: 'name_fehlt', error: 'Name ist erforderlich.' });
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, unit, scale, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, ?, '[]', ?, ?, ?, ?)`
  ).run(
    id,
    body.name.trim().slice(0, 100),
    body.mediaId ?? null,
    toNumber(body.width, 0),
    toNumber(body.height, 0),
    clamp(toNumber(body.gridSize, 70), 10, 500),
    body.fogEnabled === false ? 0 : 1,
    body.unit === 'meter' ? 'meter' : 'fuss',
    clamp(toNumber(body.scale, body.unit === 'meter' ? 1 : 5), 0.1, 1000),
    req.campaignId,
    new Date().toISOString()
  );
  // Die erste Szene kommt gleich auf den Tisch.
  if (!aktiveSzeneId(req.campaignId)) setState('szene', req.campaignId, id);
  sendeSzene(req.campaignId);
  res.status(201).json(rowToScene(holeSzene(id, req.campaignId)));
});

router.put('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  const body = req.body ?? {};

  db.prepare(
    `UPDATE scenes SET name = ?, media_id = ?, width = ?, height = ?, grid_size = ?,
            grid_offset_x = ?, grid_offset_y = ?, grid_visible = ?, fog_enabled = ?, dark = ?,
            sight = ?, unit = ?, scale = ?
       WHERE id = ?`
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
    'dark' in body ? (body.dark ? 1 : 0) : row.dark,
    'sight' in body ? clamp(toNumber(body.sight, row.sight), 0, 100000) : row.sight,
    body.unit === 'meter' || body.unit === 'fuss' ? body.unit : row.unit,
    'scale' in body ? clamp(toNumber(body.scale, row.scale), 0.1, 1000) : row.scale,
    row.id
  );
  sendeSzene(req.campaignId);
  res.json(rowToScene(holeSzene(row.id, req.campaignId)));
});

router.delete('/:id', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  db.prepare('DELETE FROM scenes WHERE id = ?').run(row.id);
  if (aktiveSzeneId(req.campaignId) === row.id) {
    setState(
      'szene',
      req.campaignId,
      db.prepare('SELECT id FROM scenes WHERE campaign_id = ? ORDER BY created_at DESC').get(req.campaignId)?.id ?? null
    );
  }
  sendeSzene(req.campaignId);
  res.status(204).end();
});

/**
 * POST /api/scenes/:id/kopieren  { campaignId }
 *
 * Die Szene noch einmal in einer anderen Kampagne – samt Figuren und samt
 * dem Nebel, so wie er gerade steht. Die Karte dahinter gehört ohnehin der
 * ganzen Runde und wird nicht zweimal abgelegt.
 *
 * Figuren, die an einem Charakterblatt hängen, suchen drüben den Charakter
 * gleichen Namens. Wer also erst die Runde kopiert und dann die Szene,
 * bekommt seine Helden wieder auf die Karte; wer es umgekehrt tut, bekommt
 * Figuren ohne Blatt dahinter. Ein Kämpfer aus einem laufenden Kampf bleibt
 * in jedem Fall hier – Kämpfe reisen nicht mit.
 */
router.post('/:id/kopieren', requireDm, zielPruefen, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const kopiert = kopiereSzene(row, req.ziel);
  // Drüben kann diese Kopie gerade die erste Szene überhaupt sein und damit
  // sofort auf dem Tisch liegen – wer dort offen hat, soll es sehen.
  sendeSzene(req.ziel);
  res.status(201).json({ ...kopiert, campaignId: req.ziel });
});

// POST /api/scenes/:id/aktivieren – Szene auf den Tisch legen
router.post('/:id/aktivieren', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });
  aktiviereSzene(row, req.campaignId, { verdeckt: req.body?.verdeckt === true });
  res.json({ ...rowToScene(row), vorhang: vorhangZu(req.campaignId) });
});

/**
 * POST /api/scenes/vorhang  { zu: true|false }
 *
 * Der Vorhang über dem Tisch. Zu heißt: Die Runde bekommt keine Szene mehr,
 * und zwar wirklich keine – der Server schickt nichts, statt im Browser etwas
 * zu verdecken. Auf heißt: Bühne frei.
 *
 * Kampfliste, Beute und Handzettel laufen daneben weiter. Verdeckt wird der
 * Tisch, nicht der ganze Abend.
 */
router.post('/vorhang', requireDm, (req, res) => {
  const zu = req.body?.zu === true;
  const warZu = vorhangZu(req.campaignId);
  setState('vorhang', req.campaignId, zu);

  // Erst jetzt erreicht die Runde den Ort – also steht er jetzt im Protokoll.
  if (warZu && !zu) {
    const id = aktiveSzeneId(req.campaignId);
    const row = id ? holeSzene(id, req.campaignId) : null;
    if (row) {
      chronik.log(
        { kind: 'szene', text: `Der Vorhang hebt sich: ${row.name}.`, meta: { sceneId: row.id, name: row.name } },
        req.campaignId
      );
    }
  }

  sendeSzene(req.campaignId);
  res.json({ vorhang: zu });
});

/**
 * POST /api/scenes/nsc-sicht  { tokenId }
 *
 * Die Spielleitung sieht das Brett standardmäßig ganz – sie muss ja wissen,
 * was hinter dem Hügel steht. Manchmal will sie aber genau das Gegenteil:
 * sehen, was ihr Späher sieht, bevor sie ihn losschickt.
 *
 * Gerechnet wird das nicht im Browser, sondern hier – mit derselben Funktion,
 * die auch für die Runde rechnet. Ein Vorschaubild, das anders rechnet als
 * das Original, wäre keine Hilfe, sondern eine Falle.
 *
 * `tokenId: null` schaltet zurück auf die Vogelperspektive.
 */
router.post('/nsc-sicht', requireDm, (req, res) => {
  const kennung = req.body?.tokenId ?? null;
  if (kennung !== null) {
    const figur = holeFigur(kennung, req.campaignId);
    if (!figur) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
    if (figur.scene_id !== aktiveSzeneId(req.campaignId)) {
      return res.status(409).json({ code: 'figur_andere_szene', error: 'Diese Figur steht nicht auf dem Tisch.' });
    }
  }
  setState('nsc_sicht', req.campaignId, kennung);
  broadcast('szene', szenenSicht({ role: 'sl' }, req.campaignId), { role: 'sl', campaignId: req.campaignId });
  res.json({ nscSicht: kennung });
});

/* --- Nebel des Krieges --------------------------------------------------- */

// 200 x 200 Felder sind 40 000 – bei einem Meter je Feld also die
// zweihundert Meter, die eine große Außenkarte braucht. Etwas Kopfraum
// darüber, damit ein leicht verschobenes Raster nicht schon anstößt.
const MAX_FELDER = 65536;

// POST /api/scenes/:id/nebel  { cells: ['3,4', …], revealed: true }
router.post('/:id/nebel', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
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
  broadcast('nebel', { sceneId: row.id, cells, revealed }, { exceptClient: originClient(req), campaignId: req.campaignId });
  // Deckt der Strich eine Figur auf oder wieder zu, muss auch das ankommen.
  sendeFigurenWennGeaendert(req.campaignId);
  res.json({ ok: true, offen: naechste.length });
});

// POST /api/scenes/:id/nebel/alles  { revealed: true|false }
router.post('/:id/nebel/alles', requireDm, (req, res) => {
  const row = holeSzene(req.params.id, req.campaignId);
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
  sendeSzene(req.campaignId);
  res.json({ ok: true, offen: fog.length });
});

/* --- Figuren ------------------------------------------------------------- */

router.post('/:id/figuren', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id, req.campaignId);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const body = req.body ?? {};
  const id = randomUUID();
  db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id,
                         hidden, light_bright, light_dim, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
    clamp(toNumber(body.lightBright, 0), 0, 200),
    clamp(toNumber(body.lightDim, 0), 0, 200),
    new Date().toISOString()
  );
  const row = holeFigur(id, req.campaignId);
  meldeFigur(row, req);
  res.status(201).json(rowToToken(row));
});

// PATCH /api/scenes/figuren/:id – Bewegen darf auch, wem die Figur gehört
router.patch('/figuren/:id', (req, res) => {
  const row = holeFigur(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  if (!darfBewegen(req.user, row)) return res.status(403).json({ code: 'figur_fremd', error: 'Diese Figur gehört jemand anderem.' });

  const body = req.body ?? {};
  const nurBewegen = !isDm(req.user);

  db.prepare(
    `UPDATE tokens SET x = ?, y = ?, name = ?, size = ?, color = ?, media_id = ?, hidden = ?,
            light_bright = ?, light_dim = ? WHERE id = ?`
  ).run(
    'x' in body ? toNumber(body.x, row.x) : row.x,
    'y' in body ? toNumber(body.y, row.y) : row.y,
    !nurBewegen && typeof body.name === 'string' ? body.name.slice(0, 60) : row.name,
    !nurBewegen && 'size' in body ? clamp(toNumber(body.size, row.size), 1, 6) : row.size,
    !nurBewegen && /^#[0-9a-f]{6}$/i.test(body.color ?? '') ? body.color : row.color,
    !nurBewegen && 'mediaId' in body ? (body.mediaId ?? null) : row.media_id,
    !nurBewegen && 'hidden' in body ? (body.hidden ? 1 : 0) : row.hidden,
    !nurBewegen && 'lightBright' in body ? clamp(toNumber(body.lightBright, row.light_bright), 0, 200) : row.light_bright,
    !nurBewegen && 'lightDim' in body ? clamp(toNumber(body.lightDim, row.light_dim), 0, 200) : row.light_dim,
    row.id
  );

  const next = holeFigur(row.id, req.campaignId);
  meldeFigur(next, req);
  res.json(rowToToken(next));
});

router.delete('/figuren/:id', requireDm, (req, res) => {
  const row = holeFigur(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'figur_nicht_gefunden', error: 'Figur nicht gefunden.' });
  db.prepare('DELETE FROM tokens WHERE id = ?').run(row.id);
  // Mit der Figur geht womöglich ihre Fackel – das ändert, was alle sehen.
  if (getState('nsc_sicht', req.campaignId, null) === row.id) setState('nsc_sicht', req.campaignId, null);
  broadcast('figur:entfernt', { id: row.id }, { role: 'sl', campaignId: req.campaignId });
  sendeSzene(req.campaignId);
  res.status(204).end();
});

// POST /api/scenes/:id/figuren/aus-kampf – alle Kämpfer als Figuren auslegen
router.post('/:id/figuren/aus-kampf', requireDm, (req, res) => {
  const szene = holeSzene(req.params.id, req.campaignId);
  if (!szene) return res.status(404).json({ code: 'szene_nicht_gefunden', error: 'Szene nicht gefunden.' });

  const vorhanden = new Set(
    db
      .prepare('SELECT combatant_id FROM tokens WHERE scene_id = ? AND combatant_id IS NOT NULL')
      .all(szene.id)
      .map((r) => r.combatant_id)
  );
  const kaempfer = db.prepare('SELECT * FROM combatants WHERE campaign_id = ? ORDER BY initiative DESC').all(req.campaignId);
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

  sendeSzene(req.campaignId);
  res.status(201).json({ created: platz });
});

/* --- Zeigen -------------------------------------------------------------- */

// POST /api/scenes/ping – ein kurzes Aufleuchten für alle, nichts wird gespeichert
router.post('/ping', (req, res) => {
  const body = req.body ?? {};
  broadcast(
    'ping',
    { x: toNumber(body.x, 0), y: toNumber(body.y, 0), color: req.user.color, name: req.user.name, at: Date.now() },
    { campaignId: req.campaignId }
  );
  res.status(204).end();
});

export default router;
