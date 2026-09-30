/**
 * Was sehen diese Figuren zusammen? – die eigentliche Sichtrechnung.
 *
 * Zusammengesetzt aus raster.js (wo steht wer) und sinne.js (wie weit reicht
 * wessen Blick, was ist beleuchtet). Aufgerufen wird sie an genau einer
 * Stelle: spieltisch/sichtbarkeit.js.
 */
import { figurenFeld, inFelder, rasterBereich, scheibe } from './raster.js';
import { beleuchteteFelder, eigeneSichtweite, sinnesReichweite, szenenSichtweite } from './sinne.js';

/** Fuß in Felder, aber „unbegrenzt“ bleibt unbegrenzt. */
const grenzeInFelder = (fuss, scene) => (fuss === Infinity ? Infinity : inFelder(fuss, scene));

/** Abstand zweier Felder in Feldern, euklidisch – wie die Scheiben oben. */
function abstandFelder(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Was sehen diese Figuren zusammen?
 *
 * `null` heißt „alles, was aufgedeckt ist“: kein Nebel, keine eigene Figur
 * auf der Karte, oder schlicht nichts, das den Blick begrenzt. Letzteres ist
 * Absicht – wer nicht mitspielt, soll nicht vor einem schwarzen Blatt sitzen,
 * und eine helle Szene ohne eingetragene Sichtweite bleibt, wie sie war.
 *
 * Der Aufbau in einem Satz: **Sichtbar ist, was innerhalb der eigenen
 * Reichweite liegt und dort auch wahrzunehmen ist.**
 *
 * Wie weit die Reichweite geht, hängt vom Licht ab:
 *
 *   hell   – so weit der Blick trägt (`senses.sight`).
 *   dunkel – so weit der Blick trägt **oder die eigene Fackel leuchtet**,
 *            was von beidem weiter ist. Wer sich im Finstern ein Licht
 *            anzündet, sieht damit auch weiter; das ist der ganze Zweck
 *            einer Fackel.
 *
 * Die Szene deckelt beides. Nebel bleibt Nebel, auch mit Laterne.
 *
 * Innerhalb der Reichweite ist sichtbar, was beleuchtet ist – auch von
 * fremdem Licht. Aber fremdes Licht kann die Reichweite nicht *aufziehen*:
 * Die Fackel am anderen Kartenrand geht dich nichts an, sonst wanderte dein
 * Nebelfenster, ohne dass du einen Schritt getan hättest.
 */
export function sichtFelder(scene, alleTokens, eigeneTokens, sinneJeToken) {
  if (!scene.fogEnabled) return null;
  if (!eigeneTokens || eigeneTokens.length === 0) return null;

  const bereich = rasterBereich(scene);
  const beleuchtet = scene.dark ? beleuchteteFelder(scene, alleTokens) : null;
  const wetter = grenzeInFelder(szenenSichtweite(scene), scene);
  const sichtbar = new Set();
  let begrenzt = false;

  for (const token of eigeneTokens) {
    const sinne = sinneJeToken.get(token.id);
    const mitte = figurenFeld(token, scene);
    const ausAugen = grenzeInFelder(eigeneSichtweite(sinne), scene);

    // Das eigene Feld sieht man immer, und sei es durch Tasten.
    sichtbar.add(`${mitte.fx},${mitte.fy}`);

    if (!scene.dark) {
      // Helle Szene: Es zählt allein, wie weit der Blick reicht.
      const reichweite = Math.min(ausAugen, wetter);
      if (reichweite === Infinity) return null;
      begrenzt = true;
      scheibe(mitte, reichweite, bereich, sichtbar);
      continue;
    }

    begrenzt = true;
    // Dunkel: Die eigene Fackel trägt den Blick über die Sichtweite hinaus.
    const ausLicht = inFelder((token.lightBright ?? 0) + (token.lightDim ?? 0), scene);
    const reichweite = Math.min(Math.max(ausAugen, ausLicht), wetter);

    // Was ohne jedes Licht wahrgenommen wird, aber nie über die Reichweite.
    const dunkelSinne = Math.min(inFelder(sinnesReichweite(sinne), scene), reichweite);
    if (dunkelSinne > 0) scheibe(mitte, dunkelSinne, bereich, sichtbar);

    // Dazu, was beleuchtet ist – soweit der Blick hinreicht.
    for (const feld of beleuchtet) {
      if (sichtbar.has(feld)) continue;
      if (reichweite !== Infinity) {
        const trenner = feld.indexOf(',');
        const x = Number(feld.slice(0, trenner));
        const y = Number(feld.slice(trenner + 1));
        if (abstandFelder(x, y, mitte.fx, mitte.fy) > reichweite) continue;
      }
      sichtbar.add(feld);
    }
  }

  return begrenzt ? sichtbar : null;
}
