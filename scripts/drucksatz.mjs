#!/usr/bin/env node
/**
 * Aus den Handbüchern druckfertige Seiten setzen.
 *
 *   npm run drucksatz
 *
 * Markdown liest sich am Bildschirm gut, auf Papier nicht: keine Seitenzahlen,
 * keine Ränder, Tabellen laufen über den Bund. Dieses Skript setzt die
 * Dokumente aus docs/ als HTML, das für den Druck gedacht ist – mit
 * Titelblatt, Seitenzahlen und Tabellen, die nicht mitten in einer Zeile
 * umbrechen.
 *
 * Das Ergebnis liegt in docs/druck/ und wird im Browser geöffnet:
 * Strg+P, dann „Als PDF sichern“. Mehr braucht es nicht – kein pandoc, kein
 * LaTeX, kein Zusatzwerkzeug.
 *
 * Bewusst ein eigener, kleiner Markdown-Leser statt einer Bibliothek: Die
 * Handbücher benutzen eine Handvoll Formen – Überschriften, Listen, Tabellen,
 * Zitate, Codeblöcke –, und dafür lohnt keine Abhängigkeit, die bei jedem
 * `npm install` mitkommen müsste.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quelle = path.join(wurzel, 'docs');
const ziel = path.join(quelle, 'druck');

/** Welche Dokumente gesetzt werden, und was aufs Titelblatt kommt. */
const BAENDE = [
  { datei: 'HANDBUCH.md', titel: 'Handbuch', unter: 'Die vollständige Beschreibung des Abenteuer-Almanachs' },
  { datei: 'SPIELLEITUNG.md', titel: 'Betriebsanleitung', unter: 'Für die Spielleitung' },
  { datei: 'SPIELER.md', titel: 'Betriebsanleitung', unter: 'Für die Runde' },
  { datei: 'EINRICHTUNG.md', titel: 'Einrichtungs-Handbuch', unter: 'Vom nackten Gerät bis zur ersten Runde' },
];

/* --- Markdown lesen ------------------------------------------------------ */

