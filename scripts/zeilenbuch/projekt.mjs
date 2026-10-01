/**
 * Der Projekt-Index: was der Almanach über sich selbst weiß.
 *
 * Eine Zeile wie `blattWurf(name, modifier)` ist nur halb erklärt, wenn das
 * Buch sagt „ruft `blattWurf` auf“. Was `blattWurf` *tut*, steht im
 * Kommentar über der Funktion – in einer anderen Datei. Dieser Index liest
 * deshalb vorab alle Dateien und merkt sich:
 *
 *   – zu jeder Datei ihren Kopfkommentar (wozu es sie gibt),
 *   – zu jeder Funktion, Komponente und Konstante mit einem Kommentar
 *     darüber dessen ersten Satz,
 *   – was jede Datei woher einführt und was sie ausführt – so lässt sich
 *     ein Name über Dateigrenzen hinweg bis zu seiner Erklärung verfolgen,
 *   – zu jedem Weg der Schnittstelle Methode, ganzen Pfad, Wächter und
 *     Kommentar (gelesen wie im Handbuch, handbuch/referenz/wege.mjs),
 *   – zu jeder eigenen CSS-Klasse ihr Stilblatt und ihren Kommentar,
 *   – zu jeder Umgebungsvariablen ihre Erklärung aus der .env.example.
 */
import fs from 'node:fs';
import path from 'node:path';
import { parsen, durchgehen } from './js/parser.mjs';
import { bloecke, klassenIn } from './css-leser.mjs';
import { ersterSatz, kommentarInhalt } from './text.mjs';
import { alleWege } from '../handbuch/referenz/wege.mjs';

/** Endungen, die beim Einführen weggelassen werden dürfen. */
const ENDUNGEN = ['', '.js', '.jsx', '.mjs', '/index.js', '/index.jsx'];

/** Enthält der Knoten irgendwo JSX? Dann ist eine Funktion eine Komponente. */
function hatJsx(knoten) {
  let gefunden = false;
  durchgehen(knoten, (k) => {
    if (k.type === 'JSXElement' || k.type === 'JSXFragment') gefunden = true;
  });
  return gefunden;
}

/** Was für eine Art Definition: Komponente, Hook, Funktion, Konstante … */
function artVon(name, wert) {
  const funktion = wert && /Function|ArrowFunction/.test(wert.type);
  if (funktion || wert?.type === 'FunctionDeclaration') {
    if (/^use[A-Z]/.test(name)) return 'Hook';
    if (/^[A-Z]/.test(name) && hatJsx(wert)) return 'Komponente';
    return 'Funktion';
  }
  if (wert?.type === 'ObjectExpression') return 'Objekt';
  if (wert?.type === 'ArrayExpression') return 'Liste';
  if (wert?.type === 'NewExpression' && wert.callee.type === 'Identifier') return wert.callee.name;
  return 'Konstante';
}

/**
 * Der Kommentar, der direkt über einem Knoten steht (höchstens eine
 * Zeile Abstand nach oben ist keiner) – als Text, oder ''.
 */
function kommentarDirektVor(knoten) {
  const liste = knoten.leadingComments;
  if (!liste?.length) return '';
  // Mehrere `//`-Zeilen direkt untereinander gehören zusammen.
  const raus = [];
  let unten = knoten.loc.start.line;
  for (let i = liste.length - 1; i >= 0; i -= 1) {
    const k = liste[i];
    if (k.loc.end.line < unten - 1) break;
    raus.unshift(kommentarInhalt(k.value));
    unten = k.loc.start.line;
  }
  return raus.join('\n');
}

/** Aus einem Pfad in einer Vorlage (`/characters/${id}`) ein Muster: `/characters/*`. */
function pfadAus(knoten) {
  if (knoten?.type === 'StringLiteral') return knoten.value;
  if (knoten?.type === 'TemplateLiteral') return knoten.quasis.map((q) => q.value.cooked).join('*');
  return null;
}

/** Die Kurzformen aus lib/api/anfrage.js und ihre HTTP-Methode. */
const SENDER = { request: 'GET', post: 'POST', put: 'PUT', patch: 'PATCH', del: 'DELETE' };

/**
 * Ruft der Wert eines Feldes den Server? (`create: (p) => post('/characters', p)`)
 * Dann: Methode und Pfadmuster.
 */
