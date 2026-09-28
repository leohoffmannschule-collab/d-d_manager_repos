#!/usr/bin/env node
/**
 * Die Einfuhrprobe: Wer benutzt etwas, das er nicht eingeführt hat?
 *
 *   npm run einfuhrprobe
 *
 * Beim Zerlegen großer Dateien in kleine passiert immer wieder dasselbe:
 * Eine Funktion wandert in eine neue Datei – und die Zeile `import { … }`
 * bleibt zurück. Der Bau merkt davon **nichts**: Für ihn ist ein unbekannter
 * Name einfach eine globale Variable, die es zur Laufzeit schon geben wird.
 * Auffallen tut es erst, wenn jemand die Seite öffnet und ein weißes Fenster
 * bekommt.
 *
 * Diese Probe schließt die Lücke, und zwar ohne ein zusätzliches Paket
 * (der Almanach soll mit dem auskommen, was er ohnehin braucht):
 *
 *   1. Sie sammelt aus allen Dateien, **was irgendwo ausgeführt wird** –
 *      jedes `export function`, `export const`, `export { … }`.
 *   2. Für jede Datei sammelt sie, was darin **eingeführt oder erklärt**
 *      wird: Einfuhren, Funktionen, Konstanten, Parameter, Zerlegungen.
 *   3. Gemeldet wird jeder Name, der **benutzt** wird, im Almanach
 *      ausgeführt wird – und in der Datei weder steht noch hereingeholt
 *      wurde.
 *
 * Das ist bewusst eng gefasst: Nur Namen, die es anderswo im Almanach
 * wirklich gibt, werden überhaupt betrachtet. Ein Tippfehler in einer
 * Variablen fällt hier nicht auf – eine vergessene Einfuhr dagegen immer.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ORDNER = ['frontend/src', 'backend/src', 'scripts', 'backend/scripts'];

/* --- Dateien einsammeln --------------------------------------------------- */

function dateien(ordner) {
  const gefunden = [];
  const gehen = (verzeichnis) => {
    for (const eintrag of fs.readdirSync(verzeichnis, { withFileTypes: true })) {
      const pfad = path.join(verzeichnis, eintrag.name);
      if (eintrag.isDirectory()) gehen(pfad);
      else if (/\.(js|jsx|mjs)$/.test(eintrag.name)) gefunden.push(pfad);
    }
  };
  gehen(path.join(wurzel, ordner));
  return gefunden;
}

/**
 * Kommentare und Zeichenketten entfernen – aber nichts, was Code ist.
 *
 * Ohne das hielte die Probe jedes erwähnte Wort in einem Kommentar für eine
 * Benutzung – und gerade dieser Almanach ist voller Kommentare, die Namen
 * nennen.
 *
 * Mit einer Handvoll Ersetzungen kommt man hier nicht weit: In einer Vorlage
 * mit Gegenstrichen (`` `…${esc(name)}…` ``) steckt *beides* – Text, der weg
 * soll, und Code, der bleiben muss. Genau dort, in der Blattausfuhr, steht
 * der meiste Code des Almanachs. Deshalb läuft hier ein kleiner Leser Zeichen
 * für Zeichen durch die Datei und merkt sich, wo er gerade ist:
 *
 *   Code      → wird übernommen; Kommentare, Zeichenketten und
 *                Suchmuster werden übersprungen.
 *   Vorlage   → wird verworfen, bis ein `${` kommt: dann ist wieder Code.
 *
 * Die Lagen stapeln sich, denn in einem `${…}` darf wieder eine Vorlage
 * stehen, und darin wieder ein `${…}`.
 */
function nurCode(text) {
  let raus = '';
  // Das letzte bedeutsame Zeichen – nur dafür da, einen Schrägstrich als
  // Suchmuster (`/\d+/`) von einer Division (`a / b`) zu unterscheiden.
  let letztes = '';
  const lagen = [{ art: 'code', klammern: 0 }];

  const schreiben = (zeichen) => {
    raus += zeichen;
    if (!/\s/.test(zeichen)) letztes = zeichen;
  };

  for (let i = 0; i < text.length; i++) {
    const lage = lagen[lagen.length - 1];
    const z = text[i];
    const dann = text[i + 1];

    if (lage.art === 'vorlage') {
      if (z === '\\') i++;                                   // \` bleibt Text
      else if (z === '`') { lagen.pop(); schreiben(' '); }
      else if (z === '$' && dann === '{') { lagen.push({ art: 'code', klammern: 0 }); i++; schreiben(' '); }
      continue;                                              // alles andere ist Text
    }

    // Kommentare.
    if (z === '/' && dann === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      raus += '\n';
      continue;
    }
    if (z === '/' && dann === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      schreiben(' ');
      continue;
    }

    // Zeichenketten. Der Abbruch am Zeilenende ist Absicht: Ein einzelnes
    // Hochkomma in einem Text („Das ist's“) soll höchstens eine Zeile
    // verschlucken, nicht den Rest der Datei.
    if (z === "'" || z === '"') {
      i++;
      while (i < text.length && text[i] !== z && text[i] !== '\n') i += text[i] === '\\' ? 2 : 1;
      schreiben(' ');
      continue;
    }

    // Vorlagen mit Gegenstrich.
    if (z === '`') { lagen.push({ art: 'vorlage' }); schreiben(' '); continue; }

    // Suchmuster. Ein Schrägstrich beginnt eines nur dort, wo kein Wert
    // davorsteht – nach `(`, `=`, `,` und dergleichen. Steht ein Name oder
    // eine schließende Klammer davor, ist es geteilt.
    if (z === '/' && !/[\w$)\]]/.test(letztes)) {
      i++;
      let klasse = false;
      while (i < text.length && text[i] !== '\n') {
        if (text[i] === '\\') i++;
        else if (text[i] === '[') klasse = true;
        else if (text[i] === ']') klasse = false;
        else if (text[i] === '/' && !klasse) break;
        i++;
      }
      while (i + 1 < text.length && /[a-z]/.test(text[i + 1])) i++;   // Flaggen
      schreiben(' ');
      continue;
    }

    // Die Klammern zählen, damit ein `}` das Ende eines `${…}` erkennt.
    if (z === '{') lage.klammern++;
    if (z === '}') {
      if (lage.klammern === 0 && lagen.length > 1) { lagen.pop(); schreiben(' '); continue; }
      lage.klammern--;
    }
    schreiben(z);
  }

  return raus;
}

