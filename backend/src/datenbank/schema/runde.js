/**
 * Die Runde: Konten, Anmeldungen, Einladungen.
 *
 * Konten gehören der ganzen Runde, nicht einer Kampagne. Eine Sitzung
 * (`auth_sessions`) trägt nur den Hash ihres Kennzeichens – nie das
 * Kennzeichen selbst.
 *
 * Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
 * steht in ../nachruesten.js und ../kampagnenwanderung.js.
 */
export const RUNDE = `
  /* --- Runde: Konten, Anmeldungen, Einladungen --------------------------- */

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'spieler',
    color TEXT NOT NULL DEFAULT '#9a2b22',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id TEXT,
    created_at TEXT NOT NULL,
    last_seen TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS invites (
    code TEXT PRIMARY KEY,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    used_by TEXT,
    used_at TEXT
  );
`;
