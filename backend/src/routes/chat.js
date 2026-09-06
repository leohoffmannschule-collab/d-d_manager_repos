import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { requireAuth, requireDm } from '../auth.js';
import { broadcast, originClient, presence } from '../events.js';

/**
 * Der Chat am Tisch.
 *
 * Zwei Arten von Nachrichten, und der Unterschied ist eine Spalte:
 *
 *   an alle    to_user_id ist leer – jede und jeder in der Runde liest mit
 *   geflüstert to_user_id trägt ein Konto – nur die beiden Beteiligten
 *
 * Geflüstertes bekommt sonst niemand, auch die Spielleitung nicht. Das ist
 * Absicht: „flüstern“ soll heißen, was es sagt. Wer als Spielleitung etwas
 * Geheimes an die Runde geben will, hat dafür die Handzettel – die sind zum
 * Austeilen gedacht und stehen hinterher in der Chronik.
 *
 * Wie überall im Almanach entscheidet der Server, wer was bekommt: Eine
 * geflüsterte Zeile wird gar nicht erst an die übrigen Fenster geschickt.
 *
 * Nicht in der Chronik: Gerede ist kein Ereignis. Die Chronik soll nach dem
 * Abend lesbar bleiben, und dafür ist es besser, wenn nicht jede Nachfrage
 * nach dem Pizzadienst darin steht.
 */
const router = Router();
router.use(requireAuth);

// Der Chat ist ein Gespräch, kein Archiv. Ältere Zeilen fallen hinten heraus.
const AUFBEWAHREN = 300;
const MAX_ZEICHEN = 2000;

function rowToMessage(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    color: row.color,
    text: row.text,
    toUserId: row.to_user_id,
    toUserName: row.to_user_name,
    createdAt: row.created_at,
  };
}

/**
 * Was diese Person lesen darf: alles Öffentliche und die eigenen Flüstereien
 * in beide Richtungen.
 */
function sichtbarFuer(userId, limit) {
  return db
    .prepare(
      `SELECT * FROM messages
        WHERE to_user_id IS NULL OR to_user_id = ? OR user_id = ?
        ORDER BY created_at DESC
        LIMIT ?`
    )
    .all(userId, userId, limit)
    .map(rowToMessage);
}

// GET /api/chat – der Verlauf, jüngste zuerst
router.get('/', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), AUFBEWAHREN);
  res.json(sichtbarFuer(req.user.id, limit));
});

// POST /api/chat – etwas sagen; mit `an` wird geflüstert
router.post('/', (req, res) => {
  const { text, an } = req.body ?? {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ code: 'nachricht_leer', error: 'Die Nachricht ist leer.' });
  }

  let empfaenger = null;
  if (an) {
    empfaenger = db.prepare('SELECT id, name FROM users WHERE id = ?').get(an);
    if (!empfaenger) {
      return res.status(404).json({ code: 'empfaenger_unbekannt', error: 'Diese Person gibt es nicht.' });
    }
    if (empfaenger.id === req.user.id) {
      return res.status(400).json({ code: 'empfaenger_selbst', error: 'An sich selbst flüstert man nicht.' });
    }
  }

  const eintrag = {
    id: randomUUID(),
    userId: req.user.id,
    userName: req.user.name,
    color: req.user.color ?? null,
    text: text.trim().slice(0, MAX_ZEICHEN),
    toUserId: empfaenger?.id ?? null,
    toUserName: empfaenger?.name ?? null,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO messages (id, user_id, user_name, color, text, to_user_id, to_user_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    eintrag.id,
    eintrag.userId,
    eintrag.userName,
    eintrag.color,
    eintrag.text,
    eintrag.toUserId,
    eintrag.toUserName,
    eintrag.createdAt
  );

  db.prepare('DELETE FROM messages WHERE id NOT IN (SELECT id FROM messages ORDER BY created_at DESC LIMIT ?)').run(
    AUFBEWAHREN
  );

  // Geflüstertes geht nur an die beiden – nicht an die übrigen Fenster.
  broadcast('chat', eintrag, {
    ...(eintrag.toUserId ? { userIds: [eintrag.userId, eintrag.toUserId] } : {}),
    exceptClient: originClient(req),
  });

  res.status(201).json(eintrag);
});

// GET /api/chat/wer – an wen sich flüstern lässt
router.get('/wer', (req, res) => {
  const rows = db.prepare('SELECT id, name, role, color FROM users ORDER BY name').all();
  const anwesend = new Set(presence().map((p) => p.id));
  res.json(
    rows
      .filter((r) => r.id !== req.user.id)
      .map((r) => ({ id: r.id, name: r.name, role: r.role, color: r.color, anwesend: anwesend.has(r.id) }))
  );
});

// DELETE /api/chat – aufräumen, bevor die nächste Runde beginnt
router.delete('/', requireDm, (req, res) => {
  db.prepare('DELETE FROM messages').run();
  broadcast('chat:geleert', {});
  res.json({ ok: true });
});

export default router;