function apiAufruf(wert) {
  if (!wert || !/ArrowFunction|FunctionExpression/.test(wert.type)) return null;
  const rumpf = wert.body.type === 'CallExpression' ? wert.body : null;
  if (!rumpf || rumpf.callee.type !== 'Identifier' || !(rumpf.callee.name in SENDER)) return null;
  const pfad = pfadAus(rumpf.arguments[0]);
  if (!pfad) return null;
  let methode = SENDER[rumpf.callee.name];
  const optionen = rumpf.arguments[1];
  if (rumpf.callee.name === 'request' && optionen?.type === 'ObjectExpression') {
    const m = optionen.properties.find((p) => p.key?.name === 'method');
    if (m?.value.type === 'StringLiteral') methode = m.value.value.toUpperCase();
  }
  return { methode, pfad: pfad.split('?')[0] };
}

/** Passt ein Pfadmuster der Oberfläche (`/characters/*`) zum Pfad eines Weges (`/api/characters/:id`)? */
function passt(muster, wegPfad) {
  const a = ('/api' + muster).split('/').filter(Boolean);
  const b = wegPfad.split('/').filter(Boolean);
  if (a.length !== b.length) return false;
  return a.every((teil, i) => teil === b[i] || teil.includes('*') || b[i].startsWith(':'));
}

/** Der Index über alle Dateien des Almanachs. */
export class Projekt {
  /**
   * @param {string} wurzel     das Wurzelverzeichnis
   * @param {string[]} dateien  alle Dateien des Buches (relativ zur Wurzel)
   */
  constructor(wurzel, dateien) {
    this.wurzel = wurzel;
    this.dateien = new Map();
    this.fehler = [];
    this.klassen = new Map();
    this.umgebung = new Map();
    /** Die Datei, die gerade erklärt wird – für `klasse()`. */
    this.aktuell = null;
    for (const datei of dateien) {
      if (/\.(js|jsx|mjs)$/.test(datei)) this.leseJs(datei);
      else if (datei.endsWith('.css')) this.leseCss(datei);
    }
    this.leseUmgebung();
    try {
      this.wege = alleWege(wurzel).map((w) => ({ ...w, datei: path.relative(wurzel, w.datei).split(path.sep).join('/') }));
    } catch {
      this.wege = [];
    }
  }

  /** Eine Datei als Text. */
  text(datei) {
    return fs.readFileSync(path.join(this.wurzel, datei), 'utf8').replace(/\r\n/g, '\n');
  }

