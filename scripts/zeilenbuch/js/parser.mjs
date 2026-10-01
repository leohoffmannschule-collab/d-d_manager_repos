/**
 * JavaScript und JSX lesen – mit dem Parser, der ohnehin da ist.
 *
 * Um eine Zeile zu erklären, muss man wissen, was in ihr steht: eine
 * Funktion, die beginnt, ein Aufruf, ein Element der Oberfläche. Das sagt
 * ein Parser, der den Code in einen Baum zerlegt (AST, abstrakter
 * Syntaxbaum). Babel bringt einen mit, der auch JSX versteht – und er liegt
 * schon in frontend/node_modules, weil das Bauwerkzeug der Oberfläche ihn
 * benutzt (über die React- und die PWA-Erweiterung von Vite). Geholt wird
 * also nichts; fehlt er, weil die Oberfläche noch nicht eingerichtet ist,
 * sagt das Skript, was zu tun ist.
 */
import path from 'node:path';
import { createRequire } from 'node:module';
import { wurzel } from '../../gemeinsam/dateien.mjs';

let babel = null;

/** Den Parser laden – einmal, beim ersten Gebrauch. */
function parser() {
  if (babel) return babel;
  try {
    babel = createRequire(path.join(wurzel, 'frontend', 'package.json'))('@babel/parser');
  } catch {
    throw new Error('Der JavaScript-Parser (@babel/parser) fehlt. Zuerst die Oberfläche einrichten: npm run setup');
  }
  return babel;
}

/**
 * Einen Quelltext in seinen Baum zerlegen. Jeder Knoten trägt `loc` mit
 * Zeile (ab 1) und Spalte (ab 0) von Anfang und Ende; die Kommentare stehen
 * gesammelt in `comments`.
 */
export function parsen(text) {
  return parser().parse(text, {
    sourceType: 'module',
    plugins: ['jsx'],
    errorRecovery: true,
  });
}

/** Felder eines Knotens, die keine Kinder sind. */
const KEINE_KINDER = new Set([
  'type',
  'loc',
  'start',
  'end',
  'extra',
  'range',
  'leadingComments',
  'trailingComments',
  'innerComments',
  'comments',
  'tokens',
  'errors',
]);

/**
 * Die Kinder eines Knotens, der Reihe nach – jeweils mit dem Feld, in dem
 * sie stehen, und ihrer Stelle, wenn das Feld eine Liste ist.
 *
 * @returns {Array<{ kind: object, schluessel: string, stelle: number|null }>}
 */
export function kinder(knoten) {
  const raus = [];
  for (const schluessel of Object.keys(knoten)) {
    if (KEINE_KINDER.has(schluessel)) continue;
    const wert = knoten[schluessel];
    if (Array.isArray(wert)) {
      wert.forEach((kind, stelle) => {
        if (kind && typeof kind.type === 'string') raus.push({ kind, schluessel, stelle });
      });
    } else if (wert && typeof wert.type === 'string') {
      raus.push({ kind: wert, schluessel, stelle: null });
    }
  }
  return raus.sort((a, b) => a.kind.start - b.kind.start);
}

/**
 * Den ganzen Baum durchgehen. `besuch(knoten, eltern)` bekommt zu jedem
 * Knoten den Elternknoten samt Feld und Stelle.
 */
export function durchgehen(wurzelKnoten, besuch) {
  const gehen = (knoten, eltern) => {
    besuch(knoten, eltern);
    for (const k of kinder(knoten)) gehen(k.kind, { knoten, schluessel: k.schluessel, stelle: k.stelle });
  };
  gehen(wurzelKnoten, null);
}
