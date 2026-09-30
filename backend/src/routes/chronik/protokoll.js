/**
 * Das Protokoll: eine Sitzung als lesbarer Markdown-Text.
 *
 * Zum Ausdrucken, zum Weitergeben, und als Vorlage für den Rückblick eines
 * Sprachmodells (rueckblick.js). Die Runde bekommt ihr Protokoll ohne die
 * verdeckten Einträge – dieselbe Filterung wie überall, aus abfragen.js.
 */
import { Router } from 'express';
import { eintraege, sitzungHolen } from './abfragen.js';

const router = Router();

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
  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });
  const text = protokoll(row, eintraege(row.id, req.user));
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.send(text);
});

export default router;
