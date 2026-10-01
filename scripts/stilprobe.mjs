#!/usr/bin/env node
/**
 * Die Stilprobe: Steht Aussehen oder Verhalten irgendwo, wo es nicht hingehört?
 *
 *   npm run stilprobe
 *
 * Die Regel des Almanachs heißt: **Wie etwas aussieht, steht im Stilblatt;
 * was es tut, steht in einer Skriptdatei.** Das Markup beschreibt nur, *was*
 * da ist. Wo ein Wert erst im Browser feststeht (die Lage einer Figur, die
 * selbst gewählte Farbe eines Kontos), geht er als CSS-Variable in eine
 * Laufzeit-Regel (frontend/src/lib/laufstil.js) – im Markup steht dann nur
 * ein Klassenname.
 *
 * Geprüft wird:
 *
 *   1. Im JSX steht kein `style=` – auch nicht für eine einzelne Variable.
 *   2. Im JSX stehen keine Farben oder Strichstärken als SVG-Attribute mit
 *      CSS-Werten (`fill="var(--…)"`, `stroke="var(--…)"`) – auch das ist
 *      Aussehen und gehört ins Stilblatt.
 *   3. SVG steht nur in den Symbol-Dateien (components/icons/) – und im
 *      Lineal, das Geometrie zeichnet, die erst beim Ziehen entsteht.
 *   4. In HTML, das der Almanach selbst erzeugt (das mitgenommene Blatt,
 *      der Drucksatz, das Handbuch), steht kein `style="…"`, kein
 *      `on…="…"`, kein `<script>` und kein `<style>` – außer an der einen
 *      begründeten Stelle unten (AUSNAHMEN).
 *   5. In der Oberfläche steht kein roher Farbwert (`#9a2b22`) außerhalb der
 *      Stilblätter. Farben haben Namen – siehe stile/farben.css.
 *   6. Die index.html lädt ihre Skripte und Stilblätter, statt sie zu
 *      enthalten.
 *   7. Dieselbe Regel gilt für design/: Die Artboards dort sind von Hand
 *      bearbeitetes HTML, kein Bau-Ergebnis – aber genauso wenig ein Ort
 *      für style="…" (siehe design/README.md).
 *
 * Wie die Einfuhrprobe kommt sie ohne ein zusätzliches Paket aus.
 */
import fs from 'node:fs';
import path from 'node:path';
import { dateien, kurz, wurzel, zeileVon } from './gemeinsam/dateien.mjs';

/**
 * Ausnahmen, jede mit ihrem Grund. Eine Farbe ist hier kein Aussehen,
 * sondern ein *Wert*, den jemand auswählt und der gespeichert wird.
 */
const FARBEN_ALS_DATEN = new Map([
  ['frontend/src/components/tabletop/TokenPanel.jsx', 'die Farben, aus denen die Spielleitung für eine Figur wählt'],
]);

const maengel = [];

/**
 * Den Ausdruck in `style={…}` herausschneiden – mit Klammerzählung, weil
 * darin selbst geschweifte Klammern stehen (`style={{ '--x': px(a) }}`).
 */
function stilAusdruecke(text) {
  const funde = [];
  for (const treffer of text.matchAll(/\bstyle=\{/g)) {
    let tiefe = 1;
    let i = treffer.index + treffer[0].length;
    const anfang = i;
    while (i < text.length && tiefe > 0) {
      if (text[i] === '{') tiefe += 1;
      else if (text[i] === '}') tiefe -= 1;
      i += 1;
    }
    funde.push({ stelle: treffer.index, ausdruck: text.slice(anfang, i - 1) });
  }
  return funde;
}

/* --- 1. JSX: kein style ------------------------------------------------- */

const JSX = dateien('frontend/src', /\.jsx$/);

for (const datei of JSX) {
  const text = fs.readFileSync(datei, 'utf8');
  for (const { stelle } of stilAusdruecke(text)) {
    maengel.push(
      `${kurz(datei)}:${zeileVon(text, stelle)} – style im Markup; Werte gehen über <Laufwert> oder useLaufstil (lib/laufstil.js), Regeln ins Stilblatt`
    );
  }
}

/* --- 2. JSX: keine CSS-Werte in SVG-Attributen --------------------------- */

for (const datei of JSX) {
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/\b(fill|stroke|strokeWidth|strokeDasharray|color)=["{][^"}]*var\(/g)) {
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – ${treffer[1]} mit CSS-Wert im Markup; das gehört ins Stilblatt`);
  }
}

/* --- 3. SVG nur in den Symbol-Dateien ------------------------------------ */

/** Wo SVG außerhalb von components/icons/ stehen darf – mit Grund. */
const SVG_ERLAUBT = new Map([
  ['frontend/src/components/tabletop/brett/Lineal.jsx', 'zeichnet eine Linie, die erst beim Ziehen entsteht – Geometrie, kein Symbol'],
]);
for (const datei of JSX) {
  if (kurz(datei).startsWith('frontend/src/components/icons/') || SVG_ERLAUBT.has(kurz(datei))) continue;
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/<svg\b/g)) {
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – SVG mitten im Bauteil; Symbole stehen in components/icons/`);
  }
}

