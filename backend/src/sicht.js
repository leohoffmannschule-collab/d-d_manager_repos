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
 */

const FUSS_JE_FELD = 5;

/** Fuß in Rasterfelder. 30 Fuß Dunkelsicht sind sechs Felder. */
export const inFelder = (fuss) => Math.max(0, Math.floor((Number(fuss) || 0) / FUSS_JE_FELD));

/** In welchem Rasterfeld steht der Mittelpunkt dieser Figur? */
export function figurenFeld(token, scene) {
  const g = Math.max(4, scene.gridSize);
  const mitteX = token.x + (Math.max(1, token.size || 1) * g) / 2;
  const mitteY = token.y + (Math.max(1, token.size || 1) * g) / 2;
  return {
    fx: Math.floor((mitteX - scene.gridOffsetX) / g),
    fy: Math.floor((mitteY - scene.gridOffsetY) / g),
  };
}

/** Die Rasterfelder, die eine Karte überhaupt umfasst. */
export function rasterBereich(scene) {
  const g = Math.max(4, scene.gridSize);
  return {
    g,
    minX: Math.floor((0 - scene.gridOffsetX) / g),
    minY: Math.floor((0 - scene.gridOffsetY) / g),
    maxX: Math.floor((Math.max(1, scene.width) - 1 - scene.gridOffsetX) / g),
    maxY: Math.floor((Math.max(1, scene.height) - 1 - scene.gridOffsetY) / g),
  };
}

/** Alle Felder im Umkreis eines Feldes in eine Menge legen. */
function scheibe(mitte, radiusFelder, bereich, ziel) {
  const r = radiusFelder;
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = mitte.fx + dx;
      const y = mitte.fy + dy;
      if (x < bereich.minX || x > bereich.maxX || y < bereich.minY || y > bereich.maxY) continue;
      ziel.add(`${x},${y}`);
    }
  }
}

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
    const reichweite = inFelder((token.lightBright ?? 0) + (token.lightDim ?? 0));
    if (reichweite <= 0) continue;
    scheibe(figurenFeld(token, scene), reichweite, bereich, felder);
  }
  return felder;
}

/**
 * Die eigenen Sinne einer Figur, in Fuß. Was davon zählt, ist das Weiteste:
 * Wer dreißig Fuß Dunkelsicht und zehn Fuß Blindsicht hat, sieht dreißig.
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
 * Was sehen diese Figuren zusammen?
 *
 * `null` heißt „alles, was aufgedeckt ist“ – bei Tageslicht, ohne Nebel, oder
 * wenn jemand gar keine Figur auf der Karte hat. Letzteres ist Absicht: Wer
 * nicht mitspielt, soll nicht vor einem schwarzen Blatt sitzen.
 */
export function sichtFelder(scene, alleTokens, eigeneTokens, sinneJeToken) {
  if (!scene.fogEnabled || !scene.dark) return null;
  if (!eigeneTokens || eigeneTokens.length === 0) return null;

  const bereich = rasterBereich(scene);
  // Licht scheint für jeden, der hinsieht – auch die Fackel des Nachbarn.
  const sichtbar = new Set(beleuchteteFelder(scene, alleTokens));

  for (const token of eigeneTokens) {
    const mitte = figurenFeld(token, scene);
    // Das eigene Feld sieht man immer, und sei es durch Tasten.
    sichtbar.add(`${mitte.fx},${mitte.fy}`);
    const reichweite = inFelder(sinnesReichweite(sinneJeToken.get(token.id)));
    if (reichweite > 0) scheibe(mitte, reichweite, bereich, sichtbar);
  }

  return sichtbar;
}
