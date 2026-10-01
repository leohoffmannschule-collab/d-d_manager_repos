/**
 * Ausdrücke in Worten: aus `user?.name ?? 'Gast'` wird „`user?.name`,
 * ersatzweise `'Gast'`“.
 *
 * Zwei Formen, je nach Platz im Satz:
 *
 *   wendung(n, k)    ein Satzteil, der für einen Wert steht
 *                    („eine Funktion mit dem Parameter `x` …“)
 *   bedingung(n, k)  ein Nebensatz für „wenn …“ und „ob …“
 *                    („`liste` leer ist“, „`a` gleich `b` ist“)
 *
 * Beschrieben wird nur, was in der aktuellen Zeile steht (`k.L`). Teile,
 * die später beginnen, bekommen ihre Erklärung in ihrer eigenen Zeile;
 * hier heißt es dann „folgt“ oder „bis Zeile N“.
 */
import { code, zeile, aufzaehlen, kuerzen, dativ } from '../text.mjs';
import { GLOBALE, SPRACHMITTEL, EIGENSCHAFTEN } from '../woerterbuch/javascript.mjs';
import { EXPRESS } from '../woerterbuch/node.mjs';
import { quelle, schnipsel, hier, einzeilig, hinweis, nameVon, namenIn } from './hilfen.mjs';
import { aufrufWendung } from './aufruf.mjs';
import { jsxWendung } from './jsx.mjs';
import { vorlageArt } from './vorlage.mjs';
import { zusammenfassung } from '../sql.mjs';

/** Kurz und als Code: für einfache Werte, die man am besten so liest, wie sie dastehen. */
export function kurzwert(n, k) {
  const einfach = ['Identifier', 'NumericLiteral', 'StringLiteral', 'BooleanLiteral', 'NullLiteral', 'MemberExpression', 'OptionalMemberExpression', 'ThisExpression'];
  if (einfach.includes(n.type) || (einzeilig(n) && quelle(k, n).length <= 32 && !/Function|JSX/.test(n.type))) {
    return schnipsel(k, n, 48);
  }
  return wendung(n, k);
}

/** Die Parameter einer Funktion in Worten. */
export function parameterText(params, k, istKomponente = false) {
  if (!params.length) return 'ohne Parameter';
  if (!hier(k, params[0])) return 'mit Parametern, die in den nächsten Zeilen folgen';
  const teile = params.map((p) => {
    if (!hier(k, p)) return null;
    if (p.type === 'ObjectPattern') {
      hinweis(k, 'zerlegung', SPRACHMITTEL.zerlegung);
      const namen = namenIn(p).map((x) => code(x));
      if (!einzeilig(p)) return istKomponente ? 'den Props, die ab der nächsten Zeile aufgezählt sind' : 'einem Objekt, dessen Felder folgen';
      return istKomponente ? `den Props ${aufzaehlen(namen)}` : `einem Objekt, aus dem sie ${aufzaehlen(namen)} holt`;
    }
    if (p.type === 'AssignmentPattern') return `${code(namenIn(p.left).join(', '))} (Vorgabe: ${kurzwert(p.right, k)})`;
    if (p.type === 'RestElement') return `beliebig vielen weiteren als Liste ${code(namenIn(p.argument)[0] ?? '…')}`;
    if (p.type === 'ArrayPattern') return `einer Liste, aus der sie ${aufzaehlen(namenIn(p).map((x) => code(x)))} holt`;
    return code(quelle(k, p));
  });
  const da = teile.filter(Boolean);
  const mehr = teile.length > da.length ? ' (weitere folgen)' : '';
  if (params.length === 1) {
    return params[0].type === 'Identifier' ? `mit dem Parameter ${da[0]}` : `mit ${da[0]}`;
  }
  return `mit ${params.every((p) => p.type === 'Identifier') ? 'den Parametern ' : ''}${aufzaehlen(da)}${mehr}`;
}

