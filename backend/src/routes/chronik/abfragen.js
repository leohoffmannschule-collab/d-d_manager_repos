/**
 * Was mehrere Chronik-Wege lesen: die Einträge einer Sitzung und eine
 * Sitzung dieser Kampagne.
 *
 * Verdeckte Einträge (`secret`) bekommt ein Spielerfenster nicht – gefiltert
 * wird in `eintraege()`, also an einer einzigen Stelle. Auch der
 * KI-Rückblick holt seine Einträge hier, in der Sicht der Runde.
 */
import { db } from '../../db.js';
import { isDm } from '../../auth.js';
import * as chronik from '../../chronicle.js';

/** Die Einträge einer Sitzung, je nach Rolle vollständig oder gefiltert. */
export function eintraege(sessionId, user) {
  const rows = isDm(user)
    ? db.prepare('SELECT * FROM chronicle WHERE session_id = ? ORDER BY created_at').all(sessionId)
    : db.prepare('SELECT * FROM chronicle WHERE session_id = ? AND secret = 0 ORDER BY created_at').all(sessionId);
  return rows.map(chronik.rowToEntry);
}

/** Eine Sitzung dieser Kampagne – eine aus einer fremden gibt es hier nicht. */
export const sitzungHolen = (id, campaignId) =>
  db.prepare('SELECT * FROM game_sessions WHERE id = ? AND campaign_id = ?').get(id, campaignId);
