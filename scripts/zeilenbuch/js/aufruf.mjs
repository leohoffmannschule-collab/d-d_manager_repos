/**
 * Aufrufe in Worten: was `foo(a, b)` tut.
 *
 * Ein Aufruf kommt in drei Satzformen vor, und jede braucht ihre eigene
 * Wortstellung:
 *
 *   satz     als eigene Anweisung       „Ruft `speichern()` auf“
 *   relativ  im Nebensatz               „…, die `speichern()` aufruft“
 *   wert     als Wert in einem Satz     „das Ergebnis von `speichern()`“
 *
 * Was die gerufene Funktion bedeutet, kommt als Hinweis dazu: aus dem
 * Projekt-Index (eigene Funktionen, mit dem ersten Satz ihres Kommentars),
 * aus den Wörterbüchern (JavaScript, React, Node, Express, Browser) – oder,
 * für eine Handvoll häufiger Muster, als eigene Wendung: das Ändern eines
 * Zustands, das Anlegen eines Server-Weges, das Antworten mit einem Status,
 * SQL über `db.prepare`, die Aufrufe der eigenen Schnittstelle.
 */
import { code, zeile, aufzaehlen, kuerzen, zitat, dativ } from '../text.mjs';
import { GLOBALE, STATISCH, METHODEN } from '../woerterbuch/javascript.mjs';
import { REACT } from '../woerterbuch/react.mjs';
import { NODE, EXPRESS, STATUS, SQLITE, METHODE } from '../woerterbuch/node.mjs';
import { BROWSER } from '../woerterbuch/browser.mjs';
import { quelle, schnipsel, hier, einzeilig, hinweis, nameVon, parameterVon, istKomponente } from './hilfen.mjs';
import { wendung, kurzwert, bedingung } from './ausdruck.mjs';
import { zusammenfassung } from '../sql.mjs';

/** Wie eine Datei im Hinweis heißt: ohne die üblichen Wurzeln. */
const kurzPfad = (datei) => datei.replace(/^(frontend|backend)\/src\//, '').replace(/^scripts\//, 'scripts/');

/** Der erste Satz des Kommentars über einem Weg, ohne die Kopfzeile „POST /api/… { … } –“. */
export function wegSatz(weg) {
  let t = (weg?.text ?? '').replace(/\s+/g, ' ').trim();
  t = t.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+\S+\s*/, '').replace(/^\{[^}]*\}\s*/, '').replace(/^[\s–-]+/, '');
  const satz = /^(.+?[.!?])(\s|$)/.exec(t)?.[1] ?? t;
  return kuerzen(satz, 200);
}

/** Wer einen Weg benutzen darf – aus den Wächtern davor. */
export function werDarf(waechter = []) {
  if (waechter.includes('requireDm')) return 'nur die Spielleitung';
  if (waechter.includes('requireCampaign')) return 'alle Angemeldeten, die eine Kampagne gewählt haben';
  if (waechter.includes('requireAuth')) return 'alle Angemeldeten';
  return 'alle, auch ohne Anmeldung';
}

/** Ein Modul wie `node:fs` unter dem Namen, den die Wörterbücher benutzen (`fs`). */
const modulKurz = (paket) => paket.replace(/^node:/, '').replace(/\/promises$/, '');

/**
 * Was der gerufene Name bedeutet – oder null, wenn ihn niemand kennt.
 *
 * @returns {{ name: string, text: string, wo?: string, schluessel: string } | null}
 */
