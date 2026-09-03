import { Router } from 'express';

import { db } from '../db.js';
import { isDm, requireAuth, requireDm } from '../auth.js';
import { broadcast } from '../events.js';
import * as chronik from '../chronicle.js';

const router = Router();
router.use(requireAuth);

/* --- Sitzungen ----------------------------------------------------------- */

function eintraege(sessionId, user) {
  const rows = isDm(user)
    ? db.prepare('SELECT * FROM chronicle WHERE session_id = ? ORDER BY created_at').all(sessionId)
    : db.prepare('SELECT * FROM chronicle WHERE session_id = ? AND secret = 0 ORDER BY created_at').all(sessionId);
  return rows.map(chronik.rowToEntry);
}

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
  const rows = db.prepare('SELECT * FROM game_sessions ORDER BY started_at DESC').all();
  res.json(rows.map((row) => rowToSession(row, req.user)));
});

router.get('/sessions/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Sitzung nicht gefunden.' });
  res.json({ ...rowToSession(row, req.user), entries: eintraege(row.id, req.user) });
});

router.post('/sessions', requireDm, (req, res) => {
  res.status(201).json(rowToSession(chronik.starteSitzung(req.body?.title), req.user));
});

router.post('/sessions/:id/ende', requireDm, (req, res) => {
  const beendet = chronik.beendeSitzung();
  if (!beendet) return res.status(400).json({ error: 'Es läuft gerade keine Sitzung.' });
  res.json(rowToSession(beendet, req.user));
});

router.patch('/sessions/:id', requireDm, (req, res) => {
  const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Sitzung nicht gefunden.' });
  if (typeof req.body?.title === 'string' && req.body.title.trim()) {
    db.prepare('UPDATE game_sessions SET title = ? WHERE id = ?').run(req.body.title.trim().slice(0, 150), row.id);
  }
  res.json(rowToSession(db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(row.id), req.user));
});

router.delete('/sessions/:id', requireDm, (req, res) => {
  const info = db.prepare('DELETE FROM game_sessions WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Sitzung nicht gefunden.' });
  res.status(204).end();
});

/* --- Eigene Einträge ----------------------------------------------------- */

// Die Spielleitung kann von Hand nachtragen, was der Server nicht mitbekommt –
// eine gelungene List, ein Schwur, der Name des Wirts.
router.post('/eintrag', requireDm, (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) return res.status(400).json({ error: 'Ohne Text kein Eintrag.' });
  const eintrag = chronik.log({
    kind: 'notiz',
    actor: req.user.name,
    text: text.slice(0, 2000),
    secret: req.body?.secret === true,
  });
  res.status(201).json(eintrag);
});

router.delete('/eintrag/:id', requireDm, (req, res) => {
  const info = db.prepare('DELETE FROM chronicle WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Eintrag nicht gefunden.' });
  broadcast('chronik:geaendert', {});
  res.status(204).end();
});

/* --- Protokoll ----------------------------------------------------------- */

const uhrzeit = (iso) =>
  new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

/**
 * Aus den Einträgen ein lesbares Protokoll setzen. Szenenwechsel und Kämpfe
 * beginnen ein neues Kapitel – so liest sich der Abend hinterher als Folge
 * von Stationen und nicht als endlose Liste.
 */
export function protokoll(session, liste) {
  const zeilen = [
    `# ${session.title}`,
    '',
    `*${new Date(session.started_at ?? session.startedAt).toLocaleString('de-DE')}` +
      (session.ended_at ?? session.endedAt
        ? ` bis ${new Date(session.ended_at ?? session.endedAt).toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit',
          })}`
        : ' – noch offen') +
      '*',
    '',
  ];

  if (session.summary) {
    zeilen.push('## Rückblick', '', session.summary, '');
  }

  // Ein neues Kapitel beginnt, wo die Runde weiterzieht oder ein Kampf
  // anhebt – nicht bei jedem einzelnen Goblin, der um die Ecke kommt.
  let kapitelOffen = false;
  for (const e of liste) {
    if (e.kind === 'szene' || e.meta?.kapitel) {
      zeilen.push('', `## ${e.text.replace(/\.$/, '')}`, '');
      kapitelOffen = true;
      continue;
    }
    if (!kapitelOffen) {
      zeilen.push('## Zu Beginn', '');
      kapitelOffen = true;
    }
    const marke = e.secret ? ' *(verdeckt)*' : '';
    zeilen.push(`- **${uhrzeit(e.createdAt)}** ${e.text}${marke}`);
  }

  if (liste.length === 0) zeilen.push('*In dieser Sitzung wurde noch nichts verzeichnet.*');
  return zeilen.join('\n');
}

