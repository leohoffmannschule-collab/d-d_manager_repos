/**
 * Ein kleiner Markdown-Leser für die Druckfassungen – Handbücher und Buch.
 *
 * Bewusst ein eigener statt einer Bibliothek: Die Dokumente des Almanachs
 * benutzen eine Handvoll Formen – Überschriften, Absätze, Listen (auch
 * verschachtelt), Tabellen, Zitate, Codeblöcke, Bilder –, und dafür lohnt
 * keine Abhängigkeit, die bei jedem `npm install` mitkommen müsste.
 *
 * Was er *nicht* kann, steht in keinem der Dokumente: eingebettetes HTML,
 * Fußnoten, Definitionslisten. Wer so etwas braucht, erweitert ihn hier –
 * und prüft danach das Ergebnis mit `npm run drucksatz` und
 * `npm run handbuch`.
 *
 * Drei Stellen lassen sich von außen einstellen (`optionen`):
 *
 *   anker(text)    – welche Kennung eine Überschrift bekommt. Für einzelne
 *                    Handbücher die Regel von GitHub, im Buch eine, die
 *                    auch über Kapitelgrenzen hinweg eindeutig ist.
 *   verweis(ziel)  – wohin ein Verweis im Druck zeigt. Ein Verweis auf ein
 *                    anderes Markdown-Dokument soll dort auf dessen gesetzte
 *                    Fassung zeigen, nicht auf die .md-Datei. `null` heißt:
 *                    kein Verweis, nur der Text (etwa für eine Quelldatei,
 *                    die es im Druck nicht gibt).
 *   bild(pfad)     – wo ein Bild aus Sicht der gesetzten Datei liegt.
 */

/** Text für HTML entschärfen. */
export const schuetzen = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Überschrift zu Anker – dieselbe Regel, die auch GitHub anwendet. */
export function githubAnker(text) {
  const nackt = text.trim().toLowerCase().replace(/`|\*\*|\*|_/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return [...nackt]
    .filter((c) => /[\p{L}\p{N}_-]/u.test(c) || /\s/.test(c))
    .map((c) => (/\s/.test(c) ? '-' : c))
    .join('');
}

/**
 * Merkzeichen für herausgenommene Code-Stellen. Ein Zeichen aus dem privaten
 * Bereich von Unicode: Es kommt in keinem Dokument vor, also kann es sich
 * nicht mit dem Text verwechseln – anders als eine Ziffer in Leerzeichen, die
 * in „200 × 200 Felder“ prompt danebengriffe.
 */
const MARKE = '';

/**
 * Fett, kursiv, Code, Verweise und Bilder innerhalb einer Zeile. Code wird
 * zuerst herausgenommen und ganz zum Schluss wieder eingesetzt – sonst würde
 * ein Sternchen in einem Befehl als Kursivschrift gelesen.
 */
function inline(text, verweis, bild = (pfad) => pfad) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${schuetzen(c)}</code>`);
    return `${MARKE}${codes.length - 1}${MARKE}`;
  });
  s = schuetzen(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (_, alt, src) => `<img src="${bild(src)}" alt="${alt}">`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => {
    const ziel = verweis(u);
    return ziel === null ? t : `<a href="${ziel}">${t}</a>`;
  });
  s = s.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, u) => `<a href="${u}">${u}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s.replace(new RegExp(`${MARKE}(\\d+)${MARKE}`, 'g'), (_, i) => codes[Number(i)]);
}

/** Eine Tabellenzeile in ihre Zellen zerlegen. */
function zellen(z) {
  return z.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
}

/** Wie tief eine Zeile eingerückt ist (Tabulator zählt vier). */
const einzug = (zeile) => zeile.replace(/\t/g, '    ').match(/^ */)[0].length;

/** Beginnt hier ein Listenpunkt? Gibt Art, Einzug, Startnummer und Text zurück. */
function listenpunkt(zeile) {
  const m = zeile.match(/^(\s*)([-*]|(\d+)\.) (.*)$/);
  if (!m) return null;
  return { art: m[3] ? 'ol' : 'ul', tiefe: einzug(m[1]), start: m[3] ? Number(m[3]) : 1, text: m[4] };
}

/** Beginnt mit dieser Zeile ein neuer Block (und endet damit ein Absatz)? */
const blockBeginn = (zeile) => /^(#{1,6} |\s*[-*] |\s*\d+\. |\||>|```|---\s*$|!\[)/.test(zeile);

/**
 * Markdown zu HTML.
 *
 * @param {string} markdown
 * @param {object} [optionen]
 * @param {(text: string) => string} [optionen.anker]    Kennung einer Überschrift
 * @param {(ziel: string) => string} [optionen.verweis]  Ziel eines Verweises im Druck
 * @param {(pfad: string) => string} [optionen.bild]     Ort eines Bildes im Druck
 * @param {(stufe: number, text: string, id: string) => void} [optionen.ueberschrift]
 *   wird für jede Überschrift gerufen – so sammelt das Buch sein Inhaltsverzeichnis
 * @returns {string}
 */
