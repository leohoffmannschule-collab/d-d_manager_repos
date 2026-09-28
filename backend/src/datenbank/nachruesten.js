/**
 * Die Wanderung: was eine bestehende Datenbank nachträglich bekommt.
 *
 * Der Almanach hat keine Wanderungsdateien mit Nummern, wie man sie aus
 * größeren Projekten kennt. Er braucht sie auch nicht: Jeder Schritt hier
 * prüft selbst, ob er nötig ist, und läuft bei *jedem* Start. Daraus folgt
 * die eine Regel, die man nie brechen darf:
 *
 *   **Jeder Schritt muss gefahrlos wiederholbar sein.**
 *
 * `addColumnIfMissing` erfüllt das von selbst. Wer etwas anderes braucht –
 * Daten umschreiben etwa –, muss selbst dafür sorgen, dass der zweite Lauf
 * nichts mehr tut (siehe `ersteKampagneSichern` in kampagnenwanderung.js).
 *
 * Die Reihenfolge der Zeilen ist zugleich die Geschichte des Almanachs:
 * Konten kamen nach den Charakteren, Bilder nach dem Bestiarium, die
 * Kampagnen zuletzt.
 */
import { db } from './verbindung.js';

/**
 * Fügt eine Spalte hinzu, falls eine ältere Datenbank sie noch nicht hat.
 *
 * Tabelle und Spalte stehen hier ausnahmsweise *in* der SQL-Zeichenkette:
 * Bezeichner lassen sich in SQLite nicht als Platzhalter übergeben. Das ist
 * nur deshalb in Ordnung, weil alle drei Werte feste Zeichenketten aus dem
 * Quelltext sind – nie etwas, das aus einer Anfrage stammt.
 */
export function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (columns.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function ruesteNach() {
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

  // Eine obere Schranke für alle in dieser Szene, in Fuß – Nebelbank,
  // Schneetreiben, dichter Wald. 0 heißt: Der Blick reicht bis zum Rand.
  addColumnIfMissing('scenes', 'sight', 'REAL NOT NULL DEFAULT 0');

  // Der Maßstab: Wofür steht ein Rasterfeld? Vorgabe bleiben die 5 Fuß aus dem
  // Regelwerk. Wer in Metern denkt – und eine Karte über zweihundert Meter
  // legen will –, stellt hier ein Feld auf einen Meter.
  addColumnIfMissing('scenes', 'unit', "TEXT NOT NULL DEFAULT 'fuss'");
  addColumnIfMissing('scenes', 'scale', 'REAL NOT NULL DEFAULT 5');
  addColumnIfMissing('maps', 'unit', "TEXT NOT NULL DEFAULT 'fuss'");
  addColumnIfMissing('maps', 'scale', 'REAL NOT NULL DEFAULT 5');
}