const schuetzen = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Überschrift zu Anker – dieselbe Regel, die auch GitHub anwendet. */
function anker(text) {
  const nackt = text.trim().toLowerCase().replace(/`|\*\*|\*|_/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  return [...nackt]
    .filter((c) => /[\p{L}\p{N}_-]/u.test(c) || /\s/.test(c))
    .map((c) => (/\s/.test(c) ? '-' : c))
    .join('');
}

/**
 * Merkzeichen für herausgenommene Code-Stellen. Ein Zeichen aus dem privaten
 * Bereich von Unicode: Es kommt in keinem Handbuch vor, also kann es sich
 * nicht mit dem Text verwechseln – anders als eine Ziffer in Leerzeichen, die
 * in „200 × 200 Felder“ prompt danebengriffe.
 */
const MARKE = '\uE000';

/**
 * Fett, kursiv, Code und Verweise. Code wird zuerst herausgenommen und ganz
 * zum Schluss wieder eingesetzt – sonst würde ein Sternchen in einem Befehl
 * als Kursivschrift gelesen.
 */
function inline(text) {
  const codes = [];
  let s = text.replace(/`([^`]+)`/g, (_, c) => {
    codes.push(`<code>${schuetzen(c)}</code>`);
    return `${MARKE}${codes.length - 1}${MARKE}`;
  });
  s = schuetzen(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${verweis(u)}">${t}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  return s.replace(new RegExp(`${MARKE}(\\d+)${MARKE}`, 'g'), (_, i) => codes[Number(i)]);
}

/**
 * Verweise umbiegen: Zwischen den gesetzten Bänden soll man springen können,
 * also zeigen sie im Druck auf die HTML-Fassung nebenan statt auf das
 * Markdown, das dort gar nicht liegt. Alles andere bleibt, wie es ist.
 */
function verweis(ziel) {
  const [datei, ...rest] = ziel.split('#');
  const marke = rest.length ? `#${rest.join('#')}` : '';
  if (BAENDE.some((b) => b.datei === datei)) return `${datei.replace(/\.md$/, '.html')}${marke}`;
  return ziel;
}

/** Eine Tabellenzeile in ihre Zellen zerlegen. */
function zellen(z) {
  return z.replace(/^\|/, '').replace(/\|$/, '').split('|').map((s) => s.trim());
}

const absaetze = (text) =>
  text
    .split(/\n{2,}/)
    .filter((a) => a.trim())
    .map((a) => `<p>${inline(a.replace(/\n/g, ' ').trim())}</p>`)
    .join('');

function nachHtml(markdown) {
  const zeilen = markdown.split('\n');
  const raus = [];
  const offen = [];
  let i = 0;

  const listeSchliessen = () => {
    while (offen.length) raus.push(`</${offen.pop()}>`);
  };

  while (i < zeilen.length) {
    const z = zeilen[i];

    // Codeblock
    if (z.startsWith('```')) {
      listeSchliessen();
      const inhalt = [];
      i += 1;
      while (i < zeilen.length && !zeilen[i].startsWith('```')) inhalt.push(zeilen[i++]);
      i += 1;
      raus.push(`<pre><code>${schuetzen(inhalt.join('\n'))}</code></pre>`);
      continue;
    }

    // Tabelle: Kopfzeile, Trennzeile, Rumpf
    if (z.startsWith('|') && /^\|[\s:|-]+\|$/.test(zeilen[i + 1] ?? '')) {
      listeSchliessen();
      const kopf = zellen(z);
      i += 2;
      const rumpf = [];
      while (i < zeilen.length && zeilen[i].startsWith('|')) rumpf.push(zellen(zeilen[i++]));
      const kopfHtml = kopf.map((s) => `<th>${inline(s)}</th>`).join('');
      const rumpfHtml = rumpf.map((r) => `<tr>${r.map((s) => `<td>${inline(s)}</td>`).join('')}</tr>`).join('');
      raus.push(`<table><thead><tr>${kopfHtml}</tr></thead><tbody>${rumpfHtml}</tbody></table>`);
      continue;
    }

    // Zitat – aufeinanderfolgende Zeilen gehören zusammen
    if (z.startsWith('> ') || z === '>') {
      listeSchliessen();
      const inhalt = [];
      while (i < zeilen.length && (zeilen[i].startsWith('> ') || zeilen[i] === '>')) {
        inhalt.push(zeilen[i].replace(/^> ?/, ''));
        i += 1;
      }
      raus.push(`<blockquote>${absaetze(inhalt.join('\n'))}</blockquote>`);
      continue;
    }

    const ueber = z.match(/^(#{1,6}) (.+)$/);
    if (ueber) {
      listeSchliessen();
      const stufe = ueber[1].length;
      raus.push(`<h${stufe} id="${anker(ueber[2])}">${inline(ueber[2])}</h${stufe}>`);
      i += 1;
      continue;
    }

    if (/^(---|\*\*\*|___)\s*$/.test(z)) {
      listeSchliessen();
      raus.push('<hr>');
      i += 1;
      continue;
    }

    const punkt = z.match(/^[-*] (.+)$/);
    const nummer = z.match(/^\d+\. (.+)$/);
    if (punkt || nummer) {
      const art = punkt ? 'ul' : 'ol';
      if (offen[offen.length - 1] !== art) {
        listeSchliessen();
        offen.push(art);
        raus.push(`<${art}>`);
      }
      // Eingerückte Folgezeilen gehören noch zu diesem Punkt.
      const teile = [(punkt ?? nummer)[1]];
      i += 1;
      while (i < zeilen.length && /^\s{2,}\S/.test(zeilen[i]) && !/^\s*([-*] |\d+\. )/.test(zeilen[i])) {
        teile.push(zeilen[i].trim());
        i += 1;
      }
      raus.push(`<li>${inline(teile.join(' '))}</li>`);
      continue;
    }

    if (z.trim() === '') {
      listeSchliessen();
      i += 1;
      continue;
    }

    // Absatz – bis zur nächsten Leerzeile oder zum nächsten Block
    listeSchliessen();
    const teile = [];
    while (
      i < zeilen.length &&
      zeilen[i].trim() !== '' &&
      !/^(#{1,6} |[-*] |\d+\. |\||>|```|---)/.test(zeilen[i])
    ) {
      teile.push(zeilen[i].trim());
      i += 1;
    }
    if (teile.length) raus.push(`<p>${inline(teile.join(' '))}</p>`);
    else i += 1;
  }

  listeSchliessen();
  return raus.join('\n');
}

/* --- Der Satzspiegel ----------------------------------------------------- */

function seite(titel, unter, koerper) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${schuetzen(titel)} – Abenteuer-Almanach</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 18mm;
  }

  :root {
    --tinte: #241c12;
    --sepia: #5c4c38;
    --schwach: #8a7960;
    --linie: #cbb68d;
    --rubrik: #8f2820;
    --gold: #a8842b;
    --blatt: #fdfaf3;
  }

  * { box-sizing: border-box; }

  body {
    margin: 0;
    background: #fff;
    color: var(--tinte);
    font-family: "Liberation Serif", "DejaVu Serif", Georgia, "Times New Roman", serif;
    font-size: 10.5pt;
    line-height: 1.55;
    hyphens: auto;
  }

  /* --- Titelblatt --- */
  .titelblatt {
    height: 245mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    page-break-after: always;
    break-after: page;
  }
  .titelblatt .marke {
    font-size: 9pt;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: var(--schwach);
    margin-bottom: 14mm;
  }
  .titelblatt h1 {
    font-size: 30pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--tinte);
    margin: 0;
    border: 0;
    padding: 0;
  }
  .titelblatt .unter {
    font-style: italic;
    font-size: 13pt;
    color: var(--sepia);
    margin-top: 6mm;
    max-width: 120mm;
  }
  .zierat { margin-top: 14mm; color: var(--gold); }

  /* --- Überschriften --- */
  h1, h2, h3, h4 {
    font-weight: 600;
    break-after: avoid;
    page-break-after: avoid;
  }
  h1 {
    font-size: 19pt;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border-bottom: 1.5pt solid var(--gold);
    padding-bottom: 2mm;
    margin: 0 0 6mm;
  }
  h2 {
    font-size: 14pt;
    letter-spacing: 0.04em;
    color: var(--rubrik);
    margin: 9mm 0 3mm;
    border-bottom: 0.5pt solid var(--linie);
    padding-bottom: 1.5mm;
  }
  h3 {
    font-size: 11.5pt;
    letter-spacing: 0.03em;
    margin: 6mm 0 2mm;
  }
  h4 { font-size: 10.5pt; margin: 4mm 0 1.5mm; }

  p { margin: 0 0 3mm; orphans: 2; widows: 2; }

  a { color: var(--rubrik); text-decoration: none; }

  ul, ol { margin: 0 0 3mm; padding-left: 6mm; }
  li { margin-bottom: 1.2mm; break-inside: avoid; }
  li::marker { color: var(--rubrik); }

  code {
    font-family: "DejaVu Sans Mono", "Liberation Mono", monospace;
    font-size: 8.8pt;
    background: #f2ead7;
    padding: 0.3mm 1mm;
    border-radius: 0.6mm;
  }

  pre {
    background: var(--blatt);
    border: 0.5pt solid var(--linie);
    border-left: 2pt solid var(--gold);
    padding: 2.5mm 3mm;
    margin: 0 0 3.5mm;
    break-inside: avoid;
    white-space: pre-wrap;
  }
  pre code { background: none; padding: 0; font-size: 8.5pt; line-height: 1.4; }

  blockquote {
    margin: 0 0 3.5mm;
    padding: 2mm 3mm;
    background: rgba(168, 132, 43, 0.09);
    border-left: 2pt solid var(--gold);
    break-inside: avoid;
  }
  blockquote p:last-child { margin-bottom: 0; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0 0 4mm;
    font-size: 9.3pt;
  }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th {
    text-align: left;
    font-size: 8pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--schwach);
    border-bottom: 0.8pt solid var(--linie);
    padding: 1.5mm 2mm 1mm 0;
    font-weight: 600;
  }
  td {
    vertical-align: top;
    border-bottom: 0.4pt dotted var(--linie);
    padding: 1.5mm 2mm 1.5mm 0;
  }
  td:first-child { padding-right: 4mm; }

  hr {
    border: 0;
    border-top: 0.5pt solid var(--linie);
    margin: 6mm 0;
  }

  strong { font-weight: 700; }
</style>
</head>
<body>

<div class="titelblatt">
  <div class="marke">Abenteuer-Almanach</div>
  <h1>${schuetzen(titel)}</h1>
  <div class="unter">${schuetzen(unter)}</div>
  <div class="zierat">
    <svg width="160" height="16" viewBox="0 0 160 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 8h58M102 8h58" stroke="currentColor" stroke-width="0.8" fill="none"/>
      <path d="M80 2c-3.6 0-6.5 2.7-6.5 6s2.9 6 6.5 6 6.5-2.7 6.5-6-2.9-6-6.5-6zm0 1.8c2.6 0 4.7 1.9 4.7 4.2s-2.1 4.2-4.7 4.2-4.7-1.9-4.7-4.2 2.1-4.2 4.7-4.2z" fill="currentColor"/>
      <circle cx="66" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="94" cy="8" r="1.5" fill="currentColor"/>
    </svg>
  </div>
</div>

${koerper}

</body>
</html>`;
}

/* --- Los ----------------------------------------------------------------- */

fs.mkdirSync(ziel, { recursive: true });
const gesetzt = [];

for (const band of BAENDE) {
  const pfad = path.join(quelle, band.datei);
  if (!fs.existsSync(pfad)) continue;
  // Die erste Überschrift steht schon auf dem Titelblatt.
  const markdown = fs.readFileSync(pfad, 'utf8').replace(/^# .+\n/, '');
  const name = band.datei.replace(/\.md$/, '.html');
  fs.writeFileSync(path.join(ziel, name), seite(band.titel, band.unter, nachHtml(markdown)));
  gesetzt.push(name);
}

console.log('');
console.log('  Druckfertig gesetzt nach docs/druck/:');
for (const n of gesetzt) console.log(`    ${n}`);
console.log('');
console.log('  Im Browser öffnen, dann Strg+P und „Als PDF sichern“.');
console.log('');
