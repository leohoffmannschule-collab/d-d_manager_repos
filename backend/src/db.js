import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Auch nach außen sichtbar: Skripte wie die Sicherung sollen denselben
// Ordner treffen wie der Server – und ihn nicht aus dem Arbeitsverzeichnis
// raten müssen, das je nach Aufrufort ein anderer wäre.
export const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
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

// Aus der Zeit der Figurenschmiede. Die ist entfernt, aber schon gegossene
// Figuren sollen weiter auf dem Tisch stehen – deshalb bleibt die Spalte.
// Neue Einträge lassen sie leer.
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

// NSC-Blätter: Statblöcke, die nur die Spielleitung sieht. Sie tauchen weder
// in den Listen der Runde auf noch beim Holen der Runde in den Kampf.
addColumnIfMissing('characters', 'npc', 'INTEGER NOT NULL DEFAULT 0');

// Eine dunkle Szene: Wer nichts sieht, sieht nichts. Erst hier greifen
// Lichtquellen und Dunkelsicht – bei Tageslicht wäre das nur Rechnerei.
addColumnIfMissing('scenes', 'dark', 'INTEGER NOT NULL DEFAULT 0');

// Was eine Figur an Licht mit sich trägt, in Fuß (Fackel: 20 hell, 20 dämmrig).
addColumnIfMissing('tokens', 'light_bright', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('tokens', 'light_dim', 'INTEGER NOT NULL DEFAULT 0');

// Der Maßstab: Wofür steht ein Rasterfeld? Vorgabe bleiben die 5 Fuß aus dem
// Regelwerk. Wer in Metern denkt – und eine Karte über zweihundert Meter
// legen will –, stellt hier ein Feld auf einen Meter.
// Eine obere Schranke für alle in dieser Szene, in Fuß – Nebelbank,
// Schneetreiben, dichter Wald. 0 heißt: Der Blick reicht bis zum Rand.
addColumnIfMissing('scenes', 'sight', 'REAL NOT NULL DEFAULT 0');

addColumnIfMissing('scenes', 'unit', "TEXT NOT NULL DEFAULT 'fuss'");
addColumnIfMissing('scenes', 'scale', 'REAL NOT NULL DEFAULT 5');
addColumnIfMissing('maps', 'unit', "TEXT NOT NULL DEFAULT 'fuss'");
addColumnIfMissing('maps', 'scale', 'REAL NOT NULL DEFAULT 5');

/* --- Kampagnen nachrüsten -------------------------------------------------
   Jede Tabelle, die am Tisch entsteht, bekommt eine campaign_id. Wer schon
   eine laufende Runde hat, bekommt seine bestehenden Daten in eine erste
   Kampagne überführt – niemand verliert dadurch etwas. */
const KAMPAGNEN_TABELLEN = [
  'characters', 'combatants', 'library', 'notes', 'rolls', 'messages',
  'scenes', 'maps', 'media', 'encounters', 'stash_items', 'ambience', 'game_sessions',
];
for (const tabelle of KAMPAGNEN_TABELLEN) addColumnIfMissing(tabelle, 'campaign_id', 'TEXT');
addColumnIfMissing('auth_sessions', 'campaign_id', 'TEXT');

(function ersteKampagneSichern() {
  if (db.prepare('SELECT COUNT(*) AS n FROM campaigns').get().n > 0) return;

  const nutzer = db.prepare('SELECT id FROM users ORDER BY created_at').all();
  if (nutzer.length === 0) return; // Frisch eingerichteter Almanach: legt seine erste Kampagne selbst an.

  const id = randomUUID();
  const jetzt = new Date().toISOString();
  const ersteSl = db.prepare("SELECT id FROM users WHERE role = 'sl' ORDER BY created_at LIMIT 1").get();
  db.prepare('INSERT INTO campaigns (id, name, created_by, created_at) VALUES (?, ?, ?, ?)').run(
    id,
    'Erste Kampagne',
    ersteSl?.id ?? null,
    jetzt
  );
  const mitglied = db.prepare(
    'INSERT INTO campaign_members (campaign_id, user_id, joined_at) VALUES (?, ?, ?)'
  );
  for (const { id: userId } of nutzer) mitglied.run(id, userId, jetzt);

  for (const tabelle of KAMPAGNEN_TABELLEN) {
    db.prepare(`UPDATE ${tabelle} SET campaign_id = ? WHERE campaign_id IS NULL`).run(id);
  }
  db.prepare('UPDATE auth_sessions SET campaign_id = ? WHERE campaign_id IS NULL').run(id);

  // app_state trug seine Werte bisher unter nacktem Schlüssel (z. B. „beute“) –
  // jetzt gehört die Kampagne mit davor. Ohne diesen Umzug stünde die Kiste
  // der Runde nach dem Update plötzlich wieder leer da.
  const alteSchluessel = ['kampf', 'szene', 'vorhang', 'nsc_sicht', 'klang', 'beute', 'vorlagen:gesaet'];
  for (const schluessel of alteSchluessel) {
    const alt = db.prepare('SELECT value FROM app_state WHERE key = ?').get(schluessel);
    if (!alt) continue;
    db.prepare('INSERT OR IGNORE INTO app_state (key, value) VALUES (?, ?)').run(`${id}:${schluessel}`, alt.value);
    db.prepare('DELETE FROM app_state WHERE key = ?').run(schluessel);
  }
})();

/** Kleiner Schlüssel-Wert-Speicher für Einzelwerte (aktive Szene, Kampfrunde …).
 *  Der Schlüssel trägt die Kampagne mit sich (`<campaignId>:<key>`) – so
 *  braucht app_state selbst keine eigene Spalte und keine neue Sitzung. */
export function getState(key, campaignId, fallback = null) {
  const row = db.prepare('SELECT value FROM app_state WHERE key = ?').get(`${campaignId}:${key}`);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setState(key, campaignId, value) {
  db.prepare(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(`${campaignId}:${key}`, JSON.stringify(value));
  return value;
}

export default db;
