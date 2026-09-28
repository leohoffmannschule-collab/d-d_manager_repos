/**
 * Die Regeln von D&D 5e, soweit der Almanach sie kennt – das
 * Inhaltsverzeichnis.
 *
 * Diese Datei enthält selbst nichts mehr. Sie führt zusammen, was in
 * `regeln/` in fünf Teilen liegt, damit der Rest der Oberfläche weiterhin
 * eine Anlaufstelle hat:
 *
 *   regeln/listen.js       Attribute, Fertigkeiten, Zustände, Erschöpfung
 *   regeln/masse.js        Fuß und Meter, Pfund und Kilogramm
 *   regeln/blattfelder.js  Aktionsarten, Merkmale, Aussehen, Erfahrung
 *   regeln/rechnen.js      was das Regelwerk ausrechnen lässt
 *   regeln/leeresBlatt.js  ein frisches Blatt – und alte auf neuen Stand
 *
 * Wer eine Regel *ändert*, geht dorthin. Wer eine *benutzt*, kann hier
 * bleiben: `import { abilityModifier } from '../lib/dnd5e.js'` funktioniert
 * unverändert.
 *
 * Die eine Sache, die man über das ganze Bündel wissen muss: Gespeichert
 * wird immer in **Fuß und Pfund**, angezeigt wahlweise metrisch. Umgerechnet
 * wird erst beim Anzeigen (regeln/masse.js). So bleibt ein Blatt dasselbe,
 * gleich wer es aufschlägt.
 */
export * from './regeln/listen.js';
export * from './regeln/masse.js';
export * from './regeln/blattfelder.js';
export * from './regeln/rechnen.js';
export * from './regeln/leeresBlatt.js';
