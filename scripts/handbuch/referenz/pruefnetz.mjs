/**
 * Verzeichnis: das Prüfnetz – jede Probe, jedes Kapitel des Vertrags, und
 * wie viele Prüfungen darin stehen.
 *
 * Die Erklärungen sind die Köpfe der Skripte selbst; gezählt wird, wie oft
 * darin `pruefe(`, `gleich(` oder `mangel(` gerufen wird – eine grobe, aber
 * ehrliche Zahl dafür, wie dicht das Netz an welcher Stelle ist. (Die Zahl,
 * die eine Probe beim Laufen meldet, kann höher sein: Eine Prüfung in einer
 * Schleife zählt dort einmal je Durchgang.)
 */
import path from 'node:path';
import { alsMarkdown, dateienUnter, kapitelKopf, kopfkommentar, lesen, relativ } from './quelle.mjs';

/** Wie viele Prüfstellen eine Datei hat. */
const pruefstellen = (text) => (text.match(/\b(pruefe|gleich|mangel)\(/g) ?? []).length;

/** Die Proben, in der Reihenfolge von `npm test`. */
const PROBEN = [
  'einfuhrprobe.mjs',
  'stilprobe.mjs',
  'kommentarprobe.mjs',
  'blattprobe.mjs',
  'klangprobe.mjs',
  'vertrag.mjs',
];

/** Das Kapitel. */
export const PRUEFNETZ = {
  datei: '90-pruefnetz.md',
  erzeugen(wurzel) {
    const teile = [];
    for (const name of PROBEN) {
      const datei = path.join(wurzel, 'scripts', name);
      const text = lesen(datei);
      teile.push(`## ${name.replace(/\.mjs$/, '')}`, '', `*${relativ(wurzel, datei)} · npm run ${name.replace(/\.mjs$/, '')}*`, '', alsMarkdown(kopfkommentar(text)), '');
    }

    const kapitel = dateienUnter(path.join(wurzel, 'scripts', 'vertrag'), /^\d.*\.mjs$/);
    const tabelle = [
      '| Kapitel | Prüfstellen | worum es geht |',
      '|---|---|---|',
      ...kapitel.map((d) => {
        const text = lesen(d);
        const kopf = kopfkommentar(text).split(/\n\s*\n/)[0].replace(/\s+/g, ' ');
        return `| ${path.basename(d, '.mjs')} | ${pruefstellen(text)} | ${kopf.replace(/\|/g, '/')} |`;
      }),
    ].join('\n');
    const einzeln = kapitel
      .map((d) => `### ${path.basename(d, '.mjs')}\n\n${alsMarkdown(kopfkommentar(lesen(d)))}`)
      .join('\n\n');

    return (
      kapitelKopf(
        'Das Prüfnetz',
        `\`npm test\` lässt der Reihe nach laufen: die Prüfregeln (oxlint), drei Proben, die den Code lesen (Einfuhren, Stil, Kommentare), zwei, die rechnen (Blatt, Klang), und den Vertrag, der einen eigenen Almanach startet und eine ganze Runde gegen die Schnittstelle spielt. Keine davon braucht ein zusätzliches Paket.

Wie man mit dem Netz arbeitet – wann welche Probe anschlägt und was dann zu tun ist –, steht im Kapitel über die Entwicklung. Hier stehen die Proben selbst, mit dem, was ihr Kopf über sie sagt.`
      ) +
      '\n' +
      teile.join('\n') +
      `\n## Die Kapitel des Vertrags\n\nDer Vertrag spielt einen Abend in ${kapitel.length} Kapiteln, jedes baut auf dem vorigen auf (scripts/vertrag/).\n\n${tabelle}\n\n${einzeln}\n`
    );
  },
};
