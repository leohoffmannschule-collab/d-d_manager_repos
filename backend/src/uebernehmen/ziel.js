/**
 * Die Zielkampagne: Darf hier überhaupt hineingelegt werden?
 *
 * Jede Kopierroute beginnt mit derselben Vergewisserung – nicht dieselbe
 * Kampagne, und nur eine, in der die Spielleitung selbst sitzt. Wer nicht
 * hineinsieht, soll auch nichts hineinlegen können.
 */
import { db } from '../db.js';

/**
 * Darf hier hineingelegt werden?
 *
 * Nur in Kampagnen, in denen die Spielleitung selbst sitzt: Wer nicht
 * hineinsieht, soll auch nichts hineinlegen können. Gibt die Kampagne
 * zurück oder null.
 */
export function zielKampagne(id, userId) {
  if (!id) return null;
  return (
    db
      .prepare(
        `SELECT c.* FROM campaigns c
           JOIN campaign_members m ON m.campaign_id = c.id
          WHERE c.id = ? AND m.user_id = ? AND c.deleted_at IS NULL`
      )
      .get(id, userId) ?? null
  );
}

/**
 * Die Zielkampagne aus dem Rumpf der Anfrage, geprüft und in `req.ziel`
 * abgelegt – oder eine Absage. Jede Kopierroute beginnt mit derselben
 * Vergewisserung, also steht sie einmal hier.
 */
export function zielPruefen(req, res, next) {
  const ziel = req.body?.campaignId;
  if (ziel === req.campaignId) {
    return res.status(400).json({
      code: 'gleiche_kampagne',
      error: 'Das wäre dieselbe Kampagne – kopiert wird nur in eine andere.',
    });
  }
  if (!zielKampagne(ziel, req.user.id)) {
    return res.status(403).json({ code: 'ziel_unbekannt', error: 'In diese Kampagne kannst du nichts legen.' });
  }
  req.ziel = ziel;
  next();
}
