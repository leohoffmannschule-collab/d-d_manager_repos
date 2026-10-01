/**
 * HTML Zeile für Zeile erklären.
 *
 * HTML beschreibt, *was* auf einer Seite steht: Elemente in spitzen
 * Klammern (`<p>…</p>`), mit Attributen (`class="knopf"`), ineinander
 * verschachtelt. Gebraucht wird das für die echten HTML-Dateien
 * (frontend/index.html, die Entwürfe in design/) und für HTML, das der Code
 * als Vorlagentext zusammensetzt (das mitgenommene Blatt, der Drucksatz,
 * das Handbuch) – dort stehen eingesetzte Werte als „…“.
 *
 * Der Leser merkt sich, welche Elemente offen sind, damit ein schließendes
 * `</div>` sagen kann, wo es geöffnet wurde, und ein Tag, dessen Attribute
 * über mehrere Zeilen gehen, auf jeder Zeile weiß, zu wem sie gehören.
 */
import { code, zeile, kuerzen, gross, zitat } from './text.mjs';
import { ELEMENTE, HTML_ATTRIBUTE, META, LINK } from './woerterbuch/html.mjs';
import { klassenErklaeren } from './tailwind.mjs';

/** Die Attribute aus einem Stück Tag: `a="1" b c='2'` → [{ name, wert }]. */
function attributeLesen(text) {
  const raus = [];
  for (const m of text.matchAll(/([:@\w-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+))?/g)) {
    raus.push({ name: m[1], wert: m[3] ?? m[4] ?? (m[2] && !/^["']/.test(m[2]) ? m[2] : m[2] === undefined ? null : '') });
  }
  return raus;
}

/** Ein Leser für HTML, Zeile für Zeile. */
export class HtmlZeilen {
  /** @param {object} [projekt] der Projekt-Index – für die Klassen aus den Stilblättern */
  constructor(projekt) {
    this.projekt = projekt;
    this.offen = [];
    this.imTag = null;
    this.imKommentar = false;
    this.imSkript = null;
  }

  /** Ein Attribut in Worten. */
  attribut(tag, a) {
    if (a.name === 'class') return `Klassen: ${klassenErklaeren(a.wert ?? '', this.projekt).text}`;
    if (tag === 'meta' && a.name === 'content') return `Wert ${code(a.wert ?? '', 70)}`;
    const was = HTML_ATTRIBUTE[a.name] ?? (a.name.startsWith('data-') ? 'eigenes Datenattribut' : a.name.startsWith('aria-') ? 'Angabe für Vorleseprogramme' : null);
    if (a.wert === null) return `${code(a.name)}${was ? ` (${was})` : ''}`;
    return `${code(a.name)} = „${kuerzen(a.wert, 60)}“${was ? ` (${was})` : ''}`;
  }

  /** Ein öffnendes Tag in Worten. */
  oeffnend(tag, attrText, nr, selbst) {
    const name = tag.toLowerCase();
    const attrs = attributeLesen(attrText);
    const wert = (n) => attrs.find((a) => a.name === n)?.wert;
    if (name === 'meta') {
      if (wert('charset')) return `Die Zeichenkodierung ist ${code(wert('charset'))} – damit stimmen Umlaute und alle anderen Zeichen.`;
      const n = wert('name') ?? wert('http-equiv');
      if (n) return `Angabe ${code(n)}${META[n] ? `: ${META[n]}` : ''}${wert('content') !== undefined ? ` – Wert ${code(wert('content'), 70)}` : ''}.`;
    }
    if (name === 'link' && wert('rel')) {
      return `Verweis (${code(wert('rel'))}): ${LINK[wert('rel')] ?? 'eine zugehörige Datei'} – ${code(wert('href') ?? '', 60)}.`;
    }
    if (name === 'script') {
      const quelle = wert('src');
      return quelle
        ? `Lädt das Skript ${code(quelle)}${wert('type') === 'module' ? ' als Modul (es darf andere Dateien mit import holen)' : ''}.`
        : 'Ein eingebettetes Skript.';
    }
    const was = ELEMENTE[name];
    const teile = [`${gross(`ein ${code(`<${name}>`)}`)}${was ? ` (${was})` : ''}`];
    const beschrieben = attrs.map((a) => this.attribut(name, a));
    if (beschrieben.length) teile[0] += ` – ${beschrieben.join('; ')}`;
    if (name === 'html' && wert('data-theme') === 'kerzenlicht') teile.push('Mit data-theme="kerzenlicht" gilt auf der ganzen Seite die dunkle Fassung');
    if (!selbst && !['meta', 'link', 'img', 'br', 'hr', 'input', 'col'].includes(name)) this.offen.push({ name, nr });
    return teile.join('. ') + '.';
  }

  /**
   * Die Erklärung einer Zeile.
   *
   * @param {string} roh  die Zeile
   * @param {number} nr   ihre Nummer – für „schließt das <div> aus Zeile N“
   */
  zeile(roh, nr) {
    let rest = roh.trim();
    if (!rest) return '';
    const teile = [];
    if (this.imKommentar) {
      if (rest.includes('-->')) {
        this.imKommentar = false;
        rest = rest.slice(rest.indexOf('-->') + 3).trim();
        teile.push('Ende des Kommentars.');
      } else return 'Fortsetzung des Kommentars (für Menschen; der Browser zeigt ihn nicht).';
    }
    if (this.imTag) {
      const ende = rest.indexOf('>');
      const attrText = ende === -1 ? rest : rest.slice(0, ende);
      const attrs = attributeLesen(attrText.replace(/\/$/, ''));
      if (attrs.length) teile.push(`${attrs.length > 1 ? 'Weitere Attribute' : 'Weiteres Attribut'} von ${code(`<${this.imTag.name}>`)}: ${attrs.map((a) => this.attribut(this.imTag.name, a)).join('; ')}.`);
      if (ende === -1) return teile.join(' ');
      const selbst = /\/\s*$/.test(rest.slice(0, ende));
      teile.push(selbst ? `Ende von ${code(`<${this.imTag.name} … />`)} (aus ${zeile(this.imTag.nr)}).` : `Ende des öffnenden ${code(`<${this.imTag.name}>`)} (aus ${zeile(this.imTag.nr)}); es folgt sein Inhalt.`);
      if (!selbst && !['meta', 'link', 'img', 'br', 'input'].includes(this.imTag.name)) this.offen.push({ name: this.imTag.name, nr: this.imTag.nr });
      this.imTag = null;
      rest = rest.slice(ende + 1).trim();
    }
    while (rest) {
      let m;
      if ((m = /^<!doctype[^>]*>\s*/i.exec(rest))) {
        teile.push('Sagt dem Browser: Dies ist modernes HTML (HTML5).');
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^<!--([\s\S]*?)(-->|$)\s*/.exec(rest))) {
        if (!m[2]) this.imKommentar = true;
        teile.push(`Kommentar im HTML: „${kuerzen(m[1].trim(), 120)}“ – der Browser zeigt ihn nicht.`);
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^<\/([\w-]+)\s*>\s*/.exec(rest))) {
        const name = m[1].toLowerCase();
        const i = this.offen.map((o) => o.name).lastIndexOf(name);
        const auf = i >= 0 ? this.offen.splice(i)[0] : null;
        teile.push(auf && auf.nr !== nr ? `Schließt das ${code(`<${name}>`)} aus ${zeile(auf.nr)}.` : `Schließt ${code(`<${name}>`)}.`);
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^<([\w-]+)([^>]*?)(\/?)>\s*/.exec(rest))) {
        teile.push(this.oeffnend(m[1], m[2], nr, Boolean(m[3])));
        rest = rest.slice(m[0].length);
        continue;
      }
      if ((m = /^<([\w-]+)(.*)$/.exec(rest))) {
        // Ein Tag, dessen Attribute in den nächsten Zeilen weitergehen.
        const name = m[1].toLowerCase();
        const attrs = attributeLesen(m[2]);
        this.imTag = { name, nr };
        teile.push(`${gross(`ein ${code(`<${name}>`)}`)}${ELEMENTE[name] ? ` (${ELEMENTE[name]})` : ''}${attrs.length ? ` – ${attrs.map((a) => this.attribut(name, a)).join('; ')}` : ''}; weitere Attribute folgen.`);
        break;
      }
      const text = /^[^<]+/.exec(rest)[0];
      const sauber = text.trim();
      if (sauber) teile.push(sauber === '…' ? 'Hier wird ein Wert eingesetzt.' : `Text: ${zitat(kuerzen(sauber, 120))}.`);
      rest = rest.slice(text.length).trim();
    }
    return teile.join(' ');
  }
}

/**
 * Eine ganze HTML-Datei erklären.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 * @param {object} projekt
 */
export function erklaereHtml(blatt, projekt) {
  const leser = new HtmlZeilen(projekt);
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    if (blatt.leer(nr)) continue;
    blatt.dazu(nr, leser.zeile(blatt.text(nr), nr));
  }
}

