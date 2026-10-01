/**
 * Anweisungen in Worten: Einfuhren, Festlegungen, Funktionen, Verzweigungen,
 * Schleifen, Rückgaben.
 *
 * Eine Anweisung ist ein ganzer Schritt des Programms – sie bekommt einen
 * ganzen Satz („Legt den Zustand `offen` an …“, „Wenn `liste` leer ist:
 * Gibt `null` zurück.“). Was innerhalb der Anweisung in derselben Zeile
 * steht, beschreibt der Satz mit; was in späteren Zeilen folgt, bekommt dort
 * seine eigene Erklärung.
 */
import { code, zeile, aufzaehlen, kuerzen, gross, satz, dativ, akkusativ } from '../text.mjs';
import { SPRACHMITTEL } from '../woerterbuch/javascript.mjs';
import { REACT } from '../woerterbuch/react.mjs';
import { MODULE, NODE, EXPRESS } from '../woerterbuch/node.mjs';
import { quelle, schnipsel, hier, einzeilig, hinweis, nameVon, funktionsArt, istKomponente, namenIn, umgebendeFunktion } from './hilfen.mjs';
import { wendung, kurzwert, bedingung, parameterText } from './ausdruck.mjs';
import { aufrufWendung, abhaengigkeiten } from './aufruf.mjs';
import { jsxWendung } from './jsx.mjs';
import { zusammenfassung } from '../sql.mjs';

