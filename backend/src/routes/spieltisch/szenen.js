/**
 * Die Szenen selbst: anlegen, ändern, auflegen, löschen, kopieren – und der
 * Vorhang.
 *
 * Der Vorhang ist der heikelste Weg darin. Zugezogen heißt: Die Runde
 * bekommt *keine* Szene mehr geschickt, nicht etwa eine, die sie nicht
 * anzeigt. Was hinter dem Vorhang aufgebaut wird, verlässt den Server nicht.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, setState } from '../../db.js';
import { isDm, requireDm } from '../../auth.js';
import { broadcast } from '../../events.js';
import * as chronik from '../../chronicle.js';
import { kopiereSzene, zielPruefen } from '../../uebernehmen.js';
import { aktiveSzeneId, holeFigur, holeSzene, rowToScene, vorhangZu } from '../../spieltisch/umwandlung.js';
import { clamp, hatText, toNumber } from '../../werte.js';
import { szenenSicht } from '../../spieltisch/sichtbarkeit.js';
import { aktiviereSzene, sendeSzene } from '../../spieltisch/melden.js';

const router = Router();

// GET /api/scenes – die Spielleitung sieht alle, die Runde nur die aktive
router.get('/', (req, res) => {
  if (!isDm(req.user)) {
    const sicht = szenenSicht(req.user, req.campaignId);
    return res.json(sicht ? [sicht] : []);
  }
  const aktiv = aktiveSzeneId(req.campaignId);
  // Gezählt wird in derselben Abfrage – nicht je Szene alle Figuren laden,
  // nur um die Länge der Liste zu nehmen.
  res.json(
    db
      .prepare(
        `SELECT s.*, (SELECT COUNT(*) FROM tokens t WHERE t.scene_id = s.id) AS token_count
           FROM scenes s WHERE s.campaign_id = ? ORDER BY s.created_at DESC`
      )
      .all(req.campaignId)
      .map((row) => ({ ...rowToScene(row), aktiv: row.id === aktiv, tokenCount: row.token_count }))
  );
});

// GET /api/scenes/aktiv – was gerade auf dem Tisch liegt
router.get('/aktiv', (req, res) => {
  res.json(szenenSicht(req.user, req.campaignId));
});

// POST /api/scenes  { name, mediaId?, width, height, gridSize?, unit?, scale? }
//
// Eine Szene anlegen, unter vollem Nebel. Die erste Szene einer Kampagne
// kommt gleich auf den Tisch; alle weiteren warten, bis sie aufgelegt werden.
router.post('/', requireDm, (req, res) => {
  const body = req.body ?? {};
  if (!hatText(body.name)) {
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

// PUT /api/scenes/:id – Raster, Nebel, Dunkelheit, Sichtweite, Maßstab.
// Alle Zahlen werden auf vernünftige Grenzen gestutzt (siehe werte.js,
// `clamp`), damit ein Tippfehler keine Karte aus einer Million Feldern macht.
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

// DELETE /api/scenes/:id – eine Szene samt Figuren und Nebel löschen. Lag
// sie auf dem Tisch, rückt die jüngste andere nach.
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

export default router;
