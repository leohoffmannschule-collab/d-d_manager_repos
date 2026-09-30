/**
 * Das Buch setzen: aus der Gliederung und den Kapiteln eine einzige
 * HTML-Seite – Titelblatt, Inhaltsverzeichnis, Vorwort, Teile, Kapitel.
 *
 * Die eigentliche Arbeit steckt in drei Dingen:
 *
 *   1. **Eindeutige Anker.** Jedes Kapitel ist für sich ein Markdown-
 *      Dokument, und „Überblick“ kommt in einem Dutzend davon vor. Im Buch
 *      bekommt deshalb jede Überschrift eine Kennung mit Kapitelnummer
 *      davor (`k7-ueberblick`) – und zwar in reinem ASCII, weil das PDF
 *      die Kennungen als Sprungziele übernimmt (siehe seitenzahlen.mjs).
 *   2. **Verweise umbiegen.** Ein Verweis auf docs/SPIELER.md#wuerfeln
 *      zeigt im Buch auf das Kapitel, in dem SPIELER.md steht, und dort auf
 *      den Abschnitt. Ein Verweis auf eine Quelldatei (`../../backend/…`)
 *      bleibt als Text stehen – im Druck gibt es sie nicht.
 *   3. **Das Verzeichnis.** Es sammelt Teile, Kapitel und deren Abschnitte
 *      und trägt, sobald bekannt, die Seitenzahlen ein.
 */
import fs from 'node:fs';
import path from 'node:path';
import { githubAnker, nachHtml, schuetzen } from '../drucksatz/markdown.mjs';
import { ZIERAT } from '../drucksatz/seite.mjs';

