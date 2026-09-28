/**
 * Die Figuren auf dem Tisch: auslegen, schieben, wegnehmen, aus dem Kampf
 * holen.
 *
 * Das Schieben ist der einzige Weg hier, den auch die Runde gehen darf –
 * und auch nur für die eigene Figur. Wem welche gehört, entscheidet
 * `darfBewegen`, nicht die Oberfläche.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db, getState, setState } from '../../db.js';
import { isDm, requireDm } from '../../auth.js';
import { broadcast } from '../../events.js';
import { clamp, holeFigur, holeSzene, rowToToken, toNumber } from '../../spieltisch/umwandlung.js';
import { darfBewegen, meldeFigur, sendeSzene } from '../../spieltisch/melden.js';

const router = Router();

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

export default router;
