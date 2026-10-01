/**
 * JSX in Worten: was ein `<button onClick={…}>` auf dem Bildschirm ist.
 *
 * JSX sieht aus wie HTML, ist aber JavaScript: Jedes Element wird zu einem
 * Aufruf, den React in echtes HTML verwandelt. Kleingeschriebene Namen
 * (`<div>`, `<button>`) sind HTML-Elemente; großgeschriebene (`<Wurfknopf>`)
 * sind Komponenten – Funktionen des Almanachs, die selbst wieder JSX
 * liefern. In geschweiften Klammern `{…}` steht wieder JavaScript.
 *
 * Erklärt wird hier ein Element (`jsxElementSatz`), ein Attribut, das auf
 * eigener Zeile steht (`jsxAttributSatz`), ein `{…}` im Inhalt
 * (`jsxKindSatz`) und eine Zeile reinen Texts (`jsxTextSatz`).
 */
import { code, zeile, aufzaehlen, kuerzen, gross, akkusativ, dativ, zitat } from '../text.mjs';
import { REACT, EREIGNISSE, ATTRIBUTE } from '../woerterbuch/react.mjs';
import { ELEMENTE } from '../woerterbuch/html.mjs';
import { klassenErklaeren } from '../tailwind.mjs';
import { quelle, schnipsel, hier, einzeilig, hinweis, parameterVon, istKomponente } from './hilfen.mjs';
import { kurzwert, bedingung } from './ausdruck.mjs';
import { aufrufWendung } from './aufruf.mjs';

/** Den ersten Buchstaben klein schreiben – für Satzformen mitten im Satz. */
// Die Steuerzeichen sind die Code- und Zeilenmarken aus text.mjs.
// eslint-disable-next-line no-control-regex
export const klein = (t) => t.replace(/^([\u0001-\u0004]*)(\p{Lu})(?=\p{Ll})/u, (_, vor, b) => vor + b.toLowerCase());

/** Der Name eines Elements: `div`, `Wurfknopf`, `t.Component`. */
export function elementName(n) {
  const name = (n.openingElement ?? n).name;
  if (!name) return '';
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') return `${elementName({ name: name.object })}.${name.property.name}`;
  if (name.type === 'JSXNamespacedName') return `${name.namespace.name}:${name.name.name}`;
  return '';
}

/** Was für ein Element: „ein `<p>` (ein Absatz)“ oder „die Komponente `<Wurfknopf>` …“. */
function wasFuerEin(n, k, mitErklaerung = true) {
  if (n.type === 'JSXFragment') {
    hinweis(k, 'fragment', `${code('<>…</>')} – ${REACT.Fragment}; so darf eine Komponente mehrere Elemente nebeneinander liefern.`);
    return `eine Gruppe ohne eigenes HTML-Element (${code('<>')})`;
  }
  const name = elementName(n);
  if (/^[a-z]/.test(name)) {
    return `ein ${code(`<${name}>`)}${ELEMENTE[name] ? ` (${ELEMENTE[name]})` : ''}`;
  }
  hinweis(k, 'komponente', 'Ein Name mit großem Anfangsbuchstaben im JSX ist eine Komponente: eine Funktion des Almanachs, die selbst Markup liefert. Die Attribute daran sind ihre Props – die Werte, die sie mitbekommt.');
  const wurzelName = name.split('.')[0];
  const ziel = k.projekt.aufloesen(k.datei, wurzelName);
  let erkl = '';
  if (mitErklaerung && !k.gesehen.has(`komp:${name}`)) {
    if (ziel?.def?.satz) {
      k.gesehen.add(`komp:${name}`);
      const wo = ziel.datei !== k.datei ? ` (${ziel.datei.replace(/^frontend\/src\//, '')})` : '';
      erkl = ` – „${ziel.def.satz.replace(/\.$/, '')}“${wo}`;
    } else if (ziel?.paket && REACT[name]) {
      k.gesehen.add(`komp:${name}`);
      erkl = ` – ${REACT[name]}`;
    }
  }
  return `die Komponente ${code(`<${name}>`)}${erkl}`;
}

/** Ein Element als Satzteil – ohne Attribute, mit dem Inhalt, wenn er kurz ist. */
export function jsxWendung(n, k) {
  const was = wasFuerEin(n, k);
  if (einzeilig(n) && n.children?.length) {
    const inhalt = inhaltKurz(n, k);
    if (inhalt) return `${was} mit ${inhalt}`;
  }
  if (!einzeilig(n)) return `${was}, das bis ${zeile(n.loc.end.line)} reicht`;
  return was;
}

