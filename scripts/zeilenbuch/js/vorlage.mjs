/**
 * Mehrzeilige Vorlagentexte im Code: SQL, HTML, CSS, Klassen, Text.
 *
 * Ein Vorlagentext zwischen Backticks darf über viele Zeilen gehen – das
 * Schema der Datenbank ist einer, das HTML des mitgenommenen Blattes ein
 * anderer. Für JavaScript ist das alles nur Text. Für das Buch nicht: Jede
 * dieser Zeilen ist Code in einer anderen Sprache und wird mit dem Leser
 * dieser Sprache erklärt (sql.mjs, html.mjs, css.mjs). Steht im Text selbst
 * JavaScript (ein Skript, das an einen eigenen Node-Prozess geht), wird es
 * wie jede andere Datei erklärt – über `k.eingebettet`.
 *
 * Eingesetzte Werte (`${…}`) sind JavaScript; sie erklärt der übrige
 * Erklärer in ihrer Zeile. Im Text stehen sie hier als „…“.
 */
import { code, zeile, kuerzen } from '../text.mjs';
import { klassenErklaeren, sindKlassen } from '../tailwind.mjs';
import { SqlZeilen } from '../sql.mjs';
import { HtmlZeilen } from '../html.mjs';
import { CssZeilen } from '../css.mjs';
import { eltern, nameVon } from './hilfen.mjs';

/**
 * Welche Sprache in einem Vorlagentext steht.
 *
 * @returns {'sql'|'html'|'css'|'klassen'|'js'|'text'}
 */
export function vorlageArt(n, k) {
  const roh = n.quasis.map((q) => q.value.raw).join('…');
  const e = eltern(k, n);
  if (e?.knoten.type === 'JSXExpressionContainer') {
    const oben = eltern(k, e.knoten);
    if (oben?.knoten.type === 'JSXAttribute' && oben.knoten.name.name === 'className') return 'klassen';
  }
  if (e?.knoten.type === 'CallExpression' && /(prepare|exec)$/.test(nameVon(e.knoten.callee) ?? '')) return 'sql';
  if (/^\s*(\/\*[\s\S]*?\*\/\s*)*(CREATE|SELECT|INSERT|UPDATE|DELETE|PRAGMA|ALTER|BEGIN|WITH|SAVEPOINT)\b/i.test(roh)) return 'sql';
  if ((roh.match(/<\/?[a-z][\w-]*[\s>/]/gi) ?? []).length >= 2) return 'html';
  if (/^\s*[^{}\n]+\{\s*$/m.test(roh) && /^\s*-{0,2}[a-z-]+\s*:\s*[^;\n]+;\s*$/m.test(roh)) return 'css';
  if (/\b(const|let|await|import|function|process)\b/.test(roh) && /[;{]\s*$/m.test(roh)) return 'js';
  if (sindKlassen(roh.replace(/…/g, ' '), k.projekt)) return 'klassen';
  return 'text';
}

/**
 * Der Teil von Zeile `L`, der zum Text gehört – ohne Backticks, eingesetzte
 * Werte als „…“. Gelesen wird aus den Textstücken (Quasis) selbst: Was
 * zwischen zwei Stücken liegt, ist ein `${…}` – auch dann, wenn seine
 * schließende Klammer erst in einer späteren Zeile steht.
 */
function inhaltDerZeile(n, k, L) {
  const text = k.zeilen[L - 1] ?? '';
  const teile = [];
  n.quasis.forEach((q, i) => {
    if (q.loc.start.line > L || q.loc.end.line < L) {
      if (i > 0 && q.loc.start.line > L && n.quasis[i - 1].loc.end.line < L) teile.push('…');
      return;
    }
    const von = q.loc.start.line === L ? q.loc.start.column : 0;
    const bis = q.loc.end.line === L ? q.loc.end.column : text.length;
    if (i > 0 && q.loc.start.line === L) teile.push('…');
    teile.push(text.slice(von, bis));
    if (i < n.quasis.length - 1 && q.loc.end.line === L) teile.push('…');
  });
  return teile.join('').replace(/…+/g, '…');
}

/**
 * JavaScript im Text: einen Ersatztext bauen, in dem der Vorlagentext genau
 * an seiner Stelle steht und alles andere leer ist – dann stimmen die
 * Zeilennummern, und der gewöhnliche Erklärer kann ihn lesen.
 */
function eingebettetesJs(n, k) {
  const zeilen = k.zeilen.map(() => '');
  for (let L = n.loc.start.line; L <= n.loc.end.line; L += 1) {
    const roh = inhaltDerZeile(n, k, L);
    const vorne = L === n.loc.start.line ? ' '.repeat(n.loc.start.column + 1) : '';
    zeilen[L - 1] = vorne + roh.replace(/…/g, '__');
  }
  return zeilen.join('\n');
}

/**
 * Die Zeilen eines mehrzeiligen Vorlagentexts erklären.
 *
 * @param {object} n  TemplateLiteral
 * @param {object} k  Kontext
 */
export function vorlageErklaeren(n, k) {
  const art = vorlageArt(n, k);
  if (art === 'js' && k.eingebettet) {
    const erklaert = k.eingebettet(eingebettetesJs(n, k));
    if (erklaert) {
      for (const [L, texte] of erklaert) {
        if (L < n.loc.start.line || L > n.loc.end.line) continue;
        for (const t of [...texte].reverse()) {
          if (L === n.loc.start.line) k.blatt.dazu(L, t);
          else k.blatt.vorn(L, t);
        }
      }
      return art;
    }
  }
  const leser = art === 'sql' ? new SqlZeilen() : art === 'html' ? new HtmlZeilen(k.projekt) : art === 'css' ? new CssZeilen() : null;
  for (let L = n.loc.start.line; L <= n.loc.end.line; L += 1) {
    const inhalt = inhaltDerZeile(n, k, L);
    const sauber = inhalt.trim();
    if (!sauber || /^(…\s*)+$/.test(sauber)) continue;
    let text;
    if (art === 'sql') text = leser.zeile(inhalt);
    else if (art === 'html' || art === 'css') text = leser.zeile(inhalt, L);
    else if (art === 'klassen') {
      if (L === n.loc.start.line) continue;
      text = `Weitere Klassen: ${klassenErklaeren(sauber.replace(/…/g, ' '), k.projekt).text}.`;
    } else if (art === 'js') text = `JavaScript als Text: ${code(sauber, 80)} – es wird später ausgeführt.`;
    else text = L === n.loc.start.line ? `Der Text beginnt: „${kuerzen(sauber, 140)}“.` : `Weiter im Text (aus ${zeile(n.loc.start.line)}): „${kuerzen(sauber, 140)}“.`;
    if (art === 'css' && leser) for (const h of leser.neueHinweise(k.gesehen)) k.blatt.hinweis(L, h);
    // In der ersten Zeile steht schon, was der Text ist; dort kommt der Inhalt
    // dahinter. In allen anderen Zeilen steht er vor den eingesetzten Werten.
    if (text && L === n.loc.start.line) k.blatt.dazu(L, text);
    else if (text) k.blatt.vorn(L, text);
  }
  return art;
}