/** Eine Funktion als Wert (Pfeilfunktion oder function-Ausdruck). */
export function funktionWendung(f, k) {
  if (f.type === 'ArrowFunctionExpression') hinweis(k, '=>', SPRACHMITTEL['=>']);
  const art = f.async ? 'eine asynchrone Funktion' : 'eine Funktion';
  if (f.async) hinweis(k, 'async', SPRACHMITTEL.async);
  const params = parameterText(f.params, k);
  const rumpf = f.body;
  if (rumpf.type === 'BlockStatement') {
    if (einzeilig(rumpf)) {
      const n = rumpf.body.length;
      return `${art} ${params}, die ${n === 0 ? 'nichts tut' : n === 1 ? `${schnipsel(k, rumpf.body[0], 50)} ausführt` : `${n} Schritte ausführt`}`;
    }
    return `${art} ${params}, deren Körper bis ${zeile(rumpf.loc.end.line)} reicht`;
  }
  if (!hier(k, rumpf)) return `${art} ${params}, deren Ergebnis ab ${zeile(rumpf.loc.start.line)} steht`;
  if (rumpf.type === 'JSXElement' || rumpf.type === 'JSXFragment') return `${art} ${params}, die ${jsxWendung(rumpf, k)} liefert`;
  if (rumpf.type === 'CallExpression' || rumpf.type === 'OptionalCallExpression') {
    return `${art} ${params}, die ${aufrufWendung(rumpf, k, { tat: true })}`;
  }
  return `${art} ${params}, die ${wendung(rumpf, k)} liefert`;
}

/** Ein Text in Anführungszeichen – oder, wenn er nach etwas Bestimmtem aussieht, als das. */
function textWendung(n) {
  const t = n.value;
  if (t === '') return `ein leerer Text (${code("''")})`;
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|PRAGMA|ALTER|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|RELEASE)\b/i.test(t)) {
    return `die SQL-Anweisung ${code(t, 70)}: ${zusammenfassung(t)}`;
  }
  return `„${kuerzen(t, 70)}“`;
}

/** Ein Vorlagentext `` `…${x}…` ``. */
function vorlageWendung(n, k) {
  hinweis(k, '`', SPRACHMITTEL['`']);
  if (einzeilig(n)) {
    return n.expressions.length ? `der Text ${schnipsel(k, n, 70)} (mit eingesetzten Werten)` : `der Text ${schnipsel(k, n, 70)}`;
  }
  const art = vorlageArt(n, k);
  const was = { sql: 'SQL', html: 'HTML', css: 'CSS', klassen: 'CSS-Klassen', text: 'Text', js: 'JavaScript' }[art] ?? 'Text';
  return `ein mehrzeiliger Text (${was}), der bis ${zeile(n.loc.end.line)} reicht`;
}

/** Ein Objekt `{ … }`. */
function objektWendung(n, k) {
  if (!n.properties.length) return `ein leeres Objekt (${code('{}')})`;
  if (!einzeilig(n)) {
    const hierDa = n.properties.filter((p) => hier(k, p));
    if (hierDa.length) return `ein Objekt, beginnend mit ${aufzaehlen(hierDa.map((p) => feldName(p, k)))}; weitere Felder folgen bis ${zeile(n.loc.end.line)}`;
    return `ein Objekt; seine Felder folgen bis ${zeile(n.loc.end.line)}`;
  }
  const spreads = n.properties.filter((p) => p.type === 'SpreadElement');
  const felder = n.properties.filter((p) => p.type !== 'SpreadElement');
  const teile = spreads.map((p) => {
    hinweis(k, '...', SPRACHMITTEL['...']);
    return `allen Feldern aus ${kurzwert(p.argument, k)}`;
  });
  if (felder.length) teile.push(`${felder.length === 1 ? 'dem Feld' : 'den Feldern'} ${aufzaehlen(felder.map((p) => feldName(p, k)))}`);
  return `ein Objekt mit ${aufzaehlen(teile)}`;
}

