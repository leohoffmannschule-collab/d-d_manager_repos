/**
 * Wer sitzt in welcher Kampagne? – nur für die Spielleitung.
 *
 * Konten gehören der ganzen Runde; welche davon in einer Kampagne
 * mitspielen, steht in `campaign_members`. Wer herausgenommen wird, verliert
 * sofort den Zugang: Seine Sitzung zeigt auf keine Kampagne mehr, und sein
 * offenes Fenster wird getrennt.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { requireDm } from '../../auth.js';
import { trenne } from '../../events.js';

const router = Router();

// GET /api/campaigns/:id/mitglieder – wer in dieser Kampagne mitspielt, die
// Spielleitung zuerst.
router.get('/:id/mitglieder', requireDm, (req, res) => {
  const kampagne = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(req.params.id);
  if (!kampagne) return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });

  res.json(
    db
      .prepare(
        `SELECT u.id, u.name, u.role, u.color, m.joined_at
           FROM campaign_members m JOIN users u ON u.id = m.user_id
          WHERE m.campaign_id = ?
          ORDER BY u.role = 'sl' DESC, u.name COLLATE NOCASE`
      )
      .all(req.params.id)
  );
});

// POST /api/campaigns/:id/mitglieder  { userId } – ein Konto in diese Kampagne
// aufnehmen. Wer schon dabei ist, bleibt einfach dabei.
router.post('/:id/mitglieder', requireDm, (req, res) => {
  const kampagne = db.prepare('SELECT id FROM campaigns WHERE id = ?').get(req.params.id);
  if (!kampagne) return res.status(404).json({ code: 'kampagne_nicht_gefunden', error: 'Kampagne nicht gefunden.' });

  const konto = db.prepare('SELECT id FROM users WHERE id = ?').get(req.body?.userId);
  if (!konto) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });

  db.prepare(
    `INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)
     ON CONFLICT(campaign_id, user_id) DO NOTHING`
  ).run(req.params.id, konto.id, new Date().toISOString());
  res.status(204).end();
});

// DELETE /api/campaigns/:id/mitglieder/:userId – ein Konto aus der Kampagne
// nehmen. Die Blätter bleiben liegen; wer gerade in ihr saß, landet wieder in
// der Kampagnenauswahl.
router.delete('/:id/mitglieder/:userId', requireDm, (req, res) => {
  db.prepare('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?').run(
    req.params.id,
    req.params.userId
  );
  // Wer gerade dort spielte, steht sonst in einer Kampagne, zu der er keinen Zutritt mehr hat.
  db.prepare('UPDATE auth_sessions SET campaign_id = NULL WHERE campaign_id = ? AND user_id = ?').run(
    req.params.id,
    req.params.userId
  );
  // Und ein offenes Fenster hörte sonst weiter mit – Chat, Würfe, Tisch –,
  // obwohl jede neue Anfrage schon abgewiesen würde.
  trenne({ userId: req.params.userId, campaignId: req.params.id });
  res.status(204).end();
});

export default router;