export function bedeutung(callee, k) {
  const name = nameVon(callee);
  if (!name) {
    // Ein Glied einer Kette (`liste.filter(…).map(…)`): nur der Methodenname zählt.
    const m = /MemberExpression/.test(callee.type) && !callee.computed ? callee.property.name : null;
    const t = m && (METHODEN[m] ?? BROWSER[m]);
    return t ? { name: `.${m}`, text: t, schluessel: `methode:${m}` } : null;
  }
  const teile = name.split('.');
  const erst = teile[0];
  const letzt = teile[teile.length - 1];

  // Ein eigener Name: im Projekt-Index verfolgen.
  if (teile.length === 1) {
    const ziel = k.projekt.aufloesen(k.datei, name);
    if (ziel?.def?.satz) return { name, text: zitat(ziel.def.satz), wo: ziel.datei !== k.datei ? kurzPfad(ziel.datei) : null, schluessel: `ruf:${name}` };
    if (ziel?.paket) {
      const t = REACT[ziel.name] ?? NODE[ziel.name] ?? EXPRESS[ziel.name] ?? NODE[`${modulKurz(ziel.paket)}.${ziel.name}`];
      if (t) return { name, text: t, schluessel: `ruf:${name}` };
    }
    if (ziel?.def) return null;
    const f = parameterVon(k, callee, name);
    if (f) {
      return {
        name,
        text: istKomponente(k, f) ? 'eine Funktion, die die Elternkomponente als Prop mitgegeben hat' : 'eine Funktion, die als Parameter mitgegeben wurde',
        schluessel: `ruf:${name}`,
      };
    }
    const t = GLOBALE[name] ?? BROWSER[name] ?? NODE[name] ?? REACT[name] ?? EXPRESS[name];
    return t ? { name, text: t, schluessel: `ruf:${name}` } : null;
  }

  // Ein Feld eines eingeführten Moduls: `fs.readFileSync`, `rechnen.formatModifier`.
  const ein = k.projekt.dateien.get(k.datei)?.einfuhren.get(erst);
  if (ein && teile.length === 2) {
    if (k.projekt.dateien.has(ein.quelle) && ein.name === '*') {
      const ziel = k.projekt.ausfuhrVon(ein.quelle, letzt);
      if (ziel?.def?.satz) return { name, text: zitat(ziel.def.satz), wo: kurzPfad(ziel.datei), schluessel: `ruf:${name}` };
    }
    if (!k.projekt.dateien.has(ein.quelle)) {
      const t = NODE[`${modulKurz(ein.quelle)}.${letzt}`] ?? EXPRESS[`${modulKurz(ein.quelle)}.${letzt}`];
      if (t) return { name: `${modulKurz(ein.quelle)}.${letzt}`, text: t, schluessel: `ruf:${modulKurz(ein.quelle)}.${letzt}` };
    }
  }
  const fest = STATISCH[name] ?? NODE[name] ?? EXPRESS[name] ?? BROWSER[name];
  if (fest) return { name, text: fest, schluessel: `ruf:${name}` };
  if (teile.length === 2) {
    const feld = k.projekt.feld(k.datei, erst, letzt);
    if (feld?.def?.satz) return { name, text: zitat(feld.def.satz), wo: kurzPfad(feld.datei), schluessel: `ruf:${name}` };
  }
  if (['res', 'req'].includes(erst) && EXPRESS[`${erst}.${letzt}`]) return { name: `${erst}.${letzt}`, text: EXPRESS[`${erst}.${letzt}`], schluessel: `ruf:${erst}.${letzt}` };
  const methode = METHODEN[letzt] ?? BROWSER[letzt];
  if (methode) return { name: `.${letzt}`, text: methode, schluessel: `methode:${letzt}` };
  return null;
}

/** Den Hinweis zu einer Bedeutung geben (einmal je Datei). */
function erklaereBedeutung(b, k) {
  if (!b) return;
  hinweis(k, b.schluessel, `${code(b.name)} – ${b.text}${b.wo ? ` (${b.wo})` : ''}`);
}

/**
 * Die Argumente eines Aufrufs, die hier stehen, in Worten:
 * „Argument: eine Funktion …“, „Argumente: `a` und `b`“.
 */
function argumente(n, k) {
  const da = n.arguments.filter((a) => hier(k, a));
  const teile = da.map((a) => kurzwert(a, k));
  const spaeter = n.arguments.find((a) => !hier(k, a));
  const mehr = spaeter ? `${da.length ? 'weitere Argumente folgen' : 'die Argumente folgen'} ab ${zeile(spaeter.loc.start.line)}` : '';
  const text = teile.length ? `${teile.length === 1 && !spaeter ? 'Argument' : 'Argumente'}: ${aufzaehlen(teile)}` : '';
  return [text, mehr].filter(Boolean).join('; ');
}