/** Der Inhalt eines einzeiligen Elements in wenigen Worten. */
function inhaltKurz(n, k) {
  const teile = [];
  for (const kind of n.children) {
    if (kind.type === 'JSXText') {
      const t = kind.value.replace(/\s+/g, ' ').trim();
      if (t) teile.push(`dem Text „${kuerzen(t, 60)}“`);
    } else if (kind.type === 'JSXExpressionContainer') {
      if (kind.expression.type !== 'JSXEmptyExpression') teile.push(`dem Wert von ${kurzwert(kind.expression, k)}`);
    } else if (kind.type === 'JSXElement' || kind.type === 'JSXFragment') {
      teile.push(`darin ${wasFuerEin(kind, k)}`);
    }
  }
  return aufzaehlen(teile);
}

/** Was beim Ereignis geschieht – der Wert eines `onClick={…}`. */
function handlerText(wert, k) {
  if (!wert) return '';
  if (wert.type === 'ArrowFunctionExpression' || wert.type === 'FunctionExpression') {
    const r = wert.body;
    if (r.type !== 'BlockStatement' && hier(k, r)) {
      if (r.type === 'CallExpression' || r.type === 'OptionalCallExpression') return klein(aufrufWendung(r, k, { form: 'satz' }));
      return `ergibt ${kurzwert(r, k)}`;
    }
    if (r.type === 'BlockStatement' && einzeilig(r)) {
      const s = r.body.map((a) => (a.type === 'ExpressionStatement' && /Call/.test(a.expression.type) ? klein(aufrufWendung(a.expression, k, { form: 'satz' })) : schnipsel(k, a, 40)));
      return s.length ? aufzaehlen(s, 'und dann') : 'nichts';
    }
    return `führt die Schritte bis ${zeile(r.loc.end.line)} aus`;
  }
  if (wert.type === 'Identifier') {
    const ziel = k.projekt.aufloesen(k.datei, wert.name);
    if (ziel?.def?.satz) {
      hinweis(k, `ruf:${wert.name}`, `${code(wert.name)} – „${ziel.def.satz}“`);
      return `ruft ${code(wert.name)} auf`;
    }
    const f = parameterVon(k, wert, wert.name);
    if (f && istKomponente(k, f)) return `ruft ${code(wert.name)} auf – die Funktion, die die Elternkomponente als Prop mitgegeben hat`;
    if (k.zustand.has(wert.name)) return `setzt den Zustand ${code(k.zustand.get(wert.name))} auf den neuen Wert`;
    return `ruft ${code(wert.name)} auf`;
  }
  if (/Call/.test(wert.type)) return `ruft die Funktion auf, die ${schnipsel(k, wert)} liefert`;
  return kurzwert(wert, k);
}

/** Der Wert eines Attributs (ohne `{}`) – oder null bei `disabled` ohne Wert. */
const attributWert = (a) => (a.value?.type === 'JSXExpressionContainer' ? a.value.expression : a.value);

/** Ein className in Worten – Text, Vorlage oder Bedingung. */
export function klassenWert(wert, k) {
  hinweis(
    k,
    'tailwind',
    'className bestimmt das Aussehen über CSS-Klassen. Die meisten stammen von Tailwind – jede ein kleiner Baustein (flex: nebeneinander, gap-2: 8 px Abstand, text-rubric: rote Schrift). Die Farbnamen kommen aus stile/farben.css und wechseln mit Pergament und Kerzenlicht.'
  );
  if (!wert) return '';
  if (wert.type === 'StringLiteral') return klassenErklaeren(wert.value, k.projekt).text;
  if (wert.type === 'TemplateLiteral') {
    const teile = [];
    wert.quasis.forEach((q, i) => {
      if (q.loc.start.line <= k.L && q.loc.end.line >= k.L) {
        const zeilen = q.value.cooked.split('\n');
        const stueck = zeilen[k.L - q.loc.start.line] ?? '';
        if (stueck.trim()) teile.push(klassenErklaeren(stueck, k.projekt).text);
      }
      const e = wert.expressions[i];
      if (e && hier(k, e)) teile.push(bedingteKlassen(e, k));
    });
    const mehr = !einzeilig(wert) ? ' (weitere Klassen folgen in den nächsten Zeilen)' : '';
    return teile.join('; dazu ') + mehr;
  }
  return bedingteKlassen(wert, k);
}

