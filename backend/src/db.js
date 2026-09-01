import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

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
`);

export default db;
