/**
 * Verzeichnis: jede Einstellung, die der Almanach aus der Umgebung liest –
 * mit Vorgabe, Fundort und dem Kommentar dazu.
 *
 * Zwei Quellen: die .env.example im Wurzelverzeichnis (das, was man
 * einstellen *soll*, mit Erklärung für Nicht-Programmierer) und jede Stelle
 * `process.env.NAME` im Code (das, was tatsächlich gelesen wird). Eine
 * Einstellung, die nur im Code steht, ist für Fortgeschrittene; eine, die
 * nur in der Beispieldatei steht, wäre ein Fehler.
 */
import path from 'node:path';
import fs from 'node:fs';
import { dateienUnter, kapitelKopf, kommentarVor, lesen, relativ } from './quelle.mjs';

/** Umgebungsvariablen, die nicht der Almanach erfindet, sondern das Betriebssystem. */
const SYSTEM = new Set(['HOME', 'USERPROFILE', 'LOCALAPPDATA', 'PROGRAMFILES', 'PATH']);

/** Die Blöcke der .env.example: Name → Kommentar darüber und Beispielwert. */
function beispiele(wurzel) {
  const datei = path.join(wurzel, '.env.example');
  if (!fs.existsSync(datei)) return new Map();
  const zeilen = lesen(datei).split('\n');
  const karte = new Map();
  let kommentar = [];
  let letzter = '';
  for (const zeile of zeilen) {
    if (zeile.startsWith('#')) {
      const text = zeile.replace(/^#\s?/, '');
      if (text.startsWith('---')) kommentar = [text.replace(/-+/g, '').trim() + '.'];
      else kommentar.push(text);
      continue;
    }
    const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(zeile);
    if (m) {
      // Mehrere Namen direkt untereinander teilen sich den Kommentar darüber.
      const text = kommentar.join('\n').trim() || letzter;
      karte.set(m[1], { text, beispiel: m[2] });
      letzter = text;
      kommentar = [];
    }
  }
  return karte;
}

/** Jede Stelle im Code, die eine Umgebungsvariable liest. */
function stellen(wurzel) {
  const dateien = [
    ...dateienUnter(path.join(wurzel, 'backend', 'src'), /\.js$/),
    ...dateienUnter(path.join(wurzel, 'backend', 'scripts'), /\.(js|mjs)$/),
    // Ohne die Handbuch-Werkzeuge selbst: Sie nennen `process.env` in ihren
    // Erklärungen, ohne etwas zu lesen.
    ...dateienUnter(path.join(wurzel, 'scripts'), /\.mjs$/).filter((d) => !d.includes(`${path.sep}handbuch${path.sep}referenz`)),
    path.join(wurzel, 'frontend', 'vite.config.js'),
  ];
  const funde = [];
  for (const datei of dateien) {
    const text = lesen(datei);
    const zeilen = text.split('\n');
    zeilen.forEach((zeile, i) => {
      for (const m of zeile.matchAll(/process\.env(?:\.([A-Z_][A-Z0-9_]*)|\['([A-Z_()0-9]+)'\])/g)) {
        const name = m[1] ?? m[2];
        if (SYSTEM.has(name) || name.startsWith('PROGRAMFILES')) continue;
        const vorgabe = /(?:\|\||\?\?)\s*('[^']*'|"[^"]*"|\d+)/.exec(zeile.slice(m.index))?.[1];
        funde.push({ name, datei: relativ(wurzel, datei), zeile: i + 1, vorgabe, text: kommentarVor(zeilen, i) });
      }
    });
  }
  return funde;
}

/** Das Kapitel. */
export const EINSTELLUNGEN = {
  datei: '86-einstellungen.md',
  erzeugen(wurzel) {
    const beispiel = beispiele(wurzel);
    const code = stellen(wurzel);
    const namen = [...new Set([...beispiel.keys(), ...code.map((c) => c.name)])].sort();
    const tabelle = [
      '| Name | Vorgabe | in .env.example | gelesen in |',
      '|---|---|---|---|',
      ...namen.map((name) => {
        const orte = code.filter((c) => c.name === name);
        const vorgabe = orte.find((o) => o.vorgabe)?.vorgabe;
        return `| \`${name}\` | ${vorgabe ? `\`${vorgabe}\`` : '–'} | ${beispiel.has(name) ? 'ja' : ''} | ${[...new Set(orte.map((o) => o.datei))].join(', ') || '–'} |`;
      }),
    ].join('\n');
    const einzeln = namen
      .map((name) => {
        const teile = [`### ${name}`, ''];
        const b = beispiel.get(name);
        if (b?.text) teile.push(b.text, '');
        for (const o of code.filter((c) => c.name === name)) {
          teile.push(`*${o.datei}, Zeile ${o.zeile}*${o.vorgabe ? ` – ohne Angabe: \`${o.vorgabe}\`` : ''}`, '');
          if (o.text && o.text !== b?.text) teile.push(o.text.replace(/^(\s*)–\s/gm, '$1- '), '');
        }
        return teile.join('\n');
      })
      .join('\n');
    return (
      kapitelKopf(
        'Verzeichnis der Einstellungen',
        `Der Almanach läuft ohne eine einzige Einstellung. Was sich einstellen lässt, steht in einer Datei \`.env\` im Wurzelverzeichnis (als Vorlage liegt \`.env.example\` daneben) oder wird beim Start mitgegeben (\`PORT=3002 npm start\`). Was schon in der Umgebung steht, hat Vorrang vor der Datei.

Die .env gehört nicht ins Git – sie ist in .gitignore eingetragen, denn darin stehen Kennwörter wie das Tunnel-Token.`
      ) +
      `\n## Übersicht\n\n${tabelle}\n\n## Im Einzelnen\n\n${einzeln}`
    );
  },
};
