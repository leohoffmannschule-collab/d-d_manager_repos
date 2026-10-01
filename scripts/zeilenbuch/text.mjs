/**
 * Sprachhilfen für die Erklärungen des Zeilenbuchs.
 *
 * Eine Erklärung ist ein deutscher Satz mit eingestreutem Code. Damit beim
 * Setzen nichts verrutscht, wird Code nicht als HTML hineingeschrieben,
 * sondern zwischen zwei Steuerzeichen gelegt (`code()`); erst satz.mjs macht
 * daraus ein <code>-Element. So darf ein Stück Code selbst Backticks,
 * spitze Klammern oder Anführungszeichen enthalten. Dasselbe gilt für
 * Verweise auf eine andere Zeile derselben Datei (`zeile()`): Sie werden im
 * PDF zu Sprungmarken, die man anklicken kann.
 */

/** Steuerzeichen um ein Stück Code. Im Quelltext des Almanachs kommen sie nie vor. */
export const CODE_AUF = '\u0001';
/** Das Gegenstück zu CODE_AUF. */
export const CODE_ZU = '\u0002';
/** Steuerzeichen um eine Zeilennummer, auf die verwiesen wird. */
export const ZEILE_AUF = '\u0003';
/** Das Gegenstück zu ZEILE_AUF. */
export const ZEILE_ZU = '\u0004';

/** Mehrfachen Leerraum zu einem Leerzeichen zusammenziehen. */
const glatt = (text) => String(text).replace(/\s+/g, ' ').trim();

/**
 * Text auf höchstens `laenge` Zeichen kürzen – mit „…“ am Ende, wenn etwas
 * fehlt. Gekürzt wird an einer Wortgrenze, wenn eine in der Nähe liegt.
 */
export function kuerzen(text, laenge = 70) {
  const t = glatt(text);
  if (t.length <= laenge) return t;
  const schnitt = t.slice(0, laenge - 1);
  const grenze = schnitt.lastIndexOf(' ');
  return (grenze > laenge * 0.6 ? schnitt.slice(0, grenze) : schnitt) + '…';
}

/** Ein Stück Code für eine Erklärung – geglättet, gekürzt, markiert. */
export function code(text, laenge = 70) {
  return CODE_AUF + kuerzen(text, laenge) + CODE_ZU;
}

/** Ein Verweis auf eine Zeile derselben Datei („Zeile 12“, anklickbar). */
export function zeile(nr) {
  return ZEILE_AUF + nr + ZEILE_ZU;
}

/** „a“, „a und b“, „a, b und c“. */
export function aufzaehlen(liste, und = 'und') {
  const l = liste.filter(Boolean);
  if (l.length <= 1) return l[0] ?? '';
  return `${l.slice(0, -1).join(', ')} ${und} ${l[l.length - 1]}`;
}

const ORDNUNG = ['erste', 'zweite', 'dritte', 'vierte', 'fünfte', 'sechste', 'siebte', 'achte', 'neunte', 'zehnte'];

/**
 * Die Ordnungszahl zu einer Stelle ab 0, mit der Endung, die das Wort
 * dahinter verlangt: (0, 's') → „erstes“ (Argument), (1, 'r') → „zweiter“
 * (Eintrag). Ab der elften Stelle schlicht „11.“.
 */
export function ordnung(i, endung = '') {
  return ORDNUNG[i] ? ORDNUNG[i] + endung : `${i + 1}.`;
}

/**
 * Den ersten Buchstaben groß schreiben. Beginnt der Text mit Code, bleibt
 * er, wie er ist – `type` darf nicht zu `Type` werden.
 */
export function gross(text) {
  if (String(text).startsWith(CODE_AUF)) return text;
  return String(text).replace(/^(\p{Ll})/u, (b) => b.toUpperCase());
}