/** `aktiv ? 'a' : 'b'` oder `fehler && 'rot'` als Klassen in Worten. */
function bedingteKlassen(e, k) {
  const k2 = (n) =>
    n.type === 'StringLiteral' ? (n.value.trim() ? klassenErklaeren(n.value, k.projekt).text : 'keine weiteren Klassen') : `die Klassen aus ${kurzwert(n, k)}`;
  if (e.type === 'ConditionalExpression') {
    return `je nachdem, ob ${bedingung(e.test, k)}: ${hier(k, e.consequent) ? k2(e.consequent) : '…'} – sonst ${hier(k, e.alternate) ? k2(e.alternate) : '…'}`;
  }
  if (e.type === 'LogicalExpression' && e.operator === '&&') return `nur wenn ${bedingung(e.left, k)}: ${hier(k, e.right) ? k2(e.right) : '…'}`;
  if (e.type === 'StringLiteral') return k2(e);
  if (e.type === 'TemplateLiteral') return klassenWert(e, k);
  return `die Klassen aus ${kurzwert(e, k)}`;
}

/** Ein Attribut als Satzteil: „beim Klick: ruft … auf“, „`size` = 13“. */
function attributWendung(a, k, istHtml) {
  if (a.type === 'JSXSpreadAttribute') {
    return `alle Felder von ${kurzwert(a.argument, k)} als weitere Attribute (Spread)`;
  }
  const name = a.name.type === 'JSXNamespacedName' ? `${a.name.namespace.name}:${a.name.name.name}` : a.name.name;
  const wert = attributWert(a);
  if (name === 'className') return `Aussehen: ${klassenWert(wert, k)}`;
  if (/^on[A-Z]/.test(name)) {
    const wann = EREIGNISSE[name];
    if (wann && istHtml) return `${wann} (${code(name)}): ${handlerText(wert, k)}`;
    hinweis(k, 'rueckruf', `Props, die mit „on“ beginnen (${code('onChange')}, ${code('onSpeichern')} …), sind Rückrufe: Die Elternkomponente gibt eine Funktion mit, und die Komponente ruft sie auf, wenn das Genannte passiert.`);
    return `Rückruf ${code(name)}: ${wert ? handlerText(wert, k) : '…'}`;
  }
  if (name === 'key') {
    hinweis(k, 'attr:key', `${code('key')} – ${ATTRIBUTE.key}`);
    return `Schlüssel ${wert ? kurzwert(wert, k) : ''}`;
  }
  if (name === 'ref') {
    hinweis(k, 'attr:ref', `${code('ref')} – ${ATTRIBUTE.ref}`);
    return `verbunden mit dem Ref ${wert ? kurzwert(wert, k) : ''}`;
  }
  if (istHtml && ATTRIBUTE[name]) hinweis(k, `attr:${name}`, `${code(name)} – ${ATTRIBUTE[name]}`);
  if (!wert) return `${code(name)} (eingeschaltet)`;
  if (!hier(k, wert)) return `${code(name)} = … (der Wert folgt ab ${zeile(wert.loc.start.line)})`;
  if (wert.type === 'StringLiteral') return `${code(name)} = „${kuerzen(wert.value, 60)}“`;
  return `${code(name)} = ${kurzwert(wert, k)}`;
}

/** Die Attribute eines Elements, die in der aktuellen Zeile stehen. */
function attributeHier(n, k) {
  const oe = n.openingElement;
  if (!oe) return { text: '', mehr: false };
  const istHtml = /^[a-z]/.test(elementName(n));
  const alle = oe.attributes;
  const da = alle.filter((a) => hier(k, a));
  // className zuletzt – er ist meist lang, das Wesentliche soll vorne stehen.
  const sortiert = [...da.filter((a) => a.name?.name !== 'className'), ...da.filter((a) => a.name?.name === 'className')];
  return { text: sortiert.map((a) => attributWendung(a, k, istHtml)).join('; '), mehr: da.length < alle.length };
}