/** Der Name eines Aufrufs für den Satz: `foo`, `db.prepare`, `.run` (am Ende einer Kette). */
export function rufName(n, k) {
  const name = nameVon(n.callee);
  if (name) return code(name);
  if (n.callee.type === 'MemberExpression' && !n.callee.computed) return code('.' + n.callee.property.name);
  return schnipsel(k, n.callee, 40);
}

/**
 * Wie der Aufruf im Satz erscheint: als Ganzes, wenn er kurz in einer
 * Zeile steht; sonst sein Name, und die Argumente kommen dahinter.
 */
function anzeige(n, k) {
  const t = quelle(k, n);
  if (einzeilig(n) && t.length <= 80) return { kurz: code(t, 80), args: '' };
  return { kurz: rufName(n, k), args: argumente(n, k) };
}

/** Die Rückruf-Funktion einer Listenmethode: ihr Parameter und – wenn er hier steht – ihr Ausdruck. */
function rueckruf(fn, k) {
  if (!fn || !/Function/.test(fn.type)) return null;
  const p = fn.params[0] ? quelle(k, fn.params[0]) : null;
  const ausdruck = fn.body.type !== 'BlockStatement' && hier(k, fn.body) ? fn.body : null;
  return { p, ausdruck, bis: fn.body.loc.end.line };
}

/** Listenmethoden mit Rückruf: was dabei herauskommt. */
function listenMethode(n, k) {
  const c = n.callee;
  const m = c.property?.name;
  if (!['map', 'filter', 'find', 'some', 'every', 'forEach', 'flatMap', 'findIndex'].includes(m)) return null;
  const r = rueckruf(n.arguments[0], k);
  if (!r) return null;
  // Das vorige Glied einer Kette, das schon in früheren Zeilen erklärt ist,
  // heißt hier nur noch „die Liste aus Zeile N“.
  const liste = hier(k, c.object) || einzeilig(c.object) ? kurzwert(c.object, k) : `die Liste aus ${zeile(c.object.loc.end.line)}`;
  const vonListe = dativ(liste);
  const jeder = r.p ? `jeden Eintrag ${code(r.p)} von ${vonListe}` : `jeden Eintrag von ${vonListe}`;
  const folgt = `(was dabei geschieht, steht bis ${zeile(r.bis)})`;
  hinweis(k, `methode:${m}`, `${code('.' + m)} – ${METHODEN[m]}`);
  switch (m) {
    case 'map':
    case 'flatMap':
      return {
        wert: r.ausdruck
          ? `eine neue Liste: Aus ${r.p ? `jedem Eintrag ${code(r.p)}` : 'jedem Eintrag'} von ${vonListe} wird ${wendung(r.ausdruck, k)}`
          : `eine neue Liste, die aus jedem Eintrag von ${vonListe} entsteht ${folgt}`,
        satz: r.ausdruck
          ? `Baut eine neue Liste: Aus ${r.p ? `jedem Eintrag ${code(r.p)}` : 'jedem Eintrag'} von ${vonListe} wird ${wendung(r.ausdruck, k)}`
          : `Geht ${jeder} durch und baut daraus eine neue Liste ${folgt}`,
      };
    case 'filter':
      return {
        wert: r.ausdruck ? `die Einträge ${r.p ? code(r.p) + ' ' : ''}von ${vonListe}, für die gilt: ${bedingung(r.ausdruck, k)}` : `die Einträge von ${vonListe}, die die Prüfung bestehen ${folgt}`,
        satz: r.ausdruck
          ? `Behält von ${vonListe} nur die Einträge${r.p ? ' ' + code(r.p) : ''}, für die gilt: ${bedingung(r.ausdruck, k)}`
          : `Siebt ${liste} aus ${folgt}`,
      };
    case 'find':
    case 'findIndex':
      return {
        wert: r.ausdruck
          ? `${m === 'find' ? 'der erste Eintrag' : 'die Stelle des ersten Eintrags'} ${r.p ? code(r.p) + ' ' : ''}von ${vonListe}, für den gilt: ${bedingung(r.ausdruck, k)}`
          : `${m === 'find' ? 'der erste Eintrag' : 'die Stelle des ersten Eintrags'} von ${vonListe}, der die Prüfung besteht ${folgt}`,
        satz: r.ausdruck
          ? `Sucht in ${dativ(liste)} ${m === 'find' ? 'den ersten Eintrag' : 'die Stelle des ersten Eintrags'}${r.p ? ' ' + code(r.p) : ''}, für den gilt: ${bedingung(r.ausdruck, k)}`
          : `Sucht in ${dativ(liste)} ${folgt}`,
      };
    case 'some':
    case 'every':
      return {
        wert: r.ausdruck
          ? `ob ${m === 'some' ? 'mindestens ein Eintrag' : 'jeder Eintrag'} ${r.p ? code(r.p) + ' ' : ''}von ${vonListe} die Bedingung erfüllt: ${bedingung(r.ausdruck, k)}`
          : `ob ${m === 'some' ? 'mindestens ein Eintrag' : 'jeder Eintrag'} von ${vonListe} die Prüfung besteht ${folgt}`,
        satz: r.ausdruck
          ? `Prüft, ob ${m === 'some' ? 'mindestens ein Eintrag' : 'jeder Eintrag'}${r.p ? ' ' + code(r.p) : ''} von ${vonListe} die Bedingung erfüllt: ${bedingung(r.ausdruck, k)}`
          : `Prüft ${liste} ${folgt}`,
      };
    case 'forEach':
      return {
        wert: `nichts (forEach liefert kein Ergebnis)`,
        satz: r.ausdruck
          ? `Für ${jeder}: ${/Call/.test(r.ausdruck.type) ? aufrufWendung(r.ausdruck, k, { form: 'satz' }) : wendung(r.ausdruck, k)}`
          : `Für ${jeder} geschieht Folgendes ${folgt}`,
      };
    default:
      return null;
  }
}

