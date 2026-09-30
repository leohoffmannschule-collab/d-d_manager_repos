/**
 * Daten von einer Kampagne in eine andere kopieren.
 *
 * Die Vorbereitung – Karten, Bilder, Bestiarium, Begegnungen, Klang – gehört
 * ohnehin der ganzen Runde und liegt in jeder Kampagne bereit; dort gibt es
 * nichts zu kopieren. Was hier hinüberwandert, ist das, was zu *einer*
 * Geschichte gehört: Charaktere, Handzettel, Szenen und die Beutekiste.
 *
 * Kopiert wird, nicht verschoben: Was hier liegt, bleibt liegen, und beide
 * Fassungen gehen danach getrennte Wege. Der Almanach führt auch nicht Buch
 * darüber, was schon einmal hinüber ist – zweimal kopiert heißt zweimal dort.
 *
 * Nicht kopiert wird die Geschichte selbst: Würfe, Chat und Chronik gehören
 * zu den Abenden, an denen sie geschahen, und in einer anderen Kampagne wären
 * sie eine Fälschung. Ein laufender Kampf ebenso wenig – dafür gibt es
 * „Kampf als Begegnung sichern“, und Begegnungen liegen der ganzen Runde
 * bereit.
 *
 * Diese Datei ist nur der Eingang; gebaut wird in `uebernehmen/`:
 *
 *   ziel.js     darf hier hineingelegt werden?
 *   stuecke.js  je Art ein Stück kopieren
 *   arten.js    welche Arten es gibt, in welcher Reihenfolge
 *   alles.js    alles Gewählte auf einmal, und Bescheid an das Ziel
 */

export { zielKampagne, zielPruefen } from './uebernehmen/ziel.js';
export {
  kopiereCharakter,
  kopiereGegenstand,
  kopiereMuenzen,
  kopiereNotiz,
  kopiereSzene,
} from './uebernehmen/stuecke.js';
export { ARTEN, istArt, umfang } from './uebernehmen/arten.js';
export { meldeNachZiel, uebernimmAlles } from './uebernehmen/alles.js';