/** Wie ein Feld in einer Aufzählung heißt. */
function feldName(p, k) {
  if (p.type === 'SpreadElement') {
    hinweis(k, '...', SPRACHMITTEL['...']);
    return `allem aus ${kurzwert(p.argument, k)}`;
  }
  const name = p.key?.name ?? p.key?.value ?? quelle(k, p.key);
  if (p.type === 'ObjectProperty' && !p.shorthand && !p.computed) {
    const w = p.value;
    if (['StringLiteral', 'NumericLiteral', 'BooleanLiteral', 'NullLiteral', 'Identifier'].includes(w.type) && quelle(k, w).length <= 24) {
      return `${code(name)} = ${code(quelle(k, w))}`;
    }
  }
  return code(String(name));
}

/** Eine Liste `[ … ]`. */
function listeWendung(n, k) {
  if (!n.elements.length) return `eine leere Liste (${code('[]')})`;
  if (!einzeilig(n)) return `eine Liste; ihre Einträge folgen bis ${zeile(n.loc.end.line)}`;
  const t = quelle(k, n);
  if (t.length <= 50) return `die Liste ${code(t)}`;
  return `eine Liste mit ${n.elements.length} Einträgen`;
}

/** `new X(…)` */
function neuWendung(n, k) {
  const name = nameVon(n.callee) ?? '';
  const args = n.arguments;
  const erst = args[0];
  if (GLOBALE[name]) hinweis(k, `global:${name}`, `${code(name)} – ${GLOBALE[name]}`);
  switch (name) {
    case 'Map':
      return erst ? `eine neue Map (Zuordnung Schlüssel → Wert), gefüllt aus ${kurzwert(erst, k)}` : 'eine neue, leere Map (Zuordnung Schlüssel → Wert)';
    case 'Set':
      return erst ? `eine Menge aus ${kurzwert(erst, k)} (doppelte Werte fallen weg)` : 'eine neue, leere Menge';
    case 'Date':
      return erst ? `der Zeitpunkt ${kurzwert(erst, k)}` : 'der jetzige Zeitpunkt';
    case 'Error':
    case 'TypeError':
      if (erst?.type === 'StringLiteral') return `ein Fehler mit der Meldung „${kuerzen(erst.value, 80)}“`;
      return erst ? `ein Fehler mit der Meldung ${kurzwert(erst, k)}` : 'ein Fehler';
    case 'Promise':
      return `eine neue Zusage (Promise); die Funktion darin entscheidet, wann sie erfüllt wird (resolve) oder scheitert (reject)`;
    default: {
      const was = name ? code(name) : schnipsel(k, n.callee);
      return `ein neues ${was}-Objekt${args.length && einzeilig(n) ? ` aus ${aufzaehlen(args.map((a) => dativ(kurzwert(a, k))))}` : ''}`;
    }
  }
}

/** `a.b.c` – mit Hinweisen zu dem, was der Almanach oder Node darunter versteht. */
function mitgliedWendung(n, k) {
  const name = nameVon(n);
  if (n.type === 'OptionalMemberExpression' || n.optional) hinweis(k, '?.', SPRACHMITTEL['?.']);
  if (name?.startsWith('process.env.')) {
    const v = name.slice('process.env.'.length);
    const text = k.projekt.umgebung.get(v);
    return `die Umgebungsvariable ${code(v)}${text ? ` („${kuerzen(text, 120)}“)` : ''}`;
  }
  if (name === 'import.meta.url') {
    hinweis(k, 'import.meta.url', SPRACHMITTEL['import.meta.url']);
    return `die Adresse dieser Datei (${code(name)})`;
  }
  if (name && EXPRESS[name.split('.').slice(0, 2).join('.')]) {
    const zwei = name.split('.').slice(0, 2).join('.');
    hinweis(k, `express:${zwei}`, `${code(zwei)} – ${EXPRESS[zwei]}`);
  }
  if ((name ?? '').endsWith('.target.value')) return `der eingegebene Wert (${code(name)})`;
  if ((name ?? '').endsWith('.target.checked')) return `ob das Kästchen angehakt ist (${code(name)})`;
  const letzt = !n.computed ? n.property.name : null;
  if (letzt && EIGENSCHAFTEN[letzt]) hinweis(k, `eig:${letzt}`, `${code('.' + letzt)} – ${EIGENSCHAFTEN[letzt]}`);
  return schnipsel(k, n, 60);
}

