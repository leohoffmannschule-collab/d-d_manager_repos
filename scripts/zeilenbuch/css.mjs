/**
 * Stilblätter Zeile für Zeile erklären.
 *
 * Ein Stilblatt besteht aus Regeln: oben der Selektor (wen die Regel
 * betrifft), in geschweiften Klammern die Deklarationen (Eigenschaft: Wert;).
 * Der Leser hier geht Zeile für Zeile durch und merkt sich, in welcher
 * Regel er gerade steht – so kann eine schließende Klammer sagen, wessen
 * Ende sie ist, und eine Variable in `@theme` sagen, welche Tailwind-Klassen
 * aus ihr entstehen.
 *
 * Kommentare (/* … *\/) fasst `erklaereCss` zu Blöcken zusammen; den Rest
 * erklärt die Klasse `CssZeilen`, die auch für CSS in Vorlagentexten des
 * Codes benutzt wird (vorlage.mjs).
 */
import { code, zeile, aufzaehlen, kuerzen, gross, kommentarInhalt, ersterSatz } from './text.mjs';
import { EIGENSCHAFTEN, WERTE, PSEUDO, AT_REGELN, FUNKTIONEN, EINHEITEN } from './woerterbuch/css.mjs';
import { ELEMENTE } from './woerterbuch/html.mjs';

/** Wofür eine Variable in `@theme` die Klassen baut. */
function themeKlassen(name) {
  let m;
  if ((m = /^--color-(.+)$/.exec(name))) return `daraus macht Tailwind die Klassen ${code('text-' + m[1])}, ${code('bg-' + m[1])}, ${code('border-' + m[1])} …`;
  if ((m = /^--font-(.+)$/.exec(name))) return `daraus macht Tailwind die Klasse ${code('font-' + m[1])}`;
  return '';
}

/** Ein einzelner Teil eines Selektors: `.btn:hover`, `h1`, `[data-theme="x"]`. */
function selektorTeil(teil) {
  const t = teil.trim();
  if (t === '*') return 'alle Elemente';
  if (t === '&') return 'das Element selbst';
  if (t === ':root') return `die Wurzel der Seite (${code(':root')}) – Variablen hier gelten überall`;
  const stuecke = [];
  let rest = t;
  let m;
  if ((m = /^([a-z][a-z0-9]*)/i.exec(rest))) {
    stuecke.push(`jedes ${code(`<${m[1]}>`)}${ELEMENTE[m[1].toLowerCase()] ? ` (${ELEMENTE[m[1].toLowerCase()]})` : ''}`);
    rest = rest.slice(m[0].length);
  }
  const klassen = [];
  const bedingungen = [];
  while (rest) {
    if ((m = /^\.(-?[_a-zA-Z][\w-]*)/.exec(rest))) klassen.push(code(m[1]));
    else if ((m = /^\[([\w-]+)(?:([~|^$*]?=)["']?([^"'\]]*)["']?)?\]/.exec(rest))) {
      bedingungen.push(m[2] ? `wenn das Attribut ${code(m[1])} = „${m[3]}“ ist${m[1] === 'data-theme' && m[3] === 'kerzenlicht' ? ' (die dunkle Fassung Kerzenlicht)' : ''}` : `wenn es das Attribut ${code(m[1])} hat`);
    } else if ((m = /^(::?[\w-]+)(\([^)]*\))?/.exec(rest))) {
      bedingungen.push(PSEUDO[m[1]] ? `${PSEUDO[m[1]]}${m[2] ? ` ${code(m[2])}` : ''}` : code(m[0]));
    } else {
      bedingungen.push(code(rest));
      break;
    }
    rest = rest.slice(m[0].length);
  }
  if (klassen.length) stuecke.push(`Elemente mit der Klasse ${aufzaehlen(klassen)}`);
  if (!stuecke.length && bedingungen.length) stuecke.push('Elemente');
  return [stuecke.join(' bzw. '), ...bedingungen].join(', ');
}

