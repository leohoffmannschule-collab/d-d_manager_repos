/**
 * Datendateien erklären: JSON-Einstellungen, Ignore-Listen, .gitattributes
 * und die Beispieldatei .env.example.
 *
 * Diese Dateien enthalten keine Abläufe, nur Angaben – aber jede Zeile
 * bewirkt etwas: welche Pakete installiert werden, was git übergeht, mit
 * welchen Zeilenenden eine Datei gespeichert wird. JSON liest sich wie ein
 * Baum aus Schlüsseln; der Leser merkt sich, wo er steht (scripts → test),
 * denn dieselbe Zeile `"dev": "vite"` bedeutet unter `scripts` etwas
 * anderes als anderswo.
 */
import { code, zeile, zitat } from './text.mjs';
import { MODULE } from './woerterbuch/node.mjs';
import { UMGEBUNG } from './woerterbuch/umgebung.mjs';

/** Pakete, die in einer package.json stehen – was sie sind. */
const PAKETE = {
  ...MODULE,
  'better-sqlite3': 'eine ältere SQLite-Anbindung; nur als Ersatz für alte Node-Fassungen, die node:sqlite noch nicht haben',
  'react-dom': 'React DOM – bringt die React-Oberfläche in die echte HTML-Seite',
  '@fontsource/cinzel': 'die Schrift Cinzel als Paket (Überschriften) – sie wird mit ausgeliefert, kein Laden aus dem Netz',
  '@fontsource/eb-garamond': 'die Schrift EB Garamond als Paket (Fließtext)',
  '@fontsource/unifrakturmaguntia': 'die Schrift UnifrakturMaguntia als Paket (Zierbuchstaben)',
  '@types/react': 'Typbeschreibungen für React – helfen dem Editor beim Vervollständigen',
  '@types/react-dom': 'Typbeschreibungen für React DOM',
  oxlint: 'oxlint – prüft den Code auf Fehler und Unschönes (npm run lint)',
  tailwindcss: 'Tailwind – erzeugt aus den Klassen im Code das CSS',
  concurrently: 'startet mehrere Befehle zugleich in einem Fenster (Server und Oberfläche beim Entwickeln)',
};

/** Was ein Versionsbereich wie `^4.21.2` erlaubt. */
function fassung(v) {
  let m;
  if ((m = /^\^(\d+)\.(\d+)\.(\d+)/.exec(v))) return Number(m[1]) === 0 ? `${code(v)}: genau diese Unterfassung oder ein Fehlerbehebungs-Nachfolger` : `${code(v)}: Fassung ${m[1]}.${m[2]}.${m[3]} oder neuer, aber unter ${Number(m[1]) + 1}.0.0 (nichts, was bricht)`;
  if ((m = /^>=(\d+)/.exec(v))) return `${code(v)}: Fassung ${m[1]} oder neuer`;
  return code(v);
}

/** Bekannte Schlüssel einer package.json und anderer JSON-Dateien. */
const SCHLUESSEL = {
  name: 'der Name des Pakets',
  version: 'die Fassungsnummer',
  description: 'eine Kurzbeschreibung',
  private: 'nicht zum Veröffentlichen gedacht – npm verweigert ein versehentliches Hochladen',
  type: 'module heißt: Die .js-Dateien sind ES-Module (import/export statt require)',
  main: 'die Datei, mit der das Paket startet',
  engines: 'welche Fassungen von Node nötig sind',
  scripts: 'die Befehle, die man mit npm run <Name> startet',
  dependencies: 'die Pakete, die das Programm zum Laufen braucht',
  devDependencies: 'die Pakete, die nur zum Entwickeln und Bauen gebraucht werden',
  optionalDependencies: 'Pakete, die installiert werden, wenn es geht – fehlen sie, ist das kein Fehler',
  $schema: 'wo die Beschreibung dieses Dateiformats liegt – der Editor kann damit Fehler zeigen und vervollständigen',
  env: 'in welcher Umgebung der Code läuft – daraus wissen die Prüfregeln, welche Namen es von selbst gibt',
  rules: 'die Prüfregeln und wie streng sie gelten',
  plugins: 'zusätzliche Regelsammlungen',
  recommendations: 'die Erweiterungen, die VS Code beim Öffnen des Projekts vorschlägt',
  'files.eol': 'mit welchen Zeilenenden VS Code Dateien speichert (\\n: wie unter Linux und macOS)',
  'terminal.integrated.defaultProfile.windows': 'welches Terminal VS Code unter Windows öffnet',
  'search.exclude': 'welche Ordner die Suche in VS Code überspringt',
  configurations: 'die Startkonfigurationen (F5 in VS Code)',
  compounds: 'Startkonfigurationen, die mehrere zugleich starten',
  tasks: 'die Aufgaben, die man in VS Code über „Aufgabe ausführen“ startet',
  label: 'der Name, unter dem es im Menü steht',
  command: 'der Befehl, der dabei läuft',
  problemMatcher: 'woran VS Code Fehler in der Ausgabe erkennt (leer: gar nicht)',
  presentation: 'wie das Terminal dazu erscheint',
  reveal: 'ob das Terminal nach vorn kommt',
  panel: 'ob es ein eigenes Terminal bekommt',
  isBackground: 'läuft dauerhaft im Hintergrund weiter',
  group: 'zu welcher Gruppe die Aufgabe gehört (build: Strg+Umschalt+B)',
  kind: 'die Art der Gruppe',
  isDefault: 'die vorgegebene Aufgabe dieser Gruppe',
  request: 'launch: das Programm wird gestartet (nicht an ein laufendes angehängt)',
  program: 'welche Datei gestartet wird',
  cwd: 'in welchem Ordner',
  console: 'wo die Ausgabe erscheint',
  skipFiles: 'Dateien, in die der Debugger nicht hineinspringt',
  runtimeExecutable: 'welches Programm startet (statt node)',
  runtimeArgs: 'mit welchen Angaben',
  windows: 'Abweichungen für Windows',
  serverReadyAction: 'was geschieht, sobald der Server bereit ist',
  pattern: 'woran man in der Ausgabe erkennt, dass er bereit ist (ein Suchmuster)',
  uriFormat: 'wie daraus die Adresse wird',
  action: 'was dann geschieht (openExternally: im Browser öffnen)',
  stopAll: 'beim Beenden einer Konfiguration alle beenden',
  node: 'die nötige Fassung von Node',
};