  /** Eine JavaScript-Datei lesen: Kopf, Definitionen, Ein- und Ausfuhren. */
  leseJs(datei) {
    const text = this.text(datei);
    let ast;
    try {
      ast = parsen(text);
    } catch {
      return;
    }
    const kopfMatch = /^(#![^\n]*\n)?\s*\/\*([\s\S]*?)\*\//.exec(text);
    const kopf = kopfMatch ? kommentarInhalt(kopfMatch[2]) : '';
    const eintrag = {
      datei,
      kopf,
      satz: ersterSatz(kopf),
      defs: new Map(),
      einfuhren: new Map(),
      ausfuhren: new Map(),
      sterne: [],
    };
    this.dateien.set(datei, eintrag);
    const ordner = path.posix.dirname(datei);
    const quelle = (wert) => (wert.startsWith('.') ? this.findeDatei(path.posix.join(ordner, wert)) ?? wert : wert);
    const merke = (name, wert, knotenMitKommentar, zeile) => {
      if (!name || eintrag.defs.has(name)) return;
      const kommentar = kommentarDirektVor(knotenMitKommentar);
      eintrag.defs.set(name, { name, art: artVon(name, wert), satz: ersterSatz(kommentar), zeile });
    };

    for (const anweisung of ast.program.body) {
      const huelle = anweisung;
      let kern = anweisung;
      if (anweisung.type === 'ExportNamedDeclaration' || anweisung.type === 'ExportDefaultDeclaration') {
        kern = anweisung.declaration ?? anweisung;
      }
      if (anweisung.type === 'ImportDeclaration') {
        for (const s of anweisung.specifiers) {
          const name = s.type === 'ImportDefaultSpecifier' ? 'default' : s.type === 'ImportNamespaceSpecifier' ? '*' : s.imported.name ?? s.imported.value;
          eintrag.einfuhren.set(s.local.name, { quelle: quelle(anweisung.source.value), name });
        }
      }
      if (anweisung.type === 'ExportAllDeclaration') eintrag.sterne.push(quelle(anweisung.source.value));
      if (anweisung.type === 'ExportNamedDeclaration' && anweisung.specifiers.length) {
        for (const s of anweisung.specifiers) {
          const aussen = s.exported.name ?? s.exported.value;
          const innen = s.local?.name ?? aussen;
          eintrag.ausfuhren.set(aussen, anweisung.source ? { datei: quelle(anweisung.source.value), name: innen } : { lokal: innen });
        }
      }
      if (kern.type === 'FunctionDeclaration' && kern.id) {
        merke(kern.id.name, kern, huelle, kern.loc.start.line);
        if (huelle.type === 'ExportNamedDeclaration') eintrag.ausfuhren.set(kern.id.name, { lokal: kern.id.name });
        if (huelle.type === 'ExportDefaultDeclaration') eintrag.ausfuhren.set('default', { lokal: kern.id.name });
      } else if (kern.type === 'VariableDeclaration') {
        for (const d of kern.declarations) {
          if (d.id.type !== 'Identifier') continue;
          merke(d.id.name, d.init, kern.declarations.length > 1 ? d : huelle, d.loc.start.line);
          if (huelle.type === 'ExportNamedDeclaration') eintrag.ausfuhren.set(d.id.name, { lokal: d.id.name });
          if (d.init?.type === 'ObjectExpression') this.leseObjekt(eintrag, d.id.name, d.init);
        }
      } else if (huelle.type === 'ExportDefaultDeclaration') {
        if (kern.type === 'Identifier') eintrag.ausfuhren.set('default', { lokal: kern.name });
        else if (kern.id) {
          merke(kern.id.name, kern, huelle, kern.loc.start.line);
          eintrag.ausfuhren.set('default', { lokal: kern.id.name });
        }
      }
    }

    // Auch Hilfsfunktionen *innerhalb* von Funktionen haben oft einen
    // Kommentar – sie werden in derselben Datei aufgerufen.
    durchgehen(ast.program, (k, eltern) => {
      if (k.type === 'FunctionDeclaration' && k.id && eltern?.knoten.type !== 'Program' && eltern?.knoten.type !== 'ExportNamedDeclaration') {
        merke(k.id.name, k, k, k.loc.start.line);
      }
      if (k.type === 'VariableDeclaration' && eltern?.knoten.type === 'BlockStatement') {
        for (const d of k.declarations) {
          if (d.id.type === 'Identifier' && d.init && /Function/.test(d.init.type)) merke(d.id.name, d.init, k, d.loc.start.line);
        }
      }
    });
  }

  /** Felder eines ausgeführten Objekts: Kommentar und – bei Schnittstellen-Objekten – der Weg. */
  leseObjekt(eintrag, name, objekt) {
    for (const p of objekt.properties) {
      if (p.type !== 'ObjectProperty' && p.type !== 'ObjectMethod') continue;
      const feld = p.key?.name ?? p.key?.value;
      if (!feld) continue;
      const wert = p.type === 'ObjectMethod' ? p : p.value;
      eintrag.defs.set(`${name}.${feld}`, {
        name: `${name}.${feld}`,
        art: artVon(feld, wert),
        satz: ersterSatz(kommentarDirektVor(p)),
        zeile: p.loc.start.line,
        api: apiAufruf(wert),
      });
    }
  }

  /** Eine Einfuhr wie './rechnen' auf eine echte Datei abbilden. */
  findeDatei(ohneEndung) {
    const normal = path.posix.normalize(ohneEndung);
    for (const e of ENDUNGEN) {
      if (fs.existsSync(path.join(this.wurzel, normal + e)) && fs.statSync(path.join(this.wurzel, normal + e)).isFile()) return normal + e;
    }
    return null;
  }

  /**
   * Ein Stilblatt lesen: welche Klassen es festlegt, mit welchem Kommentar.
   * Gleichnamige Klassen in verschiedenen Stilblättern bleiben getrennt –
   * `.marke` der Entwürfe ist nicht `.marke` des Drucksatzes.
   */
  leseCss(datei) {
    const text = this.text(datei);
    for (const block of bloecke(text)) {
      if (block.kopf.startsWith('@')) continue;
      for (const klasse of klassenIn(block.kopf)) {
        if (!this.klassen.has(klasse)) this.klassen.set(klasse, []);
        const liste = this.klassen.get(klasse);
        const bisher = liste.find((e) => e.datei === datei);
        const satz = ersterSatz(kommentarInhalt(block.kommentar));
        if (!bisher) liste.push({ datei, satz, zeile: block.zeile });
        else if (!bisher.satz && satz) Object.assign(bisher, { satz, zeile: block.zeile });
      }
    }
  }

  /**
   * Eine eigene Klasse, wie sie für die gerade erklärte Datei gilt: aus dem
   * Stilblatt, das ihr im Ordnerbaum am nächsten liegt (design/ nimmt
   * design/stil.css, die Oberfläche ihre eigenen). Ein Stilblatt aus einem
   * ganz anderen Teil des Almanachs zählt nicht – dann ist es keine eigene
   * Klasse, sondern null.
   */
  klasse(name) {
    const liste = this.klassen.get(name);
    if (!liste) return null;
    const hier = (this.aktuell ?? '').split('/');
    const naehe = (datei) => {
      const dort = datei.split('/');
      let i = 0;
      while (i < dort.length - 1 && i < hier.length - 1 && dort[i] === hier[i]) i += 1;
      return i;
    };
    const beste = liste.reduce((a, b) => (naehe(b.datei) > naehe(a.datei) ? b : a));
    return naehe(beste.datei) > 0 || !this.aktuell ? beste : null;
  }

  /** Die Erklärungen der .env.example: Name → Kommentar darüber. */
  leseUmgebung() {
    const datei = path.join(this.wurzel, '.env.example');
    if (!fs.existsSync(datei)) return;
    let kommentar = [];
    let letzter = '';
    for (const zeile of fs.readFileSync(datei, 'utf8').split('\n')) {
      if (zeile.startsWith('#')) {
        const t = zeile.replace(/^#\s?/, '');
        if (!t.startsWith('---')) kommentar.push(t);
        continue;
      }
      const m = /^([A-Z_][A-Z0-9_]*)=/.exec(zeile);
      if (m) {
        const text = kommentar.join(' ').trim() || letzter;
        this.umgebung.set(m[1], text);
        letzter = text;
      }
      kommentar = [];
    }
  }

  /**
   * Einen Namen, der in `datei` benutzt wird, bis zu seiner Definition
   * verfolgen – über Einfuhren und weitergereichte Ausfuhren hinweg.
   *
   * @returns {{ datei: string, def: object } | { paket: string, name: string } | null}
   */
  aufloesen(datei, name, tiefe = 0) {
    const e = this.dateien.get(datei);
    if (!e || tiefe > 6) return null;
    if (e.defs.has(name)) return { datei, def: e.defs.get(name) };
    const ein = e.einfuhren.get(name);
    if (ein) {
      if (!this.dateien.has(ein.quelle)) return { paket: ein.quelle, name: ein.name };
      return this.ausfuhrVon(ein.quelle, ein.name, tiefe + 1);
    }
    return null;
  }

  /** Was eine Datei unter dem Namen `name` ausführt – bis zur Definition verfolgt. */
  ausfuhrVon(datei, name, tiefe = 0) {
    const e = this.dateien.get(datei);
    if (!e || tiefe > 6) return null;
    const aus = e.ausfuhren.get(name);
    if (aus?.datei) return this.ausfuhrVon(aus.datei, aus.name, tiefe + 1);
    if (aus?.lokal) return this.aufloesen(datei, aus.lokal, tiefe + 1) ?? { datei, def: { name: aus.lokal, art: 'Funktion', satz: '' } };
    if (name === 'default') return { datei, def: { name: path.posix.basename(datei).replace(/\.\w+$/, ''), art: 'Datei', satz: e.satz } };
    for (const stern of e.sterne) {
      const t = this.ausfuhrVon(stern, name, tiefe + 1);
      if (t) return t;
    }
    return e.defs.has(name) ? { datei, def: e.defs.get(name) } : null;
  }

  /** Die Erklärung eines Feldes `objekt.feld`, wenn `objekt` ein ausgeführtes Objekt des Almanachs ist. */
  feld(datei, objekt, feld) {
    const ziel = this.aufloesen(datei, objekt);
    if (!ziel?.datei) return null;
    const e = this.dateien.get(ziel.datei);
    const def = e?.defs.get(`${ziel.def.name}.${feld}`);
    return def ? { datei: ziel.datei, def } : null;
  }

  /** Der Weg der Schnittstelle, der in `datei` in Zeile `zeile` angelegt wird. */
  wegIn(datei, zeile) {
    return this.wege.find((w) => w.datei === datei && w.zeile === zeile) ?? null;
  }

  /** Der Weg, den ein Aufruf der Oberfläche trifft (Methode und Pfadmuster). */
  wegZu(api) {
    if (!api) return null;
    return this.wege.find((w) => w.methode === api.methode && passt(api.pfad, w.pfad)) ?? null;
  }
}
