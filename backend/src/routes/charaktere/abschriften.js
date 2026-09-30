/**
 * Abschriften: dasselbe Blatt noch einmal – in dieser Kampagne oder in einer
 * anderen.
 *
 * Kopiert wird, nicht verschoben. Das Blatt hier bleibt, wo es ist, und
 * beide gehen fortan getrennte Wege.
 */
import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../../db.js';
import { requireDm } from '../../auth.js';
import { meldeBlatt } from '../../blattmeldung.js';
import { kopiereCharakter, zielPruefen } from '../../uebernehmen.js';
import { darfSehen, holen, meldeAenderung, rowToCharacter, summary } from './blatt.js';

const router = Router();

// POST /api/characters/:id/duplicate – eine Abschrift in derselben Kampagne,
// die dem Fragenden gehört. So kommt eine Vorlage vom Schirm auf den Tisch.
router.post('/:id/duplicate', (req, res) => {
  const existing = holen(req.params.id, req.campaignId);
  if (!existing) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });
  if (!darfSehen(req.user, existing)) return res.status(403).json({ code: 'blatt_nicht_sichtbar', error: 'Dieses Blatt ist nicht für dich bestimmt.' });

  // Die Abschrift ist *nie* ein NSC-Blatt, auch nicht die eines NSC – das
  // sieht nach einem Versehen aus, ist aber der Weg, auf dem eine Vorlage
  // vom Schirm auf den Tisch kommt (siehe vorlagen/index.js): Abschrift
  // nehmen, jemandem zuteilen, fertig. Wer einen NSC doppelt braucht, legt
  // die Abschrift mit PATCH { npc: true } zurück hinter den Schirm.
  // `shared` wandert mit; aus einem NSC-Blatt (nie geteilt) wird damit ein
  // ungeteiltes Blatt der Spielleitung, das die Runde noch nicht sieht.
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, `${existing.name} (Kopie)`, existing.system, existing.data, req.user.id, existing.shared, req.campaignId, now, now);
  const row = holen(id, req.campaignId);
  meldeAenderung(row, req);
  res.status(201).json(rowToCharacter(row));
});

/**
 * POST /api/characters/:id/kopieren  { campaignId }
 *
 * Dasselbe Blatt in einer anderen Kampagne – etwa, wenn die Runde dieselben
 * Helden in einer neuen Geschichte weiterspielt oder ein NSC ein zweites Mal
 * gebraucht wird. Kopiert wird, nicht verschoben: Das Blatt hier bleibt, wo
 * es ist, und beide gehen fortan getrennte Wege.
 */
router.post('/:id/kopieren', requireDm, zielPruefen, (req, res) => {
  const quelle = holen(req.params.id, req.campaignId);
  if (!quelle) return res.status(404).json({ code: 'charakter_nicht_gefunden', error: 'Charakter nicht gefunden' });

  const kopiert = kopiereCharakter(quelle, req.ziel);

  // Die Zielkampagne erfährt vom neuen Blatt sofort – wer dort gerade offen
  // hat, soll nicht erst neu laden müssen. Aber nur, wer es sehen darf: Die
  // Kopie eines NSC-Blattes bleibt auch drüben hinter dem Schirm.
  const neu = holen(kopiert.id, req.ziel);
  meldeBlatt(neu, summary(neu), { campaignId: req.ziel });
  res.status(201).json({ ...kopiert, campaignId: req.ziel });
});

export default router;
