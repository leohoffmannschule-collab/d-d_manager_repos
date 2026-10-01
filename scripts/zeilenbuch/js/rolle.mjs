/**
 * Ein Teil auf eigener Zeile: welche Rolle er im Ganzen spielt.
 *
 * Langer Code wird auf mehrere Zeilen verteilt – die Argumente eines
 * Aufrufs, die Felder eines Objekts, die Attribute eines Elements, die
 * Glieder einer Kette (`.filter(…)` / `.map(…)`). Eine solche Zeile ist erst
 * verständlich, wenn man weiß, wozu sie gehört: „Zweites Argument für
 * `useEffect`: die Abhängigkeiten …“. Dieses Modul sagt das – abhängig davon,
 * in welchem Feld des Elternknotens der Teil steht.
 */
import { code, zeile, aufzaehlen, gross, ordnung, dativ } from '../text.mjs';
import { METHODEN, OPERATOREN } from '../woerterbuch/javascript.mjs';
import { quelle, schnipsel, hier, hinweis, nameVon, eltern, funktionsName, funktionsArt, istKomponente, namenIn, istFunktion } from './hilfen.mjs';
import { wendung, kurzwert, bedingung, funktionWendung } from './ausdruck.mjs';
import { aufrufWendung, abhaengigkeiten, bedeutung, besonders } from './aufruf.mjs';
import { jsxElementSatz, jsxAttributSatz, jsxKindSatz, jsxWendung, klein } from './jsx.mjs';
import { anweisung, wenn, festlegung, eingefuehrt, funktionsSatz } from './anweisung.mjs';

/** Ein Wert als Satzteil – Elemente der Oberfläche als ganze Beschreibung. */
function wert(n, k) {
  if (n.type === 'JSXElement' || n.type === 'JSXFragment') return jsxElementSatz(n, k).replace(/\.$/, '');
  return kurzwert(n, k);
}

/** Steht der Ausdruck in einer Bedingung (if, while, ? :) – oder ist er ein Wert? */
function inBedingung(k, n) {
  let kind = n;
  let e = eltern(k, n);
  while (e && (e.knoten.type === 'LogicalExpression' || (e.knoten.type === 'UnaryExpression' && e.knoten.operator === '!'))) {
    kind = e.knoten;
    e = eltern(k, e.knoten);
  }
  if (!e) return false;
  return ['IfStatement', 'WhileStatement', 'ConditionalExpression', 'ForStatement', 'DoWhileStatement'].includes(e.knoten.type) && e.schluessel === 'test' && e.knoten.test === kind;
}