/* --- Was führt der Almanach irgendwo aus? --------------------------------- */

function ausgefuehrteNamen(alle) {
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

function bekannteNamen(code) {
  const bekannt = new Set();
  const merken = (name) => name && bekannt.add(name.trim());

  // Einfuhren: default, * as, und die geschweiften Klammern.
  for (const m of code.matchAll(/import\s+(\w+)\s*(?:,|from)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*\*\s*as\s+(\w+)/g)) merken(m[1]);
  for (const m of code.matchAll(/import\s*(?:\w+\s*,\s*)?\{([^}]*)\}/g)) {
    for (const teil of m[1].split(',')) merken(teil.split(/\s+as\s+/).pop());
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

  // Kurzschreibweise für Methoden in einem Objekt: `async protokoll(id) { … }`.
  // Das ist eine Erklärung, kein Aufruf. Die schließende Klammer mit der
  // geschweiften dahinter unterscheidet sie von einem echten Aufruf, der als
  // Argument eines anderen steht (`f(a, bar(x))` – dort folgt `)`, nicht `{`).
  for (const m of code.matchAll(/[,{]\s*(?:async\s+)?(\w+)\s*\([^()]*\)\s*\{/g)) merken(m[1]);

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
function benutzteNamen(code) {
  const benutzt = new Set();
  for (const m of code.matchAll(/(^|[^.\w$])([A-Za-z_$][\w$]*)(\s*:|=[{\s])?/g)) {
    if (m[3]) continue;
    benutzt.add(m[2]);
  }
  return benutzt;
}

/* --- Der Durchgang -------------------------------------------------------- */

const alle = ORDNER.flatMap(dateien);

/**
 * Wer kann wen überhaupt einführen?
 *
 * Oberfläche und Server sind zwei getrennte Welten: Der Browser bekommt nie
 * eine Datei aus backend/, der Server nie eine aus frontend/. Ein Name, den
 * nur der Server ausführt, kann in der Oberfläche also gar keine vergessene
 * Einfuhr sein – und umgekehrt. Ohne diese Trennung schlug die Probe an,
 * sobald der Server ein gewöhnliches Wort wie `jetzt` ausführte, das in der
 * Oberfläche irgendwo im Fließtext steht.
 *
 * Nur die Werkzeuge in scripts/ sehen beide Welten: Die Blatt- und die
 * Klangprobe prüfen Rechnungen der Oberfläche mit Node.
 */
const liegtIn = (datei, ordner) => path.relative(wurzel, datei).startsWith(ordner + path.sep);
const oberflaeche = alle.filter((d) => liegtIn(d, 'frontend'));
const server = alle.filter((d) => liegtIn(d, 'backend'));
const kataloge = {
  oberflaeche: ausgefuehrteNamen(oberflaeche),
  server: ausgefuehrteNamen(server),
  beide: ausgefuehrteNamen(alle),
};
const katalogFuer = (datei) =>
  liegtIn(datei, 'frontend') ? kataloge.oberflaeche : liegtIn(datei, 'backend') ? kataloge.server : kataloge.beide;

const maengel = [];

for (const datei of alle) {
  const code = nurCode(fs.readFileSync(datei, 'utf8'));
  const bekannt = bekannteNamen(code);
  const kurz = path.relative(wurzel, datei);
  const katalog = katalogFuer(datei);

  for (const name of benutzteNamen(code)) {
    if (!katalog.has(name)) continue;
    if (bekannt.has(name)) continue;
    // Die Datei, die den Namen selbst ausführt, kennt ihn natürlich.
    if (katalog.get(name) === datei) continue;
    maengel.push({ datei: kurz, name, her: path.relative(wurzel, katalog.get(name)) });
  }
}

console.log('');
if (maengel.length === 0) {
  console.log(`  Alle Einfuhren gehen auf: ${alle.length} Dateien geprüft.`);
  console.log('');
  process.exit(0);
}

console.log(`  ${maengel.length} benutzte Namen ohne Einfuhr:`);
for (const m of maengel) {
  console.log(`   – ${m.datei}: „${m.name}“  (ausgeführt in ${m.her})`);
}
console.log('');
process.exit(1);
