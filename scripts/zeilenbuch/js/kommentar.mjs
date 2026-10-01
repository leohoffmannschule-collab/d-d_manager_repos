/**
 * Kommentare im JavaScript: was für einer, und wozu er gehört.
 *
 * Kommentare sind Text für Menschen; das Programm überspringt sie. Im Buch
 * stehen sie trotzdem Zeile für Zeile – als Block: Ein Kommentar über
 * mehrere Zeilen bekommt eine Erklärung, die für alle seine Zeilen gilt. Sie
 * sagt, welche Art Kommentar es ist (der Kopf der Datei, die Beschreibung
 * einer Funktion darunter, eine Zwischenüberschrift, eine Anweisung an die
 * Prüfregeln) und auf welche Zeile er sich bezieht.
 */
import { code, zeile } from '../text.mjs';
import { hinweis } from './hilfen.mjs';

/** Steht vor bzw. hinter dem Kommentar in seiner Zeile nur Leerraum? */
function allein(c, zeilen) {
  const erste = zeilen[c.loc.start.line - 1] ?? '';
  const letzte = zeilen[c.loc.end.line - 1] ?? '';
  return !erste.slice(0, c.loc.start.column).trim() && !letzte.slice(c.loc.end.column).trim();
}

/** Die nächste Zeile nach `nr`, in der etwas steht – oder null. */
function naechsteZeile(zeilen, nr) {
  for (let i = nr + 1; i <= zeilen.length; i += 1) if ((zeilen[i - 1] ?? '').trim()) return i;
  return null;
}

/**
 * Die Kommentare einer Datei ins Blatt eintragen.
 *
 * @param {object[]} kommentare  `ast.comments`
 * @param {object} k             Kontext
 * @param {(zeile: number) => string|null} benennen
 *   sagt, was in einer Zeile beginnt („die Funktion `x`“) – für „Erklärung zu …“
 */
export function kommentareErklaeren(kommentare, k, benennen) {
  const { zeilen, blatt } = k;
  // Zusammenhängende Läufe: ein Blockkommentar, oder mehrere //-Zeilen
  // direkt untereinander.
  const laeufe = [];
  for (const c of kommentare) {
    if (!allein(c, zeilen)) {
      // Am Ende einer Codezeile, oder ein Kommentar über mehrere Zeilen,
      // der in einer Codezeile beginnt ({/* … */} im JSX).
      if (c.loc.end.line > c.loc.start.line) blatt.gruppe(c.loc.start.line + 1, c.loc.end.line, `Fortsetzung des Kommentars aus ${zeile(c.loc.start.line)}.`);
      else if (c.type === 'CommentLine') {
        const bisher = k.hinweise;
        k.hinweise = [];
        hinweis(k, 'zeilenende', 'Hinter // am Zeilenende steht ein Kommentar: Er erklärt die Zeile für Menschen, das Programm überspringt ihn.');
        for (const h of k.hinweise) blatt.hinweis(c.loc.start.line, h);
        k.hinweise = bisher;
      }
      continue;
    }
    const letzter = laeufe[laeufe.length - 1];
    if (c.type === 'CommentLine' && letzter?.art === 'CommentLine' && letzter.bis === c.loc.start.line - 1) {
      letzter.bis = c.loc.end.line;
      letzter.texte.push(c.value);
    } else laeufe.push({ art: c.type, von: c.loc.start.line, bis: c.loc.end.line, texte: [c.value] });
  }

  let ersteCodeZeile = zeilen.findIndex((z, i) => z.trim() && !z.trim().startsWith('#!') && !laeufe.some((l) => l.von <= i + 1 && i + 1 <= l.bis)) + 1;
  if (ersteCodeZeile === 0) ersteCodeZeile = Infinity;

  let erstesGewoehnliches = true;
  for (const lauf of laeufe) {
    const inhalt = lauf.texte.join('\n');
    const ziel = naechsteZeile(zeilen, lauf.bis);
    const direkt = ziel === lauf.bis + 1;
    let text;
    if (lauf.von < ersteCodeZeile && lauf.art === 'CommentBlock' && lauf === laeufe[0]) {
      text = 'Kopfkommentar: Er sagt, wozu es diese Datei gibt. Alles zwischen /* und */ ist Text für Menschen – das Programm überspringt ihn.';
    } else if (/^\s*(oxlint|eslint)-disable/.test(inhalt)) {
      text = `Anweisung an die Prüfregeln (oxlint): Für ${/next-line/.test(inhalt) ? 'die nächste Zeile' : 'diese Stelle'} wird die Regel ${code(inhalt.replace(/^\s*\S+\s*/, '').split(/\s+--/)[0].trim() || '…')} ausgesetzt – mit Absicht.`;
    } else if (lauf.von === lauf.bis && /^[\s*]*-{2,}\s*.+?\s*-{2,}[\s*]*$/.test(inhalt)) {
      const titel = inhalt.replace(/^[\s*]*-+\s*/, '').replace(/\s*-+[\s*]*$/, '');
      text = `Zwischenüberschrift: Hier beginnt der Abschnitt „${titel}“.`;
    } else if (lauf.art === 'CommentBlock' && inhalt.startsWith('*') && direkt) {
      const was = benennen(ziel);
      const tags = [];
      if (/@param\b/.test(inhalt)) tags.push(`${code('@param')} beschreibt die Parameter`);
      if (/@returns?\b/.test(inhalt)) tags.push(`${code('@returns')} das Ergebnis`);
      text = `Erklärung zu ${was ?? `dem, was in ${zeile(ziel)} beginnt`} (darunter, ${zeile(ziel)})${tags.length ? `. ${tags.join(', ')}` : ''}.`;
    } else {
      const was = direkt ? benennen(ziel) : null;
      text = erstesGewoehnliches
        ? `Ein Kommentar${ziel ? ` zu ${was ?? `der Stelle darunter`} (${zeile(ziel)})` : ''}: Er erklärt Menschen, was dort geschieht oder warum. ${lauf.art === 'CommentLine' ? 'Alles hinter // bis zum Zeilenende' : 'Alles zwischen /* und */'} überspringt das Programm.`
        : `Kommentar${ziel ? ` zu ${was ?? `der Stelle darunter`} (${zeile(ziel)})` : ''}.`;
      erstesGewoehnliches = false;
    }
    if (lauf.von === lauf.bis) blatt.dazu(lauf.von, text);
    else blatt.gruppe(lauf.von, lauf.bis, text);
  }
}
