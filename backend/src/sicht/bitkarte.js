/**
 * Eine Feldmenge als Bitkarte, ein Bit je Rasterfeld, base64 verpackt.
 *
 * Der Grund ist schlichte Arithmetik. Eine Karte über zweihundert Meter hat
 * bei einem Meter je Feld 40 000 Felder. Als Liste von `"x,y"` sind das
 * 348 KB – und die Szene geht bei jedem Zug an jede Person neu hinaus, macht
 * bei fünf Spielern 1,7 MB für einen Schritt zur Seite. Als Bitkarte sind es
 * 6,5 KB, also das Fünfzigfache weniger, und der Browser liest sie beim Malen
 * des Nebels sogar schneller als eine Menge.
 *
 * Die einzelnen Pinselstriche wandern weiterhin als `"x,y"` – ein Strich ist
 * klein, und dafür lohnt kein Umpacken.
 */
export function alsBitkarte(felder, bereich) {
  const spalten = bereich.maxX - bereich.minX + 1;
  const zeilen = bereich.maxY - bereich.minY + 1;
  if (spalten <= 0 || zeilen <= 0) return '';

  const bytes = new Uint8Array(Math.ceil((spalten * zeilen) / 8));
  for (const feld of felder) {
    const trenner = feld.indexOf(',');
    if (trenner < 0) continue;
    const x = Number(feld.slice(0, trenner));
    const y = Number(feld.slice(trenner + 1));
    if (x < bereich.minX || x > bereich.maxX || y < bereich.minY || y > bereich.maxY) continue;
    const stelle = (y - bereich.minY) * spalten + (x - bereich.minX);
    bytes[stelle >> 3] |= 1 << (stelle & 7);
  }
  return Buffer.from(bytes).toString('base64');
}
