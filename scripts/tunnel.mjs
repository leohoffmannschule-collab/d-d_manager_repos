#!/usr/bin/env node
/**
 * Der Weg nach außen – ohne Docker, ohne Portfreigabe, ohne Konto.
 *
 *   npm run tunnel
 *
 * `cloudflared` ruft von innen nach außen bei Cloudflare an, hält die Leitung
 * offen und bekommt dafür eine Adresse auf trycloudflare.com geliehen. Über
 * die erreicht die Runde den Almanach von überall.
 *
 * Auf dem Pi macht das der Container aus docker-compose.yml. Auf einem Laptop
 * gibt es keinen Container – dieses Skript startet dasselbe Programm direkt
 * und schreibt sein Protokoll nach `data/tunnel.log`, damit `npm run adresse`
 * die Adresse dort wiederfindet.
 *
 * Beenden mit Strg+C. Der Almanach selbst läuft davon unbeirrt weiter; nur
 * der Weg von außen ist dann wieder zu.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3001;
const datenordner = process.env.DATA_DIR || path.join(wurzel, 'backend', 'data');
const protokoll = path.join(datenordner, 'tunnel.log');

const sagen = (text = '') => console.log(text);

/* --- Wo steckt cloudflared? ---------------------------------------------- */

function laeuft(befehl) {
  const lauf = spawnSync(befehl, ['--version'], {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return !lauf.error && lauf.status === 0;
}

/**
 * Drei Stellen, in dieser Reihenfolge: eine ausdrücklich genannte, der
 * Suchpfad des Systems, und – für den Fall, dass man das Programm nur
 * heruntergeladen und nicht installiert hat – neben dem Almanach selbst.
 */
function findeCloudflared() {
  if (process.env.CLOUDFLARED) {
    return laeuft(process.env.CLOUDFLARED) ? process.env.CLOUDFLARED : null;
  }
  if (laeuft('cloudflared')) return 'cloudflared';
  const daneben = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  for (const ordner of [wurzel, datenordner]) {
    const pfad = path.join(ordner, daneben);
    if (fs.existsSync(pfad) && laeuft(pfad)) return pfad;
  }
  return null;
}

const hatDocker = () => {
  const lauf = spawnSync('docker', ['version'], { encoding: 'utf8', shell: process.platform === 'win32' });
  return !lauf.error && lauf.status === 0;
};

/* --- Wenn es fehlt: sagen, wie man weiterkommt --------------------------- */

const HOLEN = {
  'linux-arm64': 'cloudflared-linux-arm64',
  'linux-x64': 'cloudflared-linux-amd64',
  'linux-arm': 'cloudflared-linux-arm',
  'darwin-arm64': 'cloudflared-darwin-arm64.tgz',
  'darwin-x64': 'cloudflared-darwin-amd64.tgz',
  'win32-x64': 'cloudflared-windows-amd64.exe',
};

function anleitung() {
  const datei = HOLEN[`${process.platform}-${process.arch}`];
  sagen('');
  sagen('  cloudflared ist auf diesem Gerät nicht zu finden.');
  sagen('');
  if (hatDocker()) {
    sagen('  Docker ist da – dann geht es ohne weiteres Herunterladen:');
    sagen('    docker compose --profile tunnel up -d');
    sagen('    npm run adresse');
    sagen('');
  }
  sagen('  Ohne Docker: das Programm einmal holen und danebenlegen.');
  if (datei) {
    sagen(`    https://github.com/cloudflare/cloudflared/releases/latest/download/${datei}`);
  } else {
    sagen('    https://github.com/cloudflare/cloudflared/releases/latest');
  }
  if (process.platform === 'linux') {
    sagen('');
    sagen(`    curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/${datei}`);
    sagen('    chmod +x cloudflared');
  }
  if (process.platform === 'darwin') {
    sagen('    … oder, wenn Homebrew da ist:  brew install cloudflared');
  }
  sagen('');
  sagen('  Die Datei gehört neben diese Anleitung, also nach:');
  sagen(`    ${wurzel}`);
  sagen('  Danach noch einmal:  npm run tunnel');
  sagen('');
  if (process.platform === 'win32') {
    sagen('  Wenn dieser Rechner keine .exe herunterladen darf, ist der Tunnel');
    sagen('  hier nicht der Weg. Zwei Möglichkeiten bleiben:');
    sagen('    - Im selben WLAN spielen: npm run adresse nennt die Adresse,');
    sagen('      die alle im Haus erreichen. Dafür braucht es gar nichts.');
    sagen('    - Den Tunnel auf einem anderen Gerät laufen lassen – auf dem');
    sagen('      Raspberry Pi etwa, der ohnehin durchläuft.');
    sagen('');
  }
}

/* --- Los ----------------------------------------------------------------- */

const cloudflared = findeCloudflared();
if (!cloudflared) {
  anleitung();
  process.exit(1);
}

fs.mkdirSync(datenordner, { recursive: true });
// Frisch anfangen: Sonst fischt `npm run adresse` womöglich die Adresse von
// vorgestern aus dem Protokoll und die Runde landet ins Leere.
const schreiber = fs.createWriteStream(protokoll, { flags: 'w' });

sagen('');
sagen(`  Baue den Tunnel zu http://localhost:${PORT} auf …`);
sagen('  (Beenden mit Strg+C. Der Almanach läuft davon unbeirrt weiter.)');
sagen('');

const tunnel = spawn(cloudflared, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

// Nicht nur die erste Adresse: Baut cloudflared die Verbindung neu auf, leiht
// es sich eine andere. Dann muss die Runde die neue bekommen – also sagen wir
// jede, die sich von der zuletzt genannten unterscheidet.
let gemeldet = null;
function mitlesen(stueck) {
  const text = stueck.toString();
  schreiber.write(text);
  const treffer = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/g);
  if (!treffer) return;
  const neuste = treffer[treffer.length - 1];
  if (neuste === gemeldet) return;
  const zumZweiten = gemeldet !== null;
  gemeldet = neuste;
  sagen('');
  sagen(
    zumZweiten
      ? '  Der Tunnel hat eine neue Adresse bekommen – bitte weitersagen:'
      : '  Der Almanach ist jetzt von überall erreichbar unter:'
  );
  sagen('');
  sagen(`    ${neuste}`);
  sagen('');
  if (!zumZweiten) {
    sagen('  Diese Adresse ist geliehen: Startet der Tunnel neu, bekommt er eine');
    sagen('  neue. Später wieder nachsehen mit:  npm run adresse');
    sagen('');
  }
}

tunnel.stdout.on('data', mitlesen);
tunnel.stderr.on('data', mitlesen);

for (const zeichen of ['SIGINT', 'SIGTERM']) {
  process.on(zeichen, () => tunnel.kill(zeichen));
}

tunnel.on('exit', (code, signal) => {
  schreiber.end();
  if (signal) {
    sagen('');
    sagen('  Tunnel geschlossen. Von außen kommt jetzt niemand mehr herein.');
    sagen('');
    process.exit(0);
  }
  if (code !== 0 && gemeldet === null) {
    sagen('');
    sagen(`  cloudflared hat aufgegeben (Code ${code}). Das Protokoll steht in:`);
    sagen(`    ${protokoll}`);
    sagen('');
  }
  process.exit(code ?? 0);
});
