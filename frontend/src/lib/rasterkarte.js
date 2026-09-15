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

/* --- Pinsel über dem Raster ---------------------------------------------- */

/**
 * Ein Rechteck aus Feldkoordinaten, beschnitten auf das, was die Karte
 * überhaupt hat. Gibt `null` zurück, wenn davon nichts übrig bleibt.
 *
 * Beschnitten wird, weil ein Pinselabdruck am Kartenrand sonst Felder
 * enthielte, die es nicht gibt: Sie kosteten Platz in der Nebelliste und
 * wären nie wieder zu sehen.
 */
export function bereichGrenzen(scene, vonX, vonY, bisX, bisY) {
  const { minX, minY, cols, rows } = rasterBereich(scene);
  const x1 = Math.max(minX, Math.min(vonX, bisX));
  const x2 = Math.min(minX + cols - 1, Math.max(vonX, bisX));
  const y1 = Math.max(minY, Math.min(vonY, bisY));
  const y2 = Math.min(minY + rows - 1, Math.max(vonY, bisY));
  return x2 < x1 || y2 < y1 ? null : { x1, y1, x2, y2 };
}

/** Alle Felder eines solchen Rechtecks, als `"x,y"` für den Server. */
export function felderImBereich(scene, vonX, vonY, bisX, bisY) {
  const grenzen = bereichGrenzen(scene, vonX, vonY, bisX, bisY);
  if (!grenzen) return [];
  const felder = [];
  for (let y = grenzen.y1; y <= grenzen.y2; y++) {
    for (let x = grenzen.x1; x <= grenzen.x2; x++) felder.push(`${x},${y}`);
  }
  return felder;
}

/**
 * Der Abdruck eines Pinsels: ein Block um die Mitte.
 *
 * Nur ungerade Größen – bei einer geraden gäbe es keine Mitte, und der
 * Abdruck läge versetzt zum Feld unter dem Zeiger.
 */
export function pinselGrenzen(scene, feldX, feldY, groesse) {
  const rand = Math.floor(Math.max(1, groesse) / 2);
  return bereichGrenzen(scene, feldX - rand, feldY - rand, feldX + rand, feldY + rand);
}

export function felderImPinsel(scene, feldX, feldY, groesse) {
  const rand = Math.floor(Math.max(1, groesse) / 2);
  return felderImBereich(scene, feldX - rand, feldY - rand, feldX + rand, feldY + rand);
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
