#!/usr/bin/env node
/**
 * Das Zeilenbuch bauen: der ganze Code des Almanachs, jede Zeile erklärt.
 *
 *   npm run zeilenbuch                   alles: erklären, setzen, drucken
 *   npm run zeilenbuch -- --ohne-pdf     nur die gesetzte HTML-Fassung
 *   npm run zeilenbuch -- --nur <pfad>   nur Dateien, deren Pfad so beginnt (zum Ausprobieren)
 *
 * Das Buch wird nicht geschrieben, sondern *erzeugt* – wie die
 * Verzeichnisse des Handbuchs: Es liest jede Datei, zerlegt sie mit dem
 * Parser ihrer Sprache und erklärt jede Zeile aus dem, was dort steht (und
 * aus den Kommentaren, die der Almanach über jede Funktion schreibt).
 * Ändert sich der Code, baut man das Buch neu, und es stimmt wieder.
 *
 * Die Teile:
 *   zeilenbuch/sammlung.mjs   welche Dateien, in welcher Ordnung
 *   zeilenbuch/projekt.mjs    der Index: was jede Funktion tut, wo sie steht
 *   zeilenbuch/erklaeren.mjs  der passende Erklärer je Sprache
 *   zeilenbuch/satz.mjs       das HTML, zeilenbuch/zeilenbuch.css sein Aussehen
 *
 * Gedruckt wird wie beim Handbuch mit einem Browser, der ohnehin da ist,
 * zweimal – der zweite Druck trägt die Seitenzahlen ins Verzeichnis ein.
 * Ergebnis:
 *
 *   docs/druck/zeilenbuch.html                 die gesetzte Fassung (nicht im Git)
 *   docs/Abenteuer-Almanach-Zeile-fuer-Zeile.pdf das Buch
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sammeln, sprache } from './zeilenbuch/sammlung.mjs';
import { Projekt } from './zeilenbuch/projekt.mjs';
import { erklaereDatei, zweck } from './zeilenbuch/erklaeren.mjs';
import { setzen } from './zeilenbuch/satz.mjs';
import { drucken, findeBrowser } from './handbuch/drucker.mjs';
import { seitenzahlen } from './handbuch/seitenzahlen.mjs';
import { beigaben } from './drucksatz/seite.mjs';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argumente = process.argv.slice(2);
const ohnePdf = argumente.includes('--ohne-pdf');
const nur = argumente.includes('--nur') ? argumente[argumente.indexOf('--nur') + 1] : null;

const HTML = path.join(wurzel, 'docs', 'druck', 'zeilenbuch.html');
const ENTWURF = path.join(wurzel, 'docs', 'druck', 'zeilenbuch-entwurf.pdf');
const PDF = path.join(wurzel, 'docs', nur ? 'druck/zeilenbuch-probe.pdf' : 'Abenteuer-Almanach-Zeile-fuer-Zeile.pdf');
const VORSPANN = path.join(wurzel, 'docs', 'zeilenbuch');

const sagen = (text = '') => console.log(text);
const kurz = (datei) => path.relative(wurzel, datei);

sagen('');
sagen('  Das Zeilenbuch wird gebaut.');

// 1. Welche Dateien – und der Index über alle (auch wenn nur ein Teil gesetzt wird).
const gliederung = sammeln(wurzel);
const alleDateien = gliederung.flatMap((t) => t.ordner.flatMap((o) => o.dateien));
const projekt = new Projekt(wurzel, alleDateien);

// 2. Jede Datei erklären.
let nummer = 0;
let zeilen = 0;
let codezeilen = 0;
let notbehelf = 0;
const teile = gliederung
  .map((teil) => ({
    ...teil,
    ordner: teil.ordner
      .map((o) => ({
        name: o.name,
        dateien: o.dateien
          .filter((d) => !nur || d.startsWith(nur))
          .map((d) => {
            const text = fs.readFileSync(path.join(wurzel, d), 'utf8').replace(/\r\n/g, '\n');
            const { blatt, notbehelf: n } = erklaereDatei(d, text, projekt);
            nummer += 1;
            zeilen += blatt.anzahl;
            codezeilen += blatt.zeilen.filter((z) => z.trim()).length;
            notbehelf += n;
            return { id: `d${nummer}`, pfad: d, sprache: sprache(d).name, zweck: zweck(d, text, projekt), blatt };
          }),
      }))
      .filter((o) => o.dateien.length),
  }))
  .filter((t) => t.ordner.length);
sagen(`  Erklärt: ${nummer} Dateien, ${zeilen.toLocaleString('de-DE')} Zeilen (${codezeilen.toLocaleString('de-DE')} mit Inhalt)`);
if (projekt.fehler.length) sagen(`  Achtung: ${projekt.fehler.length} Zeilen konnte der Erklärer nicht deuten – sie zeigen nur ihren Code.`);
if (notbehelf) sagen(`  Achtung: ${notbehelf} Zeilen ohne eigene Erklärung (Notbehelf).`);

// 3. Setzen.
const vorspann = ['vorwort.md', 'lesehilfe.md']
  .map((name) => path.join(VORSPANN, name))
  .filter((datei) => fs.existsSync(datei))
  .map((datei) => {
    const md = fs.readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
    const titel = /^#\s+(.+)$/m.exec(md)?.[1] ?? path.basename(datei, '.md');
    return { titel, markdown: md.replace(/^#\s+.+\n/, '') };
  });
const heute = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
const stil = fs.readFileSync(path.join(wurzel, 'scripts', 'zeilenbuch', 'zeilenbuch.css'), 'utf8').replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');
beigaben(path.dirname(HTML), 'zeilenbuch.css', stil);
const satz = (seiten) =>
  setzen({ teile, vorspann, stand: `Stand: ${heute}`, zahlen: { dateien: nummer, zeilen, codezeilen }, seiten, stilDatei: 'zeilenbuch.css' });
fs.writeFileSync(HTML, satz(null));
sagen(`  Gesetzt: ${kurz(HTML)}`);
if (ohnePdf) {
  sagen('');
  process.exit(0);
}

// 4. Drucken – zweimal, damit das Verzeichnis Seitenzahlen trägt.
const browser = findeBrowser();
if (!browser) {
  sagen('');
  sagen('  Kein Chrome, Chromium oder Edge gefunden – das PDF entsteht deshalb nicht von selbst.');
  sagen('  Die gesetzte Fassung im Browser öffnen und mit Strg+P als PDF sichern.');
  sagen('');
  process.exit(0);
}
sagen(`  Drucker: ${browser}`);
const entwurf = drucken(browser, HTML, ENTWURF, 45);
const { anker } = seitenzahlen(entwurf);
fs.writeFileSync(HTML, satz(anker));
const buch = drucken(browser, HTML, PDF, 45);
fs.rmSync(ENTWURF, { force: true });
const { seiten } = seitenzahlen(buch);
sagen(`  Gedruckt: ${kurz(PDF)} – ${seiten.toLocaleString('de-DE')} Seiten, ${(buch.length / 1024 / 1024).toFixed(1)} MB`);
sagen('');
