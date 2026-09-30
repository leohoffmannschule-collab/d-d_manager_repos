/**
 * Verzeichnis: jeder `npm run …`-Befehl des Almanachs – was er aufruft und
 * was er tut.
 *
 * Die Befehle stehen in den drei package.json (Wurzel, backend, frontend).
 * Was ein Befehl *tut*, steht im Kopf des Skripts, das er startet – von dort
 * wird der erste Absatz übernommen. Für die Befehle, die nur andere Befehle
 * verketten, steht die Erklärung hier.
 */
import fs from 'node:fs';
import path from 'node:path';
import { kapitelKopf, kopfkommentar, lesen } from './quelle.mjs';

/** Erklärungen für Befehle, hinter denen kein eigenes Skript steht. */
const ZUSAMMENGESETZT = {
  setup: 'Holt die Pakete für Server und Oberfläche (`npm install` in beiden Ordnern). `npm start` erledigt das beim ersten Mal von selbst.',
  dev: 'Startet Server und Oberfläche nebeneinander im Entwicklungsmodus: Die Oberfläche lädt bei jeder Änderung neu (Vite auf Port 5173), der Server startet neu (Port 3001).',
  'dev:backend': 'Nur den Server im Entwicklungsmodus (`node --watch`).',
  'dev:frontend': 'Nur die Oberfläche im Entwicklungsmodus (Vite).',
  build: 'Baut die Oberfläche (Vite) und kopiert das Ergebnis nach backend/public, von wo der Server sie ausliefert.',
  serve: 'Startet nur den Server, ohne die Prüfungen von `npm start` – für den Container.',
  lint: 'Prüft den Code mit oxlint: die Oberfläche mit ihren Browser-Regeln, Server und Werkzeuge mit den Node-Regeln (unter anderem `no-undef`).',
  test: 'Alles, was vor einem Commit laufen soll, der Reihe nach: lint, Einfuhr-, Stil- und Kommentarprobe, Blatt- und Klangprobe, der Vertrag. Bricht beim ersten Fehler ab.',
  start: 'Startet den Server im Betrieb (mit Prüfungen, siehe scripts/start.mjs).',
  pruefen: 'Berichtet nur, was `npm start` tun würde – Node-Fassung, fehlende Pakete, fehlender Bau –, und tut nichts davon.',
  preview: 'Zeigt die gebaute Oberfläche an, ohne Server – nur zum Anschauen des Baus.',
};

/** Der erste Absatz des Kopfkommentars einer Skriptdatei. */
function erklaerungAus(datei) {
  if (!fs.existsSync(datei)) return '';
  const kopf = kopfkommentar(lesen(datei));
  return kopf.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
}

/** Die Befehle einer package.json, mit Erklärung. */
function befehleIn(wurzel, ordner) {
  const paket = JSON.parse(lesen(path.join(wurzel, ordner, 'package.json')));
  return Object.entries(paket.scripts ?? {}).map(([name, befehl]) => {
    const skript = /node (?:--\S+ )*(\S+\.m?js)/.exec(befehl)?.[1];
    const aus = skript ? erklaerungAus(path.join(wurzel, ordner, skript)) : '';
    // Wo mehrere Schritte verkettet sind oder ein Schalter den Sinn ändert,
    // gilt die Erklärung von hier – der Kopf des Skripts beschreibt nur einen Teil.
    const eigen = ZUSAMMENGESETZT[name] && (/&&|--\w/.test(befehl) || !aus);
    return { name, befehl, text: eigen ? ZUSAMMENGESETZT[name] : aus || ZUSAMMENGESETZT[name] || '' };
  });
}

/** Das Kapitel. */
export const BEFEHLE = {
  datei: '87-befehle.md',
  erzeugen(wurzel) {
    const teile = [
      ['Im Wurzelverzeichnis', '.', 'Die Befehle für den Alltag. Sie laufen alle aus dem Wurzelverzeichnis des Almanachs, also dort, wo README.md liegt.'],
      ['Im Server (backend/)', 'backend', 'Selten direkt gebraucht – die Befehle oben rufen diese auf.'],
      ['In der Oberfläche (frontend/)', 'frontend', 'Ebenso: meist über die Befehle im Wurzelverzeichnis.'],
    ];
    const abschnitte = teile.map(([titel, ordner, einleitung]) => {
      const liste = befehleIn(wurzel, ordner);
      const tabelle = ['| Befehl | ruft auf |', '|---|---|', ...liste.map((b) => `| \`npm run ${b.name}\` | \`${b.befehl.replace(/\|/g, '\\|')}\` |`)].join('\n');
      const einzeln = liste.map((b) => `### npm run ${b.name}\n\n${b.text || '–'}`).join('\n\n');
      return `## ${titel}\n\n${einleitung}\n\n${tabelle}\n\n${einzeln}`;
    });
    return (
      kapitelKopf(
        'Verzeichnis der Befehle',
        'Jeder Befehl, den `npm run` kennt, mit dem, was er aufruft, und dem, was er tut. Die Erklärung ist der erste Absatz aus dem Kopf des Skripts, das der Befehl startet.'
      ) +
      '\n' +
      abschnitte.join('\n\n') +
      '\n'
    );
  },
};