/* --- 4. Erzeugtes HTML: nichts eingebettet -------------------------------- */

/**
 * Die eine Stelle, an der eine erzeugte Seite ihr Stilblatt in sich trägt –
 * mit Grund. Geschrieben wird es trotzdem als .css-Dateien; eingesetzt erst
 * beim Bauen.
 */
const AUSNAHMEN = new Map([
  [
    'frontend/src/lib/blattAusfuhr.js|<style>',
    'das mitgenommene Blatt muss als eine einzige Datei ohne Netz und Server funktionieren (Stilblätter in lib/blatt/stil/)',
  ],
]);

const ERZEUGER = [
  path.join(wurzel, 'frontend', 'src', 'lib', 'blattAusfuhr.js'),
  ...dateien('frontend/src/lib/blatt'),
  path.join(wurzel, 'scripts', 'drucksatz.mjs'),
  ...dateien('scripts/drucksatz'),
  path.join(wurzel, 'scripts', 'handbuch.mjs'),
  ...dateien('scripts/handbuch'),
  path.join(wurzel, 'scripts', 'zeilenbuch.mjs'),
  ...dateien('scripts/zeilenbuch'),
];
for (const datei of ERZEUGER) {
  const text = fs.readFileSync(datei, 'utf8');
  const zeilen = text.split('\n');
  for (const treffer of text.matchAll(/<[a-z][^>]*\s(style|on[a-z]+)="|<style\b[^>]*>|<script\b(?![^>]*\bsrc=)[^>]*>/g)) {
    // Kommentare und reguläre Ausdrücke, die solche Stellen *suchen*, zählen nicht.
    const zeile = zeilen[zeileVon(text, treffer.index) - 1];
    if (/^\s*(\*|\/\/|\/\*)/.test(zeile) || /\.(match|test|matchAll|replace)\(/.test(zeile)) continue;
    const art = treffer[1] ? `${treffer[1]}="…"` : treffer[0].startsWith('<style') ? '<style>' : '<script>';
    if (AUSNAHMEN.has(`${kurz(datei)}|${art}`)) continue;
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – ${art} in erzeugtem HTML; es gehört in eine eigene Datei`);
  }
}

/* --- 5. Keine rohen Farbwerte in der Oberfläche --------------------------- */

for (const datei of dateien('frontend/src', /\.(jsx?|mjs)$/)) {
  if (FARBEN_ALS_DATEN.has(kurz(datei))) continue;
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?=['"\]\s;)])/g)) {
    // Ein Kommentar darf eine Farbe nennen – verwendet wird sie dort nicht.
    const zeile = text.split('\n')[zeileVon(text, treffer.index) - 1];
    if (/^\s*(\*|\/\/|\/\*)/.test(zeile)) continue;
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – roher Farbwert ${treffer[0]}; Farben haben Namen (stile/farben.css)`);
  }
}

/* --- 6. index.html: nur Verweise ------------------------------------------ */

{
  const datei = path.join(wurzel, 'frontend', 'index.html');
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/<script(?![^>]*\bsrc=)[^>]*>|<style\b|\son[a-z]+="|\sstyle="/g)) {
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – eingebetteter Stil oder eingebettetes Skript`);
  }
}

/* --- 7. design/: dieselbe Regel wie im Almanach selbst -------------------- */

for (const datei of dateien('design', /\.html$/)) {
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/<script(?![^>]*\bsrc=)[^>]*>|<style\b|\son[a-z]+="|\sstyle="/g)) {
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – eingebetteter Stil oder eingebettetes Skript`);
  }
}

/* --- Urteil --------------------------------------------------------------- */

console.log('');
if (maengel.length === 0) {
  console.log('  Stil steht im Stilblatt, Verhalten im Skript: nichts eingebettet.');
  console.log('');
  process.exit(0);
}
console.log(`  ${maengel.length} Stellen mit eingebettetem Stil oder Verhalten:`);
for (const mangel of maengel) console.log(`   – ${mangel}`);
console.log('');
process.exit(1);
