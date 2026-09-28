/**
 * Das Schema: jede Tabelle des Almanachs, wie sie beim ersten Start
 * entsteht.
 *
 * Alles als `CREATE TABLE IF NOT EXISTS` – deshalb braucht eine frische
 * Installation keinen Einrichtungsschritt und einen bestehenden Almanach
 * stört das erneute Ausführen nicht.
 *
 * **Wichtig:** Hier steht nur, wie eine Datenbank *neu* aussieht. Was
 * später dazukam, muss zusätzlich in nachruesten.js – sonst bekommen
 * bestehende Almanache die neue Spalte nie. Wer eine Spalte ergänzt,
 * ergänzt sie an beiden Stellen.
 *
 * Für Neulinge in SQL: Die Fragezeichen, die anderswo in Abfragen stehen,
 * gibt es hier nicht – dieses SQL enthält keine Werte, nur Struktur.
 */
export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS characters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    system TEXT NOT NULL DEFAULT 'dnd5e',
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS api_cache (
    cache_key TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  );

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

  /* --- Kampagnen: dieselbe Runde, mehrere Geschichten --------------------
     Konten, Rollen und Einladungen bleiben rundenweit gemeinsam; alles, was
     am Tisch entsteht (Figuren, Chronik, Spielszenen, Beute …), gehört zu
     genau einer Kampagne. Wer an mehreren teilnimmt, wählt nach der
     Anmeldung, an welcher gerade gespielt wird – festgehalten in der
     eigenen Sitzung (auth_sessions.campaign_id), nicht im Konto selbst. */

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campaign_members (
    campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TEXT NOT NULL,
    PRIMARY KEY (campaign_id, user_id)
  );

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

  /* --- Spieltisch: Szenen, Figuren, Nebel -------------------------------- */

  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    media_id TEXT,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    grid_size INTEGER NOT NULL DEFAULT 70,
    grid_offset_x INTEGER NOT NULL DEFAULT 0,
    grid_offset_y INTEGER NOT NULL DEFAULT 0,
    grid_visible INTEGER NOT NULL DEFAULT 1,
    fog_enabled INTEGER NOT NULL DEFAULT 1,
    fog TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  /* --- Kartenbibliothek der Spielleitung ---------------------------------
     Eine Karte ist Vorbereitung: das Bild samt einmal eingestelltem Raster.
     Eine Szene ist eine Karte im Spiel, mit Nebel und Figuren darauf. Aus
     einer Karte lassen sich beliebig viele Szenen legen, ohne sie erneut
     hochzuladen oder das Raster neu auszurichten. */

  CREATE TABLE IF NOT EXISTS maps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    media_id TEXT,
    thumb_media_id TEXT,
    width INTEGER NOT NULL DEFAULT 0,
    height INTEGER NOT NULL DEFAULT 0,
    grid_size INTEGER NOT NULL DEFAULT 70,
    grid_offset_x INTEGER NOT NULL DEFAULT 0,
    grid_offset_y INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tokens (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    x REAL NOT NULL DEFAULT 0,
    y REAL NOT NULL DEFAULT 0,
    size INTEGER NOT NULL DEFAULT 1,
    color TEXT NOT NULL DEFAULT '#9a2b22',
    media_id TEXT,
    character_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    combatant_id TEXT REFERENCES combatants(id) ON DELETE SET NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    mime TEXT NOT NULL,
    bytes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  /* --- Gespeicherte Begegnungen ------------------------------------------ */

  CREATE TABLE IF NOT EXISTS encounters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    entries TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  /* --- Beutekiste der Runde ---------------------------------------------- */

  CREATE TABLE IF NOT EXISTS stash_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    weight REAL NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    holder_id TEXT REFERENCES characters(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL
  );

  /* --- Klangteppich: hinterlegte Spotify-Links ---------------------------- */

  CREATE TABLE IF NOT EXISTS ambience (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    uri TEXT NOT NULL,
    kind TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );

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

  CREATE INDEX IF NOT EXISTS idx_tokens_scene ON tokens(scene_id);
  CREATE INDEX IF NOT EXISTS idx_rolls_created ON rolls(created_at);
  CREATE INDEX IF NOT EXISTS idx_chronicle_session ON chronicle(session_id, created_at);
`;