/**
 * Ein Ausdruck als Satzteil.
 *
 * @param {object} n  der Knoten
 * @param {object} k  der Kontext der Datei (siehe hilfen.mjs)
 */
export function wendung(n, k) {
  if (!n) return '';
  switch (n.type) {
    case 'Identifier':
      if (n.name === 'undefined') return `nichts (${code('undefined')})`;
      return code(n.name);
    case 'StringLiteral':
      return textWendung(n);
    case 'NumericLiteral':
      return code(n.extra?.raw ?? String(n.value));
    case 'BooleanLiteral':
      return n.value ? `${code('true')} (wahr)` : `${code('false')} (falsch)`;
    case 'NullLiteral':
      return `${code('null')} (bewusst kein Wert)`;
    case 'RegExpLiteral':
      hinweis(k, 'regex', SPRACHMITTEL.regex);
      return `das Suchmuster ${code(`/${n.pattern}/${n.flags}`, 70)}`;
    case 'TemplateLiteral':
      return vorlageWendung(n, k);
    case 'ArrowFunctionExpression':
    case 'FunctionExpression':
      return funktionWendung(n, k);
    case 'CallExpression':
    case 'OptionalCallExpression':
      return aufrufWendung(n, k);
    case 'NewExpression':
      return neuWendung(n, k);
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return mitgliedWendung(n, k);
    case 'ObjectExpression':
      return objektWendung(n, k);
    case 'ArrayExpression':
      return listeWendung(n, k);
    case 'ConditionalExpression': {
      hinweis(k, 'ternaer', SPRACHMITTEL.ternaer);
      if (hier(k, n.consequent) && hier(k, n.alternate)) {
        return `je nachdem, ob ${bedingung(n.test, k)}: ${kurzwert(n.consequent, k)} oder sonst ${kurzwert(n.alternate, k)}`;
      }
      return `je nachdem, ob ${bedingung(n.test, k)}, einer von zwei Werten (sie folgen in den nächsten Zeilen)`;
    }
    case 'LogicalExpression': {
      const rechts = hier(k, n.right) ? kurzwert(n.right, k) : `… (weiter in ${zeile(n.right.loc.start.line)})`;
      if (n.operator === '??') {
        hinweis(k, '??', SPRACHMITTEL['??']);
        return `${kurzwert(n.left, k)}, ersatzweise ${rechts}`;
      }
      if (n.operator === '||') return `${kurzwert(n.left, k)}, oder – wenn das leer bzw. falsch ist – ${rechts}`;
      // `bedingung && (<p>…</p>)` im Markup: etwas zeigen – oder nichts.
      if (n.right.type.startsWith('JSX')) {
        return `nur wenn ${bedingung(n.left, k)}: ${hier(k, n.right) ? jsxWendung(n.right, k) : `das Element ab ${zeile(n.right.loc.start.line)}`}`;
      }
      // Zwei Prüfungen mit „und“: Das Ergebnis ist wahr oder falsch.
      if (janeinAusdruck(n.left) || janeinAusdruck(n.right)) return `ob ${bedingung(n, k)} (wahr oder falsch)`;
      return `${rechts}, sofern ${bedingung(n.left, k)}`;
    }
    case 'BinaryExpression':
      if (['===', '!==', '==', '!=', '<', '>', '<=', '>=', 'in', 'instanceof'].includes(n.operator)) {
        return `ob ${bedingung(n, k)} (wahr oder falsch)`;
      }
      if (n.operator === '%') return `der Rest beim Teilen ${schnipsel(k, n)}`;
      return schnipsel(k, n, 70);
    case 'UnaryExpression':
      if (n.operator === '!') return `${schnipsel(k, n)} – wahr, wenn ${verneint(n.argument, k)}`;
      if (n.operator === 'typeof') return `die Art von ${kurzwert(n.argument, k)} als Text ('string', 'number', 'object' …)`;
      if (n.operator === 'void') return `nichts (${code('undefined')})`;
      if (n.operator === 'delete') return `das Entfernen von ${schnipsel(k, n.argument)}`;
      return schnipsel(k, n);
    case 'UpdateExpression':
      return `${schnipsel(k, n)} (um 1 ${n.operator === '++' ? 'erhöht' : 'verringert'})`;
    case 'AwaitExpression': {
      hinweis(k, 'await', SPRACHMITTEL.await);
      const w = wendung(n.argument, k);
      return w.startsWith('das Ergebnis von ') ? `${w}, sobald es da ist` : `das Ergebnis von ${w}, sobald es da ist`;
    }
    case 'AssignmentExpression':
      return `${schnipsel(k, n.left)}, das dabei auf ${kurzwert(n.right, k)} gesetzt wird`;
    case 'SpreadElement':
      hinweis(k, '...', SPRACHMITTEL['...']);
      return `alle Einträge von ${kurzwert(n.argument, k)}`;
    case 'JSXElement':
    case 'JSXFragment':
      return jsxWendung(n, k);
    case 'MetaProperty':
      if (quelle(k, n) === 'import.meta') return `die Angaben zu diesem Modul (${code('import.meta')})`;
      return code(quelle(k, n));
    case 'ParenthesizedExpression':
      return wendung(n.expression, k);
    case 'SequenceExpression':
      return `nacheinander ${aufzaehlen(n.expressions.map((e) => kurzwert(e, k)))}`;
    case 'ObjectPattern':
    case 'ArrayPattern':
      return aufzaehlen(namenIn(n).map((x) => code(x)));
    case 'AssignmentPattern':
      return `${wendung(n.left, k)} (Vorgabe: ${kurzwert(n.right, k)})`;
    case 'ThisExpression':
      return code('this');
    case 'Import':
      return code('import');
    default:
      return schnipsel(k, n, 60);
  }
}

