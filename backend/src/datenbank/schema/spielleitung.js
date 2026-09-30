/**
 * Was die Spielleitung führt: laufender Kampf, Bestiarium, Notizen, Würfe.
 *
 * `combatants` sind die Kämpfer des *laufenden* Kampfes einer Kampagne;
 * `library` ist das Bestiarium der ganzen Runde. Würfe (`rolls`) stehen hier,
 * weil sie wie der Kampf von der Spielleitung verdeckt werden können.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const SPIELLEITUNG = `
  /* --- Spielleitung: Kampf, Bestiarium, Notizen -------------------------- */

  CREATE TABLE IF NOT EXISTS combatants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'monster',
    initiative INTEGER NOT NULL DEFAULT 0,
    hp INTEGER NOT NULL DEFAULT 0,
    max_hp INTEGER NOT NULL DEFAULT 0,
    ac INTEGER NOT NULL DEFAULT 10,
    conditions TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS library (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'monster',
    ac INTEGER,
    hp INTEGER,
    speed TEXT NOT NULL DEFAULT '',
    stats TEXT NOT NULL DEFAULT '{}',
    abilities TEXT NOT NULL DEFAULT '',
    actions TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    visibility TEXT NOT NULL DEFAULT 'sl',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rolls (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL DEFAULT '',
    label TEXT NOT NULL DEFAULT '',
    expression TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'normal',
    details TEXT NOT NULL DEFAULT '[]',
    total INTEGER NOT NULL DEFAULT 0,
    secret INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );
`;
