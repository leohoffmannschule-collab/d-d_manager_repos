/**
 * Eine JavaScript- oder JSX-Datei Zeile für Zeile erklären.
 *
 * Der Ablauf:
 *
 *   1. Den Code in seinen Baum zerlegen (parser.mjs) und zu jedem Knoten
 *      den Elternknoten merken.
 *   2. Die „Köpfe“ finden: Knoten, die in einer anderen Zeile beginnen als
 *      ihr Elternknoten. Das sind die Dinge, die eine Zeile *neu* bringt –
 *      eine Anweisung, ein Argument auf eigener Zeile, ein Attribut, ein
 *      Element. Jeder Kopf bekommt einen Satz (rolle.mjs, anweisung.mjs).
 *   3. Mehrzeilige Vorlagentexte (SQL, HTML …) mit dem Leser ihrer Sprache
 *      erklären (vorlage.mjs).
 *   4. Kommentare als Blöcke eintragen (kommentar.mjs) und Text im Markup
 *      Zeile für Zeile.
 *   5. Was eine Zeile schließt (`}`, `</div>`), aus den Knoten, die dort
 *      enden (schluss.mjs).
 *   6. Was dann noch ohne Erklärung ist, als Fortsetzung des umgebenden
 *      Knotens benennen – damit keine Zeile leer bleibt.
 */
import { Blatt } from '../blatt.mjs';
import { code, zeile, satz } from '../text.mjs';
import { parsen, durchgehen } from './parser.mjs';
import { schnipsel, funktionsName, funktionsArt, istFunktion } from './hilfen.mjs';
import { kopfSatz } from './rolle.mjs';
import { vorlageErklaeren } from './vorlage.mjs';
import { kommentareErklaeren } from './kommentar.mjs';
import { schlussSaetze } from './schluss.mjs';
import { jsxTextSatz } from './jsx.mjs';

/** Knoten, die nie selbst eine Zeile erklären – das tun ihre Eltern oder andere Schritte. */
const NIE_KOPF = new Set([
  'TemplateElement',
  'JSXClosingElement',
  'JSXOpeningElement',
  'JSXIdentifier',
  'JSXMemberExpression',
  'JSXNamespacedName',
  'JSXText',
  'JSXOpeningFragment',
  'JSXClosingFragment',
  'JSXEmptyExpression',
  'InterpreterDirective',
  'Directive',
  'DirectiveLiteral',
]);

/**
 * Die Zeile, an der sich ein Kind messen lassen muss, um als neu zu gelten.
 * Meist die erste Zeile des Elternknotens; bei den Argumenten eines Aufrufs
 * am Ende einer Kette (`db.prepare(…)` ⏎ `.run(a, b)`) aber die Zeile mit
 * `.run(` – dort stehen die Argumente ja, und die Zeile erklärt sie schon.
 */
function ankerzeile(e) {
  const p = e.knoten;
  if (/Call|NewExpression/.test(p.type) && e.schluessel === 'arguments' && /MemberExpression/.test(p.callee.type) && !p.callee.computed) {
    return p.callee.property.loc.start.line;
  }
  return p.loc.start.line;
}

/**
 * @param {Blatt} blatt        das Blatt der Datei (Zeilen schon gelesen)
 * @param {string} datei       Pfad relativ zur Wurzel
 * @param {object} projekt     der Projekt-Index
 * @param {number} [tiefe]     für JavaScript in Vorlagentexten: wie tief verschachtelt
 */