/** Klingt der Name nach wahr/falsch (`istDm`, `offen`, `res.ok`)? */
function janein(name) {
  const letzt = String(name).split('.').pop();
  return (
    /^(is|has|can|should|ist|hat|darf|kann|soll|sind|war|wird|zeige|mit|ohne|nur|braucht|fehlt|gibt|will|muss)[A-Z_]/.test(letzt) ||
    /^(offen|aktiv|fertig|laedt|leer|voll|sichtbar|verborgen|bereit|gueltig|erlaubt|gesperrt|geladen|laeuft|loading|saving|open|done|enabled|disabled|visible|hidden|ready|valid|ok|checked|connected|verbunden|zu|dm|isDm|npc|beweglich|ziehend|betont|stark|aktiviert|abgelaufen|neu|alle|ohne|leise|metrisch|bestaetigt|erfolgreich|gesichert|frei|belegt|tot|bewusstlos)$/i.test(letzt)
  );
}

/** Ergibt der Ausdruck sicher wahr oder falsch (ein Vergleich, eine Verneinung)? */
function janeinAusdruck(n) {
  if (n.type === 'BinaryExpression') return ['===', '!==', '==', '!=', '<', '>', '<=', '>=', 'in', 'instanceof'].includes(n.operator);
  if (n.type === 'UnaryExpression') return n.operator === '!';
  if (n.type === 'LogicalExpression') return janeinAusdruck(n.left) && janeinAusdruck(n.right);
  if (n.type === 'BooleanLiteral') return true;
  return false;
}

