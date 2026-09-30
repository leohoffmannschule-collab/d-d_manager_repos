/**
 * Blätter lesen: die Liste, ein einzelnes, die Verwaltungsansicht.
 *
 * Die Liste filtert der Server: Die Runde bekommt ihre eigenen und die
 * geteilten Blätter, nie ein NSC-Blatt – auch nicht in der Anfrage, sodass
 * es im Netzwerkfenster des Browsers gar nicht erst auftaucht.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { isDm, requireDm } from '../../auth.js';
import { SELECT, darfBearbeiten, darfSehen, holen, rowToCharacter, summary } from './blatt.js';

const router = Router();

// GET /api/characters – eigene Charaktere, dazu die geteilten der Mitspieler
router.get('/', (req, res) => {
  const rows = isDm(req.user)
    ? db.prepare(`${SELECT} WHERE c.campaign_id = ? ORDER BY c.updated_at DESC`).all(req.campaignId)
    : db
        .prepare(
          `${SELECT} WHERE c.campaign_id = ? AND c.npc = 0 AND (c.owner_id = ? OR c.shared = 1) ORDER BY c.updated_at DESC`
        )
        .all(req.campaignId, req.user.id);
  res.json(rows.map(summary));
});

// GET /api/characters/:id – ein Blatt vollständig, samt `editable`: ob der
// Fragende es ändern darf (eigenes Blatt oder Spielleitung). Fremde, nicht
// geteilte Blätter und NSC-Blätter bekommt die Runde nicht (403).
router.get('/:id', (req, res) => {
  const row = holen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, row)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });
  res.json({ ...rowToCharacter(row), editable: darfBearbeiten(req.user, row) });
});

// GET /api/characters/verwaltung/alle – alle Blätter der Kampagne für die
// Verwaltung, NSC eingeschlossen. Zwei Pfadteile, damit es sich nie mit
// `GET /:id` überschneidet.
router.get('/verwaltung/alle', requireDm, (req, res) => {
  res.json(db.prepare(`${SELECT} WHERE c.campaign_id = ? ORDER BY c.name COLLATE NOCASE`).all(req.campaignId).map(summary));
});

export default router;
