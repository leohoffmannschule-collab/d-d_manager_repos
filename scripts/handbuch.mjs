#!/usr/bin/env node
/**
 * Das Handbuch bauen – als Markdown zum Lesen auf GitHub und als PDF.
 *
 *   npm run handbuch                 alles: Verzeichnisse, HTML, PDF
 *   npm run handbuch -- --ohne-pdf   nur Verzeichnisse und HTML
 *
 * Das Buch besteht aus den Kapiteln in docs/buch/ (von Hand geschrieben),
 * den Handbüchern in docs/ (SPIELER.md, EINRICHTUNG.md …) und den
 * Verzeichnissen in docs/buch/referenz/, die dieses Skript bei jedem Lauf
 * *aus dem Code* neu schreibt: Dateien, Wege der Schnittstelle, Tabellen,
 * Live-Ereignisse, Einstellungen, Befehle, Vorlagen. Was dort steht, kann
 * deshalb nicht veralten – es ist der Code, nur lesbar gesetzt.
 *
 * Die Reihenfolge des Buches steht in docs/buch/README.md, dem
 * Inhaltsverzeichnis, das man auf GitHub anklickt (siehe
 * handbuch/gliederung.mjs).
 *
 * Das PDF entsteht mit einem Browser, der ohnehin auf dem Rechner liegt
 * (handbuch/drucker.mjs) – zweimal: Der erste Druck legt die Seiten fest,
 * der zweite trägt die Seitenzahlen ins Verzeichnis ein
 * (handbuch/seitenzahlen.mjs). Ergebnis:
 *
 *   docs/druck/handbuch.html              die gesetzte Fassung (nicht im Git)
 *   docs/Abenteuer-Almanach-Handbuch.pdf  das Buch
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gliederung } from './handbuch/gliederung.mjs';
import { setzeBuch } from './handbuch/satz.mjs';
import { drucken, findeBrowser } from './handbuch/drucker.mjs';
import { seitenzahlen } from './handbuch/seitenzahlen.mjs';
import { schreibeVerzeichnisse } from './handbuch/referenz.mjs';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ohnePdf = process.argv.includes('--ohne-pdf');

const README = path.join(wurzel, 'docs', 'buch', 'README.md');
const HTML = path.join(wurzel, 'docs', 'druck', 'handbuch.html');
const ENTWURF = path.join(wurzel, 'docs', 'druck', 'handbuch-entwurf.pdf');
const PDF = path.join(wurzel, 'docs', 'Abenteuer-Almanach-Handbuch.pdf');

const sagen = (text = '') => console.log(text);
const kurz = (datei) => path.relative(wurzel, datei);

// Das Stilblatt ohne seinen Erklärkopf – der richtet sich an Mitarbeitende
// am Code, nicht an Leserinnen des Buches.
const STIL = fs
  .readFileSync(path.join(wurzel, 'scripts', 'handbuch', 'buch.css'), 'utf8')
  .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');

const paket = JSON.parse(fs.readFileSync(path.join(wurzel, 'package.json'), 'utf8'));
const heute = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

sagen('');
sagen('  Das Handbuch wird gebaut.');

// 1. Die Verzeichnisse aus dem Code.
const geschrieben = await schreibeVerzeichnisse(wurzel);
sagen(`  Verzeichnisse aus dem Code: ${geschrieben.length} Kapitel in docs/buch/referenz/`);

// 2. Setzen – erst ohne Seitenzahlen.
const plan = gliederung(README);
const fehlt = plan.teile.flatMap((t) => t.kapitel).filter((k) => !fs.existsSync(k.datei));
if (fehlt.length) {
  for (const k of fehlt) sagen(`  Fehlt: ${kurz(k.datei)} („${k.titel}“)`);
  process.exit(1);
}
const setzen = (seiten) =>
  setzeBuch({
    gliederung: plan,
    stil: STIL,
    ausgabe: HTML,
    unter: 'Die vollständige Beschreibung – für die Runde, die Spielleitung und alle, die am Code arbeiten',
    stand: `Stand: ${heute} · Fassung ${paket.version}`,
    seiten,
  });

fs.mkdirSync(path.dirname(HTML), { recursive: true });
const erster = setzen(null);
fs.writeFileSync(HTML, erster.html);
sagen(`  Gesetzt: ${kurz(HTML)} (${erster.kapitelZahl} Kapitel)`);

if (ohnePdf) {
  sagen('');
  process.exit(0);
}

// 3. Drucken – zweimal, damit das Verzeichnis Seitenzahlen trägt.
const browser = findeBrowser();
if (!browser) {
  sagen('');
  sagen('  Kein Chrome, Chromium oder Edge gefunden – das PDF entsteht deshalb nicht');
  sagen('  von selbst. Die gesetzte Fassung im Browser öffnen, dann Strg+P und');
  sagen('  „Als PDF sichern“. (Oder den Browser angeben: CHROME_PFAD=… npm run handbuch)');
  sagen('');
  process.exit(0);
}
sagen(`  Drucker: ${browser}`);

const entwurf = drucken(browser, HTML, ENTWURF);
const { anker } = seitenzahlen(entwurf);
fs.writeFileSync(HTML, setzen(anker).html);
const buch = drucken(browser, HTML, PDF);
fs.rmSync(ENTWURF, { force: true });

const { seiten, anker: nachher } = seitenzahlen(buch);
const verschoben = [...anker].filter(([id, s]) => nachher.get(id) !== s).length;
sagen(`  Gedruckt: ${kurz(PDF)} – ${seiten} Seiten, ${(buch.length / 1024 / 1024).toFixed(1)} MB`);
if (verschoben) sagen(`  Achtung: ${verschoben} Anker sind im zweiten Druck verrutscht; noch einmal bauen.`);
sagen('');