/** Ein Argument auf eigener Zeile. */
function argumentSatz(n, ruf, i, k) {
  const name = nameVon(ruf.callee);
  // Das Glied einer Kette (`db.prepare(…).run(`) heißt nach seiner Methode.
  const glied = ruf.callee.type === 'MemberExpression' && !ruf.callee.computed ? code(`.${ruf.callee.property.name}(…)`) : null;
  const wer = name ? code(name) : glied ?? schnipsel(k, ruf.callee, 30);
  const letzt = name?.split('.').pop();
  if (['useEffect', 'useLayoutEffect', 'useMemo', 'useCallback'].includes(name)) {
    if (i === 0 && istFunktion(n)) {
      const was = name === 'useMemo' ? 'Die Rechnung, deren Ergebnis gemerkt wird' : name === 'useCallback' ? 'Die Funktion, die gemerkt wird' : 'Der Effekt selbst – React führt diese Funktion nach dem Zeichnen aus';
      return `${was}: ${funktionWendung(n, k)}.`;
    }
    if (i === 1) return `Die Abhängigkeiten von ${wer}: ${abhaengigkeiten(n, k, name === 'useMemo' ? 'memo' : name === 'useCallback' ? 'callback' : 'effekt')}.`;
  }
  if (/^(router|app)\.(get|post|put|patch|delete)$/.test(name ?? '')) {
    if (i === 0) return `Der Pfad des Weges: ${kurzwert(n, k)}.`;
    if (i === ruf.arguments.length - 1 && istFunktion(n)) {
      return `Was bei einer passenden Anfrage geschieht: ${funktionWendung(n, k)}. ${code('req')} ist die Anfrage, ${code('res')} die Antwort.`;
    }
    const b = n.type === 'Identifier' ? bedeutung(n, k) : null;
    return `Vorher prüft ${kurzwert(n, k)}${b ? ` – ${b.text}` : ''}; nur wenn er die Anfrage durchlässt, geht es weiter.`;
  }
  if (istFunktion(n) && ['map', 'filter', 'find', 'findIndex', 'some', 'every', 'forEach', 'flatMap', 'sort', 'reduce'].includes(letzt)) {
    const p = n.params[0] ? code(namenIn(n.params[0]).join(', ') || quelle(k, n.params[0])) : null;
    hinweis(k, `methode:${letzt}`, `${code('.' + letzt)} – ${METHODEN[letzt]}`);
    return `Die Funktion für ${code('.' + letzt)}: ${funktionWendung(n, k)}${p && letzt !== 'sort' && letzt !== 'reduce' ? ` – sie bekommt jeden Eintrag einzeln als ${p}` : ''}.`;
  }
  if (istFunktion(n) && (name ?? '').endsWith('addEventListener')) return `Die Funktion, die beim Ereignis läuft: ${funktionWendung(n, k)}.`;
  if (istFunktion(n) && name === 'setTimeout') return `Was nach Ablauf der Zeit geschieht: ${funktionWendung(n, k)}.`;
  if (n.type === 'TemplateLiteral' && /prepare|exec/.test(letzt ?? '')) return `Die SQL-Anweisung für ${wer}: ${wendung(n, k)}.`;
  return `${gross(ordnung(i, 's'))} Argument für ${wer}: ${wert(n, k)}.`;
}

/** Ein Glied einer Kette auf eigener Zeile: `.filter(…)`, `.then(…)`. */
function kettenSatz(member, k) {
  const e = eltern(k, member);
  const m = member.property.name ?? quelle(k, member.property);
  const ruf = e && /Call/.test(e.knoten.type) && e.knoten.callee === member ? e.knoten : null;
  if (!ruf) return `… davon das Feld ${code(m)}.`;
  const args = ruf.arguments.filter((a) => hier(k, a));
  const mit = args.length ? ` mit ${aufzaehlen(args.map((a) => dativ(istFunktion(a) ? funktionWendung(a, k) : kurzwert(a, k))))}` : '';
  if (m === 'then') return `Sobald das Ergebnis da ist (${code('.then')}): ${args[0] && istFunktion(args[0]) ? funktionWendung(args[0], k) : mit || 'geht es weiter'}.`;
  if (m === 'catch') return `Geht dabei etwas schief (${code('.catch')}): ${args[0] && istFunktion(args[0]) ? funktionWendung(args[0], k) : mit || 'wird der Fehler aufgefangen'}.`;
  if (m === 'finally') return `Am Ende in jedem Fall (${code('.finally')}): ${args[0] ? funktionWendung(args[0], k) : ''}.`;
  const muster = besonders(ruf, k);
  if (muster?.satz) return `Dann ${code('.' + m + '(…)')}: ${klein(muster.satz)}.`;
  const b = bedeutung(member, k);
  if (b) hinweis(k, b.schluessel, `${code(b.name)} – ${b.text}`);
  if (['map', 'filter', 'find', 'some', 'every', 'forEach', 'flatMap', 'sort'].includes(m) && args[0] && istFunktion(args[0])) {
    return `Dann ${code('.' + m)}: ${METHODEN[m]} – ${funktionWendung(args[0], k)}.`;
  }
  return `Dann ${code('.' + m + '(…)')}${b ? `: ${b.text}` : ''}${mit ? ` –${mit}` : ''}.`;
}

