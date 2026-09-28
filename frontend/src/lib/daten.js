/**
 * Die Datenschicht.
 *
 * Hier steckt alles, was mit dem Server zu tun hat: laden, auf Änderungen
 * horchen, nachladen. Die Bauteile darüber bekommen fertige Daten und einen
 * Handgriff zum Nachladen – mehr wissen sie nicht.
 *
 * Der Sinn davon zeigt sich beim Umbau: Wer die Oberfläche neu gestaltet oder
 * ganz austauscht, wirft Seiten und Bauteile weg und behält diese Schicht.
 * Das mühsame Stück – wann geladen wird, welche Ereignisse welchen Zustand
 * betreffen, was beim erneuten Verbinden nachzuholen ist – bleibt erhalten.
 *
 * Alles darin sind *Haken* (React Hooks): Funktionen, deren Name mit `use`
 * beginnt und die nur aus einer Komponente heraus aufgerufen werden dürfen.
 * Sie geben Daten samt Nachlade-Handgriff zurück, etwa:
 *
 *     const { charaktere, laden } = useCharaktere();
 *
 * Drei Muster kehren immer wieder, und wer sie kennt, versteht die ganze
 * Schicht:
 *
 *   1. *Laden* über useDaten – einmal beim Verbinden, danach auf Zuruf.
 *   2. *Horchen* über useLive – der Server schiebt Änderungen nach.
 *   3. *Vorgreifen* – bei Figuren und Nebel wird die Änderung sofort
 *      örtlich angezeigt und erst danach zum Server geschickt. Ohne das
 *      ruckelte jede gezogene Figur um die Laufzeit der Anfrage hinterher.
 *
 * Diese Datei selbst ist nur noch das Inhaltsverzeichnis. Sie führt alles
 * zusammen, damit ein Bauteil weiterhin `from '../lib/daten.js'` schreiben
 * kann, ganz gleich, in welchem der Teile sein Haken steht. Geordnet ist
 * nach derselben Regel wie der ganze Almanach: Was der Runde gehört, steht
 * getrennt von dem, was einer Kampagne gehört.
 */
export * from './daten/grundlage.js';
export * from './daten/kampagne.js';
export * from './daten/kampf.js';
export * from './daten/spieltisch.js';
export * from './daten/gespraech.js';
export * from './daten/runde.js';
