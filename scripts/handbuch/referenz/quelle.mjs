/**
 * Werkzeug für die Verzeichnisse: Quelltext lesen, Kommentare herauslösen
 * und als Markdown setzen.
 *
 * Die Kommentare des Almanachs sind für Menschen geschrieben, nicht für
 * einen Dokumentationsgenerator: Absätze, Aufzählungen mit „–“, und gern
 * ausgerichtete Spalten („useAnsicht.js   Maßstab und Verschiebung“). Damit
 * diese Spalten im Buch nicht zu einem Brei zusammenlaufen, wird jeder
 * eingerückte Block, der keine Aufzählung ist, als Codeblock gesetzt – dort
 * bleibt die Ausrichtung stehen.
 */
import fs from 'node:fs';
import path from 'node:path';

/** Eine Datei als Text. */
export const lesen = (datei) => fs.readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');

/** Alle Dateien unter `ordner` mit passender Endung, sortiert. */
export function dateienUnter(ordner, muster = /\.(js|jsx|mjs|css)$/) {
  const funde = [];
  const gehen = (verzeichnis) => {
    if (!fs.existsSync(verzeichnis)) return;
    for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
      if (eintrag.name === 'node_modules') continue;
      const pfad = path.join(verzeichnis, eintrag.name);
      if (eintrag.isDirectory()) gehen(pfad);
      else if (muster.test(eintrag.name)) funde.push(pfad);
    }
  };
  gehen(ordner);
  return funde.sort((a, b) => a.localeCompare(b, 'de'));
}

/**
 * Den Inhalt eines Blockkommentars ohne Sternchen: `/**`, ` * ` und ` *\/`
 * fallen weg, Einrückungen innerhalb bleiben.
 */
export function kommentarText(block) {
  const zeilen = block
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((z) => z.replace(/^\s*\* ?/, '').replace(/^\s*\*$/, ''));
  while (zeilen.length && !zeilen[0].trim()) zeilen.shift();
  while (zeilen.length && !zeilen[zeilen.length - 1].trim()) zeilen.pop();
  return zeilen.join('\n');
}

/**
 * Kommentartext als Markdown: Absätze bleiben Absätze, eingerückte Blöcke
 * werden Codeblöcke (damit Spalten stehen bleiben), Aufzählungen mit „–“
 * oder Ziffern werden Listen. `@param` und Freunde werden eine eigene Liste.
 */
export function alsMarkdown(text) {
  const zeilen = text.split('\n');
  const raus = [];
  const tags = [];
  let i = 0;
  while (i < zeilen.length) {
    const z = zeilen[i];
    const tag = z.match(/^@(\w+)\s*(.*)$/);
    if (tag) {
      // Ein Tag kann über mehrere Zeilen gehen: alles, was eingerückt folgt.
      const teile = [tag[2]];
      i += 1;
      while (i < zeilen.length && /^\s+\S/.test(zeilen[i]) && !zeilen[i].trim().startsWith('@')) teile.push(zeilen[i++].trim());
      tags.push({ name: tag[1], text: teile.join(' ') });
      continue;
    }
    if (/^\s{2,}\S/.test(z)) {
      const block = [];
      while (i < zeilen.length && (/^\s{2,}\S/.test(zeilen[i]) || (!zeilen[i].trim() && /^\s{2,}\S/.test(zeilen[i + 1] ?? '')))) {
        block.push(zeilen[i++]);
      }
      const einzug = Math.min(...block.filter((b) => b.trim()).map((b) => b.match(/^ */)[0].length));
      const inhalt = block.map((b) => b.slice(einzug));
      const istListe = inhalt.every((b) => !b.trim() || /^([–-]|\d+\.)\s/.test(b) || /^\s{2,}/.test(b));
      if (istListe) {
        raus.push(inhalt.map((b) => b.replace(/^–\s/, '- ').replace(/^(\s+)/, '$1')).join('\n'));
      } else {
        raus.push('```\n' + inhalt.join('\n') + '\n```');
      }
      continue;
    }
    raus.push(z.replace(/^–\s/, '- '));
    i += 1;
  }
  let md = raus.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (tags.length) {
    md += '\n\n' + tags.map((t) => `- \`@${t.name}\` ${t.text.replace(/`/g, "'")}`).join('\n');
  }
  return md;
}

/** Der Kopfkommentar einer Datei als Text – oder ''. */
export function kopfkommentar(quelltext) {
  const treffer = /^(#![^\n]*\n)?\s*(\/\*[\s\S]*?\*\/)/.exec(quelltext);
  return treffer ? kommentarText(treffer[2]) : '';
}

/**
 * Der Kommentar, der direkt vor Zeile `zeile` (0-basiert) steht – ein
 * Blockkommentar oder eine Folge von `//`-Zeilen. Leer, wenn keiner da ist.
 */
export function kommentarVor(zeilen, zeile) {
  let i = zeile - 1;
  if (i < 0) return '';
  if (zeilen[i].trim().endsWith('*/')) {
    let anfang = i;
    while (anfang > 0 && !zeilen[anfang].trim().startsWith('/*')) anfang -= 1;
    return kommentarText(zeilen.slice(anfang, i + 1).join('\n'));
  }
  const teile = [];
  while (i >= 0 && zeilen[i].trim().startsWith('//')) teile.unshift(zeilen[i--].trim().replace(/^\/\/\s?/, ''));
  return teile.join('\n');
}

/** Der erste Satz eines Textes – für Tabellen, in denen kein Platz für mehr ist. */
export function ersterSatz(text) {
  const absatz = text.split(/\n\s*\n/)[0].replace(/\s+/g, ' ').trim();
  const satz = absatz.match(/^(.+?[.!?:])(\s|$)/);
  return (satz ? satz[1] : absatz).replace(/\|/g, '\\|');
}

/** Pfad relativ zur Wurzel, mit Schrägstrichen. */
export const relativ = (wurzel, datei) => path.relative(wurzel, datei).split(path.sep).join('/');

/**
 * Der Kopf eines erzeugten Kapitels: Titel und der Hinweis, dass man es
 * nicht von Hand ändert.
 */
export function kapitelKopf(titel, einleitung) {
  return `# ${titel}

> Dieses Kapitel schreibt \`npm run handbuch\` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

${einleitung.trim()}
`;
}
