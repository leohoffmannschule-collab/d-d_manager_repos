/**
 * Licht und Sinne: Was leuchtet, und wie weit reicht ein Blick?
 *
 * Alle Weiten stehen in Fuß – wie im Regelwerk und auf dem Charakterblatt.
 * In Felder umgerechnet wird erst mit dem Maßstab der Karte (raster.js).
 */
import { figurenFeld, inFelder, rasterBereich, scheibe } from './raster.js';

/**
 * Was leuchtet auf dieser Karte?
 *
 * Jede Figur mit Fackel, Laterne oder Lichtzauber erhellt ihre Umgebung – für
 * alle, nicht nur für sich selbst. Hell und dämmrig fallen dabei zusammen: In
 * beidem sieht man.
 */
export function beleuchteteFelder(scene, tokens) {
  const bereich = rasterBereich(scene);
  const felder = new Set();
  for (const token of tokens) {
    const reichweite = inFelder((token.lightBright ?? 0) + (token.lightDim ?? 0), scene);
    if (reichweite <= 0) continue;
    scheibe(figurenFeld(token, scene), reichweite, bereich, felder);
  }
  return felder;
}

/**
 * Die Sinne einer Figur für die *Dunkelheit*, in Fuß. Was davon zählt, ist
 * das Weiteste: Wer dreißig Fuß Dunkelsicht und zehn Fuß Blindsicht hat,
 * nimmt dreißig Fuß weit wahr, auch ohne jedes Licht.
 */
export function sinnesReichweite(sinne) {
  if (!sinne) return 0;
  return Math.max(
    Number(sinne.darkvision) || 0,
    Number(sinne.blindsight) || 0,
    Number(sinne.tremorsense) || 0,
    Number(sinne.truesight) || 0
  );
}

/**
 * Wie weit sieht diese Figur überhaupt, in Fuß – bei genug Licht.
 *
 * Das ist etwas anderes als die Dunkelsicht. Bei Tageslicht sieht man bis zum
 * Horizont; auf einer Karte heißt das „unbegrenzt“, und genau dafür steht die
 * Null. Wer stattdessen einen Wert einträgt, bekommt ein Nebelfenster, das
 * an seiner Figur hängt: So weit reicht der Blick, nicht weiter.
 */
export const eigeneSichtweite = (sinne) => (Number(sinne?.sight) > 0 ? Number(sinne.sight) : Infinity);

/**
 * Was die Szene allen aufzwingt, in Fuß – Nebelbank, Schneetreiben, dichter
 * Wald. Das ist die harte Grenze: Auch eine Fackel leuchtet nicht durch
 * Nebel hindurch.
 */
export const szenenSichtweite = (scene) => (Number(scene?.sight) > 0 ? Number(scene.sight) : Infinity);