/** Ein npm-Skript in Worten. */
function npmSkript(name, befehl) {
  const was = {
    setup: 'installiert die Pakete für Server und Oberfläche',
    dev: 'startet die Entwicklungsfassung (Änderungen erscheinen sofort)',
    'dev:backend': 'startet nur den Server zum Entwickeln',
    'dev:frontend': 'startet nur die Oberfläche zum Entwickeln',
    build: 'baut die fertige Oberfläche',
    start: 'startet den Almanach',
    pruefen: 'prüft, ob alles bereit ist, ohne zu starten',
    serve: 'startet den Server mit der fertig gebauten Oberfläche',
    adresse: 'zeigt, unter welcher Adresse der Almanach erreichbar ist',
    tunnel: 'öffnet den Weg nach außen',
    sicherung: 'legt eine Sicherung der Datenbank an',
    vorlagen: 'legt die Vorlage-Charaktere an',
    kennwort: 'setzt ein Kennwort neu',
    zertifikat: 'stellt die Zertifikate für HTTPS im Heimnetz aus',
    drucksatz: 'setzt die Handbücher als HTML und PDF',
    handbuch: 'baut das große Handbuch',
    zeilenbuch: 'baut dieses Buch',
    vertrag: 'prüft die Schnittstelle des Servers gegen ihren Vertrag',
    blattprobe: 'prüft die Rechnungen des Charakterblatts',
    klangprobe: 'prüft den Klangteppich',
    einfuhrprobe: 'prüft, ob jeder benutzte Name eingeführt ist',
    stilprobe: 'prüft, dass kein Stil und kein Skript eingebettet ist',
    kommentarprobe: 'prüft die Kommentare',
    lint: 'lässt die Prüfregeln (oxlint) über den Code laufen',
    test: 'alle Prüfungen nacheinander',
    preview: 'zeigt die gebaute Oberfläche zur Probe',
  }[name];
  return `Der Befehl ${code(`npm run ${name}`)}${was ? ` ${was}` : ''}: Er führt ${code(befehl, 90)} aus.`;
}

/**
 * Eine JSON-Datei erklären (auch mit // -Kommentaren, wie VS Code sie erlaubt).
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 * @param {string} datei  der Pfad – package.json wird anders gelesen als die übrigen
 */