/** Ein Element, das in dieser Zeile beginnt, als ganzer Satz. */
export function jsxElementSatz(n, k) {
  const was = gross(wasFuerEin(n, k));
  if (n.type === 'JSXFragment') {
    return einzeilig(n) ? `${was}.` : `${was}; sie fasst die Elemente bis ${zeile(n.loc.end.line)} zusammen.`;
  }
  const { text, mehr } = attributeHier(n, k);
  const teile = [text ? `${was} – ${text}` : was];
  const selbst = n.openingElement.selfClosing;
  if (mehr) teile.push(`Weitere Attribute folgen in den nächsten Zeilen${selbst ? '' : `; der Inhalt reicht bis ${zeile(n.loc.end.line)}`}`);
  else if (!selbst) {
    if (einzeilig(n)) {
      const inhalt = inhaltKurz(n, k);
      if (inhalt) teile.push(`Inhalt: ${inhalt.replace(/^dem /, 'der ').replace(/^darin /, '')}`);
    } else teile.push(`Der Inhalt folgt bis ${zeile(n.loc.end.line)}, wo ${code(`</${elementName(n)}>`)} das Element schließt`);
  }
  return teile.join('. ') + '.';
}

/** Ein Attribut auf eigener Zeile als ganzer Satz. */
export function jsxAttributSatz(a, element, k) {
  const istHtml = /^[a-z]/.test(elementName({ name: element.name }));
  return `${gross(attributWendung(a, k, istHtml))}.`;
}

/** Ein `{…}` im Inhalt eines Elements als ganzer Satz. */
export function jsxKindSatz(c, k) {
  const e = c.expression;
  if (e.type === 'JSXEmptyExpression') return 'Ein Kommentar im Markup (zwischen {/* und */}); er erscheint nicht auf dem Bildschirm.';
  hinweis(k, 'jsx{}', 'Geschweifte Klammern im Markup heißen: Hier steht wieder JavaScript – was der Ausdruck ergibt, erscheint an dieser Stelle.');
  if (e.type === 'LogicalExpression' && e.operator === '&&') {
    const was = hier(k, e.right) ? (e.right.type.startsWith('JSX') ? jsxWendung(e.right, k) : kurzwert(e.right, k)) : `das Folgende (bis ${zeile(e.right.loc.end.line)})`;
    return `Nur wenn ${bedingung(e.left, k)}, erscheint ${was}.`;
  }
  if (e.type === 'LogicalExpression') {
    return `Zeigt ${akkusativ(kurzwert(e.left, k))}, ersatzweise ${hier(k, e.right) ? kurzwert(e.right, k) : 'das Folgende'}.`;
  }
  if (e.type === 'ConditionalExpression') {
    const ja = hier(k, e.consequent) ? (e.consequent.type.startsWith('JSX') ? jsxWendung(e.consequent, k) : kurzwert(e.consequent, k)) : 'die erste Fassung (sie folgt)';
    const nein = hier(k, e.alternate) ? (e.alternate.type.startsWith('JSX') ? jsxWendung(e.alternate, k) : kurzwert(e.alternate, k)) : 'die zweite';
    return `Je nachdem, ob ${bedingung(e.test, k)}, erscheint ${ja} – sonst ${nein}.`;
  }
  if ((e.type === 'CallExpression' || e.type === 'OptionalCallExpression') && e.callee.property?.name === 'map') {
    const f = e.arguments[0];
    const p = f?.params?.[0] ? code(quelle(k, f.params[0])) : 'Eintrag';
    const liste = dativ(kurzwert(e.callee.object, k));
    // Ein Relativsatz in der Liste („…, die die Prüfung bestehen“) braucht sein Komma am Ende.
    const komma = /, (die|der|das|für die) /.test(liste) ? ',' : '';
    hinweis(k, 'liste-key', `Eine Liste von Elementen entsteht mit ${code('.map(…)')}: für jeden Eintrag ein Element. Jedes braucht ein ${code('key')}, damit React sie auseinanderhält.`);
    const rumpf = f?.body;
    if (rumpf && rumpf.type !== 'BlockStatement' && hier(k, rumpf)) {
      return `Für jeden Eintrag ${p} aus ${liste}${komma} erscheint ${rumpf.type.startsWith('JSX') ? jsxWendung(rumpf, k) : kurzwert(rumpf, k)}.`;
    }
    return `Für jeden Eintrag ${p} aus ${liste}${komma} erscheint das, was bis ${zeile(e.loc.end.line)} beschrieben ist.`;
  }
  return `Setzt ${akkusativ(kurzwert(e, k))} ein.`;
}

/** Eine Zeile, die nur Text des Markups enthält. */
export function jsxTextSatz(text) {
  return `Text, der so auf dem Bildschirm erscheint: ${zitat(kuerzen(text.trim(), 140))}.`;
}