/** `router.post('/pfad', …)` und `app.get(…)`: ein Weg der Schnittstelle. */
function wegAnlegen(n, k) {
  const c = n.callee;
  if (c.type !== 'MemberExpression' || !['get', 'post', 'put', 'patch', 'delete'].includes(c.property.name)) return null;
  const obj = nameVon(c.object);
  if (!obj || !/^(router|app|r)$/i.test(obj)) return null;
  const pfadArg = n.arguments[0];
  if (!pfadArg || (pfadArg.type !== 'StringLiteral' && pfadArg.type !== 'RegExpLiteral')) return null;
  const weg = k.projekt.wegIn(k.datei, n.loc.start.line) ?? k.projekt.wegIn(k.datei, pfadArg.loc.start.line - 1);
  const methode = METHODE[c.property.name];
  const pfad = weg?.pfad ?? (pfadArg.value ?? quelle(k, pfadArg));
  const teile = [`Legt den Weg ${methode} ${code(pfad)} an`];
  if (weg) teile.push(`erlaubt für ${werDarf(weg.waechter)}`);
  const platz = [...String(pfad).matchAll(/:(\w+)/g)].map((m) => m[1]);
  if (platz.length) teile.push(`${aufzaehlen(platz.map((p) => code(':' + p)))} ${platz.length > 1 ? 'sind Platzhalter' : 'ist ein Platzhalter'} im Pfad – der Wert steht dann in ${code('req.params.' + platz[0])}`);
  const satzWeg = weg ? wegSatz(weg) : '';
  hinweis(k, 'weg', `Ein Weg (Route) verbindet eine Methode und einen Pfad mit dem Code, der die Antwort schreibt; Express ruft ihn auf, sobald eine passende Anfrage kommt. Die Funktionen dahinter bekommen ${code('req')} (die Anfrage) und ${code('res')} (die Antwort); Funktionen davor sind Wächter, die zuerst prüfen.`);
  const helfer = n.arguments.slice(1, -1).filter((a) => a.type === 'Identifier').map((a) => code(a.name));
  if (helfer.length) teile.push(`vorher prüfen ${aufzaehlen(helfer)}`);
  return `${teile.join('; ')}.${satzWeg ? ` Der Kommentar darüber sagt: ${zitat(satzWeg)}.` : ''}`;
}

