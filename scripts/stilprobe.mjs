#!/usr/bin/env node
/**
 * Die Stilprobe: Steht Aussehen oder Verhalten irgendwo, wo es nicht hingehört?
 *
 *   npm run stilprobe
 *
 * Die Regel des Almanachs heißt: **Wie etwas aussieht, steht im Stilblatt;
 * was es tut, steht in einer Skriptdatei.** Das JSX beschreibt nur, *was*
 * da ist. Wo ein Wert erst im Browser feststeht (die Lage einer Figur, die
 * selbst gewählte Farbe eines Kontos), übergibt es ihn als CSS-Variable –
 * die Regel, die ihn benutzt, steht trotzdem im Stilblatt (siehe
 * frontend/src/lib/stilwerte.js).
 *
 * Geprüft wird viererlei:
 *
 *   1. `style={…}` im JSX enthält nur CSS-Variablen (`'--x': …`), keine
 *      echten Eigenschaften wie `left` oder `backgroundColor`.
 *   2. In HTML, das der Almanach selbst erzeugt (das mitgenommene Blatt,
 *      der Drucksatz), steht kein `style="…"` und kein `onclick="…"`.
 *   3. In der Oberfläche steht kein roher Farbwert (`#9a2b22`) außerhalb der
 *      Stilblätter. Farben haben Namen – siehe stile/farben.css.
 *   4. Die index.html lädt ihre Skripte, statt sie zu enthalten.
 *
 * Wie die Einfuhrprobe kommt sie ohne ein zusätzliches Paket aus.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Ausnahmen, jede mit ihrem Grund. Eine Farbe ist hier kein Aussehen,
 * sondern ein *Wert*, den jemand auswählt und der gespeichert wird.
 */
const FARBEN_ALS_DATEN = new Map([
  ['frontend/src/components/tabletop/TokenPanel.jsx', 'die Farben, aus denen die Spielleitung für eine Figur wählt'],
]);

function dateien(ordner, muster) {
  const gefunden = [];
  const gehen = (verzeichnis) => {
    for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
      const pfad = path.join(verzeichnis, eintrag.name);
      if (eintrag.isDirectory()) gehen(pfad);
      else if (muster.test(eintrag.name)) gefunden.push(pfad);
    }
  };
  gehen(path.join(wurzel, ordner));
  return gefunden;
}

const zeileVon = (text, stelle) => text.slice(0, stelle).split('\n').length;
const kurz = (datei) => path.relative(wurzel, datei);
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

/* --- 1. JSX: nur CSS-Variablen -------------------------------------------- */

for (const datei of dateien('frontend/src', /\.jsx$/)) {
  const text = fs.readFileSync(datei, 'utf8');
  for (const { stelle, ausdruck } of stilAusdruecke(text)) {
    // Ein Schlüssel in einem Objekt steht direkt nach `{` oder `,`. Ein
    // Doppelpunkt nach `? undefined` ist ein Dreifachausdruck, kein Schlüssel.
    for (const schluessel of ausdruck.matchAll(/[{,]\s*(['"]?)([-\w$]+)\1\s*:/g)) {
      if (schluessel[2].startsWith('--')) continue;
      maengel.push(
        `${kurz(datei)}:${zeileVon(text, stelle)} – style mit „${schluessel[2]}“; die Regel gehört ins Stilblatt, hierher nur eine CSS-Variable`
      );
    }
  }
}

/* --- 2. Erzeugtes HTML: kein style="…", kein on…="…" ---------------------- */

const ERZEUGER = [
  ...dateien('frontend/src/lib', /\.js$/).filter((d) => /blatt/i.test(d)),
  path.join(wurzel, 'scripts', 'drucksatz.mjs'),
  ...(fs.existsSync(path.join(wurzel, 'scripts', 'buch')) ? dateien('scripts/buch', /\.mjs$/) : []),
];
for (const datei of ERZEUGER) {
  const text = fs.readFileSync(datei, 'utf8');
  for (const treffer of text.matchAll(/<[a-z][^>]*\s(style|on[a-z]+)="/g)) {
    maengel.push(`${kurz(datei)}:${zeileVon(text, treffer.index)} – ${treffer[1]}="…" in erzeugtem HTML`);
  }
}

/* --- 3. Keine rohen Farbwerte in der Oberfläche --------------------------- */

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

/* --- 4. index.html: nur verwiesene Skripte -------------------------------- */

{
  const datei = path.join(wurzel, 'frontend', 'index.html');
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
