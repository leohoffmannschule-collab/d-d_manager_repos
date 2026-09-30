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
 * Bewusst ein eigener, kleiner Markdown-Leser statt einer Bibliothek – er
 * steht in drucksatz/markdown.mjs, das Gerüst der Seite in
 * drucksatz/seite.mjs. Beide teilt sich dieses Skript mit dem großen
 * Handbuch (scripts/handbuch.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nachHtml } from './drucksatz/markdown.mjs';
import { seite } from './drucksatz/seite.mjs';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Der Satzspiegel liegt als echte .css-Datei daneben und wird hier als Text
// hereingeholt. Node kennt kein `?raw` wie Vite – ein Dateilesen tut es
// genauso, und im Editor ist es trotzdem richtiges CSS.
//
// Der Erklärkopf der Datei wird dabei abgeschnitten: Er richtet sich an
// Mitarbeitende am Code und hat in einer Druckfassung nichts verloren.
const STIL = fs
  .readFileSync(path.join(wurzel, 'scripts', 'drucksatz.css'), 'utf8')
  .replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');
const quelle = path.join(wurzel, 'docs');
const ziel = path.join(quelle, 'druck');

/** Welche Dokumente gesetzt werden, und was aufs Titelblatt kommt. */
const BAENDE = [
  { datei: 'HANDBUCH.md', titel: 'Handbuch', unter: 'Die vollständige Beschreibung des Abenteuer-Almanachs' },
  { datei: 'SPIELLEITUNG.md', titel: 'Betriebsanleitung', unter: 'Für die Spielleitung' },
  { datei: 'SPIELER.md', titel: 'Betriebsanleitung', unter: 'Für die Runde' },
  { datei: 'EINRICHTUNG.md', titel: 'Einrichtungs-Handbuch', unter: 'Vom nackten Gerät bis zur ersten Runde' },
];

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

/* --- Los ----------------------------------------------------------------- */

fs.mkdirSync(ziel, { recursive: true });
const gesetzt = [];

for (const band of BAENDE) {
  const pfad = path.join(quelle, band.datei);
  if (!fs.existsSync(pfad)) continue;
  // Die erste Überschrift steht schon auf dem Titelblatt.
  const markdown = fs.readFileSync(pfad, 'utf8').replace(/^# .+\n/, '');
  const name = band.datei.replace(/\.md$/, '.html');
  const koerper = nachHtml(markdown, { verweis });
  fs.writeFileSync(path.join(ziel, name), seite({ titel: band.titel, unter: band.unter, koerper, stil: STIL }));
  gesetzt.push(name);
}

console.log('');
console.log('  Druckfertig gesetzt nach docs/druck/:');
for (const n of gesetzt) console.log(`    ${n}`);
console.log('');
console.log('  Im Browser öffnen, dann Strg+P und „Als PDF sichern“.');
console.log('');