export function nachHtml(markdown, optionen = {}) {
  const anker = optionen.anker ?? githubAnker;
  const verweis = optionen.verweis ?? ((ziel) => ziel);
  const bild = optionen.bild ?? ((pfad) => pfad);
  const zeile = (text) => inline(text, verweis, bild);
  const zeilen = markdown.replace(/\r\n/g, '\n').split('\n');
  const raus = [];
  let i = 0;

  const absatz = (text) => `<p>${zeile(text)}</p>`;

  while (i < zeilen.length) {
    const z = zeilen[i];

    // Codeblock – der Inhalt bleibt, wie er ist. Steht der Zaun eingerückt
    // (etwa unter einem Listenpunkt), gehört dieser Einzug nicht zum Code.
    if (z.trimStart().startsWith('```')) {
      const inhalt = [];
      const weg = new RegExp(`^ {0,${einzug(z)}}`);
      i += 1;
      while (i < zeilen.length && !zeilen[i].trimStart().startsWith('```')) inhalt.push(zeilen[i++].replace(weg, ''));
      i += 1;
      raus.push(`<pre><code>${schuetzen(inhalt.join('\n'))}</code></pre>`);
      continue;
    }

    // Tabelle: Kopfzeile, Trennzeile, Rumpf.
    if (z.startsWith('|') && /^\|[\s:|-]+\|\s*$/.test(zeilen[i + 1] ?? '')) {
      const kopf = zellen(z);
      i += 2;
      const rumpf = [];
      while (i < zeilen.length && zeilen[i].startsWith('|')) rumpf.push(zellen(zeilen[i++]));
      const kopfHtml = kopf.map((s) => `<th>${zeile(s)}</th>`).join('');
      const rumpfHtml = rumpf.map((r) => `<tr>${r.map((s) => `<td>${zeile(s)}</td>`).join('')}</tr>`).join('');
      raus.push(`<table><thead><tr>${kopfHtml}</tr></thead><tbody>${rumpfHtml}</tbody></table>`);
      continue;
    }

    // Zitat – aufeinanderfolgende Zeilen gehören zusammen, und darin darf
    // wieder alles stehen (Listen, Absätze).
    if (z.startsWith('>')) {
      const inhalt = [];
      while (i < zeilen.length && zeilen[i].startsWith('>')) inhalt.push(zeilen[i++].replace(/^> ?/, ''));
      raus.push(`<blockquote>${nachHtml(inhalt.join('\n'), { ...optionen, ueberschrift: undefined })}</blockquote>`);
      continue;
    }

    const ueber = z.match(/^(#{1,6}) (.+?)\s*#*\s*$/);
    if (ueber) {
      const stufe = ueber[1].length;
      const id = anker(ueber[2]);
      optionen.ueberschrift?.(stufe, ueber[2], id);
      raus.push(`<h${stufe} id="${id}">${zeile(ueber[2])}</h${stufe}>`);
      i += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(z)) {
      raus.push('<hr>');
      i += 1;
      continue;
    }

    // Ein Bild allein in seinem Absatz wird zur Abbildung mit Unterschrift.
    const abbildung = z.match(/^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/);
    if (abbildung) {
      const [, alt, pfad] = abbildung;
      const unterschrift = alt ? `<figcaption>${zeile(alt)}</figcaption>` : '';
      raus.push(`<figure><img src="${bild(pfad)}" alt="${schuetzen(alt)}">${unterschrift}</figure>`);
      i += 1;
      continue;
    }

    if (listenpunkt(z)) {
      const [html, weiter] = liste(zeilen, i, zeile);
      raus.push(html);
      i = weiter;
      continue;
    }

    if (z.trim() === '') {
      i += 1;
      continue;
    }

    // Absatz – bis zur nächsten Leerzeile oder zum nächsten Block.
    const teile = [];
    while (i < zeilen.length && zeilen[i].trim() !== '' && !(teile.length && blockBeginn(zeilen[i]))) {
      teile.push(zeilen[i].trim());
      i += 1;
    }
    raus.push(absatz(teile.join(' ')));
  }

  return raus.join('\n');
}

/**
 * Eine Liste ab Zeile `i`, samt tiefer eingerückter Unterlisten. Gibt das
 * HTML und die erste Zeile danach zurück.
 *
 * Eine Folgezeile, die tiefer steht als der Punkt, aber selbst kein Punkt
 * ist, setzt dessen Text fort. Eine Leerzeile beendet die Liste nur, wenn
 * danach kein weiterer Punkt derselben Tiefe kommt.
 */
function liste(zeilen, i, zeile) {
  const erster = listenpunkt(zeilen[i]);
  const { art, tiefe } = erster;
  const start = art === 'ol' && erster.start !== 1 ? ` start="${erster.start}"` : '';
  const punkte = [];

  while (i < zeilen.length) {
    const punkt = listenpunkt(zeilen[i]);
    if (!punkt || punkt.tiefe !== tiefe || punkt.art !== art) break;
    const text = [punkt.text];
    const unter = [];
    i += 1;
    while (i < zeilen.length) {
      const z = zeilen[i];
      if (z.trim() === '') {
        // Geht es nach der Leerzeile mit dieser Liste weiter?
        const naechste = zeilen.slice(i + 1).find((x) => x.trim() !== '');
        const np = naechste && listenpunkt(naechste);
        if (np && np.tiefe >= tiefe) {
          i += 1;
          continue;
        }
        break;
      }
      const np = listenpunkt(z);
      if (np && np.tiefe > tiefe) {
        const [html, weiter] = liste(zeilen, i, zeile);
        unter.push(html);
        i = weiter;
        continue;
      }
      if (np || einzug(z) <= tiefe || blockBeginn(z.trim())) break;
      text.push(z.trim());
      i += 1;
    }
    punkte.push(`<li>${zeile(text.join(' '))}${unter.join('')}</li>`);
  }

  return [`<${art}${start}>${punkte.join('')}</${art}>`, i];
}
