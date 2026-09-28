#!/usr/bin/env node
/**
 * Die Einfuhrprobe: Wer benutzt etwas, das er nicht eingeführt hat?
 *
 *   npm run einfuhrprobe
 *
 * Beim Zerlegen großer Dateien in kleine passiert immer wieder dasselbe:
 * Eine Funktion wandert in eine neue Datei – und die Zeile `import { … }`
 * bleibt zurück. Der Bau merkt davon **nichts**: Für ihn ist ein unbekannter
 * Name einfach eine globale Variable, die es zur Laufzeit schon geben wird.
 * Auffallen tut es erst, wenn jemand die Seite öffnet und ein weißes Fenster
 * bekommt.
 *
 * Diese Probe schließt die Lücke, und zwar ohne ein zusätzliches Paket
 * (der Almanach soll mit dem auskommen, was er ohnehin braucht):
 *
 *   1. Sie sammelt aus allen Dateien, **was irgendwo ausgeführt wird** –
 *      jedes `export function`, `export const`, `export { … }`.
 *   2. Für jede Datei sammelt sie, was darin **eingeführt oder erklärt**
 *      wird: Einfuhren, Funktionen, Konstanten, Parameter, Zerlegungen.
 *   3. Gemeldet wird jeder Name, der **benutzt** wird, im Almanach
 *      ausgeführt wird – und in der Datei weder steht noch hereingeholt
 *      wurde.
 *
 * Das ist bewusst eng gefasst: Nur Namen, die es anderswo im Almanach
 * wirklich gibt, werden überhaupt betrachtet. Ein Tippfehler in einer
 * Variablen fällt hier nicht auf – eine vergessene Einfuhr dagegen immer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = ['frontend/src', 'backend/src', 'scripts', 'backend/scripts'];

/* --- Dateien einsammeln --------------------------------------------------- */

function dateien(ordner) {
  const gefunden = [];
  const gehen = (verzeichnis) => {
    for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
      const pfad = path.join(verzeichnis, eintrag.name);
      if (eintrag.isDirectory()) gehen(pfad);
      else if (/\.(js|jsx|mjs)$/.test(eintrag.name)) gefunden.push(pfad);
    }
  };
  gehen(path.join(wurzel, ordner));
  return gefunden;
}

/**
 * Kommentare und Zeichenketten entfernen.
 *
 * Ohne das hielte die Probe jedes erwähnte Wort in einem Kommentar für eine
 * Benutzung – und gerade dieser Almanach ist voller Kommentare, die Namen
 * nennen.
 */
function nurCode(text) {
  // Die Reihenfolge ist wichtig: erst die Anführungszeichen, dann die
  // Schrägstriche. Sonst reißt ein Gegenstrich in einer Zeichenkette –
  // etwa der Markdown-Zaun ``` in drucksatz.mjs – eine Spur quer durch
  // die halbe Datei, und alles dahinter gilt als Zeichenkette.
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
    .replace(/'(?:\\.|[^'\\\n])*'/g, ' ')
    .replace(/"(?:\\.|[^"\\\n])*"/g, ' ')
    .replace(/`(?:\\.|[^`\\])*`/g, ' ');
}

/* --- Was führt der Almanach irgendwo aus? --------------------------------- */

function ausgefuehrteNamen(alle) {
  const katalog = new Map();
  for (const datei of alle) {
    const code = nurCode(fs.readFileSync(datei, 'utf8'));
    const merken = (name) => {
      if (name && !katalog.has(name)) katalog.set(name, datei);
    };
    for (const m of code.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)) merken(m[1]);
    for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const teil of m[1].split(',')) merken(teil.trim().split(/\s+as\s+/).pop()?.trim());
    }
  }
  return katalog;
}

/* --- Was kennt eine einzelne Datei? --------------------------------------- */

function bekannteNamen(code) {
  const bekannt = new Set();
  const merken = (name) => name && bekannt.add(name.trim());

  // Einfuhren: default, * as, und die geschweiften Klammern.
  for (const m of code.matchAll(/import\s+(\w+)\s*(?:,|from)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*\*\s*as\s+(\w+)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*(?:\w+\s*,\s*)?\{([^}]*)\}/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/\s+as\s+/).pop());
  }

  // Eigene Erklärungen.
  for (const m of code.matchAll(/(?:^|[;{}\s])(?:function|class)\s+(\w+)/g)) merken(m[1]);
  for (const m of code.matchAll(/(?:const|let|var)\s+(\w+)/g)) merken(m[1]);

  // Zerlegungen: const { a, b: c } = …  und  const [a, b] = …
  for (const m of code.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }

  // Parameter – grob, aber für diesen Zweck genau genug: alles in den
  // Klammern einer Funktion oder vor einem Pfeil.
  for (const m of code.matchAll(/(?:function\s*\w*\s*|=>\s*|\(\s*)\(([^)]*)\)\s*(?:=>|\{)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/function\s*\w*\s*\(([^)]*)\)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/(\w+)\s*=>/g)) merken(m[1]);

  // Zerlegungen in Parametern: ({ szene, figuren: tokens }) => …
  // Sie sehen aus wie eine Benutzung, sind aber eine Erklärung.
  for (const m of code.matchAll(/\(\s*\{([^}]*)\}\s*(?:=[^)]*)?\)\s*(?:=>|\{)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }
  for (const m of code.matchAll(/function\s*\w*\s*\(\s*\{([^}]*)\}/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }

  return bekannt;
}

/**
 * Alle benutzten Namen.
 *
 * Nicht mitgezählt werden zwei Dinge, die nur *aussehen* wie eine
 * Benutzung und die sonst reihenweise Fehlalarm auslösten:
 *
 *   `a.name`   – ein Eigenschaftszugriff. Der Punkt davor genügt zur
 *                Unterscheidung.
 *   `name:`    – ein Schlüssel in einem Objekt (`{ umfang: () => … }`)
 *                oder eine Kurzschreibweise für eine Methode. Was hinter
 *                dem Doppelpunkt steht, wird dagegen sehr wohl gezählt.
 */
function benutzteNamen(code) {
  const benutzt = new Set();
  for (const m of code.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)\s*(:?)/g)) {
    if (m[3] === ':') continue;
    benutzt.add(m[2]);
  }
  return benutzt;
}

/* --- Der Durchgang -------------------------------------------------------- */

const alle = ORDNER.flatMap(dateien);
const katalog = ausgefuehrteNamen(alle);
const maengel = [];

for (const datei of alle) {
  const code = nurCode(fs.readFileSync(datei, 'utf8'));
  const bekannt = bekannteNamen(code);
  const kurz = path.relative(wurzel, datei);

  for (const name of benutzteNamen(code)) {
    if (!katalog.has(name)) continue;
    if (bekannt.has(name)) continue;
    // Die Datei, die den Namen selbst ausführt, kennt ihn natürlich.
    if (katalog.get(name) === datei) continue;
    maengel.push({ datei: kurz, name, her: path.relative(wurzel, katalog.get(name)) });
  }
}

console.log('');
if (maengel.length === 0) {
  console.log(`  Alle Einfuhren gehen auf: ${alle.length} Dateien geprüft.`);
  console.log('');
  process.exit(0);
}

console.log(`  ${maengel.length} benutzte Namen ohne Einfuhr:`);
for (const m of maengel) {
  console.log(`   – ${m.datei}: „${m.name}“  (ausgeführt in ${m.her})`);
}
console.log('');
process.exit(1);
