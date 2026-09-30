/**
 * Die Konten der Runde verwalten – nur für die Spielleitung.
 *
 * Rolle und Farbe ändern, ein neues Kennwort setzen, ein Konto löschen. Wer
 * ändert, wer jemand ist, trennt dessen offene Live-Kanäle: Ein Fenster
 * hält die Rolle vom Moment des Verbindens fest (siehe events.js).
 */
import { Router } from 'express';
import { db, transaktion } from '../../db.js';
import { destroyAllSessions, hashPassword, requireDm } from '../../auth.js';
import { broadcast, trenne } from '../../events.js';
import { asynchron } from '../../asynchron.js';
import { istFarbe } from '../../werte.js';
import { MIN_PASSWORT, letzteSpielleitung, passwortZuKurz } from './regeln.js';

const router = Router();

router.get('/users', requireDm, (req, res) => {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.role, u.color, u.created_at,
              (SELECT COUNT(*) FROM characters c WHERE c.owner_id = u.id) AS characters
         FROM users u ORDER BY u.role = 'sl' DESC, u.name COLLATE NOCASE`
    )
    .all();
  res.json(rows);
});

/**
 * PATCH /api/auth/users/:id { role?, color?, password? }
 *
 * Erst wird *alles* geprüft, dann *alles* geschrieben. Andersherum stünde
 * nach „neue Rolle, aber zu kurzes Kennwort“ die Rolle schon geändert da,
 * während die Antwort „400, nichts passiert“ behauptet.
 */
router.patch('/users/:id', requireDm, asynchron(async (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });

  const { role, color, password } = req.body ?? {};
  const neueRolle = role && role !== row.role ? role : null;
  const neuesKennwort = typeof password === 'string' && password ? password : null;

  if (neueRolle) {
    if (!['sl', 'spieler'].includes(neueRolle)) {
      return res.status(400).json({ code: 'unbekannte_rolle', error: 'Unbekannte Rolle.' });
    }
    // Es muss immer jemand die Spielleitung innehaben.
    if (row.role === 'sl' && letzteSpielleitung()) {
      return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
    }
  }
  if (neuesKennwort && neuesKennwort.length < MIN_PASSWORT) return passwortZuKurz(res);

  const hash = neuesKennwort ? await hashPassword(neuesKennwort) : null;

  transaktion(() => {
    if (neueRolle) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(neueRolle, row.id);
    if (istFarbe(color)) db.prepare('UPDATE users SET color = ? WHERE id = ?').run(color, row.id);
    if (hash) db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.id);
  });

  // Neues Kennwort: alle Anmeldungen weg (das trennt auch die Live-Kanäle).
  // Neue Rolle: Die Anmeldung bleibt, aber offene Kanäle hören noch mit der
  // alten Rolle mit – eine entzogene Spielleitung sähe sonst weiter die
  // verdeckten Würfe. Getrennt verbinden sie sich mit der neuen Rolle neu.
  if (hash) destroyAllSessions(row.id);
  else if (neueRolle) trenne({ userId: row.id });

  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.json(db.prepare('SELECT id, name, role, color, created_at FROM users WHERE id = ?').get(row.id));
}));

router.delete('/users/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ code: 'konto_nicht_gefunden', error: 'Konto nicht gefunden.' });
  if (row.id === req.user.id) return res.status(400).json({ code: 'eigenes_konto', error: 'Das eigene Konto lässt sich nicht löschen.' });
  if (row.role === 'sl' && letzteSpielleitung()) {
    return res.status(400).json({ code: 'letzte_spielleitung', error: 'Es braucht mindestens eine Spielleitung.' });
  }
  // Die Charaktere bleiben erhalten und fallen an die Spielleitung zurück –
  // im selben Block wie das Löschen, sonst gäbe es nach einem Abbruch
  // Blätter, deren Besitzer es nicht mehr gibt.
  transaktion(() => {
    db.prepare('UPDATE characters SET owner_id = ? WHERE owner_id = ?').run(req.user.id, row.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(row.id);
  });
  // Die Anmeldungen gehen per Fremdschlüssel mit – die offenen Kanäle nicht.
  trenne({ userId: row.id });
  broadcast('runde:aktualisiert', {}, { dmOnly: true });
  res.status(204).end();
});

export default router;