export function erklaereJs(blatt, datei, projekt, tiefe = 0) {
  const text = blatt.zeilen.join('\n');
  const ast = parsen(text);
  const k = {
    datei,
    text,
    zeilen: blatt.zeilen,
    projekt,
    blatt,
    eltern: new Map(),
    zustand: new Map(),
    refs: new Set(),
    anweisungen: new Map(),
    gesehen: new Set(),
    hinweise: [],
    L: 0,
    jsxFunktionen: new Set(),
    eingebettet: null,
  };

  // 1. Elternkarte, Funktionen mit JSX, Köpfe, Enden.
  const koepfe = new Map();
  const enden = new Map();
  const vorlagen = [];
  const jsxTexte = [];
  durchgehen(ast.program, (n, e) => {
    if (e) k.eltern.set(n, e);
    if (n.type === 'JSXElement' || n.type === 'JSXFragment') {
      let x = e;
      while (x) {
        if (istFunktion(x.knoten)) k.jsxFunktionen.add(x.knoten);
        x = k.eltern.get(x.knoten);
      }
    }
    if (n.type === 'TemplateLiteral' && n.loc.end.line > n.loc.start.line) vorlagen.push(n);
    if (n.type === 'JSXText') jsxTexte.push(n);
    if (e && n.loc.end.line > n.loc.start.line) {
      if (!enden.has(n.loc.end.line)) enden.set(n.loc.end.line, []);
      enden.get(n.loc.end.line).push(n);
    }
    if (!e || NIE_KOPF.has(n.type)) return;
    // Die Quelle einer Einfuhr (`} from './x';`) nennt die Schlusszeile.
    if (e.schluessel === 'source') return;
    if (e.knoten.type !== 'Program' && n.loc.start.line === ankerzeile(e)) return;
    const L = n.loc.start.line;
    if (!koepfe.has(L)) koepfe.set(L, []);
    koepfe.get(L).push({ n, e });
  });

  // Zustände vorab: `const [x, setX] = useState(…)` – damit ein Setzer, der in
  // einer Funktion *über* der Festlegung steht, trotzdem erkannt wird.
  durchgehen(ast.program, (n) => {
    if (n.type === 'VariableDeclarator' && n.id.type === 'ArrayPattern' && n.init?.type === 'CallExpression' && n.init.callee.name === 'useState') {
      const [wert, setzer] = n.id.elements;
      if (wert?.type === 'Identifier' && setzer?.type === 'Identifier') k.zustand.set(setzer.name, wert.name);
    }
  });

  // JavaScript in Vorlagentexten: dieselbe Erklärung, eine Ebene tiefer.
  k.eingebettet = (ersatz) => {
    if (tiefe > 1) return null;
    try {
      const unter = new Blatt(ersatz);
      erklaereJs(unter, datei, projekt, tiefe + 1);
      const raus = new Map();
      unter.teile.forEach((teile, i) => {
        const texte = teile.filter((t) => t.art === 'text').map((t) => t.text);
        if (texte.length) raus.set(i + 1, texte);
      });
      for (const g of unter.gruppen) for (let i = g.von; i <= g.bis; i += 1) if (!raus.has(i)) raus.set(i, [g.text]);
      return raus;
    } catch {
      return null;
    }
  };

  /** Was in einer Zeile beginnt, als Satzteil – für „Erklärung zu …“. */
  const benennen = (L) => {
    const liste = koepfe.get(L);
    if (!liste?.length) return null;
    let n = liste[0].n;
    if (n.type === 'ExportNamedDeclaration' || n.type === 'ExportDefaultDeclaration') n = n.declaration ?? n;
    if (istFunktion(n)) {
      const art = funktionsArt(k, n);
      return `${art === 'Hook' ? 'dem Hook' : art === 'Komponente' ? 'der Komponente' : 'der Funktion'} ${code(funktionsName(k, n) ?? '…')}`;
    }
    if (n.type === 'VariableDeclaration') {
      const d = n.declarations[0];
      if (d.id.type === 'Identifier') {
        if (d.init && istFunktion(d.init)) {
          const art = funktionsArt(k, d.init);
          return `${art === 'Hook' ? 'dem Hook' : art === 'Komponente' ? 'der Komponente' : 'der Funktion'} ${code(d.id.name)}`;
        }
        return code(d.id.name);
      }
    }
    if (n.type === 'ObjectProperty' || n.type === 'ObjectMethod') return `dem Feld ${code(n.key?.name ?? n.key?.value ?? '…')}`;
    if (n.type === 'JSXAttribute') return `dem Attribut ${code(n.name.name)}`;
    return null;
  };

  // 2. Köpfe – Zeile für Zeile, in jeder Zeile von links nach rechts.
  const zeilenMitKopf = [...koepfe.keys()].sort((a, b) => a - b);
  for (const L of zeilenMitKopf) {
    const liste = koepfe.get(L).sort((a, b) => a.n.start - b.n.start);
    k.L = L;
    for (const { n, e } of liste) {
      k.hinweise = [];
      let s;
      try {
        s = kopfSatz(n, e, k);
      } catch (fehler) {
        // Ein Fehler im Erklärer soll nicht das ganze Buch kosten: Die Zeile
        // bekommt ihren Code als Erklärung, und der Fehler wird gezählt.
        projekt.fehler?.push({ datei, zeile: L, meldung: fehler.message, stapel: fehler.stack });
        s = schnipsel(k, n, 60);
      }
      blatt.dazu(L, satz(s));
      for (const h of k.hinweise) blatt.hinweis(L, h);
    }
  }

  // 4. Kommentare und Text im Markup.
  kommentareErklaeren(ast.comments ?? [], k, benennen);
  for (const t of jsxTexte) {
    const stuecke = t.value.split('\n');
    stuecke.forEach((stueck, i) => {
      const L = t.loc.start.line + i;
      if (!stueck.trim()) return;
      // Text in derselben Zeile wie sein Element hat das Element schon genannt.
      const el = k.eltern.get(t)?.knoten;
      if (el && i === 0 && L === el.loc.start.line) return;
      blatt.dazu(L, jsxTextSatz(stueck));
    });
  }

  // Die erste Zeile eines direkt startbaren Skripts.
  if ((blatt.text(1) ?? '').startsWith('#!')) {
    blatt.vorn(1, `Die „Shebang“-Zeile: Sie sagt dem Betriebssystem, mit welchem Programm diese Datei läuft, wenn man sie direkt startet (${code('./datei.mjs')}) – hier mit Node.`);
  }

  // 5. Schlusszeilen.
  for (let L = 1; L <= blatt.anzahl; L += 1) {
    const liste = enden.get(L);
    if (!liste?.length) continue;
    const kopfListe = koepfe.get(L) ?? [];
    const ersteSpalte = kopfListe.length ? Math.min(...kopfListe.map((x) => x.n.loc.start.column)) : Infinity;
    k.L = L;
    const { vorher, nachher } = schlussSaetze(liste, ersteSpalte, k);
    for (const s of [...vorher].reverse()) blatt.vorn(L, s);
    for (const s of nachher) blatt.dazu(L, s);
  }

  // 5b. Vorlagentexte – nach den Schlusszeilen, damit ihr Inhalt in der
  // Zeile vor dem steht, was dort endet oder eingesetzt wird.
  for (const v of vorlagen) {
    k.L = v.loc.start.line;
    k.hinweise = [];
    vorlageErklaeren(v, k);
  }

  // 6. Was jetzt noch fehlt: die Fortsetzung des innersten Knotens, der die Zeile umfasst.
  for (const L of blatt.offen()) {
    let innerster = null;
    let fall = null;
    durchgehen(ast.program, (n) => {
      if (n.loc.start.line < L && n.loc.end.line >= L && (!innerster || n.end - n.start < innerster.end - innerster.start)) innerster = n;
      // `) : (` zwischen zwei Fassungen im Markup: Ende der einen, Anfang der anderen.
      if (n.type === 'ConditionalExpression' && n.consequent.loc.end.line <= L && n.alternate.loc.start.line >= L && n.loc.start.line < L) fall = n;
    });
    k.L = L;
    if (fall && /:/.test(blatt.text(L))) {
      blatt.dazu(L, `Ende der ersten Fassung (die gilt, wenn die Bedingung aus ${zeile(fall.loc.start.line)} zutrifft); was nach dem ${code(':')} folgt, gilt sonst (ab ${zeile(fall.alternate.loc.start.line)}).`);
      continue;
    }
    blatt.dazu(L, innerster ? `Fortsetzung von ${schnipsel(k, innerster, 50)} (aus ${zeile(innerster.loc.start.line)}).` : `${code(blatt.text(L).trim(), 60)}.`);
  }
  return blatt;
}
