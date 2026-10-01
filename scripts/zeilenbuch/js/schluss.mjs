/**
 * Zeilen, die etwas schließen: `}`, `});`, `</div>`, `)`.
 *
 * Eine schließende Klammer ist für sich nichtssagend – sie wird verständlich
 * durch das, was sie beendet, und wo es angefangen hat. Gesucht werden
 * deshalb alle Knoten, die in dieser Zeile enden und in einer früheren
 * begonnen haben. Weil an einer einzigen `}` oft mehrere Knoten enden (der
 * Block, die Funktion, die Anweisung um sie herum), wird je Stelle der
 * aussagekräftigste genommen: lieber „Ende der Funktion `speichern`“ als
 * „Ende des Blocks“.
 */
import { code, zeile, aufzaehlen } from '../text.mjs';
import { METHODE } from '../woerterbuch/node.mjs';
import { schnipsel, nameVon, eltern, funktionsName, funktionsArt } from './hilfen.mjs';
import { elementName } from './jsx.mjs';

/** Wie wichtig das Ende eines Knotens zum Verstehen ist (0: gar nicht erwähnen). */
const GEWICHT = {
  FunctionDeclaration: 9,
  ArrowFunctionExpression: 9,
  FunctionExpression: 9,
  ObjectMethod: 9,
  JSXElement: 9,
  JSXFragment: 9,
  JSXOpeningElement: 8,
  IfStatement: 8,
  ForOfStatement: 8,
  ForInStatement: 8,
  ForStatement: 8,
  WhileStatement: 8,
  TryStatement: 8,
  CatchClause: 7,
  CallExpression: 7,
  OptionalCallExpression: 7,
  NewExpression: 6,
  ObjectExpression: 6,
  ArrayExpression: 6,
  TemplateLiteral: 6,
  ImportDeclaration: 6,
  ExportNamedDeclaration: 5,
  JSXExpressionContainer: 5,
  ConditionalExpression: 5,
  ObjectPattern: 5,
  ArrayPattern: 5,
  ReturnStatement: 4,
  VariableDeclaration: 4,
  LogicalExpression: 4,
  ThrowStatement: 4,
  JSXAttribute: 4,
  BlockStatement: 3,
  AssignmentExpression: 3,
  BinaryExpression: 2,
  ObjectProperty: 2,
  ExportDefaultDeclaration: 1,
};

/** „der Funktion `x`“, „der Komponente `X`“, „des Hooks `useX`“. */
function funktionMitArtikel(k, f) {
  const name = funktionsName(k, f);
  const art = funktionsArt(k, f);
  if (name) return art === 'Hook' ? `des Hooks ${code(name)}` : art === 'Komponente' ? `der Komponente ${code(name)}` : `der Funktion ${code(name)}`;
  const e = eltern(k, f);
  if (e?.knoten.type === 'CallExpression' && e.schluessel === 'arguments') {
    const c = e.knoten.callee;
    const methode = c.type === 'MemberExpression' && !c.computed ? c.property.name : null;
    // Eine Liste von Elementen im Markup: `{liste.map((x) => (…))}`.
    if (methode === 'map' && eltern(k, e.knoten)?.knoten.type === 'JSXExpressionContainer') return `der Liste von Elementen (${code('.map')})`;
    if (methode) return `der Funktion für ${code('.' + methode)}`;
    const ruf = nameVon(c);
    if (ruf) return `der Funktion für ${code(ruf)}`;
  }
  if (e?.knoten.type === 'JSXExpressionContainer') return 'der Funktion für das Ereignis';
  return 'der Funktion';
}

/** Wem ein Objekt oder eine Liste gehört: „des Objekts `einstellungen`“. */
function besitzer(k, n) {
  const e = eltern(k, n);
  if (!e) return '';
  if (e.knoten.type === 'VariableDeclarator' && e.knoten.id.type === 'Identifier') return ` ${code(e.knoten.id.name)}`;
  if (e.knoten.type === 'ObjectProperty' && e.schluessel === 'value') return ` im Feld ${code(e.knoten.key?.name ?? e.knoten.key?.value ?? '…')}`;
  if (/Call/.test(e.knoten.type) && e.schluessel === 'arguments') {
    const ruf = nameVon(e.knoten.callee);
    return ruf ? ` für ${code(ruf)}` : '';
  }
  return '';
}