/** Ein ganzer Selektor in Worten – mit Kombinatoren (Leerzeichen, >) und Kommata. */
export function selektor(s) {
  return s
    .split(/,(?![^(]*\))/)
    .map((einer) => {
      const glieder = einer.trim().split(/\s*(>|\+|~)\s*|\s+/).filter(Boolean);
      const raus = [];
      let verbindung = null;
      for (const g of glieder) {
        if (g === '>' || g === '+' || g === '~') {
          verbindung = g;
          continue;
        }
        const w = selektorTeil(g);
        if (!raus.length) raus.push(w);
        else raus.push(verbindung === '>' ? `davon direkt darin: ${w}` : verbindung === '+' ? `direkt danach: ${w}` : `darin: ${w}`);
        verbindung = null;
      }
      return raus.join(' – ');
    })
    .join('; außerdem ');
}

/** Ein Wert in Worten: `var(--tinte)` → „der Wert der Variablen `--tinte`“. */
function wertText(v, hinweise) {
  const t = v.trim().replace(/;$/, '').trim();
  const wichtig = t.endsWith('!important');
  const w = t.replace(/\s*!important$/, '');
  for (const f of w.matchAll(/([a-z-]+)\(/g)) if (FUNKTIONEN[f[1]]) hinweise.set(`css:${f[1]}`, `${code(f[1] + '()')} – ${FUNKTIONEN[f[1]]}`);
  for (const e of w.matchAll(/\d(px|rem|em|vh|vw|mm|pt|fr|deg|ms)\b/g)) if (EINHEITEN[e[1]]) hinweise.set(`einheit:${e[1]}`, `${code(e[1])} – ${EINHEITEN[e[1]]}`);
  let m;
  let raus;
  if ((m = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/.exec(w))) raus = `der Wert der Variablen ${code(m[1])}${m[2] ? ` (gibt es sie nicht: ${code(m[2])})` : ''}`;
  else if (/^#[0-9a-f]{3,8}$/i.test(w)) raus = `die Farbe ${code(w)}`;
  else if (/^rgba?\(/i.test(w)) raus = `die Farbe ${code(w)}`;
  else if (WERTE[w]) raus = `${code(w)} (${WERTE[w]})`;
  else raus = code(w, 80);
  return wichtig ? `${raus} – mit !important: gilt vor allen anderen Regeln` : raus;
}

/** Eine Deklaration `eigenschaft: wert;` in Worten. */
function deklaration(name, wert, imTheme, hinweise) {
  if (name.startsWith('--')) {
    const extra = imTheme ? themeKlassen(name) : '';
    return `Legt die CSS-Variable ${code(name)} fest: ${wertText(wert, hinweise)}${extra ? `; ${extra}` : ''}.`;
  }
  const was = EIGENSCHAFTEN[name];
  const w = wert.trim().replace(/;$/, '').trim();
  let m;
  // Ein paar Kurzschreibweisen lohnen eine eigene Lesart.
  if (/^(margin|padding)$/.test(name) && /^\S+(\s+\S+){1,3}$/.test(w) && !w.includes('(')) {
    const t = w.split(/\s+/);
    const seiten = t.length === 2 ? `oben und unten ${code(t[0])}, links und rechts ${code(t[1])}` : t.length === 3 ? `oben ${code(t[0])}, links und rechts ${code(t[1])}, unten ${code(t[2])}` : `oben ${code(t[0])}, rechts ${code(t[1])}, unten ${code(t[2])}, links ${code(t[3])}`;
    return `${gross(was)}: ${seiten}.`;
  }
  if (/^border(-top|-bottom|-left|-right)?$/.test(name) && (m = /^(\S+)\s+(solid|dashed|dotted|double)\s+(.+)$/.exec(w))) {
    return `${gross(was)}: ${code(m[1])} stark, ${WERTE[m[2]] ?? m[2]}, Farbe: ${wertText(m[3], hinweise)}.`;
  }
  if (name === 'grid-template-columns' && (m = /^repeat\((\d+),\s*(minmax\(0,\s*1fr\)|1fr)\)$/.exec(w))) {
    return `Das Raster hat ${m[1]} gleich breite Spalten.`;
  }
  if (name === 'font-family') {
    const namen = w.split(',').map((x) => x.trim().replace(/^["']|["']$/g, ''));
    return `Schriftart: ${code(namen[0])}${namen.length > 1 ? ` – fehlt sie, die erste vorhandene von ${aufzaehlen(namen.slice(1).map((x) => code(x)), 'oder')}` : ''}.`;
  }
  if (was) return `${gross(was)}: ${wertText(w, hinweise)}.`;
  return `Eigenschaft ${code(name)}: ${wertText(w, hinweise)}.`;
}

/** Ein Leser, der CSS Zeile für Zeile erklärt. */
export class CssZeilen {
  constructor() {
    this.stapel = [];
    this.offeneEigenschaft = null;
    this.selektorTeile = [];
    this.hinweise = new Map();
  }

  /** Die Hinweise, die seit dem letzten Abholen dazugekommen sind. */
  neueHinweise(gesehen) {
    const raus = [];
    for (const [schl, text] of this.hinweise) {
      if (!gesehen.has(schl)) {
        gesehen.add(schl);
        raus.push(text);
      }
    }
    this.hinweise.clear();
    return raus;
  }

  /** Liegt die aktuelle Zeile in einem `@theme`-Block? */
  get imTheme() {
    return this.stapel.some((s) => s.kopf.startsWith('@theme'));
  }

  /**
   * Die Erklärung einer Zeile (ohne Kommentare – die erklärt erklaereCss).
   *
   * @param {string} roh  die Zeile
   * @param {number} nr   ihre Nummer – für Verweise „Ende der Regel aus Zeile N“
   */
  zeile(roh, nr) {
    const t = roh.replace(/\/\*.*?\*\//g, '').trim();
    if (!t) return '';
    const teile = [];
    let rest = t;

    // Fortsetzung eines Werts über mehrere Zeilen.
    if (this.offeneEigenschaft) {
      const fertig = /;\s*$/.test(rest) || rest.startsWith('}');
      const wert = rest.replace(/;\s*$/, '').replace(/,\s*$/, '');
      if (!rest.startsWith('}')) {
        teile.push(`Weiterer Teil des Werts von ${code(this.offeneEigenschaft)}: ${wertText(wert, this.hinweise)}.`);
        if (fertig) this.offeneEigenschaft = null;
        return teile.join(' ');
      }
      this.offeneEigenschaft = null;
    }

    while (rest) {
      let m;
      if ((m = /^\}\s*/.exec(rest))) {
        const regel = this.stapel.pop();
        teile.push(regel ? `Ende ${regel.art === 'at' ? 'des Blocks' : 'der Regel'} ${regel.kurz} (aus ${zeile(regel.nr)}).` : 'Ende des Blocks.');
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^(@[\w-]+)([^{;]*)\{\s*/.exec(rest))) {
        const at = m[1];
        const zusatz = m[2].trim();
        this.stapel.push({ kopf: at + ' ' + zusatz, kurz: `${code(at)}${zusatz ? ` ${code(zusatz, 40)}` : ''}`, art: 'at', nr });
        let s = `${code(at)}${zusatz ? ` ${code(zusatz, 60)}` : ''}: ${AT_REGELN[at] ?? 'eine At-Regel'}`;
        if (at === '@media' && /print/.test(zusatz)) s += ' – hier: nur beim Drucken';
        else if (at === '@media' && (m = /min-width:\s*([\d.]+)(px|rem)/.exec(zusatz))) s += ` – hier: ab ${m[1]} ${m[2]} Fensterbreite`;
        if (at === '@page' && zusatz) s += ` – für die Seitenart „${zusatz}“`;
        teile.push(`${s}.`);
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^(@[\w-]+)\s*([^;]*);?\s*/.exec(rest))) {
        teile.push(`${code(m[1])} ${code(m[2], 70)}: ${AT_REGELN[m[1]] ?? 'eine At-Regel'}.`);
        rest = rest.slice(m[0].length);
        continue;
      }
      // Was vor einer öffnenden Klammer steht, ist ein Selektor – eine
      // Deklaration enthält nie eine geschweifte Klammer.
      if ((m = /^([^{};]+)\{\s*/.exec(rest))) {
        const sel = [...this.selektorTeile, m[1].trim()].join(' ');
        this.selektorTeile = [];
        this.stapel.push({ kopf: sel, kurz: `für ${code(sel, 50)}`, art: 'regel', nr });
        teile.push(`Regel für ${selektor(sel)}:`);
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^(--?[\w-]+|[a-z-]+)\s*:\s*([^;]*?)(;|$)\s*/i.exec(rest)) && this.stapel.length) {
        const [, name, wert, ende] = m;
        if (!ende && (wert.trim().endsWith(',') || !wert.trim())) {
          this.offeneEigenschaft = name;
          teile.push(wert.trim() ? `${deklaration(name, wert.replace(/,\s*$/, ''), this.imTheme, this.hinweise).replace(/\.$/, '')} – weitere Teile folgen.` : `${gross(EIGENSCHAFTEN[name] ?? `Eigenschaft ${code(name)}`)}: Der Wert folgt in den nächsten Zeilen.`);
        } else teile.push(deklaration(name, wert, this.imTheme, this.hinweise));
        rest = rest.slice(m[0].length);
        continue;
      }
      if (/,\s*$/.test(rest) && !this.offeneEigenschaft) {
        this.selektorTeile.push(rest.replace(/\s*$/, ''));
        teile.push(`Selektor ${selektor(rest.replace(/,\s*$/, ''))} – die Regel gilt außerdem für das, was in den nächsten Zeilen folgt.`);
        break;
      }
      teile.push(`${code(rest, 70)}.`);
      break;
    }
    return teile.join(' ');
  }
}

/**
 * Ein ganzes Stilblatt erklären: Kommentare als Blöcke, jede andere Zeile
 * mit `CssZeilen`.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 */
export function erklaereCss(blatt) {
  const leser = new CssZeilen();
  const gesehen = new Set();
  let imKommentar = null;
  let erster = true;
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const t = blatt.text(nr);
    if (imKommentar !== null) {
      if (t.includes('*/')) {
        blatt.gruppe(imKommentar.von, nr, kommentarSatz(imKommentar, blatt, nr));
        imKommentar = null;
        const danach = t.slice(t.indexOf('*/') + 2).trim();
        if (danach) blatt.dazu(nr, leser.zeile(danach, nr));
      }
      continue;
    }
    const s = t.trim();
    if (s.startsWith('/*') && !s.includes('*/')) {
      imKommentar = { von: nr, erster };
      erster = false;
      continue;
    }
    if (/^\/\*.*\*\/$/.test(s)) {
      const inhalt = kommentarInhalt(s.slice(2, -2));
      const titel = /^-+\s*(.*?)\s*-*$/.exec(inhalt);
      blatt.dazu(nr, titel ? `Zwischenüberschrift: Hier beginnt der Abschnitt „${titel[1]}“.` : `Kommentar: „${kuerzen(inhalt, 140)}“ – für Menschen; der Browser überspringt ihn.`);
      erster = false;
      continue;
    }
    if (!s) continue;
    erster = false;
    blatt.dazu(nr, leser.zeile(t, nr));
    for (const h of leser.neueHinweise(gesehen)) blatt.hinweis(nr, h);
  }
}

/** Was ein Kommentarblock in einem Stilblatt ist. */
function kommentarSatz(k, blatt, bis) {
  const text = [];
  for (let i = k.von; i <= bis; i += 1) text.push(blatt.text(i));
  const inhalt = kommentarInhalt(text.join('\n').replace(/^\s*\/\*+/, '').replace(/\*\/\s*$/, ''));
  if (k.erster) {
    return `Kopfkommentar des Stilblatts: ${ersterSatz(inhalt) ? `„${ersterSatz(inhalt)}“ ` : ''}Er erklärt, wofür die Regeln darunter da sind. Alles zwischen /* und */ überspringt der Browser.`;
  }
  const naechste = (() => {
    for (let i = bis + 1; i <= blatt.anzahl; i += 1) if (!blatt.leer(i)) return i;
    return null;
  })();
  return `Kommentar${naechste ? ` zu der Regel ab ${zeile(naechste)}` : ''}: ${ersterSatz(inhalt) ? `„${ersterSatz(inhalt)}“` : 'eine Erklärung für Menschen.'}`;
}
