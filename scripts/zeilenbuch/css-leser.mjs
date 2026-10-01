/**
 * CSS in Regeln zerlegen – so weit, wie das Zeilenbuch es braucht.
 *
 * Kein vollständiger CSS-Parser: Gesucht werden die Stellen, an denen ein
 * Block beginnt (`selektor {` oder `@media … {`), mit der Zeile, der Tiefe
 * der Verschachtelung und dem Kommentar direkt davor. Daraus entstehen zwei
 * Dinge: das Verzeichnis der eigenen CSS-Klassen (welche Klasse steht in
 * welchem Stilblatt, und was sagt der Kommentar dazu – siehe projekt.mjs)
 * und das Gerüst, an dem css.mjs die Zeilen eines Stilblatts erklärt.
 */

/**
 * Die Blöcke eines Stilblatts, in Lesereihenfolge.
 *
 * @param {string} text
 * @returns {Array<{ kopf: string, zeile: number, ende: number, tiefe: number, kommentar: string }>}
 *   `kopf` ist der Selektor bzw. die At-Regel vor `{`, `zeile` die Zeile
 *   der öffnenden, `ende` die der schließenden Klammer.
 */
export function bloecke(text) {
  const raus = [];
  const offen = [];
  let zeile = 1;
  let kopfAnfang = 0;
  let kopfZeile = 1;
  let kommentar = '';
  let i = 0;
  const neueZeilen = (von, bis) => {
    for (let k = von; k < bis; k += 1) if (text[k] === '\n') zeile += 1;
  };
  while (i < text.length) {
    const z = text[i];
    if (z === '/' && text[i + 1] === '*') {
      const ende = text.indexOf('*/', i + 2);
      const bis = ende === -1 ? text.length : ende + 2;
      kommentar = text.slice(i + 2, bis - 2);
      neueZeilen(i, bis);
      i = bis;
      kopfAnfang = i;
      kopfZeile = zeile;
      continue;
    }
    if (z === '"' || z === "'") {
      const ende = text.indexOf(z, i + 1);
      i = ende === -1 ? text.length : ende + 1;
      continue;
    }
    if (z === '{') {
      const kopf = text.slice(kopfAnfang, i).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      // Die Zeile des Selektors ist die erste, in der er etwas enthält.
      const vorlauf = text.slice(kopfAnfang, i);
      const fuehrend = vorlauf.length - vorlauf.trimStart().length;
      const eintrag = { kopf, zeile: kopfZeile + (vorlauf.slice(0, fuehrend).match(/\n/g)?.length ?? 0), ende: 0, tiefe: offen.length, kommentar };
      raus.push(eintrag);
      offen.push(eintrag);
      kommentar = '';
      i += 1;
      kopfAnfang = i;
      kopfZeile = zeile;
      continue;
    }
    if (z === '}') {
      const eintrag = offen.pop();
      if (eintrag) eintrag.ende = zeile;
      kommentar = '';
      i += 1;
      kopfAnfang = i;
      kopfZeile = zeile;
      continue;
    }
    if (z === ';') {
      i += 1;
      kopfAnfang = i;
      kopfZeile = zeile;
      kommentar = '';
      continue;
    }
    if (z === '\n') zeile += 1;
    i += 1;
  }
  return raus;
}

/** Alle Klassennamen in einem Selektor: `.btn:hover, .btn-seal` → btn, btn-seal. */
export function klassenIn(selektor) {
  return [...selektor.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]);
}
