/**
 * Einladungscodes: anlegen, auflisten, zurückziehen – nur für die
 * Spielleitung.
 *
 * Ein Code gilt genau einmal. Eingelöst wird er beim Einrichten eines
 * Kontos (anmeldung.js, /register); danach steht bei ihm, wer ihn benutzt
 * hat.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { requireDm } from '../../auth.js';
import { jetzt } from '../../werte.js';
import { neuerEinladungscode } from './regeln.js';

const router = Router();

// GET /api/auth/invites – alle Einladungscodes, neueste zuerst, mit dem Namen
// dessen, der einen eingelöst hat.
router.get('/invites', requireDm, (req, res) => {
  res.json(
    db
      .prepare(
        `SELECT i.code, i.note, i.created_at, i.used_at, u.name AS used_by_name
           FROM invites i LEFT JOIN users u ON u.id = i.used_by
          ORDER BY i.created_at DESC`
      )
      .all()
  );
});

// POST /api/auth/invites  { note? } – einen neuen Code erzeugen. Die Notiz
// („für Mara“) hilft nur der Spielleitung beim Zuordnen.
router.post('/invites', requireDm, (req, res) => {
  const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 80) : '';
  const code = neuerEinladungscode();
  const stand = jetzt();
  db.prepare('INSERT INTO invites (code, note, created_at) VALUES (?, ?, ?)').run(code, note, stand);
  res.status(201).json({ code, note, created_at: stand, used_at: null, used_by_name: null });
});

// DELETE /api/auth/invites/:code – einen Code zurückziehen. Groß- und
// Kleinschreibung spielen keine Rolle, die Codes sind immer groß.
router.delete('/invites/:code', requireDm, (req, res) => {
  const info = db.prepare('DELETE FROM invites WHERE code = ?').run(req.params.code.toUpperCase());
  if (info.changes === 0) return res.status(404).json({ code: 'einladung_nicht_gefunden', error: 'Einladung nicht gefunden.' });
  res.status(204).end();
});

export default router;
