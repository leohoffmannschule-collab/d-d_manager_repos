#!/usr/bin/env node
/**
 * Die Kommentarprobe: Ist der Code so erklärt, wie es sich der Almanach
 * vorgenommen hat?
 *
 *   npm run kommentarprobe
 *
 * Kommentare veralten leiser als Code. Eine Funktion, die umzieht, meldet
 * sich beim Bau sofort; ein Kommentar, der auf ihren alten Ort zeigt,
 * schweigt – bis jemand ihm folgt und ins Leere läuft. Diese Probe fängt
 * dreierlei ab:
 *
 *   1. **Jede Datei hat einen Kopf.** Ganz oben (nach einer #!-Zeile) steht
 *      ein Blockkommentar, der sagt, wozu es die Datei gibt. Wer eine Datei
 *      öffnet, soll nicht erst den Code lesen müssen, um zu wissen, ob er
 *      hier richtig ist.
 *   2. **Jede Ausfuhr ist erklärt.** Direkt über jedem `export function`,
 *      `export const`, `export class` steht ein Kommentar. Was eine andere
 *      Datei benutzen darf, ist ein Versprechen – und ein Versprechen ohne
 *      Wortlaut hält niemand ein. (Die Standardausfuhr einer Datei ist durch
 *      den Kopf erklärt.)
 *   3. **Jeder genannte Pfad stimmt.** Nennt ein Kommentar eine Datei mit
 *      Ordner („siehe lib/rasten.js“), dann gibt es sie auch – vom Ort der
 *      Datei aus oder von einer der üblichen Wurzeln (frontend/src,
 *      backend/src, …).
 *
 * Wie die anderen Proben ohne zusätzliches Paket.
 */
import fs from 'node:fs';
import path from 'node:path';
import { dateien, kurz, wurzel, zeileVon } from './gemeinsam/dateien.mjs';

const QUELLEN = /\.(js|jsx|mjs|css)$/;
const ORDNER = ['frontend/src', 'frontend/public', 'backend/src', 'backend/scripts', 'scripts'];
const EINZELN = ['frontend/vite.config.js'];

/**
 * Von wo aus ein Pfad in einem Kommentar gemeint sein kann. Ein Kommentar in
 * der Oberfläche schreibt „lib/api.js“ und meint frontend/src/lib/api.js; im
 * Server heißt „routes/stash.js“ backend/src/routes/stash.js.
 */
const WURZELN = [
  '',
  'frontend',
  'frontend/src',
  'frontend/src/components',
  'frontend/src/lib',
  'frontend/src/pages',
  'backend',
  'backend/src',
  'backend/src/routes',
  'scripts',
  'docs',
];

const alle = [
  ...ORDNER.flatMap((ordner) => dateien(ordner, QUELLEN)),
  ...EINZELN.map((datei) => path.join(wurzel, datei)).filter((datei) => fs.existsSync(datei)),
];
const maengel = [];

/* --- 1. Der Kopf ---------------------------------------------------------- */

/** Beginnt die Datei (nach einer #!-Zeile und Leerraum) mit einem Blockkommentar? */
function hatKopf(text) {
  return /^(#![^\n]*\n)?\s*\/\*/.test(text);
}

/* --- 2. Erklärte Ausfuhren ------------------------------------------------ */

/**
 * Alle benannten Ausfuhren ohne Kommentar direkt darüber. Eine Leerzeile
 * dazwischen zählt als Lücke: Ein Kommentar, der durch eine Leerzeile
 * getrennt ist, gehört zu etwas anderem – meist zum Kopf der Datei.
 */
function unerklaerteAusfuhren(text) {
  const zeilen = text.split('\n');
  const funde = [];
  zeilen.forEach((zeile, i) => {
    const treffer = /^export\s+(?:async\s+)?(?:function\s*\*?\s*|const\s+|let\s+|class\s+)([\w$]+)/.exec(zeile);
    if (!treffer) return;
    const davor = (zeilen[i - 1] ?? '').trim();
    if (davor.endsWith('*/') || davor.startsWith('//')) return;
    funde.push({ name: treffer[1], zeile: i + 1 });
  });
  return funde;
}

/* --- 3. Genannte Pfade ---------------------------------------------------- */

/**
 * Pfade in Kommentaren: mindestens ein Ordner, eine bekannte Endung. Was in
 * Anführungszeichen steht, ist Code in einem Beispiel (`from './x.js'`) und
 * wird nicht geprüft; ebenso Muster mit Sternchen (`stil/*.css`).
 */
const PFAD = /(?<![\w/.:'"-])((?:\.\.?\/)*(?:[\w.-]+\/)+[\w.-]+\.(?:jsx|js|mjs|css|md|json|sh|yml|html))(?!\w)/g;

function falschePfade(datei, text) {
  const funde = [];
  for (const kommentar of text.matchAll(/\/\*[\s\S]*?\*\/|(?<![:'"\\])\/\/[^\n]*/g)) {
    for (const treffer of kommentar[0].matchAll(PFAD)) {
      const pfad = treffer[1];
      const moeglich = [
        path.resolve(path.dirname(datei), pfad),
        ...WURZELN.map((basis) => path.resolve(wurzel, basis, pfad)),
      ];
      if (moeglich.some((kandidat) => fs.existsSync(kandidat))) continue;
      funde.push({ pfad, zeile: zeileVon(text, kommentar.index + treffer.index) });
    }
  }
  return funde;
}

/* --- Der Durchgang -------------------------------------------------------- */

for (const datei of alle) {
  const text = fs.readFileSync(datei, 'utf8');
  if (!hatKopf(text)) maengel.push(`${kurz(datei)} – kein Kopfkommentar`);
  if (!datei.endsWith('.css')) {
    for (const { name, zeile } of unerklaerteAusfuhren(text)) {
      maengel.push(`${kurz(datei)}:${zeile} – Ausfuhr „${name}“ ohne Kommentar darüber`);
    }
  }
  for (const { pfad, zeile } of falschePfade(datei, text)) {
    maengel.push(`${kurz(datei)}:${zeile} – der Kommentar nennt „${pfad}“, das es nicht gibt`);
  }
}

console.log('');
if (maengel.length === 0) {
  console.log(`  Jede Datei erklärt sich: ${alle.length} Dateien geprüft.`);
  console.log('');
  process.exit(0);
}
console.log(`  ${maengel.length} Stellen, an denen die Erklärung fehlt oder nicht mehr stimmt:`);
for (const mangel of maengel) console.log(`   – ${mangel}`);
console.log('');
process.exit(1);
