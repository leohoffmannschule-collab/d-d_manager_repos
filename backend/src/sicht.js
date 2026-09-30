/**
 * Wer sieht was?
 *
 * Bis hierher war der Nebel eine Decke, die die Spielleitung von Hand
 * wegwischt. Das bleibt so – aber in einer *dunklen* Szene kommt eine zweite
 * Frage dazu: Was kann diese Figur von dort, wo sie steht, überhaupt
 * wahrnehmen? Eine Zwergin mit Dunkelsicht sieht dreißig Fuß weit ins
 * Schwarze; der Mensch neben ihr sieht nur so weit, wie die Fackel trägt.
 *
 * Zwei Dinge, die dieses Modul bewusst *nicht* kann:
 *
 * 1. **Keine Wände.** Licht und Blick gehen hier durch Mauern hindurch. Wer
 *    das nicht will, deckt den Nebel eben nicht auf – der von Hand gemalte
 *    Nebel begrenzt jede Sicht und bleibt das Werkzeug der Spielleitung.
 * 2. **Kein Unterschied zwischen hell und dämmrig.** Wer in dämmrigem Licht
 *    steht, sieht; er würfelt nur mit Nachteil auf Wahrnehmung. Das ist eine
 *    Regel für den Wurf, nicht für den Nebel.
 *
 * Gerechnet wird auf Feldmittelpunkten mit euklidischem Abstand – so, wie die
 * Regeln einen Radius auf dem Raster auslegen ("alle Felder, deren Mitte
 * innerhalb liegt"). Das Lineal am Brett misst dagegen die Entfernung
 * *zwischen zwei Figuren* und zählt Diagonalen einfach; das sind zwei
 * verschiedene Fragen, und beide werden hier so beantwortet, wie es im
 * Regelwerk steht.
 *
 * Diese Datei ist der Eingang; gerechnet wird in `sicht/`:
 *
 *   raster.js    Fuß und Felder, Feld einer Figur, Umfang der Karte
 *   sinne.js     Licht, Dunkelsicht, Sichtweiten
 *   felder.js    was die eigenen Figuren zusammen sehen
 *   bitkarte.js  eine Feldmenge als Bitkarte für die Übertragung
 */
export { figurenFeld, fussJeFeld, inFelder, rasterBereich } from './sicht/raster.js';
export { beleuchteteFelder, eigeneSichtweite, sinnesReichweite, szenenSichtweite } from './sicht/sinne.js';
export { sichtFelder } from './sicht/felder.js';
export { alsBitkarte } from './sicht/bitkarte.js';