export function erklaereJson(blatt) {
  const stapel = [];
  let kommentarVon = null;
  const kommentarEnde = (bis, naechste) => {
    if (kommentarVon === null) return;
    const text = `Kommentar${naechste ? ` zu ${zeile(naechste)}` : ''} – reines JSON kennt keine Kommentare, die Einstellungsdateien von VS Code und oxlint aber schon (JSONC).`;
    if (kommentarVon === bis) blatt.dazu(bis, text);
    else blatt.gruppe(kommentarVon, bis, text);
    kommentarVon = null;
  };
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const t = blatt.text(nr).trim();
    if (!t) continue;
    if (t.startsWith('//')) {
      if (kommentarVon === null) kommentarVon = nr;
      continue;
    }
    kommentarEnde(nr - 1, nr);
    const teile = [];
    let m;
    const pfad = stapel.map((s) => s.name).filter(Boolean);
    const oben = pfad[pfad.length - 1];
    if (/^[{[]$/.test(t) && !stapel.length) {
      stapel.push({ name: null, nr, art: t });
      blatt.dazu(nr, `Beginn der Datei: ${t === '{' ? 'ein Objekt' : 'eine Liste'} in JSON – Schlüssel in Anführungszeichen, dahinter ihr Wert.`);
      continue;
    }
    if ((m = /^[}\]],?$/.exec(t))) {
      const zu = stapel.pop();
      blatt.dazu(nr, zu?.name ? `Ende von ${code(zu.name)} (aus ${zeile(zu.nr)}).` : zu && stapel.length ? `Ende des Eintrags aus ${zeile(zu.nr)}.` : 'Ende der Datei.');
      continue;
    }
    if (/^\{$/.test(t)) {
      stapel.push({ name: null, nr, art: '{' });
      blatt.dazu(nr, `Ein Eintrag der Liste ${oben ? code(oben) : ''} beginnt.`);
      continue;
    }
    if ((m = /^"([^"]+)"\s*:\s*(.*?),?$/.exec(t))) {
      const [, schl, rohWert] = m;
      const oeffnet = /^[{[]$/.test(rohWert);
      const einzeilig = /^[{[].*[}\]]$/.test(rohWert);
      const wert = /^".*"$/.test(rohWert) ? rohWert.slice(1, -1) : rohWert;
      if (oben === 'scripts') teile.push(npmSkript(schl, wert));
      else if (/dependencies$/i.test(oben ?? '')) teile.push(`Das Paket ${code(schl)}${PAKETE[schl] ? ` – ${PAKETE[schl]}` : ''}; erlaubt ist ${fassung(wert)}.`);
      else if (oben === 'search.exclude') teile.push(`Die Suche überspringt ${code(schl)}.`);
      else if (oben === 'env') teile.push(`Umgebung ${code(schl)} ist ${wert === 'true' ? 'an' : 'aus'}.`);
      else if (oben === 'rules') teile.push(`Die Regel ${code(schl)} gilt als ${code(wert.replace(/"/g, ''))} (error: ein Verstoß lässt die Prüfung scheitern).`);
      else if (oben === 'engines' && schl === 'node') teile.push(`Node in der Fassung ${fassung(wert)}.`);
      else {
        const was = SCHLUESSEL[schl];
        // Mit Wert: „`name` = `frontend` – der Name des Pakets“; ohne (ein Objekt öffnet sich): „`scripts` – die Befehle …“.
        const gesetzt = oeffnet ? '' : ` = ${einzeilig ? code(rohWert.replace(/,$/, ''), 80) : code(wert, 80)}`;
        teile.push(`${code(schl)}${gesetzt}${was ? ` – ${was}` : ''}.`);
      }
      if (oeffnet) {
        stapel.push({ name: schl, nr, art: rohWert });
        teile.push(rohWert === '[' ? 'Die Einträge folgen.' : 'Darunter folgen seine Felder.');
      }
      blatt.dazu(nr, teile.join(' '));
      continue;
    }
    if ((m = /^"([^"]+)",?$/.exec(t))) {
      const w = m[1];
      if (oben === 'recommendations') {
        const ext = {
          'bradlc.vscode-tailwindcss': 'Tailwind: zeigt beim Tippen, welche Klassen es gibt und was sie tun',
          'oxc.oxc-vscode': 'oxc: zeigt die Fehler der Prüfregeln (oxlint) direkt im Editor',
          'qwtel.sqlite-viewer': 'SQLite Viewer: öffnet die Datenbank direkt im Editor',
          'ms-azuretools.vscode-docker': 'Docker: hilft beim Dockerfile und docker-compose.yml',
          'eamodio.gitlens': 'GitLens: zeigt zu jeder Zeile, wann und warum sie zuletzt geändert wurde',
        }[w];
        blatt.dazu(nr, `Die Erweiterung ${code(w)}${ext ? ` – ${ext}` : ''}.`);
      } else blatt.dazu(nr, `Eintrag ${code(w)}.`);
      continue;
    }
    blatt.dazu(nr, `${code(t, 80)}.`);
  }
  kommentarEnde(blatt.anzahl, null);
}