/** Eine Überschrift als ASCII-Kennung: „Übersicht & Kampf“ → „uebersicht-kampf“. */
export function kennung(text) {
  return text
    .replace(/`|\*\*|\*|_/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/Ä/g, 'Ae').replace(/Ö/g, 'Oe').replace(/Ü/g, 'Ue')
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'abschnitt';
}

/** Die Überschriften eines Markdown-Textes, ohne die in Codeblöcken. */
function ueberschriften(markdown) {
  const liste = [];
  let imCode = false;
  for (const zeile of markdown.split('\n')) {
    if (zeile.trimStart().startsWith('```')) imCode = !imCode;
    if (imCode) continue;
    const m = zeile.match(/^(#{1,6}) (.+?)\s*#*\s*$/);
    if (m) liste.push({ stufe: m[1].length, text: m[2] });
  }
  return liste;
}

/**
 * Für ein Kapitel die Kennungen vorab ausrechnen: in der Reihenfolge der
 * Überschriften, doppelte mit -2, -3 … unterschieden. Dazu die Übersetzung
 * von GitHub-Ankern (so, wie sie in Verweisen stehen) in Buch-Anker.
 */
function kennungenFuer(nummer, markdown) {
  const vergeben = new Map();
  const github = new Map();
  const githubGezaehlt = new Map();
  const folge = ueberschriften(markdown).map(({ text }) => {
    const grund = `k${nummer}-${kennung(text)}`;
    const n = (vergeben.get(grund) ?? 0) + 1;
    vergeben.set(grund, n);
    const id = n === 1 ? grund : `${grund}-${n}`;
    const gh = githubAnker(text);
    const m = githubGezaehlt.get(gh) ?? 0;
    githubGezaehlt.set(gh, m + 1);
    github.set(m === 0 ? gh : `${gh}-${m}`, id);
    return id;
  });
  return { folge, github };
}

/**
 * Die Handbücher in docs/ bringen ihr eigenes kleines Inhaltsverzeichnis
 * mit („## Inhalt“ mit Verweisen auf die Abschnitte). Auf GitHub ist das
 * nützlich, im Buch stünde es doppelt – dort gibt es das große Verzeichnis.
 *
 * Zeile für Zeile statt mit einem regulären Ausdruck, weil Codeblöcke
 * zählen: Das Kapitel über den Bau des Buches zeigt die Gliederung als
 * Beispiel, samt einer Zeile „## Inhalt“. Ein Ausdruck, der Zäune nicht
 * kennt, schnitt dort das halbe Beispiel heraus.
 */
function ohneEigenesInhaltsverzeichnis(markdown) {
  const zeilen = markdown.split('\n');
  const behalten = [];
  let imCode = false;
  let imVerzeichnis = false;
  let schonWeg = false;
  for (const zeile of zeilen) {
    if (/^\s*(```|~~~)/.test(zeile)) imCode = !imCode;
    if (!imCode && imVerzeichnis && (zeile.startsWith('## ') || /^---\s*$/.test(zeile))) imVerzeichnis = false;
    if (!imCode && !schonWeg && /^## Inhalt(sverzeichnis)?\s*$/.test(zeile)) {
      imVerzeichnis = true;
      schonWeg = true;
    }
    if (!imVerzeichnis) behalten.push(zeile);
  }
  return behalten.join('\n');
}

/** Römische Zahlen für die Teile. */
const ROEMISCH = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * @param {object} args
 * @param {ReturnType<import('./gliederung.mjs').gliederung>} args.gliederung
 * @param {string} args.stilDatei      Name des Stilblatts neben der HTML-Datei (drucksatz/seite.mjs, `beigaben`)
 * @param {string} args.ausgabe        Pfad der HTML-Datei, die entsteht (für Bildpfade)
 * @param {string} args.unter          die Zeile unter dem Titel
 * @param {string} args.stand          „Stand: …“ auf dem Titelblatt
 * @param {Map<string, number>|null} args.seiten  Seiten je Anker aus dem ersten Durchgang
 * @returns {{ html: string, kapitelZahl: number }}
 */
export function setzeBuch({ gliederung, stilDatei, ausgabe, unter, stand, seiten }) {
  const ausgabeOrdner = path.dirname(ausgabe);
  const buchOrdner = path.dirname(gliederung.teile[0]?.kapitel[0]?.datei ?? ausgabeOrdner);

  // Erst alle Kapitel nummerieren und ihre Kennungen kennen – ein Verweis
  // darf auch nach vorn zeigen, auf ein Kapitel, das noch nicht gesetzt ist.
  const kapitel = [];
  gliederung.teile.forEach((teil, t) => {
    for (const k of teil.kapitel) {
      const nummer = kapitel.length + 1;
      const markdown = ohneEigenesInhaltsverzeichnis(fs.readFileSync(k.datei, 'utf8').replace(/\r\n/g, '\n'));
      kapitel.push({ ...k, nummer, teil: t, markdown, ...kennungenFuer(nummer, markdown) });
    }
  });
  const nachDatei = new Map(kapitel.map((k) => [k.datei, k]));
  const readme = path.join(buchOrdner, 'README.md');

  const seite = (id) => {
    const zahl = seiten?.get(id);
    return `<span class="seite">${zahl ?? '000'}</span>`;
  };

  /** Ein Verweis aus Kapitel `k` heraus, umgebogen für das Buch. */
  const verweisIn = (k) => (ziel) => {
    if (/^(https?:|mailto:)/.test(ziel)) return ziel;
    const [pfad, marke] = ziel.split('#');
    const zielKapitel = pfad ? nachDatei.get(path.resolve(path.dirname(k.datei), pfad)) : k;
    if (!zielKapitel) {
      if (pfad && path.resolve(path.dirname(k.datei), pfad) === readme) return '#verzeichnis';
      return null;
    }
    if (!marke) return `#k${zielKapitel.nummer}`;
    return `#${zielKapitel.github.get(marke) ?? `k${zielKapitel.nummer}`}`;
  };

  // --- Verzeichnis und Rumpf zugleich --------------------------------------
  const verzeichnis = [];
  const rumpf = [];

  gliederung.teile.forEach((teil, t) => {
    const teilId = `t${t + 1}`;
    const [nummer, ...name] = teil.titel.split('·').map((s) => s.trim());
    const teilName = name.length ? name.join(' · ') : nummer;
    const teilNummer = name.length ? nummer : `Teil ${ROEMISCH[t + 1]}`;
    verzeichnis.push(
      `<li class="v-teil"><a href="#${teilId}">${schuetzen(teilNummer)} · ${schuetzen(teilName)}<span class="fuellung"></span>${seite(teilId)}</a></li>`
    );
    rumpf.push(`<section class="teilblatt" id="${teilId}">
  <div class="teil-nummer">${schuetzen(teilNummer)}</div>
  <h1>${schuetzen(teilName)}</h1>
  <div class="teil-text">${nachHtml(teil.einleitung)}</div>
</section>`);

    for (const k of kapitel.filter((x) => x.teil === t)) {
      const nurKapitel = k.datei.includes(`${path.sep}referenz${path.sep}`);
      let naechste = 0;
      const eintraege = [];
      const html = nachHtml(k.markdown, {
        anker: () => k.folge[naechste++],
        verweis: verweisIn(k),
        bild: (pfad) => path.relative(ausgabeOrdner, path.resolve(path.dirname(k.datei), pfad)).split(path.sep).join('/'),
        ueberschrift: (stufe, text, id) => {
          if (stufe === 2 && !nurKapitel) eintraege.push({ id, text });
        },
      });
      const titel = ueberschriften(k.markdown)[0]?.text ?? k.titel;
      verzeichnis.push(
        `<li class="v-kapitel"><a href="#k${k.nummer}"><span class="nummer">${k.nummer}</span>${inlineText(titel)}<span class="fuellung"></span>${seite(`k${k.nummer}`)}</a></li>`
      );
      for (const e of eintraege) {
        verzeichnis.push(
          `<li class="v-abschnitt"><a href="#${e.id}">${inlineText(e.text)}<span class="fuellung"></span>${seite(e.id)}</a></li>`
        );
      }
      rumpf.push(`<section class="kapitel" id="k${k.nummer}">
<div class="kapitel-nummer">Kapitel ${k.nummer}</div>
${html}
</section>`);
    }
  });

  const vorwort = gliederung.vorwort
    ? `<section class="kapitel" id="vorwort">${nachHtml(`# Vorwort\n\n${gliederung.vorwort}`, {
        anker: (text) => `vorwort-${kennung(text)}`,
        verweis: (ziel) => {
          if (/^(https?:|mailto:)/.test(ziel)) return ziel;
          const k = nachDatei.get(path.resolve(buchOrdner, ziel.split('#')[0]));
          return k ? `#k${k.nummer}` : null;
        },
      })}</section>`
    : '';

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${schuetzen(gliederung.titel)}</title>
<link rel="stylesheet" href="${stilDatei}">
</head>
<body>

<section class="titelblatt">
  <div class="marke">Abenteuer-Almanach</div>
  <h1>${schuetzen(gliederung.titel)}</h1>
  <div class="unter">${schuetzen(unter)}</div>
  <div class="zierat">${ZIERAT}</div>
  <div class="stand">${schuetzen(stand)}</div>
</section>

<section class="verzeichnis" id="verzeichnis">
<h1>Inhalt</h1>
<ol>
<li class="v-kapitel"><a href="#vorwort"><span class="nummer"></span>Vorwort<span class="fuellung"></span>${seite('vorwort')}</a></li>
${verzeichnis.join('\n')}
</ol>
</section>

${vorwort}

${rumpf.join('\n\n')}

</body>
</html>`;
  return { html, kapitelZahl: kapitel.length };
}

/** Eine Überschrift für das Verzeichnis: Code und Betonung bleiben, Verweise werden Text. */
function inlineText(text) {
  return schuetzen(text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1');
}