/** Ein Feld eines Objekts auf eigener Zeile. */
function feldSatz(n, objekt, k) {
  if (n.type === 'SpreadElement') return `Übernimmt alle Felder von ${kurzwert(n.argument, k)} (Spread).`;
  const schl = n.computed ? `[${quelle(k, n.key)}]` : n.key?.name ?? n.key?.value ?? quelle(k, n.key);
  if (n.type === 'ObjectMethod') return funktionsSatz(n, schl, k).replace(/^Beginnt die Funktion/, 'Die Methode');
  // Ein Feld eines ausgeführten Schnittstellen-Objekts: welcher Weg dahinter liegt.
  const besitzer = eltern(k, objekt);
  if (besitzer?.knoten.type === 'VariableDeclarator' && besitzer.knoten.id.type === 'Identifier') {
    const def = k.projekt.dateien.get(k.datei)?.defs.get(`${besitzer.knoten.id.name}.${schl}`);
    if (def?.api) {
      const weg = k.projekt.wegZu(def.api);
      return `Feld ${code(String(schl))}: schickt ${def.api.methode} an ${code(weg?.pfad ?? '/api' + def.api.pfad)}${weg?.text ? ` – „${weg.text.replace(/\s+/g, ' ').replace(/^(GET|POST|PUT|PATCH|DELETE)\s+\S+\s*(\{[^}]*\}\s*)?[–-]?\s*/, '').split(/(?<=[.!?])\s/)[0]}“` : ''}.`;
    }
  }
  const v = n.value;
  if (n.shorthand) return `Feld ${code(String(schl))} – mit dem Wert der gleichnamigen Variablen.`;
  if (!hier(k, v)) return `Feld ${code(String(schl))}: Der Wert folgt ab ${zeile(v.loc.start.line)}.`;
  if (istFunktion(v)) return `Feld ${code(String(schl))}: ${funktionWendung(v, k)}.`;
  return `Feld ${code(String(schl))}: ${wert(v, k)}.`;
}

/** Ein Feld einer Zerlegung auf eigener Zeile – bei einer Komponente: eine Prop. */
function zerlegungSatz(n, muster, k) {
  if (n.type === 'RestElement') return `Alles Übrige kommt gesammelt in ${code(namenIn(n.argument)[0] ?? '…')}.`;
  const schl = n.key?.name ?? n.key?.value ?? quelle(k, n.key);
  const e = eltern(k, muster);
  const prop = e && istFunktion(e.knoten) && e.schluessel === 'params' && istKomponente(k, e.knoten);
  const v = n.value;
  const vorgabe = v?.type === 'AssignmentPattern' ? ` (Vorgabe, wenn nichts mitkommt: ${kurzwert(v.right, k)})` : '';
  const anders = v && v.type === 'Identifier' && v.name !== schl ? `, hier ${code(v.name)} genannt` : '';
  return prop ? `Prop ${code(String(schl))}${anders}${vorgabe}.` : `Holt ${code(String(schl))} heraus${anders}${vorgabe}.`;
}

/**
 * Der Satz zu einem Teil, der auf eigener Zeile beginnt.
 *
 * @param {object} n  der Knoten
 * @param {{ knoten: object, schluessel: string, stelle: number|null }} e  sein Elternknoten
 * @param {object} k  Kontext
 */
