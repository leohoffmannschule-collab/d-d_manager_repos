/**
 * Gemeinsame Hilfen der JavaScript-Erklärer.
 *
 * Alle Erklärer bekommen einen Kontext `k` mit: die Datei, ihren Text, den
 * Projekt-Index, die Elternkarte des Baums, die Zeile, die gerade erklärt
 * wird (`k.L`), und die Hinweise, die zu dieser Zeile gesammelt werden.
 * „Hier“ heißt dabei immer: in Zeile `k.L`. Ein Teil, der erst in einer
 * späteren Zeile beginnt, wird nicht hier beschrieben, sondern dort – die
 * Erklärung sagt dann nur, dass er folgt.
 */
import { code } from '../text.mjs';

/** Der Quelltext eines Knotens. */
export const quelle = (k, n) => k.text.slice(n.start, n.end);

/**
 * Ein Stück Code für die Erklärung. Mehrzeilige Knoten zeigen nur ihre
 * erste Zeile, mit „…“ für den Rest.
 */
export function schnipsel(k, n, laenge = 60) {
  const t = quelle(k, n);
  const erste = t.split('\n')[0];
  return code(erste.length < t.length ? erste.trimEnd() + ' …' : t, laenge);
}

/** Beginnt der Knoten in der Zeile, die gerade erklärt wird? */
export const hier = (k, n) => Boolean(n) && n.loc.start.line === k.L;

/** Steht der Knoten ganz in einer Zeile? */
export const einzeilig = (n) => n.loc.start.line === n.loc.end.line;

/** Ein Hinweis zur aktuellen Zeile – höchstens einmal je Datei und Schlüssel. */
export function hinweis(k, schluessel, text) {
  if (!text || k.gesehen.has(schluessel)) return;
  k.gesehen.add(schluessel);
  k.hinweise.push(text);
}

/** Der Name eines Ausdrucks wie `a` oder `a.b.c` – oder null, wenn es keiner ist. */
export function nameVon(n) {
  if (!n) return null;
  if (n.type === 'Identifier') return n.name;
  if (n.type === 'ThisExpression') return 'this';
  if ((n.type === 'MemberExpression' || n.type === 'OptionalMemberExpression') && !n.computed) {
    const links = nameVon(n.object);
    return links ? `${links}.${n.property.name}` : null;
  }
  return null;
}

/** Der Elternknoten samt Feld (`schluessel`) und Stelle – oder null. */
export const eltern = (k, n) => k.eltern.get(n) ?? null;

/** Ist der Knoten eine Funktion? */
export const istFunktion = (n) =>
  Boolean(n) && ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression', 'ObjectMethod'].includes(n.type);

/** Die Funktion, in der ein Knoten steht – oder null. */
export function umgebendeFunktion(k, n) {
  let e = eltern(k, n);
  while (e) {
    if (istFunktion(e.knoten)) return e.knoten;
    e = eltern(k, e.knoten);
  }
  return null;
}

/** Alle Namen, die ein Parametermuster anlegt: `{ a, b: c }` → a, c. */
export function namenIn(muster) {
  if (!muster) return [];
  switch (muster.type) {
    case 'Identifier':
      return [muster.name];
    case 'AssignmentPattern':
      return namenIn(muster.left);
    case 'RestElement':
      return namenIn(muster.argument);
    case 'ObjectPattern':
      return muster.properties.flatMap((p) => (p.type === 'RestElement' ? namenIn(p.argument) : namenIn(p.value)));
    case 'ArrayPattern':
      return muster.elements.flatMap((e) => namenIn(e));
    default:
      return [];
  }
}

/**
 * Wurde `name` einer umgebenden Funktion als Parameter mitgegeben? Bei
 * einer Komponente heißt das: Es ist eine Prop.
 *
 * @returns {object|null} die Funktion, zu der der Parameter gehört
 */
export function parameterVon(k, n, name) {
  let f = umgebendeFunktion(k, n);
  while (f) {
    if (f.params.some((p) => namenIn(p).includes(name))) return f;
    f = umgebendeFunktion(k, f);
  }
  return null;
}

/** Ist die Funktion eine Komponente (großer Anfangsbuchstabe, liefert JSX)? */
export function istKomponente(k, f) {
  const name = funktionsName(k, f);
  return Boolean(name) && /^[A-Z]/.test(name) && k.jsxFunktionen.has(f);
}

/**
 * Wie eine Funktion heißt: ihr eigener Name, der der Variablen oder des
 * Feldes, an das sie gebunden ist – oder null bei namenlosen Rückrufen.
 */
export function funktionsName(k, f) {
  if (f.id?.name) return f.id.name;
  if (f.type === 'ObjectMethod') return f.key?.name ?? null;
  const e = eltern(k, f);
  if (!e) return null;
  if (e.knoten.type === 'VariableDeclarator' && e.knoten.id.type === 'Identifier') return e.knoten.id.name;
  if (e.knoten.type === 'ObjectProperty' && e.schluessel === 'value') return e.knoten.key?.name ?? e.knoten.key?.value ?? null;
  if (e.knoten.type === 'AssignmentExpression') return nameVon(e.knoten.left);
  // useCallback(() => …) an einer Variablen: Die Funktion heißt wie die Variable.
  if (e.knoten.type === 'CallExpression' && e.schluessel === 'arguments' && /^(useCallback|useMemo|memo|forwardRef)$/.test(nameVon(e.knoten.callee) ?? '')) {
    const oben = eltern(k, e.knoten);
    if (oben?.knoten.type === 'VariableDeclarator' && oben.knoten.id.type === 'Identifier') return oben.knoten.id.name;
  }
  return null;
}

/** Was für eine Funktion: Komponente, Hook oder Funktion. */
export function funktionsArt(k, f) {
  const name = funktionsName(k, f) ?? '';
  if (/^use[A-Z]/.test(name)) return 'Hook';
  if (istKomponente(k, f)) return 'Komponente';
  return 'Funktion';
}
