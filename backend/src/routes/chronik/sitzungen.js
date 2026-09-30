/**
 * Sitzungen der Chronik und von Hand nachgetragene Einträge.
 *
 * Eine Sitzung eröffnet sich beim ersten Eintrag des Abends von selbst
 * (siehe ../../chronicle.js, `log`); diese Wege sind für alles, was die
 * Spielleitung ausdrücklich tut – beginnen, beenden, umbenennen, löschen,
 * etwas nachtragen.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { isDm, requireDm } from '../../auth.js';
import { broadcast } from '../../events.js';
import * as chronik from '../../chronicle.js';
import { eintraege, sitzungHolen } from './abfragen.js';

const router = Router();

/** Eine Sitzung für die Liste – mit der Zahl der Einträge, die *diese* Person sieht. */
function rowToSession(row, user) {
  return {
    id: row.id,
    title: row.title,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    summary: row.summary,
    laufend: !row.ended_at,
    anzahl: isDm(user)
      ? db.prepare('SELECT COUNT(*) AS n FROM chronicle WHERE session_id = ?').get(row.id).n
      : db.prepare('SELECT COUNT(*) AS n FROM chronicle WHERE session_id = ? AND secret = 0').get(row.id).n,
  };
}

router.get('/sessions', (req, res) => {
  const rows = db.prepare('SELECT * FROM game_sessions WHERE campaign_id = ? ORDER BY started_at DESC').all(req.campaignId);
  res.json(rows.map((row) => rowToSession(row, req.user)));
});

router.get('/sessions/:id', (req, res) => {
  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });
  res.json({ ...rowToSession(row, req.user), entries: eintraege(row.id, req.user) });
});

router.post('/sessions', requireDm, (req, res) => {
  res.status(201).json(rowToSession(chronik.starteSitzung(req.body?.title, req.campaignId), req.user));
});

// Es läuft höchstens eine Sitzung je Kampagne. Die Kennung im Pfad muss
// trotzdem stimmen: Sonst beendete ein veraltetes Fenster, das eine längst
// geschlossene Sitzung anzeigt, stillschweigend die gerade laufende.
router.post('/sessions/:id/ende', requireDm, (req, res) => {
  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });
  if (row.ended_at) return res.status(400).json({ code: 'keine_offene_sitzung', error: 'Diese Sitzung ist schon beendet.' });
  const beendet = chronik.beendeSitzung(req.campaignId);
  res.json(rowToSession(beendet, req.user));
});

router.patch('/sessions/:id', requireDm, (req, res) => {
  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });
  if (typeof req.body?.title === 'string' && req.body.title.trim()) {
    db.prepare('UPDATE game_sessions SET title = ? WHERE id = ?').run(req.body.title.trim().slice(0, 150), row.id);
  }
  res.json(rowToSession(sitzungHolen(row.id, req.campaignId), req.user));
});

router.delete('/sessions/:id', requireDm, (req, res) => {
  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });
  db.prepare('DELETE FROM game_sessions WHERE id = ?').run(row.id);
  res.status(204).end();
});

// Die Spielleitung kann von Hand nachtragen, was der Server nicht mitbekommt –
// eine gelungene List, ein Schwur, der Name des Wirts.
router.post('/eintrag', requireDm, (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ code: 'text_fehlt', error: 'Ohne Text kein Eintrag.' });
  const eintrag = chronik.log(
    {
      kind: 'notiz',
      actor: req.user.name,
      text: text.slice(0, 2000),
      secret: req.body?.secret === true,
    },
    req.campaignId
  );
  res.status(201).json(eintrag);
});

router.delete('/eintrag/:id', requireDm, (req, res) => {
  // Ein Eintrag gehört zu einer Sitzung, die zu dieser Kampagne gehört – so
  // lässt sich kein Eintrag aus einer fremden Kampagne treffen.
  const info = db
    .prepare(
      `DELETE FROM chronicle WHERE id = ? AND session_id IN (SELECT id FROM game_sessions WHERE campaign_id = ?)`
    )
    .run(req.params.id, req.campaignId);
  if (info.changes === 0) return res.status(404).json({ code: 'eintrag_nicht_gefunden', error: 'Eintrag nicht gefunden.' });
  broadcast('chronik:geaendert', {}, { campaignId: req.campaignId });
  res.status(204).end();
});

export default router;