/** Wie eine Datei im Satz heißt: ohne die üblichen Wurzeln. */
const kurzPfad = (datei) => datei.replace(/^(frontend|backend)\/src\//, '');

/** Woher eine Einfuhr kommt – mit dem, was die Datei bzw. das Paket ist. */
function herkunft(quelleText, k) {
  const ein = [...(k.projekt.dateien.get(k.datei)?.einfuhren.values() ?? [])].find((e) => e.quelle === quelleText || e.quelle?.endsWith(quelleText.replace(/^\.+\//, '')));
  if (quelleText.startsWith('.')) {
    const ziel = ein?.quelle && k.projekt.dateien.get(ein.quelle);
    if (ziel?.satz) hinweis(k, `datei:${ziel.datei}`, `${code(kurzPfad(ziel.datei))} – „${ziel.satz}“`);
    return `der Datei ${code(quelleText)}`;
  }
  if (MODULE[quelleText]) hinweis(k, `modul:${quelleText}`, `${code(quelleText)} – ${MODULE[quelleText]}`);
  return quelleText.startsWith('node:') ? `dem Node-Modul ${code(quelleText)}` : `dem Paket ${code(quelleText)}`;
}

/** Ein eingeführter Name samt Hinweis, was er ist. */
export function eingefuehrt(s, quelleText, k) {
  const lokal = s.local.name;
  let anzeige;
  if (s.type === 'ImportDefaultSpecifier') anzeige = `${code(lokal)} (das, was die Datei hauptsächlich anbietet)`;
  else if (s.type === 'ImportNamespaceSpecifier') anzeige = `alles, was sie ausführt, gesammelt als ${code(lokal)}`;
  else {
    const name = s.imported.name ?? s.imported.value;
    anzeige = name === lokal ? code(lokal) : `${code(name)} (hier ${code(lokal)} genannt)`;
  }
  const ziel = k.projekt.aufloesen(k.datei, lokal);
  if (ziel?.def?.satz && ziel.datei !== k.datei) {
    hinweis(k, `ruf:${lokal}`, `${code(lokal)} – „${ziel.def.satz}“`);
    k.gesehen.add(`komp:${lokal}`);
  } else if (ziel?.paket) {
    const t = REACT[ziel.name] ?? NODE[ziel.name] ?? EXPRESS[ziel.name];
    if (t) hinweis(k, `ruf:${lokal}`, `${code(lokal)} – ${t}`);
  }
  return anzeige;
}

/** `import … from '…'` */
function einfuhr(n, k) {
  hinweis(k, 'import', SPRACHMITTEL.import);
  const q = n.source.value;
  if (q.endsWith('?raw') && n.specifiers.length === 1) {
    hinweis(k, 'raw', `${code('?raw')} am Ende einer Einfuhr: Vite liefert den Inhalt der Datei als Text, statt sie einzubinden.`);
    return `Holt den Inhalt von ${code(q.replace(/\?raw$/, ''))} als Text und nennt ihn ${code(n.specifiers[0].local.name)}.`;
  }
  if (!n.specifiers.length) {
    if (q.endsWith('.css')) return `Lädt das Stilblatt ${code(q)}; Vite baut es beim Bauen in die Seite ein.`;
    return `Führt ${herkunft(q, k)} einmal aus, ohne etwas daraus zu übernehmen.`;
  }
  const woher = herkunft(q, k);
  const da = n.specifiers.filter((s) => hier(k, s));
  if (!da.length) return `Holt aus ${woher} die Namen, die in den nächsten Zeilen aufgezählt sind.`;
  const namen = da.map((s) => eingefuehrt(s, q, k));
  return `Holt ${aufzaehlen(namen)} aus ${woher}${da.length < n.specifiers.length ? ' (weitere Namen folgen)' : ''}.`;
}

/** Wie eine Funktion beginnt – für Deklarationen und Variablen mit Funktion. */
export function funktionsSatz(f, name, k, ausfuhr = null) {
  const art = funktionsArt(k, f);
  const komp = art === 'Komponente';
  if (komp) hinweis(k, 'komponente-def', 'Eine Komponente ist eine Funktion, die beschreibt, was auf dem Bildschirm stehen soll. React ruft sie auf, wann immer sich etwas ändert, und bringt den Bildschirm auf den neuen Stand.');
  if (art === 'Hook') hinweis(k, 'hook-def', 'Ein Hook ist eine Funktion, deren Name mit use beginnt; nur Komponenten (und andere Hooks) dürfen ihn aufrufen. Eigene Hooks bündeln Zustand und Effekte, die mehrere Komponenten brauchen.');
  if (f.async) hinweis(k, 'async', SPRACHMITTEL.async);
  if (f.type === 'ArrowFunctionExpression') hinweis(k, '=>', SPRACHMITTEL['=>']);
  const was = { Komponente: 'Komponente', Hook: 'Hook', Funktion: f.async ? 'asynchrone Funktion' : 'Funktion' }[art];
  const benannt = code(name ?? '(ohne Namen)');
  let kopf;
  if (ausfuhr === 'default') kopf = `Beginnt die Standardausfuhr dieser Datei: ${art === 'Hook' ? 'der Hook' : `die ${was}`} ${benannt}`;
  else if (art === 'Hook') kopf = `Beginnt den ${ausfuhr ? 'ausgeführten ' : ''}Hook ${benannt}`;
  else kopf = `Beginnt die ${ausfuhr ? 'ausgeführte ' : ''}${was} ${benannt}`;
  const teile = [kopf];
  // Der Hook ist männlich, Komponente und Funktion sind weiblich.
  const [er, sein, ihn] = art === 'Hook' ? ['Er', 'Sein', 'ihn'] : ['Sie', 'Ihr', 'sie'];
  if (komp && f.params.length === 1 && f.params[0].type === 'ObjectPattern') {
    const props = f.params[0];
    hinweis(k, 'zerlegung', SPRACHMITTEL.zerlegung);
    teile.push(einzeilig(props) ? `${er} bekommt die Props ${aufzaehlen(namenIn(props).map((x) => code(x)))}` : `${er} bekommt Props, die ab der nächsten Zeile aufgezählt sind`);
  } else teile.push(`${er} arbeitet ${parameterText(f.params, k)}`);
  if (f.body.type === 'BlockStatement') {
    if (!einzeilig(f.body)) teile.push(`${sein} Körper reicht bis ${zeile(f.body.loc.end.line)}`);
  } else if (hier(k, f.body)) {
    teile.push(`${er} liefert ${f.body.type.startsWith('JSX') ? jsxWendung(f.body, k) : /Call/.test(f.body.type) ? aufrufWendung(f.body, k) : wendung(f.body, k)}`);
  } else teile.push(`Was ${er.toLowerCase()} liefert, steht ab ${zeile(f.body.loc.start.line)}`);
  if (ausfuhr === 'named') teile.push(`Mit export dürfen andere Dateien ${ihn} einführen`);
  if (ausfuhr === 'named') hinweis(k, 'export', SPRACHMITTEL.export);
  if (ausfuhr === 'default') hinweis(k, 'default', SPRACHMITTEL.default);
  return teile.join('. ') + '.';
}

/** Eine Festlegung `const x = …` (ein einzelner Deklarator). */
export function festlegung(d, art, k, ausfuhr) {
  const id = d.id;
  const init = d.init;
  hinweis(k, art, SPRACHMITTEL[art] ?? '');
  const ausgefuehrt = ausfuhr ? ' (ausgeführt: andere Dateien dürfen es einführen)' : '';

  if (id.type === 'ArrayPattern') {
    const namen = namenIn(id);
    if (init?.type === 'CallExpression' && nameVon(init.callee) === 'useState') {
      const [wert, setzer] = namen;
      if (setzer) k.zustand.set(setzer, wert);
      hinweis(k, 'ruf:useState', `${code('useState')} – ${REACT.useState}`);
      const anfang = init.arguments[0];
      return `Legt den Zustand ${code(wert)} an (Anfangswert: ${anfang ? kurzwert(anfang, k) : 'nichts'}); mit ${code(setzer ?? '…')} wird er geändert – dann zeichnet React die Komponente neu.`;
    }
    hinweis(k, 'zerlegung', SPRACHMITTEL.zerlegung);
    return `Zerlegt ${init && hier(k, init) ? wendung(init, k) : 'den folgenden Wert'} und legt die Teile als ${aufzaehlen(namen.map((x) => code(x)))} ab.`;
  }
  if (id.type === 'ObjectPattern') {
    hinweis(k, 'zerlegung', SPRACHMITTEL.zerlegung);
    const woher = init ? (hier(k, init) ? dativ(wendung(init, k)) : `dem Wert ab ${zeile(init.loc.start.line)}`) : '…';
    if (!einzeilig(id)) return `Holt mehrere Felder auf einmal aus ${woher} (Zerlegung) – welche, steht in den nächsten Zeilen.`;
    const namen = id.properties.map((p) => {
      if (p.type === 'RestElement') return `alles Übrige als ${code(namenIn(p.argument)[0] ?? '…')}`;
      const schl = p.key?.name ?? p.key?.value ?? quelle(k, p.key);
      const innen = namenIn(p.value)[0];
      const vorgabe = p.value?.type === 'AssignmentPattern' ? ` (Vorgabe ${kurzwert(p.value.right, k)})` : '';
      return innen && innen !== schl ? `${code(String(schl))} (hier ${code(innen)} genannt)${vorgabe}` : `${code(String(schl))}${vorgabe}`;
    });
    return `Holt ${aufzaehlen(namen)} aus ${woher} (Zerlegung).`;
  }
  const name = id.name;
  if (!init) return `Legt die Variable ${code(name)} an, noch ohne Wert.`;
  if (!hier(k, init)) return `${art === 'let' ? 'Legt die Variable' : 'Legt'} ${code(name)} ${art === 'let' ? 'an' : 'fest'}${ausgefuehrt}; der Wert folgt ab ${zeile(init.loc.start.line)}.`;
  if (/Function/.test(init.type)) return funktionsSatz(init, name, k, ausfuhr ? 'named' : null);

  const ruf = init.type === 'CallExpression' ? nameVon(init.callee) : null;
  const arg0 = init.arguments?.[0];
  switch (ruf) {
    case 'useRef':
      hinweis(k, 'ruf:useRef', `${code('useRef')} – ${REACT.useRef}`);
      k.refs.add(name);
      return `Legt den Ref ${code(name)} an (Anfangsinhalt: ${arg0 ? kurzwert(arg0, k) : 'nichts'}) – ein Merkzettel, der das Neuzeichnen übersteht, ohne es auszulösen.`;
    case 'useMemo':
      hinweis(k, 'ruf:useMemo', `${code('useMemo')} – ${REACT.useMemo}`);
      return `Berechnet ${code(name)} und merkt sich das Ergebnis (useMemo)${init.arguments[1] && hier(k, init.arguments[1]) ? `; ${abhaengigkeiten(init.arguments[1], k, 'memo')}` : arg0 && !einzeilig(arg0) ? `; die Rechnung steht bis ${zeile(arg0.loc.end.line)}` : ''}.`;
    case 'useCallback':
      hinweis(k, 'ruf:useCallback', `${code('useCallback')} – ${REACT.useCallback}`);
      return `Legt die Funktion ${code(name)} an und merkt sie sich (useCallback)${arg0 && hier(k, arg0) ? `: ${wendung(arg0, k)}` : arg0 ? `; die Funktion selbst folgt ab ${zeile(arg0.loc.start.line)}` : ''}.`;
    case 'useContext':
      hinweis(k, 'ruf:useContext', `${code('useContext')} – ${REACT.useContext}`);
      return `Holt ${code(name)} aus dem Kontext ${arg0 ? kurzwert(arg0, k) : ''}.`;
    case 'createContext':
      hinweis(k, 'ruf:createContext', `${code('createContext')} – ${REACT.createContext}`);
      return `Legt den Kontext ${code(name)} an${ausgefuehrt}.`;
    case 'Router':
    case 'express.Router':
      hinweis(k, 'ruf:Router', `${code('Router')} – ${EXPRESS.Router}`);
      return `Legt den Router ${code(name)} an: eine Gruppe von Wegen, die server.js gemeinsam unter einem Pfad einhängt.`;
    case 'express':
      hinweis(k, 'ruf:express', `${code('express()')} – ${EXPRESS.express}`);
      return `Legt die Express-Anwendung ${code(name)} an – den Server, an den alle Wege gehängt werden.`;
    default:
      break;
  }
  if (init.type === 'CallExpression' && init.callee.type === 'MemberExpression' && init.callee.property.name === 'prepare') {
    const t = arg0?.type === 'StringLiteral' ? arg0.value : arg0?.type === 'TemplateLiteral' ? arg0.quasis.map((q) => q.value.cooked).join('?') : null;
    const was = t ? zusammenfassung(t) : 'die SQL-Anweisung, die folgt';
    k.anweisungen.set(name, kuerzen(was, 120));
    return `Bereitet die SQL-Anweisung ${code(name)} vor: ${was}. Ausgeführt wird sie später mit ${code('.get')}, ${code('.all')} oder ${code('.run')}.`;
  }
  if (init.type === 'AwaitExpression') {
    hinweis(k, 'await', SPRACHMITTEL.await);
    const arg = init.argument;
    return `Wartet auf ${/Call/.test(arg.type) ? aufrufWendung(arg, k) : wendung(arg, k)} und legt das Ergebnis als ${code(name)} ab.`;
  }
  const verb = art === 'let' ? `Legt die Variable ${code(name)} an` : /^[A-Z][A-Z0-9_]+$/.test(name) ? `Legt die Konstante ${code(name)} fest` : `Legt ${code(name)} fest`;
  return `${verb}${ausgefuehrt}: ${wendung(init, k)}.`;
}

/** Eine ganze Variablenanweisung (`const a = 1, b = 2;`). */
function variablen(n, k, ausfuhr) {
  const da = n.declarations.filter((d) => hier(k, d));
  return da.map((d) => festlegung(d, n.kind, k, ausfuhr)).join(' ');
}

/** `if (…) …` – mit `sonst` für ein `else if`. */
export function wenn(n, k, sonst = false) {
  const kopf = sonst ? `Sonst, wenn ${bedingung(n.test, k)}` : `Wenn ${bedingung(n.test, k)}`;
  const dann = n.consequent;
  if (!hier(k, dann)) return `${kopf}, geschieht, was in ${zeile(dann.loc.start.line)} steht.`;
  if (dann.type === 'BlockStatement') {
    if (einzeilig(dann)) {
      const s = dann.body.map((a) => anweisung(a, k)).join(' ');
      return `${kopf}: ${s || 'nichts.'}`;
    }
    const alt = n.alternate ? ` Sonst geht es in ${zeile(n.alternate.loc.start.line)} weiter.` : '';
    return `${kopf}, geschieht Folgendes (bis ${zeile(dann.loc.end.line)}):${alt}`;
  }
  return `${kopf}: ${anweisung(dann, k)}`;
}

/** `for (const x of liste)` */
function fuerJedes(n, k) {
  hinweis(k, 'forof', SPRACHMITTEL.forof);
  const links = n.left.type === 'VariableDeclaration' ? n.left.declarations[0].id : n.left;
  const namen = namenIn(links).map((x) => code(x));
  const was = links.type === 'Identifier' ? `jedes ${namen[0]}` : `jeden Eintrag (zerlegt in ${aufzaehlen(namen)})`;
  const quelleW = hier(k, n.right) ? wendung(n.right, k) : '…';
  const koerper = n.body.type === 'BlockStatement' && !einzeilig(n.body) ? `; für jeden läuft der Block bis ${zeile(n.body.loc.end.line)}` : hier(k, n.body) ? `: ${anweisung(n.body.type === 'BlockStatement' ? n.body.body[0] : n.body, k)}` : '';
  return `Geht ${was} aus ${quelleW} durch${n.await ? ' (und wartet jeweils, bis es da ist)' : ''}${koerper}`.replace(/([^.:])$/, '$1.');
}

/** `for (let i = 0; i < n; i++)` */
function zaehlschleife(n, k) {
  const start = n.init ? schnipsel(k, n.init, 40) : 'ohne Startwert';
  const solange = n.test ? bedingung(n.test, k) : 'immer';
  const schritt = n.update ? schnipsel(k, n.update, 30) : 'ohne Schritt';
  return `Zählschleife: beginnt mit ${start}, läuft, solange ${solange}, und macht nach jedem Durchlauf ${schritt}${n.body.type === 'BlockStatement' && !einzeilig(n.body) ? `; der Block bis ${zeile(n.body.loc.end.line)} wird jedes Mal ausgeführt` : ''}.`;
}

/** Ein Ausdruck als ganze Anweisung: Aufruf, Zuweisung, `await …` */
function ausdrucksAnweisung(e, k) {
  switch (e.type) {
    case 'CallExpression':
    case 'OptionalCallExpression':
      return satz(aufrufWendung(e, k, { form: 'satz' }));
    case 'AwaitExpression':
      hinweis(k, 'await', SPRACHMITTEL.await);
      return `Wartet, bis ${/Call/.test(e.argument.type) ? aufrufWendung(e.argument, k, { form: 'relativ' }).replace(/ aufruft$/, ' fertig ist') : `${wendung(e.argument, k)} fertig ist`}.`;
    case 'AssignmentExpression': {
      const links = e.left;
      const ziel = nameVon(links) ?? quelle(k, links);
      const rechts = hier(k, e.right) ? akkusativ(wendung(e.right, k)) : `den Wert ab ${zeile(e.right.loc.start.line)}`;
      if (ziel.endsWith('.current') && k.refs.has(ziel.replace(/\.current$/, ''))) return `Legt im Ref ${code(ziel.replace(/\.current$/, ''))} ab (ohne neu zu zeichnen): ${rechts}.`;
      if (e.operator === '+=') return `Erhöht ${code(ziel)} um ${rechts}${links.type === 'Identifier' ? '' : ''} (bei Texten: hängt es an).`;
      if (e.operator === '-=') return `Verringert ${code(ziel)} um ${rechts}.`;
      if (e.operator === '??=') return `Setzt ${code(ziel)} auf ${rechts} – aber nur, wenn noch nichts darin steht.`;
      if (e.operator === '||=') return `Setzt ${code(ziel)} auf ${rechts}, wenn es bisher leer oder falsch ist.`;
      if (links.type === 'MemberExpression') return `Setzt ${code(ziel ?? quelle(k, links), 60)} auf ${rechts}.`;
      return `Setzt ${code(ziel)} auf ${rechts}.`;
    }
    case 'UpdateExpression':
      return `${e.operator === '++' ? 'Erhöht' : 'Verringert'} ${schnipsel(k, e.argument)} um 1.`;
    case 'LogicalExpression':
      if (e.operator === '&&') return satz(`Wenn ${bedingung(e.left, k)}: ${/Call/.test(e.right.type) && hier(k, e.right) ? aufrufWendung(e.right, k, { form: 'satz' }) : kurzwert(e.right, k)}`);
      return `${gross(wendung(e, k))}.`;
    case 'ConditionalExpression':
      return `Je nachdem, ob ${bedingung(e.test, k)}: ${kurzwert(e.consequent, k)} oder sonst ${kurzwert(e.alternate, k)}.`;
    case 'UnaryExpression':
      if (e.operator === 'delete') return `Entfernt ${schnipsel(k, e.argument)}.`;
      if (e.operator === 'void') return `Ruft ${hier(k, e.argument) ? wendung(e.argument, k) : '…'} auf und verwirft das Ergebnis (void).`;
      return `${gross(wendung(e, k))}.`;
    case 'StringLiteral':
      return `Eine Anweisung an JavaScript selbst: ${code(e.value)}.`;
    default:
      return `${gross(wendung(e, k))}.`;
  }
}

/** Was steht in einer Rückgabe? */
function rueckgabe(n, k) {
  const a = n.argument;
  if (!a) return 'Beendet die Funktion hier, ohne etwas zurückzugeben.';
  const f = umgebendeFunktion(k, n);
  const komp = f && istKomponente(k, f);
  if (!hier(k, a)) {
    if (a.type === 'JSXElement' || a.type === 'JSXFragment' || (a.extra?.parenthesized && a.type.startsWith('JSX'))) {
      hinweis(k, 'jsx', 'JSX: Markup, das aussieht wie HTML, aber JavaScript ist. React macht daraus die Elemente auf dem Bildschirm.');
      return `Gibt das Markup zurück, das React zeichnet; es beginnt in ${zeile(a.loc.start.line)} und reicht bis ${zeile(a.loc.end.line)}.`;
    }
    return `Gibt zurück, was ab ${zeile(a.loc.start.line)} steht.`;
  }
  if (a.type === 'NullLiteral' && komp) return 'Gibt nichts zurück (null): Die Komponente zeigt in diesem Fall gar nichts an.';
  if (a.type === 'JSXElement' || a.type === 'JSXFragment') {
    hinweis(k, 'jsx', 'JSX: Markup, das aussieht wie HTML, aber JavaScript ist. React macht daraus die Elemente auf dem Bildschirm.');
    return `Gibt ${jsxWendung(a, k)} zurück – das zeichnet React.`;
  }
  if (/Call/.test(a.type) && quelle(k, a.callee).startsWith('res.')) {
    return `${satz(aufrufWendung(a, k, { form: 'satz' })).replace(/\.$/, '')} – und beendet damit die Funktion (return).`;
  }
  if (/Call/.test(a.type)) {
    const w = aufrufWendung(a, k);
    return w.includes(',') ? `Gibt zurück: ${w}.` : `Gibt ${w} zurück.`;
  }
  const w = akkusativ(wendung(a, k));
  // Steht ein Nebensatz in der Wendung, gehört sie ans Ende: „Gibt zurück: …, der …“.
  return w.includes(',') ? `Gibt zurück: ${w}.` : `Gibt ${w} zurück.`;
}

/**
 * Eine Anweisung als ganzer Satz.
 *
 * @param {object} n  der Knoten (Statement)
 * @param {object} k  Kontext
 */
export function anweisung(n, k) {
  switch (n.type) {
    case 'ImportDeclaration':
      return einfuhr(n, k);
    case 'ExportNamedDeclaration': {
      hinweis(k, 'export', SPRACHMITTEL.export);
      const d = n.declaration;
      if (d?.type === 'FunctionDeclaration') return funktionsSatz(d, d.id?.name, k, 'named');
      if (d?.type === 'VariableDeclaration') return variablen(d, k, true);
      if (n.source) return `Reicht ${aufzaehlen(n.specifiers.map((s) => code(s.exported.name ?? s.exported.value)))} aus ${code(n.source.value)} unverändert weiter – wer diese Datei einführt, bekommt sie mit.`;
      if (!hier(k, n.specifiers[0] ?? n)) return 'Führt die Namen aus, die in den nächsten Zeilen aufgezählt sind.';
      return `Führt ${aufzaehlen(n.specifiers.filter((s) => hier(k, s)).map((s) => code(s.exported.name ?? s.exported.value)))} aus: Andere Dateien dürfen sie einführen.`;
    }
    case 'ExportDefaultDeclaration': {
      hinweis(k, 'default', SPRACHMITTEL.default);
      const d = n.declaration;
      if (d.type === 'FunctionDeclaration') return funktionsSatz(d, d.id?.name, k, 'default');
      if (d.type === 'Identifier') return `Die Standardausfuhr dieser Datei ist ${code(d.name)}.`;
      return `Die Standardausfuhr dieser Datei: ${wendung(d, k)}.`;
    }
    case 'ExportAllDeclaration':
      return `Reicht alles, was ${code(n.source.value)} ausführt, unverändert weiter – wer diese Datei einführt, bekommt es mit.`;
    case 'VariableDeclaration':
      return variablen(n, k, false);
    case 'FunctionDeclaration':
      return funktionsSatz(n, n.id?.name, k);
    case 'ExpressionStatement':
      return ausdrucksAnweisung(n.expression, k);
    case 'ReturnStatement':
      return rueckgabe(n, k);
    case 'IfStatement':
      return wenn(n, k);
    case 'ForOfStatement':
    case 'ForInStatement':
      return fuerJedes(n, k);
    case 'ForStatement':
      return zaehlschleife(n, k);
    case 'WhileStatement':
      return `Wiederholt, solange ${bedingung(n.test, k)}${n.body.type === 'BlockStatement' && !einzeilig(n.body) ? `, den Block bis ${zeile(n.body.loc.end.line)}` : `: ${hier(k, n.body) ? anweisung(n.body.type === 'BlockStatement' ? n.body.body[0] ?? n.body : n.body, k) : '…'}`}.`;
    case 'DoWhileStatement':
      return `Führt den Block bis ${zeile(n.body.loc.end.line)} aus und wiederholt ihn, solange die Bedingung am Ende zutrifft.`;
    case 'TryStatement':
      hinweis(k, 'try', SPRACHMITTEL.try);
      return `Versucht das Folgende (bis ${zeile(n.block.loc.end.line)})${n.handler ? `; geht dabei etwas schief, geht es in ${zeile(n.handler.loc.start.line)} weiter, statt abzustürzen` : ''}${n.finalizer ? `; der finally-Teil ab ${zeile(n.finalizer.loc.start.line)} läuft danach in jedem Fall` : ''}.`;
    case 'ThrowStatement':
      hinweis(k, 'throw', SPRACHMITTEL.throw);
      return `Wirft ${hier(k, n.argument) ? akkusativ(wendung(n.argument, k)) : 'einen Fehler'} – der Ablauf springt zum nächsten umgebenden catch.`;
    case 'BreakStatement':
      return 'Bricht die Schleife hier ab.';
    case 'ContinueStatement':
      return 'Überspringt den Rest dieses Durchlaufs und macht mit dem nächsten weiter.';
    case 'BlockStatement':
      return einzeilig(n) ? (n.body.length ? n.body.map((a) => anweisung(a, k)).join(' ') : 'Ein leerer Block.') : `Ein Block bis ${zeile(n.loc.end.line)}: Was darin festgelegt wird, gilt nur dort.`;
    case 'EmptyStatement':
      return 'Eine leere Anweisung (ein einzelnes Semikolon).';
    case 'SwitchStatement':
      return `Unterscheidet nach dem Wert von ${kurzwert(n.discriminant, k)}; die Fälle folgen bis ${zeile(n.loc.end.line)}.`;
    case 'ClassDeclaration':
      return `Beginnt die Klasse ${code(n.id?.name ?? '')}; sie reicht bis ${zeile(n.loc.end.line)}.`;
    default:
      return `${code(quelle(k, n).split('\n')[0], 60)}.`;
  }
}

