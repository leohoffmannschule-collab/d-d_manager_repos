/**
 * DER – die Schreibweise, in der Zertifikate gespeichert werden.
 *
 * Ein X.509-Zertifikat ist eine verschachtelte Folge von Feldern, jedes als
 * Kennbyte, Länge und Inhalt (Tag-Length-Value). Node kann Zertifikate
 * lesen (`crypto.X509Certificate`) und Schlüssel erzeugen und signieren,
 * aber keine Zertifikate *ausstellen*. Dafür bräuchte es sonst OpenSSL oder
 * ein Paket – und der Almanach soll nichts nachladen, was er nicht braucht.
 *
 * Diese Datei kann genau die Bausteine schreiben, die zertifikat.js
 * braucht, und nicht mehr. Sie liest nichts: Gelesen und geprüft wird mit
 * Node selbst (siehe zertifikat.js und den Vertrag).
 */

/** Die Länge eines Feldes: kurz (< 128) in einem Byte, sonst mit Längenvorsatz. */
function laenge(n) {
  if (n < 0x80) return Buffer.from([n]);
  const bytes = [];
  for (let rest = n; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256);
  return Buffer.from([0x80 | bytes.length, ...bytes]);
}

/** Ein Feld: Kennbyte, Länge, Inhalt. */
export const feld = (kennbyte, inhalt) => Buffer.concat([Buffer.from([kennbyte]), laenge(inhalt.length), inhalt]);

/** SEQUENCE – eine Folge in fester Reihenfolge. */
export const folge = (...teile) => feld(0x30, Buffer.concat(teile));

/** SET – hier nur mit einem Element gebraucht, daher ohne Sortieren. */
export const menge = (teil) => feld(0x31, teil);

/**
 * INTEGER aus einem Puffer (groß-endian, positiv gemeint). Führende Nullen
 * fallen weg, und ist das oberste Bit gesetzt, kommt eine Null davor –
 * sonst läse man die Zahl als negativ.
 */
export function ganzzahl(puffer) {
  let i = 0;
  while (i < puffer.length - 1 && puffer[i] === 0) i += 1;
  const rumpf = puffer.subarray(i);
  return feld(0x02, rumpf[0] & 0x80 ? Buffer.concat([Buffer.from([0]), rumpf]) : rumpf);
}

/** Eine kleine, nichtnegative Zahl als INTEGER. */
export const kleineZahl = (n) => ganzzahl(Buffer.from([n]));

/** OBJECT IDENTIFIER aus der Punktschreibweise („2.5.4.3“). */
export function kennung(punkte) {
  const zahlen = punkte.split('.').map(Number);
  const bytes = [40 * zahlen[0] + zahlen[1]];
  for (const z of zahlen.slice(2)) {
    // Je sieben Bit, das oberste Bit sagt „es kommt noch eins“.
    const stueck = [z % 128];
    for (let rest = Math.floor(z / 128); rest > 0; rest = Math.floor(rest / 128)) stueck.unshift((rest % 128) | 0x80);
    bytes.push(...stueck);
  }
  return feld(0x06, Buffer.from(bytes));
}

/** UTF8String – für Namen im Zertifikat. */
export const text = (s) => feld(0x0c, Buffer.from(s, 'utf8'));

/** BOOLEAN wahr (falsch wird in DER einfach weggelassen). */
export const wahr = () => feld(0x01, Buffer.from([0xff]));

/** OCTET STRING. */
export const oktette = (puffer) => feld(0x04, puffer);

/** BIT STRING; `unbenutzt` sagt, wie viele Bits am Ende des letzten Bytes nicht zählen. */
export const bits = (puffer, unbenutzt = 0) => feld(0x03, Buffer.concat([Buffer.from([unbenutzt]), puffer]));

/** Ein Zeitpunkt: bis 2049 als UTCTime, danach als GeneralizedTime (so will es RFC 5280). */
export function zeit(datum) {
  const iso = datum.toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return datum.getUTCFullYear() < 2050
    ? feld(0x17, Buffer.from(`${iso.slice(2)}Z`, 'ascii'))
    : feld(0x18, Buffer.from(`${iso}Z`, 'ascii'));
}

/** Kontextfeld [n], zusammengesetzt (EXPLICIT, oder IMPLICIT über einer Folge). */
export const kontext = (n, inhalt) => feld(0xa0 | n, inhalt);

/** Kontextfeld [n], einfach (IMPLICIT über einem einfachen Typ). */
export const kontextEinfach = (n, inhalt) => feld(0x80 | n, inhalt);