/** Was endet, als Satzteil – oder null, wenn es nicht der Rede wert ist. */
function endeVon(n, k) {
  const ab = `(aus ${zeile(n.loc.start.line)})`;
  const e = eltern(k, n);
  switch (n.type) {
    case 'FunctionDeclaration':
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'ObjectMethod':
      return `Ende ${funktionMitArtikel(k, n)} ${ab}`;
    case 'BlockStatement': {
      const p = e?.knoten;
      if (!p) return `Ende des Blocks ${ab}`;
      if (p.type === 'IfStatement') return e.schluessel === 'consequent' ? `Ende des Dann-Zweigs (zum ${code('if')} aus ${zeile(p.loc.start.line)})` : `Ende des Sonst-Zweigs ${ab}`;
      if (/For|While/.test(p.type)) return `Ende des Schleifenkörpers ${ab}`;
      if (p.type === 'TryStatement') return e.schluessel === 'finalizer' ? `Ende des finally-Teils ${ab}` : `Ende des try-Teils ${ab}`;
      if (p.type === 'CatchClause') return `Ende des catch-Teils ${ab}`;
      if (/Function|ObjectMethod/.test(p.type)) return null;
      return `Ende des Blocks ${ab}`;
    }
    case 'IfStatement':
      return `Ende des ${code('if')} aus ${zeile(n.loc.start.line)}`;
    case 'ForOfStatement':
    case 'ForInStatement':
    case 'ForStatement':
    case 'WhileStatement':
      return `Ende der Schleife ${ab}`;
    case 'TryStatement':
      return `Ende von ${code('try … catch')} ${ab}`;
    case 'CatchClause':
      return `Ende des catch-Teils ${ab}`;
    case 'CallExpression':
    case 'OptionalCallExpression': {
      // Ein Zwischenglied einer Kette (`db.prepare(…)` vor `.all(…)`) endet
      // nicht wirklich – es geht mit dem nächsten Glied weiter.
      if (/MemberExpression/.test(e?.knoten.type ?? '') && e.schluessel === 'object') {
        const weiter = e.knoten.property;
        // Nur erwähnen, wenn die Zeile sonst nichts sagt (eine Klammer allein).
        if (!/^[)\]}]+;?$/.test((k.zeilen[n.loc.end.line - 1] ?? '').trim())) return null;
        return `Ende von ${code((nameVon(n.callee) ?? '…') + '(…)')} ${ab}; die Kette geht in ${zeile(weiter.loc.start.line)} mit ${code('.' + (weiter.name ?? '…'))} weiter`;
      }
      const name = nameVon(n.callee);
      if (name && /^(router|app)\.(get|post|put|patch|delete)$/.test(name)) return `Ende des Weges ${METHODE[name.split('.')[1]].split(' ')[0]} ${ab}`;
      if (name === 'useEffect' || name === 'useLayoutEffect') return `Ende des Effekts ${ab}`;
      return `Ende des Aufrufs ${name ? code(name) : n.callee.type === 'MemberExpression' && !n.callee.computed ? code('.' + n.callee.property.name) : schnipsel(k, n.callee, 30)} ${ab}`;
    }
    case 'NewExpression':
      return `Ende von ${code('new ' + (nameVon(n.callee) ?? '…'))} ${ab}`;
    case 'ObjectExpression':
      return `Ende des Objekts${besitzer(k, n)} ${ab}`;
    case 'ArrayExpression':
      return `Ende der Liste${besitzer(k, n)} ${ab}`;
    case 'ObjectPattern':
    case 'ArrayPattern':
      return `Ende der Zerlegung ${ab}`;
    case 'TemplateLiteral':
      return `Ende des mehrzeiligen Texts ${ab}`;
    case 'JSXElement': {
      const name = elementName(n);
      return `Schließt ${/^[a-z]/.test(name) ? 'das' : 'die Komponente'} ${code(`<${name}>`)} ${ab}`;
    }
    case 'JSXFragment':
      return `Schließt die Gruppe ${code('<>')} ${ab}`;
    case 'JSXOpeningElement': {
      const name = elementName({ name: n.name });
      if (n.selfClosing) return `Ende von ${code(`<${name} … />`)} ${ab} – das Element hat keinen Inhalt`;
      return `Ende des öffnenden ${code(`<${name}>`)} ${ab}; jetzt folgt sein Inhalt`;
    }
    case 'JSXExpressionContainer':
      return `Ende des JavaScript-Teils ${code('{…}')} ${ab}`;
    case 'JSXAttribute':
      return `Ende des Attributs ${code(n.name.name)} ${ab}`;
    case 'ReturnStatement':
      return `Ende der Rückgabe ${ab}`;
    case 'VariableDeclaration': {
      const namen = n.declarations.map((d) => (d.id.type === 'Identifier' ? code(d.id.name) : null)).filter(Boolean);
      return `Ende der Festlegung${namen.length ? ` von ${aufzaehlen(namen)}` : ''} ${ab}`;
    }
    case 'ImportDeclaration':
      return `Ende der Einfuhr ${ab} – die Namen kommen aus ${code(n.source.value)}`;
    case 'ExportNamedDeclaration':
      return n.declaration ? null : `Ende der Ausfuhr ${ab}`;
    case 'ConditionalExpression':
      return `Ende der Fallunterscheidung ${code('? :')} ${ab}`;
    case 'LogicalExpression':
      return `Ende der Bedingung ${ab}`;
    case 'ThrowStatement':
      return `Ende der ${code('throw')}-Anweisung ${ab}`;
    case 'AssignmentExpression':
      return `Ende der Zuweisung an ${code(nameVon(n.left) ?? '…', 40)} ${ab}`;
    case 'BinaryExpression':
      return `Ende der Rechnung ${ab}`;
    case 'ObjectProperty':
      return `Ende des Feldes ${code(n.key?.name ?? n.key?.value ?? '…')} ${ab}`;
    default:
      return null;
  }
}

