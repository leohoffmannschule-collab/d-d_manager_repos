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
 *
 * Die Tabellen stehen nach Bereichen getrennt in `schema/`. Die Reihenfolge
 * unten ist die, in der sie angelegt werden; SQLite nimmt einen
 * Fremdschlüssel auf eine Tabelle, die es noch nicht gibt, zwar hin, aber
 * wer liest, soll die Vorgängerin schon kennen.
 */
import { GRUNDSTOCK } from './schema/grundstock.js';
import { RUNDE } from './schema/runde.js';
import { KAMPAGNEN } from './schema/kampagnen.js';
import { SPIELLEITUNG } from './schema/spielleitung.js';
import { CHAT } from './schema/chat.js';
import { SPIELTISCH } from './schema/spieltisch.js';
import { SAMMLUNGEN } from './schema/sammlungen.js';
import { CHRONIK } from './schema/chronik.js';
import { INDIZES } from './schema/indizes.js';

/** Das ganze Schema als ein SQL-Text – für `db.exec` in db.js. */
export const SCHEMA = [
  GRUNDSTOCK,
  RUNDE,
  KAMPAGNEN,
  SPIELLEITUNG,
  CHAT,
  SPIELTISCH,
  SAMMLUNGEN,
  CHRONIK,
  INDIZES,
].join('\n');