router.get('/sessions/:id/protokoll', (req, res) => {
  const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Sitzung nicht gefunden.' });
  const text = protokoll(row, eintraege(row.id, req.user));
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(text);
});

/* --- Rückblick durch ein Sprachmodell (freiwillig) ----------------------- */

/**
 * Der Almanach kommt ohne KI aus – das Protokoll oben entsteht allein aus dem,
 * was am Tisch geschehen ist. Wer möchte, kann zusätzlich ein Sprachmodell
 * daraus einen Fließtext machen lassen. Das ist bewusst nichts, was
 * voreingestellt ist: Es kostet entweder Rechenzeit auf dem Pi oder Geld und
 * schickt das Protokoll aus dem Haus.
 *
 * Eingestellt wird es über drei Umgebungsvariablen; die Schnittstelle ist die
 * von OpenAI, die auch llama.cpp und Ollama örtlich anbieten.
 */
const KI_URL = process.env.CHRONIK_KI_URL || '';
const KI_MODELL = process.env.CHRONIK_KI_MODELL || 'gpt-4o-mini';
const KI_SCHLUESSEL = process.env.CHRONIK_KI_SCHLUESSEL || '';

router.get('/ki', (req, res) => {
  res.json({ verfuegbar: !!KI_URL, modell: KI_URL ? KI_MODELL : null });
});

router.post('/sessions/:id/rueckblick', requireDm, async (req, res) => {
  if (!KI_URL) {
    return res.status(501).json({
      error:
        'Es ist kein Sprachmodell eingestellt. Setze CHRONIK_KI_URL (und bei Bedarf CHRONIK_KI_MODELL und ' +
        'CHRONIK_KI_SCHLUESSEL), um den Rückblick schreiben zu lassen. Das Protokoll selbst gibt es auch ohne.',
    });
  }

  const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Sitzung nicht gefunden.' });

  const liste = db.prepare('SELECT * FROM chronicle WHERE session_id = ? ORDER BY created_at').all(row.id);
  if (liste.length === 0) return res.status(400).json({ error: 'In dieser Sitzung steht noch nichts.' });

  const roh = protokoll(row, liste.map(chronik.rowToEntry));

  try {
    const antwort = await fetch(KI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(KI_SCHLUESSEL ? { Authorization: `Bearer ${KI_SCHLUESSEL}` } : {}),
      },
      body: JSON.stringify({
        model: KI_MODELL,
        messages: [
          {
            role: 'system',
            content:
              'Du bist der Chronist einer Pen-&-Paper-Runde. Aus dem folgenden Protokoll machst du einen ' +
              'zusammenhängenden Rückblick auf Deutsch, wie die Nacherzählung einer Folge: höchstens sechs ' +
              'Absätze, im Präteritum, ohne Aufzählungszeichen, ohne Würfelergebnisse einzeln zu nennen. ' +
              'Erfinde nichts hinzu, was nicht im Protokoll steht.',
          },
          { role: 'user', content: roh },
        ],
        temperature: 0.7,
      }),
    });

    if (!antwort.ok) {
      const text = await antwort.text();
      return res.status(502).json({ error: `Das Sprachmodell antwortete mit ${antwort.status}: ${text.slice(0, 200)}` });
    }

    const daten = await antwort.json();
    const rueckblick = daten?.choices?.[0]?.message?.content?.trim();
    if (!rueckblick) return res.status(502).json({ error: 'Das Sprachmodell hat nichts geschrieben.' });

    db.prepare('UPDATE game_sessions SET summary = ? WHERE id = ?').run(rueckblick, row.id);
    broadcast('chronik:geaendert', {});
    res.json({ summary: rueckblick });
  } catch (err) {
    res.status(502).json({ error: `Das Sprachmodell war nicht erreichbar: ${err.message}` });
  }
});

export default router;
