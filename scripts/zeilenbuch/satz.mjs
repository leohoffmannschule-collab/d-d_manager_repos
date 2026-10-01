/**
 * Das Zeilenbuch setzen: aus den erklärten Dateien ein HTML-Dokument, das
 * der Browser zum PDF druckt.
 *
 * Aufbau: Titelblatt, Inhaltsverzeichnis, Vorwort und Lesehilfe (aus
 * docs/zeilenbuch/), dann je Teil ein Teilblatt und je Datei ein Abschnitt
 * mit einer Tabelle aus zwei Spalten – links der Code mit Zeilennummern,
 * rechts die Erklärung. Ein Kommentarblock steht als *eine* Reihe da, weil
 * man ihn als Ganzes liest; jede andere Zeile hat ihre eigene.
 *
 * Verweise auf andere Zeilen („bis Zeile 17“) werden zu Sprungmarken im
 * PDF. Die Seitenzahlen im Verzeichnis trägt der zweite Druck ein (siehe
 * scripts/handbuch/seitenzahlen.mjs) – deshalb nimmt `setzen` die Seiten
 * des ersten Drucks entgegen.
 */
import { schuetzen, nachHtml } from '../drucksatz/markdown.mjs';
import { ZIERAT } from '../drucksatz/seite.mjs';
import { CODE_AUF, CODE_ZU, ZEILE_AUF, ZEILE_ZU, zahl } from './text.mjs';

const ROEMISCH = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/**
 * Eine Erklärung als HTML: Code-Stellen werden <code>, Zeilenverweise
 * Sprungmarken. Außerhalb der Code-Stellen gilt auch `so etwas` als Code –
 * so schreiben es die Wörterbücher und die Kommentare des Almanachs.
 */