/** `res.status(404).json({ error: … })` – eine Antwort an die Oberfläche. */
function antwort(n, k) {
  const c = n.callee;
  if (c.type !== 'MemberExpression') return null;
  const m = c.property.name;
  let status = null;
  let inner = c.object;
  if (inner.type === 'CallExpression' && inner.callee.type === 'MemberExpression' && inner.callee.property.name === 'status' && nameVon(inner.callee.object) === 'res') {
    status = inner.arguments[0];
    inner = inner.callee.object;
  }
  if (nameVon(inner) !== 'res') return null;
  if (m === 'status' && !status) {
    const s = n.arguments[0];
    const zahl = s?.type === 'NumericLiteral' ? s.value : null;
    return { satz: `Setzt den Status der Antwort auf ${s ? kurzwert(s, k) : '…'}${zahl && STATUS[zahl] ? ` (${STATUS[zahl]})` : ''}` };
  }
  if (!['json', 'end', 'send', 'sendStatus', 'sendFile'].includes(m)) return null;
  const s = status ?? (m === 'sendStatus' ? n.arguments[0] : null);
  const zahl = s?.type === 'NumericLiteral' ? s.value : null;
  const statusText = s ? `mit Status ${kurzwert(s, k)}${zahl && STATUS[zahl] ? ` (${STATUS[zahl]})` : ''}` : 'mit Status 200 (OK)';
  const inhalt = n.arguments[0];
  let was = '';
  if (m === 'json' && inhalt) {
    const fehler = inhalt.type === 'ObjectExpression' && inhalt.properties.find((p) => p.key?.name === 'error');
    const schl = inhalt.type === 'ObjectExpression' && inhalt.properties.find((p) => p.key?.name === 'code');
    if (fehler && hier(k, fehler.value)) {
      const schluessel = schl ? (schl.value.type === 'StringLiteral' ? code(schl.value.value) : kurzwert(schl.value, k)) : null;
      was = ` und der Fehlermeldung ${fehler.value.type === 'StringLiteral' ? zitat(kuerzen(fehler.value.value, 90)) : kurzwert(fehler.value, k)}${schluessel ? ` (Schlüssel ${schluessel}, an dem die Oberfläche den Fehler erkennt)` : ''}`;
    } else if (hier(k, inhalt)) was = ` und schickt ${kurzwert(inhalt, k)} als JSON zurück`;
    else was = ' und schickt das Folgende als JSON zurück';
  }
  if (m === 'sendFile') was = ` und schickt die Datei ${inhalt ? kurzwert(inhalt, k) : ''}`;
  hinweis(k, 'antwort', `${code('res')} ist die Antwort an die Oberfläche: ${code('res.status(…)')} setzt den Statuscode, ${code('res.json(…)')} schickt Daten als JSON und beendet die Antwort.`);
  return { satz: `Antwortet ${statusText}${was}`, wert: `die Antwort ${statusText}${was}` };
}

