import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const mediaDir = path.join(dataDir, 'medien');
fs.mkdirSync(mediaDir, { recursive: true });

const dbPath = path.join(dataDir, 'manager.sqlite3');

/**
 * Zwei Wege zur Datenbank, damit die App überall ohne Bastelei läuft:
 *
 * 1. `node:sqlite` – seit Node 22.5 eingebaut. Kein Kompilieren, kein
 *    node-gyp, keine Visual-Studio-Build-Tools unter Windows.
 * 2. `better-sqlite3` – nur als Rückfallebene für ältere Node-Versionen
 *    (deshalb eine optionale Abhängigkeit).
 *
 * Beide bieten dieselbe API: exec / prepare -> run, get, all.
 */
function openDatabase() {
  try {
    // Node kennzeichnet das eingebaute SQLite noch als experimentell und gibt
    // beim Laden eine Warnung aus. Wir nutzen es bewusst – Warnung stumm.
    const emitWarning = process.emitWarning;
    process.emitWarning = (warning, ...rest) => {
      const text = typeof warning === 'string' ? warning : (warning?.message ?? '');
      if (text.includes('SQLite is an experimental feature')) return;
      return emitWarning.call(process, warning, ...rest);
    };
    try {
      const { DatabaseSync } = require('node:sqlite');
      return { db: new DatabaseSync(dbPath), driver: 'node:sqlite' };
    } finally {
      process.emitWarning = emitWarning;
    }
  } catch (builtinError) {
    try {
      const Database = require('better-sqlite3');
      return { db: new Database(dbPath), driver: 'better-sqlite3' };
    } catch {
      throw new Error(
        'Keine SQLite-Unterstützung gefunden. Bitte Node.js 22.5 oder neuer installieren ' +
          `(aktuell ${process.version}) – oder "npm install better-sqlite3" im Ordner backend ausführen. ` +
          `Ursprünglicher Fehler: ${builtinError.message}`
      );
    }
  }
}

const { db, driver } = openDatabase();
export { db, driver };

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
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
`);

/** Fügt eine Spalte hinzu, falls eine ältere Datenbank sie noch nicht hat. */
function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

// Bestehende Almanach-Datenbanken kennen noch keinen Besitzer je Charakter.
addColumnIfMissing('characters', 'owner_id', 'TEXT');
addColumnIfMissing('characters', 'shared', 'INTEGER NOT NULL DEFAULT 1');

// Bestiarium-Einträge tragen jetzt eine eigene Miniatur.
addColumnIfMissing('library', 'mini', "TEXT NOT NULL DEFAULT '{}'");
addColumnIfMissing('library', 'media_id', 'TEXT');

// Kämpfer merken sich ihr Figurenbild, damit es beim Auslegen auf den
// Spieltisch mitwandert.
addColumnIfMissing('combatants', 'media_id', 'TEXT');

// Eine Szene weiß, aus welcher Karte sie gelegt wurde – so lässt sich ein
// nachjustiertes Raster in die Bibliothek zurückschreiben.
addColumnIfMissing('scenes', 'map_id', 'TEXT');

// Eine Karte darf ihre eigene Ambiente mitbringen: Wer sie auflegt, legt
// zugleich die Musik auf, die zu diesem Ort gehört.
addColumnIfMissing('maps', 'ambience_id', 'TEXT');

/** Kleiner Schlüssel-Wert-Speicher für Einzelwerte (aktive Szene, Kampfrunde …). */
export function getState(key, fallback = null) {
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setState(key, value) {
  db.prepare(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, JSON.stringify(value));
  return value;
}

export default db;
