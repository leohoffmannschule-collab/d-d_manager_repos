import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { db } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import { rollDice } from '../dice.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

const AUFBEWAHREN = 200;

function rowToRoll(row) {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    label: row.label,
    expression: row.expression,
    mode: row.mode,
    details: JSON.parse(row.details),
    total: row.total,
    secret: !!row.secret,
    createdAt: row.created_at,
  };
}

// GET /api/dice/history – verdeckte Würfe sieht nur die Spielleitung
router.get('/history', (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), AUFBEWAHREN);
  const rows = isDm(req.user)
    ? db.prepare('SELECT * FROM rolls ORDER BY created_at DESC LIMIT ?').all(limit)
    : db.prepare('SELECT * FROM rolls WHERE secret = 0 ORDER BY created_at DESC LIMIT ?').all(limit);
  res.json(rows.map(rowToRoll));
});

// POST /api/dice/roll
router.post('/roll', (req, res) => {
  const { expression, mode, label } = req.body ?? {};
  if (!expression || typeof expression !== 'string') {
    return res.status(400).json({ error: 'Würfelausdruck ist erforderlich.' });
  }

  let ergebnis;
  try {
    ergebnis = rollDice(expression, mode === 'advantage' || mode === 'disadvantage' ? mode : 'normal');
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Verdeckt würfeln kann nur die Spielleitung – sonst könnte sich jeder
  // seine Patzer für sich behalten.
  const secret = isDm(req.user) && req.body?.secret === true;

  const eintrag = {
    id: randomUUID(),
    userId: req.user.id,
    userName: req.user.name,
    label: typeof label === 'string' ? label.slice(0, 100) : '',
    expression: expression.slice(0, 200),
    mode: mode === 'advantage' || mode === 'disadvantage' ? mode : 'normal',
    details: ergebnis.details,
    total: ergebnis.total,
    secret,
    createdAt: new Date().toISOString(),
  };

  db.prepare(
    `INSERT INTO rolls (id, user_id, user_name, label, expression, mode, details, total, secret, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    eintrag.id,
    eintrag.userId,
    eintrag.userName,
    eintrag.label,
    eintrag.expression,
    eintrag.mode,
    JSON.stringify(eintrag.details),
    eintrag.total,
    secret ? 1 : 0,
    eintrag.createdAt
  );

  db.prepare(
    `DELETE FROM rolls WHERE id NOT IN (SELECT id FROM rolls ORDER BY created_at DESC LIMIT ?)`
  ).run(AUFBEWAHREN);

  chronik.log({
    kind: 'wurf',
    actor: req.user.name,
    text: `${eintrag.label ? `${eintrag.label}: ` : ''}${eintrag.expression} ergibt ${eintrag.total}`,
    meta: { total: eintrag.total, expression: eintrag.expression, mode: eintrag.mode },
    secret,
  });

  const nutzlast = { ...eintrag, color: req.user.color };
  broadcast('wurf', nutzlast, secret ? { dmOnly: true } : {});
  res.status(201).json(nutzlast);
});

// DELETE /api/dice/history
router.delete('/history', requireDm, (req, res) => {
  db.prepare('DELETE FROM rolls').run();
  broadcast('wuerfe:geleert', {});
  res.status(204).end();
});

export default router;
