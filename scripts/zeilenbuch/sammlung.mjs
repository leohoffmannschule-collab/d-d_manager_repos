/**
 * Welche Dateien ins Zeilenbuch kommen, in welcher Reihenfolge, mit welchem
 * Erklärer.
 *
 * Genommen wird alles, was git verfolgt und Code ist – Programme,
 * Stilblätter, HTML, Skripte, Einstellungen. Nicht genommen wird, was kein
 * Code ist (Handbücher in docs/, Bilder, Schriften, die Datenbank) und was
 * ein Werkzeug erzeugt statt ein Mensch schreibt: package-lock.json legt
 * npm an, Zeile für Zeile genau so, wie es die installierten Pakete
 * vorfinden – sie zu erklären hieße, das npm-Verzeichnis abzuschreiben.
 *
 * Gegliedert wird nach Teilen (Server, Oberfläche, Werkzeuge …) und darin
 * nach Ordnern, so wie man die Dateien im Editor findet.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** Endungen bzw. Namen, die kein Code sind. */
const KEIN_CODE = /\.(md|png|jpg|jpeg|gif|ico|webp|woff2?|ttf|otf|pdf|sqlite3?|log|zip)$/i;

/** Die Teile des Buches: Titel, Einleitungssatz, welche Pfade dazugehören. */
export const TEILE = [
  {
    titel: 'Der Server',
    text: 'Alles unter backend/src: das Programm, das auf dem Pi oder dem Rechner läuft, die Datenbank führt und die Anfragen der Oberfläche beantwortet.',
    passt: (d) => d.startsWith('backend/src/'),
  },
  {
    titel: 'Werkzeuge des Servers',
    text: 'Die kleinen Programme in backend/scripts, die man von Hand startet: Sicherung, Kennwort, Vorlagen, Zertifikat.',
    passt: (d) => d.startsWith('backend/scripts/'),
  },
  {
    titel: 'Die Oberfläche',
    text: 'Alles unter frontend/: was im Browser läuft – die Seiten, die Bauteile, die Stilblätter, die Datenschicht.',
    passt: (d) => d.startsWith('frontend/') && !/package\.json$|\.gitignore$|\.oxlintrc\.json$/.test(d),
  },
  {
    titel: 'Werkzeuge',
    text: 'Alles unter scripts/: Start und Tunnel, die Proben, der Vertrag, der Drucksatz, das Handbuch – und dieses Buch selbst.',
    passt: (d) => d.startsWith('scripts/'),
  },
  {
    titel: 'Betrieb und Einstellungen',
    text: 'Die Dateien im Wurzelordner und die Paketlisten: wie der Almanach installiert, gestartet, in Docker gepackt und geprüft wird.',
    passt: (d) => !d.startsWith('design/'),
  },
  {
    titel: 'Die Entwürfe',
    text: 'design/: das Erscheinungsbild als statische Seiten – Pergament und Kerzenlicht, wie es die App übernommen hat.',
    passt: (d) => d.startsWith('design/'),
  },
];

/** Welcher Erklärer zu einer Datei gehört – und wie ihre Sprache im Buch heißt. */
export function sprache(datei) {
  const name = path.posix.basename(datei);
  if (name.endsWith('.jsx')) return { art: 'js', name: 'JavaScript mit JSX (React)' };
  if (name.endsWith('.mjs')) return { art: 'js', name: 'JavaScript-Modul (Node)' };
  if (name.endsWith('.js')) return { art: 'js', name: datei.startsWith('frontend/') ? 'JavaScript (Browser)' : 'JavaScript (Node)' };
  if (name.endsWith('.css')) return { art: 'css', name: 'CSS (Stilblatt)' };
  if (name.endsWith('.html')) return { art: 'html', name: 'HTML' };
  if (name.endsWith('.svg')) return { art: 'html', name: 'SVG (Vektorzeichnung)' };
  if (name.endsWith('.sh')) return { art: 'sh', name: 'Shell-Skript (macOS, Linux)' };
  if (/\.(cmd|bat)$/.test(name)) return { art: 'cmd', name: 'Stapeldatei (Windows)' };
  if (name === 'Dockerfile') return { art: 'docker', name: 'Dockerfile' };
  if (/docker-compose\.ya?ml$/.test(name)) return { art: 'compose', name: 'YAML (Docker Compose)' };
  if (/\.(json|webmanifest)$/.test(name)) return { art: 'json', name: 'JSON' };
  if (name === '.gitignore') return { art: 'gitignore', name: 'Ignore-Liste für git' };
  if (name === '.dockerignore') return { art: 'dockerignore', name: 'Ignore-Liste für Docker' };
  if (name === '.gitattributes') return { art: 'attribute', name: 'Dateiregeln für git' };
  if (name.startsWith('.env')) return { art: 'env', name: 'Einstellungen (Umgebungsvariablen)' };
  return null;
}

