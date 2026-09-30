/**
 * Die Abschnitte des ausgeführten Charakterblattes – je eine Funktion, je
 * eine Karte auf dem Bogen.
 *
 * Jede gibt HTML als Zeichenkette zurück und rechnet dabei dasselbe aus wie
 * die Oberfläche: Modifikatoren, Übungsbonus, passive Werte. Gerechnet wird
 * aber nicht hier, sondern in lib/regeln/ – hier steht nur, wie das
 * Ergebnis auf dem Papier aussieht.
 *
 * Alles ist schlichtes Zeichenketten-Basteln statt React, und das mit
 * Absicht: Die erzeugte Datei muss ohne React laufen, allein im Browser
 * dessen, der sie doppelklickt.
 *
 * Die Abschnitte liegen nach Sachgebiet in abschnitte/:
 *   werte.js     – Attribute, Rettungswürfe, Sinne, Fertigkeiten
 *   kampf.js     – Aktionen, Kampfwerte, Zustand, Ressourcen
 *   zauber.js    – Zauberwerte, Plätze, Zauberliste und Zaubertexte
 *   inventar.js  – Münzen, Gegenstände, Traglast
 *   person.js    – Erscheinung, Merkmale, Hintergrund
 *
 * Welcher Abschnitt wo auf dem Bogen steht, entscheidet koerper.js.
 */
export { attribute, fertigkeiten, rettungswuerfe, sinne } from './abschnitte/werte.js';
export { aktionen, kampf, ressourcen, zustand } from './abschnitte/kampf.js';
export { zauber, zauberblock } from './abschnitte/zauber.js';
export { inventar } from './abschnitte/inventar.js';
export { erscheinung, hintergrund, merkmale } from './abschnitte/person.js';