function erklaerungHtml(text, dateiId, verwiesen) {
  return schuetzen(text)
    .split(new RegExp(`(${CODE_AUF}[\\s\\S]*?${CODE_ZU})`))
    .map((stueck) => (stueck.startsWith(CODE_AUF) ? `<code>${stueck.slice(1, -1)}</code>` : stueck.replace(/`([^`\n]+)`/g, '<code>$1</code>')))
    .join('')
    .replace(new RegExp(`${ZEILE_AUF}(\\d+)${ZEILE_ZU}`, 'g'), (_, n) => {
      verwiesen.add(Number(n));
      return `<a href="#${dateiId}-z${n}">Zeile ${n}</a>`;
    });
}

/** Eine Zeile Code als HTML: Tabulatoren zu Leerzeichen, alles geschützt. */
const codeHtml = (zeile) => schuetzen(zeile.replace(/\t/g, '  '));

/** Die Seitenzahl eines Ankers – im ersten Druck ein Platzhalter gleicher Breite. */
const seitenzahl = (seiten, id) => `<span class="seite">${seiten?.get(id) ?? '0000'}</span>`;

/**
 * Eine Datei als Abschnitt des Buches.
 *
 * Die Tabelle trägt `aria-hidden`: Chromium legt sonst für jedes Element
 * einer jeden Zeile einen Eintrag in der Struktur des PDF an (für
 * Vorleseprogramme) – bei 40.000 Zeilen eine halbe Million Einträge, die
 * das Buch auf das Dreifache aufblähen. Text bleibt Text: Er lässt sich
 * weiter suchen, markieren und kopieren, und die Lesezeichen am Rand
 * entstehen wie bisher aus den Überschriften.
 *
 * @param {object} d  { id, pfad, sprache, zweck, blatt }
 */
function dateiAbschnitt(d) {
  const verwiesen = new Set();
  const reihen = d.blatt.abschnitte().map((a) => {
    if (a.leer) return { a, html: '' };
    const teile = a.teile.map((t) => `<p class="${t.art === 'hinweis' ? 'h' : 't'}">${erklaerungHtml(t.text, d.id, verwiesen)}</p>`);
    return { a, html: teile.join('') };
  });
  const zeilenHtml = (von, bis) => {
    const raus = [];
    for (let nr = von; nr <= bis; nr += 1) {
      const id = verwiesen.has(nr) ? ` id="${d.id}-z${nr}"` : '';
      raus.push(`<div class="z"${id}><span class="nr">${nr}</span><span class="q">${codeHtml(d.blatt.text(nr))}</span></div>`);
    }
    return raus.join('');
  };
  const rumpf = reihen
    .map(({ a, html }) => {
      const art = a.leer ? 'leer' : a.bis > a.von ? 'gruppe' : 'zeile';
      return `<tr class="${art}"><td class="c">${zeilenHtml(a.von, a.bis)}</td><td class="e">${html}</td></tr>`;
    })
    .join('\n');
  return `<section class="datei" id="${d.id}">
<h3 class="datei-name"><span class="pfad">${schuetzen(d.pfad)}</span></h3>
<p class="datei-angaben">${schuetzen(d.sprache)} · ${zahl(d.blatt.anzahl)} Zeilen${d.zweck ? ` · <span class="zweck">${schuetzen(d.zweck)}</span>` : ''}</p>
<table class="zeilen" aria-hidden="true">
<colgroup><col class="sp-c"><col class="sp-e"></colgroup>
<thead><tr><th>Code</th><th>Erklärung</th></tr></thead>
<tbody>
${rumpf}
</tbody>
</table>
</section>`;
}

/**
 * Das ganze Buch.
 *
 * @param {object} args
 * @param {Array} args.teile        die Teile aus sammlung.mjs, jede Datei schon erklärt:
 *                                  `{ titel, text, ordner: [{ name, dateien: [{ id, pfad, sprache, zweck, blatt }] }] }`
 * @param {Array<{ titel: string, markdown: string }>} args.vorspann  Vorwort und Lesehilfe
 * @param {string} args.stand       „Stand: …“
 * @param {object} args.zahlen      { dateien, zeilen, codezeilen, notbehelf }
 * @param {Map<string, number>|null} args.seiten  Seiten je Anker aus dem ersten Druck
 * @param {string} args.stilDatei   das Stilblatt neben der HTML-Datei
 */
export function setzen({ teile, vorspann, stand, zahlen, seiten, stilDatei }) {
  const verzeichnis = [];
  const rumpf = [];

  vorspann.forEach((v, i) => {
    const id = `v${i + 1}`;
    verzeichnis.push(`<li class="v-vor"><a href="#${id}">${schuetzen(v.titel)}<span class="fuellung"></span>${seitenzahl(seiten, id)}</a></li>`);
    let n = 0;
    rumpf.push(`<section class="vorspann" id="${id}"><h1>${schuetzen(v.titel)}</h1>\n${nachHtml(v.markdown, { anker: () => `${id}-${(n += 1)}` })}</section>`);
  });

  let ordnerNr = 0;
  teile.forEach((teil, t) => {
    const teilId = `t${t + 1}`;
    verzeichnis.push(`<li class="v-teil"><a href="#${teilId}">Teil ${ROEMISCH[t + 1]} · ${schuetzen(teil.titel)}<span class="fuellung"></span>${seitenzahl(seiten, teilId)}</a></li>`);
    const dateiZahl = teil.ordner.reduce((s, o) => s + o.dateien.length, 0);
    const zeilenZahl = teil.ordner.reduce((s, o) => s + o.dateien.reduce((x, d) => x + d.blatt.anzahl, 0), 0);
    rumpf.push(`<section class="teilblatt" id="${teilId}">
  <div class="teil-nummer">Teil ${ROEMISCH[t + 1]}</div>
  <h1>${schuetzen(teil.titel)}</h1>
  <p class="teil-text">${schuetzen(teil.text)}</p>
  <p class="teil-zahlen">${zahl(dateiZahl)} Dateien · ${zahl(zeilenZahl)} Zeilen</p>
</section>`);
    for (const ordner of teil.ordner) {
      ordnerNr += 1;
      const oId = `o${ordnerNr}`;
      verzeichnis.push(`<li class="v-ordner"><a href="#${oId}">${schuetzen(ordner.name === '.' ? '(Wurzelordner)' : ordner.name + '/')}<span class="fuellung"></span>${seitenzahl(seiten, oId)}</a></li>`);
      verzeichnis.push(
        `<li class="v-dateien">${ordner.dateien
          .map((d) => `<a href="#${d.id}">${schuetzen(d.pfad.split('/').pop())}&#8239;<span class="seite-klein">${seiten?.get(d.id) ?? '0000'}</span></a>`)
          .join(' · ')}</li>`
      );
      rumpf.push(`<h2 class="ordner" id="${oId}">${schuetzen(ordner.name === '.' ? 'Wurzelordner' : ordner.name + '/')}</h2>`);
      for (const d of ordner.dateien) rumpf.push(dateiAbschnitt(d));
    }
  });

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Zeile für Zeile – Abenteuer-Almanach</title>
<link rel="stylesheet" href="${stilDatei}">
</head>
<body>

<div class="titelblatt">
  <div class="marke">Abenteuer-Almanach</div>
  <h1>Zeile für Zeile</h1>
  <div class="unter">Der ganze Code des Almanachs – jede einzelne Zeile erklärt</div>
  <div class="zierat">${ZIERAT}</div>
  <div class="stand">${schuetzen(stand)}</div>
  <div class="stand">${zahl(zahlen.dateien)} Dateien · ${zahl(zahlen.zeilen)} Zeilen, davon ${zahl(zahlen.codezeilen)} mit Inhalt</div>
</div>

<section class="verzeichnis" id="verzeichnis">
<h1>Inhalt</h1>
<ol>
${verzeichnis.join('\n')}
</ol>
</section>

${rumpf.join('\n\n')}

</body>
</html>`;
}