/** Einen Satz daraus machen: groß anfangen, mit einem Satzzeichen enden. */
export function satz(text) {
  let t = String(text).trim();
  if (!t) return '';
  // Steuerzeichen, Klammern und Anführungszeichen am Ende zählen nicht mit:
  // „(Zeile 5)“ braucht noch einen Punkt, „„Fertig.““ nicht.
  // eslint-disable-next-line no-control-regex
  const kern = t.replace(/[\u0001-\u0004)“»"]+$/, '');
  if (!/[.!?…:]$/.test(kern)) t = t.replace(/[,;]$/, '') + '.';
  return gross(t);
}

/** Markdown-Backticks (`x`) in markierten Code verwandeln. */
export function mitCode(text) {
  const teile = String(text).split('`');
  // Eine ungerade Zahl von Backticks hieße: ein offener Code-Bereich am Ende –
  // etwa nach dem Kürzen. Dann bleibt der letzte als Zeichen stehen.
  if (teile.length % 2 === 0) teile[teile.length - 2] += '`' + teile.pop();
  return teile.map((t, i) => (i % 2 ? CODE_AUF + t + CODE_ZU : t)).join('');
}

/**
 * Abkürzungen, deren Punkt keinen Satz beendet. Sie werden vor dem Suchen
 * nach dem Satzende geschützt und danach zurückgesetzt.
 */
const ABKUERZUNGEN = ['z. B.', 'z.B.', 'd. h.', 'u. a.', 'u. ä.', 's. o.', 's. u.', 'bzw.', 'usw.', 'etc.', 'ca.', 'vgl.', 'Nr.', 'ggf.', 'inkl.', 'evtl.', 'max.', 'min.', 'bspw.', 'sog.', 'zzgl.', 'v. a.', 'o. ä.', 'Std.', 'Min.', 'Sek.', 'S.'];

/**
 * Der erste Satz eines Kommentars – für die Erklärung einer Funktion, die
 * an anderer Stelle beschrieben ist. Code in Backticks wird markiert.
 *
 * @param {string} text   der Kommentar ohne Sternchen
 * @param {number} laenge höchstens so viele Zeichen
 */
export function ersterSatz(text, laenge = 230) {
  if (!text) return '';
  const absatz = glatt(String(text).split(/\n\s*\n/)[0]);
  let geschuetzt = absatz;
  ABKUERZUNGEN.forEach((abk, i) => {
    geschuetzt = geschuetzt.split(abk).join(`\u0005${i}\u0006`);
  });
  // Ein Punkt in Code – etwa in einem Dateinamen – beendet auch keinen Satz.
  geschuetzt = geschuetzt.replace(/`[^`]*`/g, (m) => m.replace(/\./g, '\u0007'));
  const ende = /[.!?](?=\s|$)/.exec(geschuetzt);
  let s = ende ? geschuetzt.slice(0, ende.index + 1) : geschuetzt;
  // Die Platzhalter von oben (Steuerzeichen) wieder in Punkte und Abkürzungen zurück.
  // eslint-disable-next-line no-control-regex
  s = s.replace(/\u0007/g, '.').replace(/\u0005(\d+)\u0006/g, (_, i) => ABKUERZUNGEN[Number(i)]);
  return mitCode(kuerzen(s, laenge));
}

/**
 * Den Inhalt eines Kommentars ohne Sternchen und Einrückung – so, wie
 * Babel ihn liefert (`value` ohne die Zeichen /* und *\/).
 */
export function kommentarInhalt(wert) {
  return String(wert)
    .split('\n')
    .map((z) => z.replace(/^\s*\*+ ?/, '').replace(/^\s*\*$/, ''))
    .join('\n')
    .replace(/^\*+/, '')
    .trim();
}

/**
 * Ein Zitat in deutschen Anführungszeichen. Anführungszeichen im Zitat
 * selbst werden zu einfachen (‚…‘), damit man sieht, wo das Zitat endet.
 */
export function zitat(text) {
  return `„${String(text).replace(/„/g, '‚').replace(/“/g, '‘').replace(/[.:]$/, '')}“`;
}

/**
 * Eine Wendung in den Dativ setzen – für „aus …“ und „mit …“. Die Erklärer
 * bilden ihre Wendungen im Nominativ („das Ergebnis von …“); hinter einer
 * Präposition braucht es den Dativ („aus dem Ergebnis von …“). Umgestellt
 * wird nur der Anfang, und nur bei den Wendungen, die die Erklärer bilden.
 */
export function dativ(text) {
  const ersetzungen = [
    [/^das /, 'dem '],
    [/^der Text /, 'dem Text '],
    [/^der Wert /, 'dem Wert '],
    [/^der Zeitpunkt/, 'dem Zeitpunkt'],
    [/^die (Liste|Antwort|Menge|Adresse|Art|Umgebungsvariable|SQL-Anweisung|Einträge|vorbereitete) /, (m, w) => (w === 'Einträge' ? 'den Einträgen ' : `der ${w} `)],
    [/^die Komponente /, 'der Komponente '],
    [/^ein leeres /, 'einem leeren '],
    [/^ein leerer /, 'einem leeren '],
    [/^ein neues /, 'einem neuen '],
    [/^ein /, 'einem '],
    [/^eine neue /, 'einer neuen '],
    [/^eine leere /, 'einer leeren '],
    [/^eine asynchrone /, 'einer asynchronen '],
    [/^eine /, 'einer '],
    [/^ob /, 'dem Ergebnis der Frage, ob '],
    [/^alle Einträge /, 'allen Einträgen '],
  ];
  for (const [muster, ersatz] of ersetzungen) if (muster.test(text)) return text.replace(muster, ersatz);
  return text;
}

/**
 * Eine Wendung in den Akkusativ setzen – für „gibt … zurück“, „setzt … auf“,
 * „wirft …“. Nur die männlichen Wendungen ändern sich („der Text“ → „den
 * Text“, „ein Fehler“ → „einen Fehler“); alle anderen bleiben, wie sie sind.
 */
export function akkusativ(text) {
  return String(text)
    .replace(/^der (Text|Wert|Zeitpunkt|Rest|erste Eintrag|Name) /, 'den $1 ')
    .replace(/^der (Text|Wert|Zeitpunkt|Rest|erste Eintrag|Name)$/, 'den $1')
    .replace(/^ein leerer /, 'einen leeren ')
    .replace(/^ein Fehler/, 'einen Fehler')
    .replace(/^ein mehrzeiliger /, 'einen mehrzeiligen ');
}

/** Eine Zahl mit deutschem Tausenderpunkt. */
export const zahl = (n) => Number(n).toLocaleString('de-DE');

/**
 * Pixelangaben in Worten – 16 px sind ein rem, das Grundmaß der Schrift.
 * `10` → „10 px“; `2.5` rem → „40 px“.
 */
export const px = (wert) => `${zahl(Math.round(wert * 100) / 100)} px`;
