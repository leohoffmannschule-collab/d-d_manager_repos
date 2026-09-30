/**
 * Das Raster in Zahlen: Wie viel Fuß ist ein Feld, auf welchem Feld steht
 * eine Figur, welche Felder umfasst eine Karte?
 *
 * Gerechnet wird auf Feldmittelpunkten mit euklidischem Abstand – so, wie
 * die Regeln einen Radius auf dem Raster auslegen („alle Felder, deren Mitte
 * innerhalb liegt“). Dieselbe Rechnung steht für den Browser in
 * frontend/src/lib/rasterkarte.js; beide müssen übereinstimmen, sonst passt
 * die Bitkarte nicht zum Bild.
 */

const FUSS_JE_METER = 3.280839895;

/**
 * Wie viel Spielweite steckt in einem Feld – in Fuß gerechnet?
 *
 * Die Sinne stehen auf dem Charakterblatt in Fuß, weil das Regelwerk in Fuß
 * geschrieben ist. Der Maßstab der Karte darf trotzdem metrisch sein: Ein
 * Feld von einem Meter fasst 3,28 Fuß, und dreißig Fuß Dunkelsicht reichen
 * dann neun Felder weit statt sechs.
 */
export function fussJeFeld(scene) {
  const weite = Number(scene?.scale) > 0 ? Number(scene.scale) : 5;
  return scene?.unit === 'meter' ? weite * FUSS_JE_METER : weite;
}

/** Fuß in Rasterfelder, im Maßstab dieser Karte. */
export const inFelder = (fuss, scene) =>
  Math.max(0, Math.floor((Number(fuss) || 0) / fussJeFeld(scene)));

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
export function scheibe(mitte, radiusFelder, bereich, ziel) {
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