/** Ein Muster einer Ignore-Datei in Worten. */
function muster(t, art) {
  const ausnahme = t.startsWith('!');
  const m = ausnahme ? t.slice(1) : t;
  let was;
  if (m.startsWith('**/')) was = `jedes ${code(m.slice(3))}, gleich wie tief verschachtelt`;
  else if (/^\*\.[\w*?]+$/.test(m)) was = `alle Dateien mit der Endung ${code(m.slice(1))}`;
  else if (/^\*\.[\w]+\*$/.test(m) || /\*/.test(m)) was = `alles, was zum Muster ${code(m)} passt (${code('*')} steht für beliebige Zeichen)`;
  else if (m.endsWith('/')) was = `den Ordner ${code(m)} samt Inhalt`;
  else if (m === '.env') was = `die Datei ${code('.env')} – darin stehen Geheimnisse wie das Tunnel-Kennwort`;
  else was = `${code(m)} (Datei oder Ordner)`;
  if (ausnahme) return `Ausnahme: ${was} wird doch ${art === 'git' ? 'von git verfolgt' : 'mitkopiert'} – auch wenn eine Regel darüber es ausschließt.`;
  return art === 'git' ? `git übergeht ${was}.` : `Docker kopiert ${was} nicht ins Abbild.`;
}

/**
 * Eine .gitignore oder .dockerignore erklären.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 * @param {'git'|'docker'} art
 */
export function erklaereIgnore(blatt, art) {
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const t = blatt.text(nr).trim();
    if (!t) continue;
    if (t.startsWith('#')) {
      blatt.dazu(nr, `Kommentar: ${zitat(t.replace(/^#\s*/, ''))} – er sagt, wozu die Zeilen darunter da sind.`);
      continue;
    }
    blatt.dazu(nr, muster(t, art));
  }
}

/**
 * Die .gitattributes erklären: wie git Dateien beim Speichern behandelt.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 */
export function erklaereAttribute(blatt) {
  let von = null;
  for (let nr = 1; nr <= blatt.anzahl + 1; nr += 1) {
    const t = blatt.text(nr).trim();
    if (nr <= blatt.anzahl && t.startsWith('#')) {
      if (von === null) von = nr;
      continue;
    }
    if (von !== null) {
      const text = `Kommentar zu ${zeile(nr)}: Er erklärt, warum diese Dateien eine Ausnahme sind.`;
      if (von === nr - 1) blatt.dazu(von, text);
      else blatt.gruppe(von, nr - 1, text);
      von = null;
    }
    if (!t || nr > blatt.anzahl) continue;
    const [was, ...regeln] = t.split(/\s+/);
    const teile = regeln.map((r) => {
      if (r === 'text=auto') return 'git erkennt selbst, ob es eine Textdatei ist';
      if (r === 'text') return 'es ist eine Textdatei';
      if (r === 'eol=lf') return 'gespeichert wird mit Zeilenenden wie unter Linux (LF)';
      if (r === 'eol=crlf') return 'gespeichert wird mit Zeilenenden wie unter Windows (CRLF)';
      if (r === 'binary') return 'es ist eine Binärdatei: nie umwandeln, nicht Zeile für Zeile vergleichen';
      return code(r);
    });
    blatt.dazu(nr, `Für ${was === '*' ? 'alle Dateien' : `alle Dateien ${code(was)}`}: ${teile.join(', ')}.`);
  }
}

/**
 * Die .env.example erklären: Kommentare als Blöcke, jede Einstellung mit
 * dem, was sie bewirkt.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 */
export function erklaereEnv(blatt) {
  let von = null;
  let erster = true;
  for (let nr = 1; nr <= blatt.anzahl + 1; nr += 1) {
    const t = blatt.text(nr).trim();
    if (nr <= blatt.anzahl && t.startsWith('#')) {
      if (von === null) von = nr;
      continue;
    }
    if (von !== null) {
      const titel = /^#\s*-+\s*(.+?)\s*-*$/.exec(blatt.text(von).trim());
      const text = erster
        ? 'Kopfkommentar: Er sagt, wozu die Datei da ist und wie man sie benutzt. Zeilen mit # am Anfang werden beim Einlesen übergangen.'
        : titel
          ? `Abschnitt ${zitat(titel[1])}: Der Kommentar erklärt die Einstellungen darunter.`
          : `Kommentar zu ${zeile(nr)}: Er erklärt die Einstellung darunter.`;
      if (von === nr - 1) blatt.dazu(von, text);
      else blatt.gruppe(von, nr - 1, text);
      von = null;
      erster = false;
    }
    if (!t || nr > blatt.anzahl) continue;
    const m = /^(\w+)=(.*)$/.exec(t);
    if (m) {
      const was = UMGEBUNG[m[1]];
      blatt.dazu(nr, `Die Einstellung ${code(m[1])}${m[2] ? ` mit dem Beispielwert ${code(m[2])}` : ', leer gelassen'}${was ? ` – ${was}` : ''}.`);
    } else blatt.dazu(nr, `${code(t)}.`);
  }
}
