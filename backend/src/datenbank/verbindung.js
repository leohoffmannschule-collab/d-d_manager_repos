/**
 * Die Datenbank öffnen – und sagen, wo sie liegt.
 *
 * Warum SQLite und keine „richtige“ Datenbank? Weil der Almanach auf einem
 * Laptop oder Raspberry Pi einer Spielrunde läuft, nicht in einem
 * Rechenzentrum. Eine Datei, kein Dienst, kein Kennwort, keine Wartung –
 * und sichern heißt, eine Datei zu kopieren.
 *
 * Für Neulinge in SQL: `db.prepare(...)` bereitet eine Abfrage vor,
 * `.get()` holt eine Zeile, `.all()` alle, `.run()` schreibt. Die
 * Fragezeichen darin sind Platzhalter, die später gefüllt werden – *nie*
 * Werte in die Zeichenkette kleben, sonst steht die Tür für SQL-Injection
 * offen.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Auch nach außen sichtbar: Skripte wie die Sicherung sollen denselben
// Ordner treffen wie der Server – und ihn nicht aus dem Arbeitsverzeichnis
// raten müssen, das je nach Aufrufort ein anderer wäre.
//
// Zwei Ebenen hinauf, weil diese Datei in backend/src/datenbank/ liegt und
// der Ordner in backend/data/ – ein falscher Schritt hier legt eine zweite,
// leere Datenbank an, ohne sich zu beschweren.
export const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
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

// WAL: Lesen und Schreiben behindern sich nicht gegenseitig – am Spieltisch
// liest ein halbes Dutzend Fenster, während die Spielleitung schreibt.
// Fremdschlüssel sind in SQLite standardmäßig *aus*; ohne diese Zeile
// bliebe eine gelöschte Szene mit ihren Figuren als Leiche zurück.
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