/** Ist `a` ein Vorfahre von `b`? */
function umfasst(a, b) {
  return a.start <= b.start && b.end <= a.end && a !== b;
}

/**
 * Was in einer Zeile endet – als Sätze, getrennt nach „vor den neuen
 * Teilen der Zeile“ und „danach“.
 *
 * @param {object[]} enden    Knoten, die in dieser Zeile enden und früher begannen
 * @param {number} ersteSpalte  wo in der Zeile der erste neue Teil beginnt (oder Infinity)
 * @param {object} k
 * @returns {{ vorher: string[], nachher: string[] }}
 */
export function schlussSaetze(enden, ersteSpalte, k) {
  let kandidaten = enden.filter((n) => (GEWICHT[n.type] ?? 0) > 0);
  // `{liste.map((x) => (…))}`: Endet die Funktion in dieser Zeile, sagt
  // „Ende der Liste von Elementen“ schon alles über den Aufruf um sie herum.
  kandidaten = kandidaten.filter(
    (n) =>
      !(/Call/.test(n.type) && n.callee.property?.name === 'map' && eltern(k, n)?.knoten.type === 'JSXExpressionContainer' && n.arguments.some((a) => enden.includes(a)))
  );
  // Je Stelle (Ende im Text) nur der gewichtigste Knoten.
  const jeStelle = new Map();
  for (const n of kandidaten) {
    const bisher = jeStelle.get(n.end);
    if (!bisher || (GEWICHT[n.type] ?? 0) > (GEWICHT[bisher.type] ?? 0)) jeStelle.set(n.end, n);
  }
  kandidaten = [...jeStelle.values()];
  // Zwei, die in derselben Zeile begannen und ineinander stecken: nur der gewichtigere.
  kandidaten = kandidaten.filter(
    (n) =>
      !kandidaten.some(
        (m) =>
          m !== n &&
          m.loc.start.line === n.loc.start.line &&
          (umfasst(m, n) || umfasst(n, m)) &&
          ((GEWICHT[m.type] ?? 0) > (GEWICHT[n.type] ?? 0) || ((GEWICHT[m.type] ?? 0) === (GEWICHT[n.type] ?? 0) && umfasst(m, n)))
      )
  );
  kandidaten.sort((a, b) => a.end - b.end);
  const vorher = [];
  const nachher = [];
  for (const n of kandidaten.slice(0, 3)) {
    const t = endeVon(n, k);
    if (!t) continue;
    (n.loc.end.column <= ersteSpalte ? vorher : nachher).push(`${t}.`);
  }
  return { vorher, nachher };
}