/** Was eine Datei ohne Kopfkommentar ist – für die Zeile unter ihrem Namen. */
export const ZWECK = {
  'package.json': 'Die Paketliste des ganzen Almanachs: welche npm-Befehle es gibt (npm run …) und was zum Entwickeln nötig ist.',
  'backend/package.json': 'Die Paketliste des Servers: Express und, als Ersatz für alte Node-Fassungen, better-sqlite3.',
  'frontend/package.json': 'Die Paketliste der Oberfläche: React, React Router, die Schriften – und die Werkzeuge zum Bauen (Vite, Tailwind, oxlint).',
  Dockerfile: 'Das Rezept für das Docker-Abbild: Oberfläche bauen, Server dazulegen, als eigene Kennung starten.',
  'docker-compose.yml': 'Welche Behälter Docker startet: der Almanach, und auf Wunsch ein Tunnel nach außen.',
  '.gitignore': 'Was git nicht verfolgt – weil es entsteht (node_modules, Druckfassungen) oder geheim ist (.env).',
  'backend/.gitignore': 'Was im Server-Ordner nicht ins Git gehört: die Datenbank, Bilder, Sicherungen, Zertifikate.',
  'frontend/.gitignore': 'Was im Oberflächen-Ordner nicht ins Git gehört: gebaute Dateien, Protokolle, Editor-Reste.',
  '.dockerignore': 'Was beim Bauen des Docker-Abbilds nicht mitkopiert wird.',
  '.gitattributes': 'Wie git Dateien speichert: Zeilenenden und Binärdateien.',
  '.env.example': 'Die Vorlage für die eigenen Einstellungen (.env) – mit Erklärung zu jeder.',
  '.oxlintrc.json': 'Die Prüfregeln für Server und Werkzeuge (npm run lint).',
  'frontend/.oxlintrc.json': 'Die Prüfregeln für die Oberfläche.',
  '.vscode/extensions.json': 'Die Erweiterungen, die VS Code beim Öffnen des Projekts vorschlägt.',
  '.vscode/settings.json': 'Einstellungen für VS Code in diesem Projekt.',
  '.vscode/launch.json': 'Die Startkonfigurationen für VS Code (F5): Server, Oberfläche oder beides.',
  '.vscode/tasks.json': 'Die Aufgaben für VS Code: installieren, starten, bauen, Tunnel.',
};

/** Alle Dateien, die git verfolgt oder verfolgen würde – oder, ohne git, alle außer den üblichen Verdächtigen. */
function verfolgt(wurzel) {
  // Auch neue Dateien, die git noch nicht kennt, aber auch nicht übergeht.
  const lauf = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: wurzel, encoding: 'utf8' });
  if (lauf.status === 0 && lauf.stdout.trim()) return lauf.stdout.trim().split('\n');
  const raus = [];
  const gehen = (ordner) => {
    for (const e of fs.readdirSync(path.join(wurzel, ordner), { withFileTypes: true })) {
      if (['node_modules', '.git', 'dist', 'data', 'public', 'druck'].includes(e.name) && e.isDirectory()) continue;
      const p = ordner ? `${ordner}/${e.name}` : e.name;
      if (e.isDirectory()) gehen(p);
      else raus.push(p);
    }
  };
  gehen('');
  return raus;
}

/**
 * Die Dateien des Buches, gegliedert.
 *
 * @returns {Array<{ titel: string, text: string, ordner: Array<{ name: string, dateien: string[] }> }>}
 */
export function sammeln(wurzel) {
  const alle = verfolgt(wurzel)
    .filter((d) => !d.startsWith('docs/') && !KEIN_CODE.test(d) && !d.endsWith('package-lock.json'))
    .filter((d) => sprache(d) && fs.existsSync(path.join(wurzel, d)));
  const vergeben = new Set();
  return TEILE.map((teil) => {
    const dateien = alle.filter((d) => !vergeben.has(d) && teil.passt(d)).sort((a, b) => a.localeCompare(b, 'de'));
    dateien.forEach((d) => vergeben.add(d));
    const nachOrdner = new Map();
    for (const d of dateien) {
      const o = path.posix.dirname(d);
      if (!nachOrdner.has(o)) nachOrdner.set(o, []);
      nachOrdner.get(o).push(d);
    }
    return { titel: teil.titel, text: teil.text, ordner: [...nachOrdner].map(([name, liste]) => ({ name, dateien: liste })) };
  }).filter((t) => t.ordner.length);
}
