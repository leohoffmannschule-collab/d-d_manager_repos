/**
 * Die Namenssuche der Einfuhrprobe: was ausgeführt, was bekannt, was benutzt
 * wird.
 *
 * Alle drei arbeiten auf Text, der schon durch den Leser (leser.mjs)
 * gelaufen ist – Kommentare und Zeichenketten sind dann verschwunden, und
 * ein Wort im Fließtext gilt nicht mehr als Benutzung.
 */
import fs from 'node:fs';
import { nurCode } from './leser.mjs';

/* --- Was führt der Almanach irgendwo aus? --------------------------------- */

/**
 * Der Katalog aller ausgeführten Namen: Name → Datei, die ihn als erste
 * ausführt. Gezählt wird `export function|const|let|class` und
 * `export { … }` (bei `as` der Name, unter dem er hinausgeht).
 *
 * @param {string[]} alle  absolute Pfade
 * @returns {Map<string, string>}
 */
export function ausgefuehrteNamen(alle) {
  const katalog = new Map();
  for (const datei of alle) {
    const code = nurCode(fs.readFileSync(datei, 'utf8'));
    const merken = (name) => {
      if (name && !katalog.has(name)) katalog.set(name, datei);
    };
    for (const m of code.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/g)) merken(m[1]);
    for (const m of code.matchAll(/export\s*\{([^}]*)\}/g)) {
      for (const teil of m[1].split(',')) merken(teil.trim().split(/\s+as\s+/).pop()?.trim());
    }
  }
  return katalog;
}

/* --- Was kennt eine einzelne Datei? --------------------------------------- */

/**
 * Alle Namen, die eine Datei selbst einführt oder erklärt: Einfuhren,
 * Weiterreichungen, Funktionen, Klassen, Variablen, Zerlegungen und
 * Parameter. Die Regeln sind grob, aber großzügig – lieber einen Namen zu
 * viel als bekannt ansehen (dann fällt eine Einfuhr nicht auf) als einen
 * zu wenig (dann meldet die Probe Unsinn, und niemand glaubt ihr mehr).
 *
 * @param {string} code  schon durch nurCode() gelaufen
 * @returns {Set<string>}
 */
export function bekannteNamen(code) {
  const bekannt = new Set();
  const merken = (name) => name && bekannt.add(name.trim());

  // Einfuhren: default, * as, und die geschweiften Klammern.
  for (const m of code.matchAll(/import\s+(\w+)\s*(?:,|from)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*\*\s*as\s+(\w+)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*(?:\w+\s*,\s*)?\{([^}]*)\}/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/\s+as\s+/).pop());
  }

  // Weiterreichen: `export { a, b } from './x.js'` holt a und b herein und
  // gibt sie gleich weiter – eine Einfuhr, keine Benutzung.
  for (const m of code.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/\s+as\s+/)[0]);
  }

  // Eigene Erklärungen.
  for (const m of code.matchAll(/(?:^|[;{}\s])(?:function|class)\s+(\w+)/g)) merken(m[1]);
  for (const m of code.matchAll(/(?:const|let|var)\s+(\w+)/g)) merken(m[1]);

  // Zerlegungen: const { a, b: c } = …  und  const [a, b] = …
  for (const m of code.matchAll(/(?:const|let|var)\s*[{[]([^}\]]*)[}\]]/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }

  // Dasselbe noch einmal, aber großzügiger: Eine Zerlegung, die selbst
  // geschweifte Klammern enthält – `const { sinne = {}, zauber = null } = x` –
  // schneidet die Regel oben an der ersten schließenden Klammer ab, und alles
  // dahinter gälte als unbekannt. Hier reicht der Griff deshalb bis zu der
  // Klammer, hinter der das Gleichheitszeichen der Zuweisung steht.
  for (const m of code.matchAll(/(?:const|let|var)\s*\{([\s\S]*?)\}\s*=/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }

  // Kurzschreibweise für Methoden in einem Objekt oder einer Klasse:
  // `async protokoll(id) { … }`. Das ist eine Erklärung, kein Aufruf. Die
  // schließende Klammer mit der geschweiften dahinter unterscheidet sie von
  // einem echten Aufruf, der als Argument eines anderen steht (`f(a, bar(x))`
  // – dort folgt `)`, nicht `{`). In einer Klasse steht vor der Methode die
  // `}` der vorigen. Die Parameter in den Klammern sind ebenso erklärt wie
  // der Name davor.
  for (const m of code.matchAll(/[,{};]\s*(?:static\s+)?(?:async\s+)?(\w+)\s*\(([^()]*)\)\s*\{/g)) {
    merken(m[1]);
    for (const teil of m[2].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }

  // Parameter – grob, aber für diesen Zweck genau genug: alles in den
  // Klammern einer Funktion oder vor einem Pfeil.
  for (const m of code.matchAll(/(?:function\s*\w*\s*|=>\s*|\(\s*)\(([^)]*)\)\s*(?:=>|\{)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/function\s*\w*\s*\(([^)]*)\)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/\(([^()]*)\)\s*=>/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/[:=]/)[0].replace(/[{}[\].]/g, ''));
  }
  for (const m of code.matchAll(/(\w+)\s*=>/g)) merken(m[1]);

  // Zerlegungen in Parametern: ({ szene, figuren: tokens }) => …
  // Sie sehen aus wie eine Benutzung, sind aber eine Erklärung.
  for (const m of code.matchAll(/\(\s*\{([^}]*)\}\s*(?:=[^)]*)?\)\s*(?:=>|\{)/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }
  for (const m of code.matchAll(/function\s*\w*\s*\(\s*\{([^}]*)\}/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(':').pop()?.split('=')[0]);
  }

  return bekannt;
}

/**
 * Alle benutzten Namen.
 *
 * Nicht mitgezählt werden drei Dinge, die nur *aussehen* wie eine
 * Benutzung und die sonst reihenweise Fehlalarm auslösten:
 *
 *   `a.name`   – ein Eigenschaftszugriff. Der Punkt davor genügt zur
 *                Unterscheidung.
 *   `name:`    – ein Schlüssel in einem Objekt (`{ umfang: () => … }`)
 *                oder eine Kurzschreibweise für eine Methode. Was hinter
 *                dem Doppelpunkt steht, wird dagegen sehr wohl gezählt.
 *   `feld={g}` – der Name einer JSX-Eigenschaft. Er gehört dem Bauteil,
 *                das ihn entgegennimmt, und hat mit einem gleichnamigen
 *                Ausfuhrartikel nichts zu tun. Der Wert dahinter (`g`)
 *                zählt wieder als Benutzung.
 *
 * Für den letzten Fall ist das fehlende Leerzeichen vor dem `=` das
 * Erkennungszeichen: `feld={g}` ist eine Eigenschaft, `zahl = 5` eine
 * Zuweisung – und die bleibt eine Benutzung.
 */
export function benutzteNamen(code) {
  const benutzt = new Set();
  for (const m of code.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)(\s*:|=[{\s])?/g)) {
    if (m[3]) continue;
    benutzt.add(m[2]);
  }
  return benutzt;
}
