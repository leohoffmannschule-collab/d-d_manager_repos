#!/usr/bin/env node
/**
 * Der Almanach ohne Docker – ein Befehl, überall.
 *
 *   npm start
 *
 * Auf dem Raspberry Pi ist Docker der bequemere Weg: einmal eingerichtet,
 * startet der Almanach danach von selbst mit. Auf einem Laptop – erst recht
 * auf einem, auf dem man nichts installieren darf – ist Docker keine Option.
 * Dieses Skript ist der zweite Weg und braucht nichts als Node.js:
 *
 *   1. Prüfen, ob dieses Node den Almanach tragen kann.
 *   2. Fehlende Abhängigkeiten nachinstallieren (nur beim ersten Mal).
 *   3. Die Oberfläche bauen – aber nur, wenn sich seither etwas geändert hat.
 *   4. Den Server starten und die Adressen nennen, unter denen er erreichbar ist.
 *
 * Schalter:
 *   --pruefen     nur berichten, was zu tun wäre; nichts tun
 *   --neu-bauen   die Oberfläche in jedem Fall neu bauen
 *   --ohne-bau    den Bau überspringen (schnellster Start nach einer Änderung
 *                 nur am Server)
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schalter = new Set(process.argv.slice(2));
const nurPruefen = schalter.has('--pruefen');
const neuBauen = schalter.has('--neu-bauen');
const ohneBau = schalter.has('--ohne-bau');

// Unter Windows heißt das npm aus dem Pfad `npm.cmd`; `npm` allein findet die
// Prozessverwaltung dort nicht. Node selbst heißt überall `node`.
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const sagen = (text = '') => console.log(text);

/* --- 1. Trägt dieses Node den Almanach? ---------------------------------- */

/**
 * Zwei Grenzen, und sie liegen nicht an derselben Stelle:
 *
 * - Ab Node 20 läuft der Server überhaupt (die Sprachmittel, die er nutzt).
 * - Ab Node 22.5 bringt Node SQLite selbst mit (`node:sqlite`). Darunter
 *   braucht es `better-sqlite3`, und das will kompiliert werden – unter
 *   Windows also Visual-Studio-Bauwerkzeuge. Genau das, was auf einem
 *   verwalteten Laptop niemand nachinstallieren darf.
 *
 * Deshalb ist 22.5 hier die empfohlene Grenze, nicht bloß eine Randnotiz.
 */
function nodePruefen() {
  const gross = Number(process.versions.node.split('.')[0]);
  if (gross < 20) {
    sagen('');
    sagen(`  Dieses Node ist zu alt: ${process.version}`);
    sagen('  Der Almanach braucht mindestens Node 20, empfohlen ist 22 oder neuer.');
    sagen('  Zu holen unter https://nodejs.org – die LTS-Fassung genügt.');
    sagen('');
    process.exit(1);
  }

  const require = createRequire(import.meta.url);
  let eingebaut = false;
  // Node kennzeichnet sein eingebautes SQLite noch als experimentell und
  // meldet das beim Laden. Wir laden es hier nur, um nachzusehen, ob es da
  // ist – diese Warnung gehört nicht in ein Startfenster.
  const meldung = process.emitWarning;
  process.emitWarning = (warnung, ...rest) => {
    const text = typeof warnung === 'string' ? warnung : (warnung?.message ?? '');
    if (text.includes('SQLite is an experimental feature')) return;
    return meldung.call(process, warnung, ...rest);
  };
  try {
    require('node:sqlite');
    eingebaut = true;
  } catch {
    eingebaut = false;
  } finally {
    process.emitWarning = meldung;
  }
  if (eingebaut) return { node: process.version, sqlite: 'node:sqlite' };

  const ersatz = path.join(wurzel, 'backend', 'node_modules', 'better-sqlite3');
  if (fs.existsSync(ersatz)) return { node: process.version, sqlite: 'better-sqlite3' };

  sagen('');
  sagen(`  Dieses Node (${process.version}) bringt SQLite noch nicht mit.`);
  sagen('  Ab Node 22.5 ist es eingebaut, dann braucht es nichts weiter.');
  sagen('');
  sagen('  Zwei Wege:');
  sagen('    a) Node 22 oder neuer holen (https://nodejs.org) – der einfache Weg.');
  sagen('    b) npm install better-sqlite3 --prefix backend');
  sagen('       Das kompiliert und verlangt Bauwerkzeuge; unter Windows die');
  sagen('       Visual-Studio-Build-Tools.');
  sagen('');
  if (!nurPruefen) process.exit(1);
  return { node: process.version, sqlite: 'fehlt' };
}

/* --- 2. Abhängigkeiten --------------------------------------------------- */

function fehlendeOrdner() {
  return ['backend', 'frontend'].filter((teil) => !fs.existsSync(path.join(wurzel, teil, 'node_modules')));
}