export function kopfSatz(n, e, k) {
  const p = e.knoten;
  const s = e.schluessel;
  if (p.type === 'Program' || (p.type === 'BlockStatement' && s === 'body') || (p.type === 'SwitchCase' && s === 'consequent')) return anweisung(n, k);

  switch (p.type) {
    case 'IfStatement':
      if (s === 'test') return `Die Bedingung des ${code('if')} aus ${zeile(p.loc.start.line)}: ${bedingung(n, k)}.`;
      if (s === 'consequent') return n.type === 'BlockStatement' ? `Dann – wenn die Bedingung aus ${zeile(p.loc.start.line)} zutrifft – geschieht Folgendes (bis ${zeile(n.loc.end.line)}):` : `Dann: ${anweisung(n, k)}`;
      if (n.type === 'IfStatement') return wenn(n, k, true);
      if (n.type === 'BlockStatement') return `Sonst – wenn die Bedingung aus ${zeile(p.loc.start.line)} nicht zutrifft – geschieht Folgendes (bis ${zeile(n.loc.end.line)}):`;
      return `Sonst: ${anweisung(n, k)}`;
    case 'ForOfStatement':
    case 'ForInStatement':
    case 'ForStatement':
    case 'WhileStatement':
      if (s === 'body') return n.type === 'BlockStatement' ? `Bei jedem Durchlauf geschieht Folgendes (bis ${zeile(n.loc.end.line)}):` : `Bei jedem Durchlauf: ${anweisung(n, k)}`;
      return `Teil des Schleifenkopfs aus ${zeile(p.loc.start.line)}: ${kurzwert(n, k)}.`;
    case 'TryStatement':
      if (s === 'handler') {
        const fehler = n.param ? code(quelle(k, n.param)) : null;
        const rumpf = n.body;
        const inhalt = rumpf.body.length && hier(k, rumpf.body[0]) ? ` ${anweisung(rumpf.body[0], k)}` : '';
        return `Hier landet ein Fehler aus dem try-Teil (ab ${zeile(p.loc.start.line)})${fehler ? `; er heißt hier ${fehler}` : ' – der Fehler selbst wird nicht gebraucht'}.${inhalt}`;
      }
      if (s === 'finalizer') return `Läuft am Ende in jedem Fall – ob im try-Teil (ab ${zeile(p.loc.start.line)}) ein Fehler auftrat oder nicht (bis ${zeile(n.loc.end.line)}).`;
      return `Der try-Teil: ${anweisung(n, k)}`;
    case 'CallExpression':
    case 'OptionalCallExpression':
    case 'NewExpression':
      if (s === 'arguments') return argumentSatz(n, p, e.stelle, k);
      return `Gerufen wird ${kurzwert(n, k)}.`;
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      if (s === 'property') return kettenSatz(p, k);
      return `${gross(kurzwert(n, k))} – davon ${code(quelle(k, p.property))}.`;
    case 'ObjectExpression':
      return feldSatz(n, p, k);
    case 'ObjectPattern':
      return zerlegungSatz(n, p, k);
    case 'ArrayExpression':
      return `${gross(ordnung(e.stelle, 'r'))} Eintrag der Liste: ${wert(n, k)}.`;
    case 'ArrayPattern':
      return `An ${ordnung(e.stelle, 'r')} Stelle: ${kurzwert(n, k)}.`;
    case 'ObjectProperty':
      if (s === 'value') return `Der Wert von ${code(p.key?.name ?? p.key?.value ?? '…')}: ${istFunktion(n) ? funktionWendung(n, k) : wert(n, k)}.`;
      return `${gross(kurzwert(n, k))}.`;
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
    case 'FunctionDeclaration':
    case 'ObjectMethod':
      if (s === 'params') {
        if (n.type === 'ObjectPattern') return `Der Parameter ist ein Objekt, aus dem ${aufzaehlen(namenIn(n).map((x) => code(x)))} geholt werden.`;
        return `Parameter ${kurzwert(n, k)}.`;
      }
      if (s === 'body') {
        if (n.type === 'BlockStatement') {
          const name = funktionsName(k, p);
          return `Hier beginnt der Körper ${name ? `${funktionsArt(k, p) === 'Hook' ? 'des Hooks' : funktionsArt(k, p) === 'Komponente' ? 'der Komponente' : 'der Funktion'} ${code(name)}` : 'der Funktion'} (bis ${zeile(n.loc.end.line)}).`;
        }
        return n.type.startsWith('JSX') ? `Die Funktion liefert: ${jsxElementSatz(n, k)}` : `Die Funktion liefert ${/Call/.test(n.type) ? aufrufWendung(n, k) : wendung(n, k)}.`;
      }
      break;
    case 'ConditionalExpression':
      if (s === 'test') return `Die Frage: ob ${bedingung(n, k)}.`;
      if (s === 'consequent') return `Falls ja: ${wert(n, k)}.`;
      return `Sonst: ${wert(n, k)}.`;
    case 'LogicalExpression':
      if (s === 'right') {
        if (inBedingung(k, p)) return `${p.operator === '&&' ? 'Und außerdem' : 'Oder'}: ${bedingung(n, k)}.`;
        if (p.operator === '&&') return n.type.startsWith('JSX') ? `Dann erscheint: ${jsxElementSatz(n, k)}` : `Dann: ${wert(n, k)}.`;
        return `Ersatzweise: ${wert(n, k)}.`;
      }
      return `${gross(kurzwert(n, k))}.`;
    case 'BinaryExpression':
      return `${gross(OPERATOREN[p.operator] ?? code(p.operator))} ${kurzwert(n, k)}.`;
    case 'JSXElement':
    case 'JSXFragment':
      if (n.type === 'JSXElement' || n.type === 'JSXFragment') return jsxElementSatz(n, k);
      if (n.type === 'JSXExpressionContainer') return jsxKindSatz(n, k);
      if (n.type === 'JSXSpreadChild') return `Setzt alle Einträge von ${kurzwert(n.expression, k)} ein.`;
      break;
    case 'JSXOpeningElement':
      return jsxAttributSatz(n, p, k);
    case 'JSXExpressionContainer': {
      const oben = eltern(k, p);
      if (oben?.knoten.type === 'JSXAttribute') return `Der Wert des Attributs ${code(oben.knoten.name.name)}: ${wert(n, k)}.`;
      return jsxKindSatz({ expression: n }, k);
    }
    case 'JSXAttribute':
      return `Der Wert von ${code(p.name.name)}: ${wert(n.expression ?? n, k)}.`;
    case 'ReturnStatement':
      return n.type.startsWith('JSX') ? `Das zurückgegebene Markup beginnt: ${jsxElementSatz(n, k)}` : `Zurückgegeben wird ${wert(n, k)}.`;
    case 'VariableDeclaration':
      return festlegung(n, p.kind, k, false);
    case 'VariableDeclarator':
      if (s === 'init') {
        const name = p.id.type === 'Identifier' ? code(p.id.name) : 'der Zerlegung';
        if (istFunktion(n)) return funktionsSatz(n, p.id.name, k);
        return `Der Wert von ${name}: ${n.type.startsWith('JSX') ? jsxWendung(n, k) : /Call/.test(n.type) ? aufrufWendung(n, k) : wendung(n, k)}.`;
      }
      break;
    case 'AssignmentExpression':
      return `Der neue Wert von ${code(nameVon(p.left) ?? quelle(k, p.left), 40)}: ${wert(n, k)}.`;
    case 'AssignmentPattern':
      return `Vorgabe, wenn nichts mitkommt: ${kurzwert(n, k)}.`;
    case 'TemplateLiteral':
      return `Eingesetzt (${code('${…}')}) wird ${/Call/.test(n.type) ? aufrufWendung(n, k) : wendung(n, k)}.`;
    case 'ImportDeclaration':
      return `Holt ${eingefuehrt(n, p.source.value, k)}.`;
    case 'ExportNamedDeclaration':
      return `Führt ${code(n.exported?.name ?? quelle(k, n))} aus.`;
    case 'SpreadElement':
    case 'AwaitExpression':
    case 'UnaryExpression':
    case 'ThrowStatement':
    case 'SequenceExpression':
      return `${gross(wert(n, k))}.`;
    case 'ExpressionStatement':
      return `${gross(wert(n, k))}.`;
    default:
      break;
  }
  return `Teil von ${schnipsel(k, p, 40)} (ab ${zeile(p.loc.start.line)}): ${kurzwert(n, k)}.`;
}