/** Ein Vergleich `a op b` als Nebensatz. */
function vergleich(n, k) {
  const { left: l, right: r, operator: op } = n;
  const lq = quelle(k, l);
  const rq = quelle(k, r);
  if (l.type === 'UnaryExpression' && l.operator === 'typeof' && r.type === 'StringLiteral') {
    const ja = { string: 'ein Text', number: 'eine Zahl', function: 'eine Funktion', object: 'ein Objekt (oder null)', boolean: 'ein Wahrheitswert', undefined: 'nicht festgelegt' };
    const nein = { string: 'kein Text', number: 'keine Zahl', function: 'keine Funktion', object: 'kein Objekt', boolean: 'kein Wahrheitswert', undefined: 'festgelegt' };
    const art = (op.startsWith('!') ? nein : ja)[r.value] ?? `${op.startsWith('!') ? 'nicht ' : ''}vom Typ „${r.value}“`;
    return `${kurzwert(l.argument, k)} ${art} ist`;
  }
  if (lq.endsWith('.length') && r.type === 'NumericLiteral' && r.value === 0) {
    const was = code(lq.replace(/\??\.length$/, ''));
    if (op === '===' || op === '==' || op === '<=') return `${was} leer ist`;
    if (op === '>' || op === '!==' || op === '!=') return `${was} nicht leer ist`;
  }
  if ((r.type === 'NullLiteral' || rq === 'undefined') && (op === '==' || op === '===')) return op === '===' && r.type === 'NullLiteral' ? `${kurzwert(l, k)} null ist` : `${kurzwert(l, k)} fehlt (${rq})`;
  if ((r.type === 'NullLiteral' || rq === 'undefined') && (op === '!=' || op === '!==')) return `${kurzwert(l, k)} vorhanden ist`;
  const worte = { '===': 'gleich', '==': 'gleich', '!==': 'ungleich', '!=': 'ungleich', '<': 'kleiner als', '>': 'größer als', '<=': 'höchstens', '>=': 'mindestens' };
  if (worte[op]) return `${kurzwert(l, k)} ${worte[op]} ${kurzwert(r, k)} ist`;
  if (op === 'in') return `${kurzwert(l, k)} in ${kurzwert(r, k)} vorkommt`;
  if (op === 'instanceof') return `${kurzwert(l, k)} ein ${code(rq)} ist`;
  return `${schnipsel(k, n)} zutrifft`;
}

/** Bekannte Prüf-Aufrufe als Nebensatz: `liste.includes(x)` → „`liste` den Wert `x` enthält“. */
function pruefung(n, k, nicht) {
  const c = n.callee;
  const nein = nicht ? 'nicht ' : '';
  const arg = n.arguments[0] ? kurzwert(n.arguments[0], k) : '';
  const name = nameVon(c);
  if (c.type === 'MemberExpression' || c.type === 'OptionalMemberExpression') {
    const obj = kurzwert(c.object, k);
    switch (c.property.name) {
      case 'includes':
        return `${obj} ${arg} ${nein}enthält`;
      case 'has':
        return `${obj} den Eintrag ${arg} ${nein}hat`;
      case 'startsWith':
        return `${obj} ${nein}mit ${arg} beginnt`;
      case 'endsWith':
        return `${obj} ${nein}mit ${arg} endet`;
      case 'test':
        return `das Suchmuster ${obj} auf ${arg} ${nein}passt`;
      case 'some':
        return `${nicht ? 'kein' : 'mindestens ein'} Eintrag von ${obj} die Bedingung erfüllt`;
      case 'every':
        return `${nicht ? 'nicht ' : ''}alle Einträge von ${obj} die Bedingung erfüllen`;
      case 'isArray':
        if (name === 'Array.isArray') return `${arg} ${nein}eine Liste ist`;
        break;
      case 'isFinite':
        if (name === 'Number.isFinite') return `${arg} ${nein}eine gültige Zahl ist`;
        break;
      case 'isInteger':
        if (name === 'Number.isInteger') return `${arg} ${nein}eine ganze Zahl ist`;
        break;
      case 'trim':
        return nicht ? `${obj} leer ist (oder nur Leerzeichen enthält)` : `${obj} nicht leer ist (mehr als Leerzeichen enthält)`;
      case 'existsSync':
        return `es ${arg} ${nicht ? 'nicht ' : ''}gibt`;
      default:
        break;
    }
  }
  if (name === 'isNaN') return `${arg} ${nicht ? 'eine Zahl' : 'keine Zahl'} ist`;
  return null;
}

