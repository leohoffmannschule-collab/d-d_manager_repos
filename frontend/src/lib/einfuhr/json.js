/**
 * JSON lesen, das eine KI (oder eine Hand) geschrieben hat.
 *
 * Gültiges JSON geht wie immer durch `JSON.parse`. Scheitert das, versucht
 * `reparieren` die Fehler, die beim Bearbeiten durch eine KI am häufigsten
 * entstehen – und nur diese, damit nichts erraten wird:
 *
 *   – Kommentare (`// …`, `/* … *\/`), die eine KI gern dazuschreibt,
 *   – ein Komma nach dem letzten Eintrag eines Objekts oder einer Liste,
 *   – echte Zeilenumbrüche und Tabulatoren mitten in einem Text, wo JSON
 *     `\n` und `\t` verlangt.
 *
 * Bleibt es danach kaputt, nennt die Fehlermeldung Zeile und Spalte in der
 * Datei und zeigt die Stelle – damit man der KI sagen kann, was sie
 * reparieren soll.
 */

/**
 * Die drei Reparaturen in einem Durchgang. Gibt den reparierten Text zurück
 * und für jedes seiner Zeichen die Stelle im Original – für Fehlermeldungen,
 * die auf die richtige Zeile zeigen.
 */
export function reparieren(text) {
  let aus = '';
  const herkunft = [];
  const schreib = (zeichen, stelle) => {
    aus += zeichen;
    for (let k = 0; k < zeichen.length; k++) herkunft.push(stelle);
  };
  let imText = false;
  for (let i = 0; i < text.length; i++) {
    const z = text[i];
    if (imText) {
      if (z === '\\') {
        schreib(z + (text[i + 1] ?? ''), i);
        i += 1;
      } else if (z === '"') {
        imText = false;
        schreib(z, i);
      } else if (z === '\n') schreib('\\n', i);
      else if (z === '\r') continue;
      else if (z === '\t') schreib('\\t', i);
      else schreib(z, i);
      continue;
    }
    if (z === '"') {
      imText = true;
      schreib(z, i);
    } else if (z === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i += 1;
      i -= 1;
    } else if (z === '/' && text[i + 1] === '*') {
      const ende = text.indexOf('*/', i + 2);
      i = ende === -1 ? text.length : ende + 1;
    } else if (z === ',') {
      // Ein Komma, hinter dem (nach Leerraum und Kommentaren) nur noch } oder ] kommt, fällt weg.
      let j = i + 1;
      for (;;) {
        while (j < text.length && /\s/.test(text[j])) j += 1;
        if (text.startsWith('//', j)) j = text.indexOf('\n', j) === -1 ? text.length : text.indexOf('\n', j);
        else if (text.startsWith('/*', j)) j = text.indexOf('*/', j) === -1 ? text.length : text.indexOf('*/', j) + 2;
        else break;
      }
      if (text[j] !== '}' && text[j] !== ']') schreib(z, i);
    } else schreib(z, i);
  }
  return { text: aus, herkunft };
}

/** Zeile und Spalte (ab 1) einer Stelle in einem Text. */
function zeileSpalte(text, stelle) {
  const davor = text.slice(0, stelle).split('\n');
  return { zeile: davor.length, spalte: davor[davor.length - 1].length + 1 };
}

/** Die Stelle aus der Fehlermeldung von JSON.parse (Browser und Node schreiben sie verschieden). */
function stelleAus(fehler, text) {
  const pos = /position (\d+)/i.exec(fehler.message);
  if (pos) return Number(pos[1]);
  const zs = /line (\d+) column (\d+)/i.exec(fehler.message);
  if (zs) {
    const zeilen = text.split('\n').slice(0, Number(zs[1]) - 1);
    return zeilen.reduce((summe, z) => summe + z.length + 1, 0) + Number(zs[2]) - 1;
  }
  return null;
}

/**
 * JSON lesen, notfalls repariert.
 *
 * @param {string} roh        der Text des Datensatzes
 * @param {object} [ort]
 * @param {string} [ort.datei]  der ganze Dateitext – für Zeilenangaben in der Datei
 * @param {number} [ort.ab]     wo im Dateitext der Datensatz beginnt
 * @returns {{ wert: unknown, repariert: boolean }}
 * @throws {Error} mit Zeile, Spalte und der Stelle, wenn auch die Reparatur nicht hilft
 */
export function jsonLesen(roh, { datei = roh, ab = 0 } = {}) {
  try {
    return { wert: JSON.parse(roh), repariert: false };
  } catch {
    // weiter unten: reparieren
  }
  const { text, herkunft } = reparieren(roh);
  try {
    return { wert: JSON.parse(text), repariert: true };
  } catch (fehler) {
    const stelle = stelleAus(fehler, text);
    const imOriginal = stelle == null ? null : (herkunft[Math.min(stelle, herkunft.length - 1)] ?? roh.length);
    // Gekürzt sieht so aus: eine Zeile nur mit „…“, oder ein Kommentar wie „// Rest unverändert“.
    const gekuerzt =
      /^\s*(…|\.\.\.)\s*,?\s*$/m.test(roh) || /\/\/[^\n]*(…|\.\.\.|unverändert|unchanged|rest)/i.test(roh);
    let wo = '';
    if (imOriginal != null) {
      const { zeile, spalte } = zeileSpalte(datei, ab + imOriginal);
      const ausschnitt = roh.slice(Math.max(0, imOriginal - 30), imOriginal + 30).replace(/\s+/g, ' ').trim();
      wo = ` – Zeile ${zeile}, Spalte ${spalte} der Datei, bei „${ausschnitt}“`;
    }
    throw new Error(
      `Der Datensatz in dieser Datei ist beschädigt${wo}. ` +
        (gekuerzt
          ? 'Vermutlich hat die KI die Datei gekürzt („…“ oder „Rest unverändert“) – bitte sie um die vollständige Datei.'
          : 'Meist fehlt ein Komma oder ein Anführungszeichen – die KI kann es an dieser Stelle reparieren.')
    );
  }
}
