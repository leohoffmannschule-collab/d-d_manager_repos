/**
 * Bitkarten über dem Raster: eine für den Nebel, eine für die Sicht.
 *
 * Der Server schickt beides als base64 verpackte Bitfolge, ein Bit je
 * Rasterfeld. Der Grund ist Arithmetik: Eine Karte über zweihundert Meter hat
 * bei einem Meter je Feld 40 000 Felder, und die wären als Liste von `"x,y"`
 * 348 KB – bei jedem Zug, an jede Person. Als Bitkarte sind es 6,5 KB.
 *
 * Hier wird sie ausgepackt und abgefragt. Das Lesen eines Bits ist billiger
 * als ein Nachschlagen in einer Menge, was beim Malen des Nebels zählt: Dort
 * wird für jedes einzelne Feld gefragt.
 */

/** Rasterfelder, die eine Karte umfasst – auch bei verschobenem Raster. */
export function rasterBereich(scene) {
  const g = Math.max(4, scene.gridSize);
  const minX = Math.floor((0 - scene.gridOffsetX) / g);
  const minY = Math.floor((0 - scene.gridOffsetY) / g);
  const maxX = Math.floor((Math.max(1, scene.width) - 1 - scene.gridOffsetX) / g);
  const maxY = Math.floor((Math.max(1, scene.height) - 1 - scene.gridOffsetY) / g);
  return { g, minX, minY, cols: maxX - minX + 1, rows: maxY - minY + 1 };
}

/**
 * Aus base64 eine Karte machen. `null` bleibt `null` – das heißt beim Nebel
 * „nichts aufgedeckt“ und bei der Sicht „keine Grenze“.
 */
export function ausBase64(text, bereich) {
  if (typeof text !== 'string') return null;
  const { cols, rows, minX, minY } = bereich;
  const bytes = new Uint8Array(Math.ceil(Math.max(0, cols * rows) / 8));
  if (text) {
    const roh = atob(text);
    for (let i = 0; i < roh.length && i < bytes.length; i++) bytes[i] = roh.charCodeAt(i);
  }
  return { bytes, cols, rows, minX, minY };
}

/** Steht das Bit für dieses Feld? Feldkoordinaten, nicht Bildpunkte. */
export function hatFeld(karte, x, y) {
  if (!karte) return false;
  const i = x - karte.minX;
  const j = y - karte.minY;
  if (i < 0 || j < 0 || i >= karte.cols || j >= karte.rows) return false;
  const stelle = j * karte.cols + i;
  return (karte.bytes[stelle >> 3] & (1 << (stelle & 7))) !== 0;
}

/** Dasselbe, aber schon als Stelle gerechnet – für die Schleife beim Malen. */
export function hatStelle(karte, stelle) {
  if (!karte) return false;
  return (karte.bytes[stelle >> 3] & (1 << (stelle & 7))) !== 0;
}

/**
 * Einen Pinselstrich anwenden und eine *neue* Karte zurückgeben.
 *
 * Neu, weil React sonst nicht merkt, dass sich etwas geändert hat. Kopiert
 * werden dabei nur die paar Kilobyte der Bitfolge, nicht 40 000 Zeichenketten.
 */
export function mitFeldern(karte, felder, gesetzt) {
  if (!karte) return karte;
  const bytes = karte.bytes.slice();
  for (const feld of felder) {
    const trenner = String(feld).indexOf(',');
    if (trenner < 0) continue;
    const i = Number(feld.slice(0, trenner)) - karte.minX;
    const j = Number(feld.slice(trenner + 1)) - karte.minY;
    if (i < 0 || j < 0 || i >= karte.cols || j >= karte.rows) continue;
    const stelle = j * karte.cols + i;
    if (gesetzt) bytes[stelle >> 3] |= 1 << (stelle & 7);
    else bytes[stelle >> 3] &= ~(1 << (stelle & 7));
  }
  return { ...karte, bytes };
}

/* --- Maßstab ------------------------------------------------------------- */

const FUSS_JE_METER = 3.280839895;

export const EINHEIT = { fuss: 'Fuß', meter: 'Meter' };

/** Wie viel Spielweite steckt in `felder` Feldern dieser Karte? */
export function weite(scene, felder) {
  const proFeld = Number(scene?.scale) > 0 ? Number(scene.scale) : 5;
  return felder * proFeld;
}

/** „12 Meter“ oder „60 Fuß“ – fertig zum Hinschreiben. */
export function weiteText(scene, felder) {
  const wert = weite(scene, felder);
  const gerundet = Number.isInteger(wert) ? wert : Math.round(wert * 10) / 10;
  return `${gerundet} ${EINHEIT[scene?.unit] ?? 'Fuß'}`;
}

/** Fuß vom Charakterblatt in Felder dieser Karte. Spiegelt backend/src/sicht.js. */
export function inFelder(fuss, scene) {
  const weiteJeFeld = Number(scene?.scale) > 0 ? Number(scene.scale) : 5;
  const fussJeFeld = scene?.unit === 'meter' ? weiteJeFeld * FUSS_JE_METER : weiteJeFeld;
  return Math.max(0, Math.floor((Number(fuss) || 0) / fussJeFeld));
}
