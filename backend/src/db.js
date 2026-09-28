/**
 * Die Datenbank – Herzstück und einzige Stelle, an der Daten liegen.
 *
 * Diese Datei ist der Eingang dazu und tut selbst fast nichts mehr. Sie
 * bringt vier Schritte in die richtige Reihenfolge und gibt weiter, was der
 * Rest des Almanachs braucht:
 *
 *   1. *Öffnen* (datenbank/verbindung.js) – zwei Wege zu SQLite, damit der
 *      Almanach überall ohne Bastelei läuft.
 *   2. *Anlegen* (datenbank/schema.js) – jede Tabelle, wie sie beim ersten
 *      Start entsteht.
 *   3. *Nachrüsten* (datenbank/nachruesten.js) – alles, was später dazukam.
 *      Läuft bei jedem Start, deshalb muss jeder Schritt darin gefahrlos
 *      wiederholbar sein.
 *   4. *Umziehen* (datenbank/kampagnenwanderung.js) – der eine Schritt, der
 *      mehr tut als eine Spalte anzufügen.
 *
 * Die Reihenfolge ist zwingend: Ohne Tabellen keine Spalten, ohne Spalten
 * kein Umzug.
 *
 * Alles andere im Almanach holt sich `db` von hier. Wer eine Abfrage
 * schreibt: `db.prepare(...)` bereitet sie vor, `.get()` holt eine Zeile,
 * `.all()` alle, `.run()` schreibt. Die Fragezeichen darin sind
 * Platzhalter – *nie* Werte in die Zeichenkette kleben, sonst steht die Tür
 * für SQL-Injection offen.
 */
import { db, dataDir, driver, mediaDir } from './datenbank/verbindung.js';
import { SCHEMA } from './datenbank/schema.js';
import { addColumnIfMissing, ruesteNach } from './datenbank/nachruesten.js';
import { KAMPAGNEN_TABELLEN, ruesteKampagnenNach } from './datenbank/kampagnenwanderung.js';

db.exec(SCHEMA);
ruesteNach();
ruesteKampagnenNach();

export { db, dataDir, driver, mediaDir, addColumnIfMissing, KAMPAGNEN_TABELLEN };
export default db;

/* --- Der kleine Schlüssel-Wert-Speicher ---------------------------------- */

/**
 * Einzelwerte, für die eine eigene Tabelle zu viel wäre: welche Szene
 * aufliegt, ob der Vorhang zu ist, in welcher Kampfrunde man steckt, wie
 * viel Gold in der Kiste liegt.
 *
 * Der Schlüssel trägt die Kampagne mit sich (`<campaignId>:<key>`). Das
 * spart `app_state` eine eigene Spalte – und es war beim Umbau auf
 * Kampagnen der Grund, warum die Werte einmal umgeschrieben werden mussten
 * (siehe datenbank/kampagnenwanderung.js).
 *
 * Gespeichert wird als JSON. Geht das Lesen schief – etwa, weil eine
 * frühere Fassung etwas anderes hineingeschrieben hat –, kommt der
 * Ersatzwert zurück statt eines Absturzes.
 */
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