/** SQL über die Datenbank: `db.prepare(sql)`, `.get/.all/.run`, `db.exec(sql)`. */
function datenbank(n, k) {
  const c = n.callee;
  if (c.type !== 'MemberExpression') return null;
  const m = c.property.name;
  // Der Text der Anweisung – auch, wenn er aus Stücken zusammengesetzt ist
  // ('PRAGMA table_info(' + name + ')'); was eingesetzt wird, steht als „…“.
  const sqlText = (a) => {
    if (a?.type === 'StringLiteral') return a.value;
    if (a?.type === 'TemplateLiteral') return a.quasis.map((q) => q.value.cooked).join('…');
    if (a?.type === 'BinaryExpression' && a.operator === '+') return [sqlText(a.left) ?? '…', sqlText(a.right) ?? '…'].join('');
    return null;
  };
  if ((m === 'prepare' || m === 'exec') && /(^|\.)(db|datenbank)$/i.test(nameVon(c.object) ?? '')) {
    hinweis(k, 'sqlite:' + m, `${code(m)} – ${SQLITE[m]}`);
    const t = sqlText(n.arguments[0]);
    const was = t ? zusammenfassung(t) : 'die SQL-Anweisung, die folgt';
    return {
      satz: m === 'prepare' ? `Bereitet eine SQL-Anweisung vor: ${was}` : `Führt SQL direkt aus: ${was}`,
      wert: m === 'prepare' ? `die vorbereitete SQL-Anweisung (${was})` : `das Ausführen von SQL (${was})`,
    };
  }
  if (['get', 'all', 'run', 'iterate'].includes(m) && c.object.type === 'CallExpression' && c.object.callee.type === 'MemberExpression' && c.object.callee.property.name === 'prepare') {
    hinweis(k, 'sqlite:' + m, `${code('.' + m)} – ${SQLITE[m]}`);
    const t = sqlText(c.object.arguments[0]);
    const was = t ? zusammenfassung(t) : 'die SQL-Anweisung, die folgt';
    const hierDa = n.arguments.filter((a) => hier(k, a));
    const platz = hierDa.length
      ? `; die Platzhalter füllen ${aufzaehlen(hierDa.map((a) => kurzwert(a, k)))}`
      : n.arguments.length
        ? `; die Werte für die Platzhalter folgen ab ${zeile(n.arguments[0].loc.start.line)}`
        : '';
    const ergebnis = { get: 'die erste passende Zeile', all: 'alle passenden Zeilen', run: 'wie viele Zeilen betroffen waren', iterate: 'die Zeilen nacheinander' }[m];
    return { satz: `Führt eine SQL-Anweisung aus: ${was}${platz}`, wert: `${ergebnis} der SQL-Anweisung (${was})${platz}` };
  }
  if (['get', 'all', 'run'].includes(m)) {
    // Eine vorher vorbereitete Anweisung, die in einer Variablen liegt.
    const ziel = nameVon(c.object);
    if (ziel && k.anweisungen.has(ziel)) {
      hinweis(k, 'sqlite:' + m, `${code('.' + m)} – ${SQLITE[m]}`);
      const ergebnis = { get: 'die erste passende Zeile', all: 'alle passenden Zeilen', run: 'wie viele Zeilen betroffen waren' }[m];
      return { satz: `Führt die vorbereitete SQL-Anweisung ${code(ziel)} aus (${k.anweisungen.get(ziel)})`, wert: `${ergebnis} der SQL-Anweisung ${code(ziel)}` };
    }
  }
  return null;
}

/** Ein Aufruf der eigenen Schnittstelle: `charactersApi.create(…)`. */
function schnittstelle(n, k) {
  const name = nameVon(n.callee);
  if (!name || name.split('.').length !== 2) return null;
  const [obj, feld] = name.split('.');
  const def = k.projekt.feld(k.datei, obj, feld);
  if (!def?.def.api) return null;
  const weg = k.projekt.wegZu(def.def.api);
  const pfad = weg?.pfad ?? '/api' + def.def.api.pfad.replace(/\*/g, '…');
  const was = weg ? wegSatz(weg) : '';
  hinweis(k, 'schnittstelle', `Die Objekte aus lib/api/ (charactersApi, scenesApi …) sind die Verbindung zum Server: Jede ihrer Funktionen schickt eine Anfrage an einen Weg der Schnittstelle und liefert eine Zusage auf die Antwort.`);
  const ziel = `${def.def.api.methode} ${code(pfad)}`;
  return {
    satz: `Schickt eine Anfrage an den Server: ${ziel}${was ? ` – ${zitat(was)}` : ''}`,
    wert: `die Antwort des Servers auf ${ziel}${was ? ` (${zitat(was)})` : ''}`,
    relativ: `eine Anfrage ${ziel} an den Server schickt`,
  };
}

/**
 * Die besonderen Muster (Antwort, Datenbank, Schnittstelle, Listenmethode)
 * – für ein Glied einer Kette, das auf eigener Zeile steht.
 *
 * @returns {{ satz?: string, wert?: string, relativ?: string } | null}
 */
