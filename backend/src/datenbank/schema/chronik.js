/**
 * Die Chronik der Sitzungen.
 *
 * Ein Eintrag gehört zu einer Sitzung und geht mit ihr. Verdeckte Einträge
 * (`secret`) bekommt die Runde nie zu sehen.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const CHRONIK = `
  /* --- Chronik der Sitzungen --------------------------------------------- */

  CREATE TABLE IF NOT EXISTS game_sessions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    summary TEXT NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS chronicle (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES game_sessions(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    actor TEXT NOT NULL DEFAULT '',
    target TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    meta TEXT NOT NULL DEFAULT '{}',
    secret INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;