/** „`x` fehlt“ – die Verneinung als Nebensatz. */
function verneint(n, k) {
  if (n.type === 'CallExpression' || n.type === 'OptionalCallExpression') {
    const p = pruefung(n, k, true);
    if (p) return p;
    return `${schnipsel(k, n)} nicht zutrifft`;
  }
  const name = nameVon(n);
  if (name && name.endsWith('.length')) return `${code(name.replace(/\??\.length$/, ''))} leer ist`;
  if (name && janein(name)) return `${code(name)} nicht zutrifft`;
  if (n.type === 'Identifier' || n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') {
    if (n.type === 'OptionalMemberExpression') hinweis(k, '?.', SPRACHMITTEL['?.']);
    return `${schnipsel(k, n)} fehlt (leer, null oder falsch ist)`;
  }
  if (n.type === 'UnaryExpression' && n.operator === '!') return bedingung(n.argument, k);
  return `${schnipsel(k, n)} nicht zutrifft`;
}

/**
 * Eine Bedingung als Nebensatz – zum Einsetzen hinter „wenn“ oder „ob“.
 * `!liste.length` → „`liste` leer ist“.
 */
export function bedingung(n, k) {
  if (!n) return '';
  if (!hier(k, n)) return `… (die Bedingung steht ab ${zeile(n.loc.start.line)})`;
  switch (n.type) {
    case 'UnaryExpression':
      if (n.operator === '!') return verneint(n.argument, k);
      break;
    case 'LogicalExpression': {
      const rechts = hier(k, n.right) ? bedingung(n.right, k) : `… (weiter in ${zeile(n.right.loc.start.line)})`;
      if (n.operator === '&&') return `${bedingung(n.left, k)} und ${rechts}`;
      if (n.operator === '||') return `${bedingung(n.left, k)} oder ${rechts}`;
      hinweis(k, '??', SPRACHMITTEL['??']);
      return `${kurzwert(n, k)} zutrifft`;
    }
    case 'BinaryExpression':
      return vergleich(n, k);
    case 'CallExpression':
    case 'OptionalCallExpression': {
      const p = pruefung(n, k, false);
      if (p) return p;
      return `${aufrufWendung(n, k, { kurz: true })} zutrifft`;
    }
    case 'Identifier':
    case 'MemberExpression':
    case 'OptionalMemberExpression': {
      const name = nameVon(n) ?? quelle(k, n);
      if (n.type === 'OptionalMemberExpression') hinweis(k, '?.', SPRACHMITTEL['?.']);
      if (name.endsWith('.length')) return `${code(name.replace(/\??\.length$/, ''))} nicht leer ist`;
      return janein(name) ? `${code(name)} zutrifft` : `${code(name)} vorhanden ist`;
    }
    case 'AssignmentExpression':
      return `${schnipsel(k, n.left)} – auf ${kurzwert(n.right, k)} gesetzt – etwas enthält`;
    default:
      break;
  }
  return `${schnipsel(k, n)} zutrifft`;
}