export function besonders(n, k) {
  for (const muster of [antwort, datenbank, schnittstelle, listenMethode]) {
    const r = muster(n, k);
    if (r) return r;
  }
  return null;
}

/**
 * Ein Aufruf in Worten.
 *
 * @param {object} n  CallExpression
 * @param {object} k  Kontext
 * @param {{ form?: 'wert'|'satz'|'relativ', kurz?: boolean, tat?: boolean }} [opt]
 *   `tat` ist die alte Schreibweise für `form: 'relativ'`.
 */
export function aufrufWendung(n, k, opt = {}) {
  const form = opt.tat ? 'relativ' : opt.form ?? 'wert';
  const c = n.callee;
  if (n.optional || n.type === 'OptionalCallExpression') hinweis(k, '?.', '`?.(…)` ruft die Funktion nur auf, wenn es sie gibt.');
  const a = anzeige(n, k);
  if (opt.kurz) return a.kurz;

  // Einen Zustand ändern.
  if (c.type === 'Identifier' && k.zustand.has(c.name)) {
    const zustand = code(k.zustand.get(c.name));
    const neu = n.arguments[0];
    const wie =
      neu && /Function/.test(neu.type)
        ? `ausgehend vom bisherigen Wert${neu.params[0] ? ` (${code(quelle(k, neu.params[0]))})` : ''}${hier(k, neu.body) && neu.body.type !== 'BlockStatement' ? ` auf ${kurzwert(neu.body, k)}` : ''}`
        : neu && hier(k, neu)
          ? `auf ${kurzwert(neu, k)}`
          : 'neu';
    hinweis(k, 'setzer', 'Ein Setzer aus useState ändert den Zustand nicht sofort, sondern merkt die Änderung vor; danach ruft React die Komponente neu auf und zeichnet sie mit dem neuen Wert.');
    if (form === 'satz') return `Setzt den Zustand ${zustand} ${wie} – React zeichnet die Komponente daraufhin neu`;
    if (form === 'relativ') return `den Zustand ${zustand} ${wie} setzt`;
    return `das Setzen des Zustands ${zustand} ${wie}`;
  }

  const weg = wegAnlegen(n, k);
  if (weg) return form === 'satz' ? weg : `das Anlegen eines Weges (${weg.replace(/\.$/, '')})`;

  for (const muster of [antwort, datenbank, schnittstelle, listenMethode]) {
    const r = muster(n, k);
    if (r) {
      if (form === 'satz') return r.satz ?? `${r.wert}`;
      if (form === 'relativ') return r.relativ ?? `${a.kurz} aufruft (${r.wert ?? r.satz})`;
      return r.wert ?? r.satz;
    }
  }

  const name = nameVon(c);
  // Einen Zwischenschritt oder Router einhängen.
  if (name && /^(app|router)\.use$/.test(name)) {
    hinweis(k, 'use', `${code('use')} – ${EXPRESS.use}`);
    const teile = n.arguments.filter((x) => hier(k, x)).map((x) => {
      if (x.type === 'StringLiteral') return `unter dem Pfad ${code(x.value)}`;
      const b = x.type === 'Identifier' ? bedeutung(x, k) : null;
      if (b) erklaereBedeutung(b, k);
      return kurzwert(x, k);
    });
    const s = `Hängt ${aufzaehlen(teile)} in den Weg jeder Anfrage ein`;
    return form === 'satz' ? s : form === 'relativ' ? `${aufzaehlen(teile)} einhängt` : `das Einhängen von ${aufzaehlen(teile)}`;
  }
  // Ein Effekt der Oberfläche.
  if (name === 'useEffect' || name === 'useLayoutEffect') {
    hinweis(k, `ruf:${name}`, `${code(name)} – ${REACT[name]}`);
    const s = `Effekt: React führt die Funktion ${hier(k, n.arguments[0]) && !einzeilig(n.arguments[0]) ? `(bis ${zeile(n.arguments[0].loc.end.line)}) ` : ''}aus, nachdem die Komponente gezeichnet wurde${name === 'useLayoutEffect' ? ' – noch bevor das Bild erscheint' : ''}`;
    const deps = n.arguments[1];
    const wann = deps && hier(k, deps) ? `; ${abhaengigkeiten(deps, k, 'effekt')}` : '';
    return form === 'satz' ? s + wann : `${s}${wann}`;
  }
  if (name === 'navigate' && n.arguments[0]) {
    const s = `Wechselt zur Seite ${kurzwert(n.arguments[0], k)}`;
    return form === 'satz' ? s : form === 'relativ' ? `zur Seite ${kurzwert(n.arguments[0], k)} wechselt` : `der Wechsel zur Seite ${kurzwert(n.arguments[0], k)}`;
  }
  if (name && /^console\.(log|error|warn|info)$/.test(name)) {
    const s = `Schreibt in die Konsole${name.endsWith('error') ? ' (als Fehler)' : name.endsWith('warn') ? ' (als Warnung)' : ''}: ${n.arguments.length && hier(k, n.arguments[0]) ? kurzwert(n.arguments[0], k) : 'etwas'}`;
    if (form === 'satz') return s;
  }
  if (name && name.endsWith('addEventListener') && n.arguments[0]?.type === 'StringLiteral') {
    const s = `Meldet ${name.includes('.') ? `bei ${code(name.split('.').slice(0, -1).join('.'))} ` : ''}für das Ereignis „${n.arguments[0].value}“ an: ${n.arguments[1] && hier(k, n.arguments[1]) ? kurzwert(n.arguments[1], k) : 'eine Funktion (sie folgt)'}`;
    if (form === 'satz') return s;
  }
  if (name && name.endsWith('removeEventListener') && n.arguments[0]?.type === 'StringLiteral') {
    const s = `Meldet die Funktion für das Ereignis „${n.arguments[0].value}“ wieder ab`;
    if (form === 'satz') return s;
  }
  if (name === 'setTimeout' && n.arguments[1] && hier(k, n.arguments[1])) {
    erklaereBedeutung(bedeutung(c, k), k);
    const s = `Wartet ${kurzwert(n.arguments[1], k)} Millisekunden und führt dann einmal aus: ${hier(k, n.arguments[0]) ? kurzwert(n.arguments[0], k) : 'die Funktion'}`;
    if (form === 'satz') return s;
  }
  if (name === 'process.exit') {
    const z = n.arguments[0];
    const s = `Beendet das Programm${z ? ` mit dem Code ${kurzwert(z, k)}${z.type === 'NumericLiteral' ? (z.value === 0 ? ' (alles in Ordnung)' : ' (Fehler)') : ''}` : ''}`;
    if (form === 'satz') return s;
  }

  // Allgemein: Name, Bedeutung als Hinweis.
  const b = bedeutung(c, k);
  erklaereBedeutung(b, k);
  const dazu = a.args ? ` (${a.args})` : '';
  if (form === 'satz') return `Ruft ${a.kurz} auf${a.args ? ` – ${a.args}` : ''}`;
  if (form === 'relativ') return `${a.kurz}${dazu} aufruft`;
  return `das Ergebnis von ${a.kurz}${dazu}`;
}

/**
 * Die Abhängigkeiten eines Effekts, einer gemerkten Rechnung oder Funktion
 * in Worten.
 *
 * @param {'effekt'|'memo'|'callback'} art
 */
export function abhaengigkeiten(liste, k, art = 'effekt') {
  const tut = { effekt: 'läuft der Effekt erneut', memo: 'wird neu gerechnet', callback: 'entsteht die Funktion neu' }[art] ?? 'läuft es erneut';
  if (liste.type !== 'ArrayExpression') return `wann es neu läuft, bestimmt ${kurzwert(liste, k)}`;
  if (!liste.elements.length) {
    return art === 'effekt' ? `die leere Liste ${code('[]')} heißt: nur einmal, beim ersten Zeichnen` : `die leere Liste ${code('[]')} heißt: ${art === 'memo' ? 'nur einmal gerechnet' : 'die Funktion bleibt immer dieselbe'}`;
  }
  const namen = liste.elements.map((e) => (e ? schnipsel(k, e, 30) : ''));
  return `${tut}, sobald sich ${aufzaehlen(namen, 'oder')} ändert`;
}
