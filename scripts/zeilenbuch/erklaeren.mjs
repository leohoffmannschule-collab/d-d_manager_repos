/**
 * Eine Datei erklären – mit dem Erklärer, der zu ihrer Sprache gehört.
 *
 * Hier laufen die Fäden zusammen: Die Sprache einer Datei (sammlung.mjs)
 * bestimmt den Erklärer (js/, css.mjs, html.mjs, shell.mjs, docker.mjs,
 * daten.mjs). Was danach noch ohne Erklärung ist, bekommt eine Notlösung –
 * und wird gezählt, damit das Buch sagen kann, ob es wirklich jede Zeile
 * erklärt.
 */
import { Blatt } from './blatt.mjs';
import { code, kommentarInhalt } from './text.mjs';
import { sprache, ZWECK } from './sammlung.mjs';
import { erklaereJs } from './js/erklaerer.mjs';
import { erklaereCss } from './css.mjs';
import { erklaereHtml } from './html.mjs';
import { erklaereShell } from './shell.mjs';
import { erklaereDockerfile, erklaereCompose } from './docker.mjs';
import { erklaereJson, erklaereIgnore, erklaereAttribute, erklaereEnv } from './daten.mjs';

/**
 * Eine Datei erklären.
 *
 * @param {string} datei   Pfad relativ zur Wurzel
 * @param {string} text    ihr Inhalt
 * @param {import('./projekt.mjs').Projekt} projekt
 * @returns {{ blatt: Blatt, notbehelf: number }}
 */
export function erklaereDatei(datei, text, projekt) {
  const blatt = new Blatt(text);
  const art = sprache(datei)?.art;
  projekt.aktuell = datei;
  switch (art) {
    case 'js':
      erklaereJs(blatt, datei, projekt);
      break;
    case 'css':
      erklaereCss(blatt);
      break;
    case 'html':
      erklaereHtml(blatt, projekt);
      break;
    case 'sh':
    case 'cmd':
      erklaereShell(blatt, art);
      break;
    case 'docker':
      erklaereDockerfile(blatt);
      break;
    case 'compose':
      erklaereCompose(blatt, projekt);
      break;
    case 'json':
      erklaereJson(blatt);
      break;
    case 'gitignore':
      erklaereIgnore(blatt, 'git');
      break;
    case 'dockerignore':
      erklaereIgnore(blatt, 'docker');
      break;
    case 'attribute':
      erklaereAttribute(blatt);
      break;
    case 'env':
      erklaereEnv(blatt);
      break;
    default:
      break;
  }
  const offen = blatt.offen();
  for (const nr of offen) blatt.dazu(nr, `${code(blatt.text(nr).trim(), 70)}.`);
  return { blatt, notbehelf: offen.length };
}

/** Der erste Absatz eines Kommentars, als Fließtext. */
const ersterAbsatz = (text) => text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();

/**
 * Wozu es eine Datei gibt – für die Zeile unter ihrem Namen im Buch: der
 * erste Absatz ihres Kopfkommentars, oder eine feste Beschreibung für
 * Dateien, die keinen haben können (JSON, Ignore-Listen).
 */
export function zweck(datei, text, projekt) {
  if (ZWECK[datei]) return ZWECK[datei];
  const art = sprache(datei)?.art;
  if (art === 'js') {
    const kopf = projekt.dateien.get(datei)?.kopf;
    if (kopf) return ersterAbsatz(kopf);
  }
  if (art === 'css' || art === 'js') {
    const m = /^\s*\/\*([\s\S]*?)\*\//.exec(text);
    if (m) return ersterAbsatz(kommentarInhalt(m[1]));
  }
  if (art === 'sh' || art === 'cmd' || art === 'docker' || art === 'compose' || art === 'env') {
    const zeichen = art === 'cmd' ? /^rem\s?/i : /^#\s?/;
    const zeilen = text.split('\n').filter((z) => !z.startsWith('#!') && !/^@echo/i.test(z));
    const kommentar = [];
    for (const z of zeilen) {
      if (zeichen.test(z.trim())) kommentar.push(z.trim().replace(zeichen, ''));
      else if (kommentar.length) break;
    }
    const t = ersterAbsatz(kommentar.join('\n'));
    if (t && !t.startsWith('syntax=')) return t;
  }
  if (art === 'html') {
    const titel = /<title>([^<]*)<\/title>/i.exec(text);
    if (titel) return `Die Seite „${titel[1].trim()}“.`;
    if (datei.endsWith('.svg')) return 'Eine Vektorzeichnung.';
  }
  return '';
}
