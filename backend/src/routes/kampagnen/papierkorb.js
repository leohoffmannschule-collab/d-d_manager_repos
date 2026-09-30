/**
 * Der Papierkorb: wegräumen, ansehen, wiederherstellen, endgültig entfernen.
 *
 * Gelöscht wird zweistufig – erst in den Papierkorb, nach der Frist (oder
 * auf ausdrücklichen Wunsch) endgültig. Beide Schritte verlangen den
 * abgetippten Namen, und beide darf nur, wer die Kampagne angelegt hat.
 * Die Regeln dahinter stehen in ../../kampagnen.js.
 */
import { Router } from 'express';
import { db, transaktion } from '../../db.js';
import { trenne } from '../../events.js';
import { endgueltigEntfernen, FRIST_TAGE, raeumePapierkorb, verbleibendeTage } from '../../kampagnen.js';
import { darfVerwalten, holen, nameBestaetigt } from './regeln.js';

const router = Router();

/**
 * DELETE /api/campaigns/:id  { name }
 *
 * In den Papierkorb, nicht ins Nichts: Die Kampagne verschwindet aus allen
 * Listen, ihre Daten bleiben die Frist über liegen (siehe kampagnen.js).
 * Verlangt wird der abgetippte Name – ein Fehlgriff im Menü soll keine
 * Kampagne kosten.
 */
router.delete('/:id', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || kampagne.deleted_at) {
    return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });
  }
  if (!darfVerwalten(kampagne, req.user)) {
    return res.status(403).json({
      code: 'nicht_angelegt',
      error: 'Löschen darf nur, wer diese Kampagne angelegt hat.',
    });
  }
  if (!nameBestaetigt(kampagne, req.body?.name)) {
    return res.status(400).json({
      code: 'name_stimmt_nicht',
      error: 'Zum Bestätigen muss der Name der Kampagne genau abgetippt werden.',
    });
  }

  transaktion(() => {
    db.prepare('UPDATE campaigns SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), kampagne.id);
    // Alle, die gerade darin sitzen, landen bei der nächsten Anfrage wieder in
    // der Kampagnenauswahl – sonst liefen sie ins Leere.
    db.prepare('UPDATE auth_sessions SET campaign_id = NULL WHERE campaign_id = ?').run(kampagne.id);
  });
  trenne({ campaignId: kampagne.id });
  res.json({ id: kampagne.id, name: kampagne.name, frist: FRIST_TAGE });
});

// GET /api/campaigns/papierkorb – was man selbst weggeräumt hat, samt Restfrist.
router.get('/papierkorb', (req, res) => {
  raeumePapierkorb();
  const rows = db
    .prepare('SELECT id, name, created_by, deleted_at FROM campaigns WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC')
    .all()
    .filter((k) => darfVerwalten(k, req.user))
    .map((k) => ({ id: k.id, name: k.name, geloeschtAm: k.deleted_at, tageUebrig: verbleibendeTage(k.deleted_at) }));
  res.json(rows);
});

// POST /api/campaigns/:id/wiederherstellen
router.post('/:id/wiederherstellen', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || !kampagne.deleted_at) {
    return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Im Papierkorb liegt sie nicht.' });
  }
  if (!darfVerwalten(kampagne, req.user)) {
    return res.status(403).json({ code: 'nicht_angelegt', error: 'Das darf nur, wer die Kampagne angelegt hat.' });
  }
  db.prepare('UPDATE campaigns SET deleted_at = NULL WHERE id = ?').run(kampagne.id);
  res.json({ id: kampagne.id, name: kampagne.name });
});

/**
 * DELETE /api/campaigns/:id/endgueltig  { name }
 *
 * Jetzt und ohne Wiederkehr: Charaktere, Chronik, Szenen, Begegnungen und
 * Beute dieser Kampagne sind danach fort. Die Kartenbibliothek bleibt – sie
 * gehört der Runde, nicht der einzelnen Geschichte. Auch hier muss der Name
 * abgetippt werden, und liegen muss sie ohnehin schon im Papierkorb.
 */
router.delete('/:id/endgueltig', (req, res) => {
  const kampagne = holen(req.params.id);
  if (!kampagne || !kampagne.deleted_at) {
    return res.status(404).json({
      code: 'nicht_im_papierkorb',
      error: 'Endgültig entfernen lässt sich nur, was schon im Papierkorb liegt.',
    });
  }
  if (!darfVerwalten(kampagne, req.user)) {
    return res.status(403).json({ code: 'nicht_angelegt', error: 'Das darf nur, wer die Kampagne angelegt hat.' });
  }
  if (!nameBestaetigt(kampagne, req.body?.name)) {
    return res.status(400).json({
      code: 'name_stimmt_nicht',
      error: 'Zum Bestätigen muss der Name der Kampagne genau abgetippt werden.',
    });
  }

  endgueltigEntfernen(kampagne.id);
  res.status(204).end();
});

export default router;
