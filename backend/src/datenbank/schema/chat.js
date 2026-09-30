/**
 * Der Chat am Tisch.
 *
 * Eine Zeile mit `to_user_id` ist geflüstert und geht nur an die beiden
 * Beteiligten (siehe routes/chat.js).
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const CHAT = `
  /* --- Der Chat am Tisch -------------------------------------------------
     to_user_id ist leer, wenn die Nachricht an alle geht; steht dort ein
     Konto, wurde geflüstert und nur die beiden Beteiligten bekommen sie.  */

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL DEFAULT '',
    color TEXT,
    text TEXT NOT NULL,
    to_user_id TEXT,
    to_user_name TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_zeit ON messages (created_at DESC);
`;