function installieren(teil, ohneOptionale = false) {
  sagen(`  Hole die Bausteine für ${teil} … (beim ersten Mal ein paar Minuten)`);
  // `--omit=optional` lässt better-sqlite3 weg. Das ist die Rückfallebene für
  // altes Node, und sie ist das einzige Stück am ganzen Almanach, das ein
  // fertig kompiliertes Programm nachlädt. Wer Node 22.5 hat, braucht sie
  // nicht – und auf einem verwalteten Rechner, der genau solche Dateien
  // sperrt, wäre sie das Erste, was klemmt.
  const befehle = ['install', '--prefix', teil, ...(ohneOptionale ? ['--omit=optional'] : [])];
  const lauf = spawnSync(NPM, befehle, { cwd: wurzel, stdio: 'inherit' });
  if (lauf.status !== 0) {
    sagen('');
    sagen(`  Das Nachinstallieren für ${teil} ist fehlgeschlagen.`);
    sagen('  Meist fehlt schlicht die Internetverbindung. Noch einmal versuchen:');
    sagen(`    npm install --prefix ${teil}`);
    sagen('');
    process.exit(lauf.status ?? 1);
  }
}

/* --- 3. Muss die Oberfläche neu gebaut werden? --------------------------- */

const NICHT_ANSEHEN = new Set(['node_modules', 'dist', '.git']);

/** Jüngste Änderung irgendwo unter `ordner` – ohne die Ordner, die selbst
 *  aus dem Bau entstehen. */
function juengsteAenderung(ordner) {
  let neuste = 0;
  const stapel = [ordner];
  while (stapel.length) {
    const aktuell = stapel.pop();
    let eintraege;
    try {
      eintraege = fs.readdirSync(aktuell, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const eintrag of eintraege) {
      if (NICHT_ANSEHEN.has(eintrag.name)) continue;
      const voll = path.join(aktuell, eintrag.name);
      if (eintrag.isDirectory()) {
        stapel.push(voll);
        continue;
      }
      try {
        const zeit = fs.statSync(voll).mtimeMs;
        if (zeit > neuste) neuste = zeit;
      } catch {
        /* verschwundene Datei: egal */
      }
    }
  }
  return neuste;
}

/**
 * Der Bau dauert auf einem Pi Minuten. Ihn bei jedem Start zu wiederholen,
 * obwohl sich nichts geändert hat, wäre Zeitverschwendung – also vergleichen
 * wir Zeitstempel: Ist irgendeine Quelldatei jünger als das ausgelieferte
 * index.html, ist der Bau veraltet.
 */
function bauNoetig() {
  if (neuBauen) return 'erzwungen';
  const fertig = path.join(wurzel, 'backend', 'public', 'index.html');
  if (!fs.existsSync(fertig)) return 'noch nie gebaut';
  const gebautAm = fs.statSync(fertig).mtimeMs;
  if (juengsteAenderung(path.join(wurzel, 'frontend')) > gebautAm) return 'Oberfläche hat sich geändert';
  return null;
}

function bauen() {
  sagen('  Baue die Oberfläche … (auf einem Pi dauert das ein paar Minuten)');
  const lauf = spawnSync(NPM, ['run', 'build'], { cwd: wurzel, stdio: 'inherit' });
  if (lauf.status !== 0) {
    sagen('');
    sagen('  Der Bau der Oberfläche ist fehlgeschlagen.');
    sagen('  Wenn kurz zuvor etwas nachinstalliert wurde, hilft oft:');
    sagen('    npm install --prefix frontend');
    sagen('');
    process.exit(lauf.status ?? 1);
  }
}

/* --- Los ----------------------------------------------------------------- */

const umgebung = nodePruefen();
const fehlt = fehlendeOrdner();
const grund = ohneBau ? null : bauNoetig();

if (nurPruefen) {
  sagen('');
  sagen('  Abenteuer-Almanach – Prüfung');
  sagen(`  Node           : ${umgebung.node}`);
  sagen(`  Datenbank      : ${umgebung.sqlite}`);
  sagen(`  Bausteine      : ${fehlt.length ? `fehlen für ${fehlt.join(', ')}` : 'vollständig'}`);
  sagen(`  Oberfläche     : ${ohneBau ? 'Bau übersprungen' : grund ? `Bau nötig (${grund})` : 'aktuell'}`);
  sagen(`  Datenordner    : ${process.env.DATA_DIR || path.join(wurzel, 'backend', 'data')}`);
  sagen(`  Port           : ${process.env.PORT || 3001}`);
  sagen('');
  process.exit(0);
}

if (fehlt.length) {
  sagen('');
  for (const teil of fehlt) installieren(teil, teil === 'backend' && umgebung.sqlite === 'node:sqlite');
}

if (grund) {
  sagen('');
  bauen();
}

// Der Server redet ab hier selbst: Er nennt beim Start die Adressen, unter
// denen er erreichbar ist. `stdio: 'inherit'` heißt, dass das ungefiltert im
// selben Fenster landet – Strg+C beendet beide zusammen.
const server = spawn(process.execPath, [path.join(wurzel, 'backend', 'src', 'server.js')], {
  cwd: path.join(wurzel, 'backend'),
  stdio: 'inherit',
  env: process.env,
});

for (const zeichen of ['SIGINT', 'SIGTERM']) {
  process.on(zeichen, () => server.kill(zeichen));
}
server.on('exit', (code, signal) => {
  if (signal) process.exit(0);
  process.exit(code ?? 0);
});
