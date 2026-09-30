/**
 * Verzeichnis: jede Datei des Almanachs mit ihrem Kopfkommentar und ihren
 * Ausfuhren.
 *
 * Drei Kapitel – Server, Oberfläche, Werkzeuge –, innerhalb nach Ordnern.
 * Zu jeder Datei steht, was ihr Kopf sagt (vollständig, denn dort steht das
 * *Warum*), wie lang sie ist und was sie ausführt, jeweils mit dem Kommentar
 * darüber. Wer eine Stelle im Code sucht, schlägt hier nach, bevor er in den
 * Ordnern wühlt.
 */
import path from 'node:path';
import { alsMarkdown, dateienUnter, kapitelKopf, kommentarVor, kopfkommentar, lesen, relativ } from './quelle.mjs';

/** Die Ausfuhren einer Datei: Name, Art und der Kommentar darüber. */
function ausfuhren(quelltext) {
  const zeilen = quelltext.split('\n');
  const funde = [];
  zeilen.forEach((zeile, i) => {
    const m = /^export\s+(default\s+)?(async\s+)?(function\s*\*?|const|let|class)\s*([\w$]*)/.exec(zeile);
    if (!m) return;
    const art = m[3].startsWith('function') ? (m[2] ? 'async function' : 'function') : m[3];
    const name = m[4] || 'default';
    funde.push({ name, art: m[1] ? `default ${art}` : art, text: kommentarVor(zeilen, i) });
  });
  // Weitergereichtes aus Sammelstellen: export { a, b } from './x.js'
  for (const m of quelltext.matchAll(/export\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)) {
    for (const name of m[1].split(',').map((s) => s.trim()).filter(Boolean)) {
      funde.push({ name, art: `aus ${m[2]}`, text: '' });
    }
  }
  return funde;
}

/** Ein Abschnitt je Datei. */
function dateiAbschnitt(wurzel, datei) {
  const text = lesen(datei);
  const kopf = kopfkommentar(text);
  const liste = datei.endsWith('.css') ? [] : ausfuhren(text);
  const teile = [`### ${relativ(wurzel, datei)}`, '', `*${text.split('\n').length} Zeilen*`, ''];
  if (kopf) teile.push(alsMarkdown(kopf), '');
  if (liste.length) {
    teile.push('**Ausfuhren**', '');
    for (const a of liste) {
      const erklaerung = a.text ? ` – ${alsMarkdown(a.text).split('\n\n')[0].replace(/\n/g, ' ')}` : '';
      teile.push(`- \`${a.name}\` (${a.art})${erklaerung}`);
    }
    teile.push('');
  }
  return teile.join('\n');
}

/** Dateien nach Ordnern gruppiert, jeder Ordner ein Abschnitt. */
function nachOrdnern(wurzel, dateien) {
  const gruppen = new Map();
  for (const datei of dateien) {
    const ordner = relativ(wurzel, path.dirname(datei));
    if (!gruppen.has(ordner)) gruppen.set(ordner, []);
    gruppen.get(ordner).push(datei);
  }
  return [...gruppen.entries()]
    .map(([ordner, liste]) => `## ${ordner}/\n\n${liste.map((d) => dateiAbschnitt(wurzel, d)).join('\n')}`)
    .join('\n');
}

/** Wie viele Dateien und Zeilen – für die Einleitung. */
function umfang(dateien) {
  const zeilen = dateien.reduce((summe, d) => summe + lesen(d).split('\n').length, 0);
  return `${dateien.length} Dateien, ${zeilen.toLocaleString('de-DE')} Zeilen`;
}

/** Die drei Kapitel des Dateiverzeichnisses. */
export const DATEIVERZEICHNISSE = [
  {
    datei: '80-dateien-server.md',
    erzeugen(wurzel) {
      const dateien = [
        ...dateienUnter(path.join(wurzel, 'backend', 'src')),
        ...dateienUnter(path.join(wurzel, 'backend', 'scripts')),
      ];
      return (
        kapitelKopf(
          'Dateiverzeichnis: der Server',
          `Alle Dateien unter backend/src und backend/scripts (${umfang(dateien)}), nach Ordnern. Zu jeder Datei ihr Kopfkommentar – dort steht, wozu es sie gibt und warum sie so gebaut ist – und ihre Ausfuhren mit dem Kommentar darüber.

Einen Überblick, wie die Teile zusammenspielen, gibt das Kapitel über den Server im Teil „Wie es gebaut ist“.`
        ) +
        '\n' +
        nachOrdnern(wurzel, dateien)
      );
    },
  },
  {
    datei: '81-dateien-oberflaeche.md',
    erzeugen(wurzel) {
      const dateien = [
        ...dateienUnter(path.join(wurzel, 'frontend', 'src')),
        ...dateienUnter(path.join(wurzel, 'frontend', 'public'), /\.js$/),
        path.join(wurzel, 'frontend', 'vite.config.js'),
      ];
      return (
        kapitelKopf(
          'Dateiverzeichnis: die Oberfläche',
          `Alle Dateien der Oberfläche (${umfang(dateien)}): Seiten, Bauteile, die Datenschicht in lib/, die Stilblätter und der Bau. Zu jeder Datei ihr Kopfkommentar und ihre Ausfuhren.

Sammelstellen wie icons.jsx oder lib/api.js führen nichts Eigenes aus, sondern reichen weiter – bei ihnen steht, woher.`
        ) +
        '\n' +
        nachOrdnern(wurzel, dateien)
      );
    },
  },
  {
    datei: '82-dateien-werkzeuge.md',
    erzeugen(wurzel) {
      const dateien = dateienUnter(path.join(wurzel, 'scripts'), /\.(mjs|js|css|sh)$/);
      return (
        kapitelKopf(
          'Dateiverzeichnis: die Werkzeuge',
          `Alles unter scripts/ (${umfang(dateien)}): Start und Tunnel, die Proben und der Vertrag, Drucksatz und dieses Handbuch.`
        ) +
        '\n' +
        nachOrdnern(wurzel, dateien)
      );
    },
  },
];
