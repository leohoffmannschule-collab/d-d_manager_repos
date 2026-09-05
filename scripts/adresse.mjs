#!/usr/bin/env node
/**
 * Welche Adresse hat der Almanach gerade?
 *
 *   npm run adresse
 *
 * Drei Antworten, je nachdem, wo man steht:
 *
 *   - auf demselben Gerät      http://localhost:3001
 *   - im selben Netz (WLAN)    http://192.168.x.y:3001
 *   - von überall              die geliehene Adresse des Schnelltunnels
 *
 * Die dritte wechselt bei jedem Neustart des Tunnels. Sie steht in dessen
 * Protokoll – entweder in dem des Containers (Weg über Docker) oder in
 * `data/tunnel.log` (Weg über `npm run tunnel`). Dieses Skript sieht in
 * beiden nach, damit man sie nicht suchen muss.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3001;
const datenordner = process.env.DATA_DIR || path.join(wurzel, 'backend', 'data');
// Drei mögliche Anbieter, drei Domains – siehe scripts/tunnel.mjs.
const MUSTER = /https:\/\/[a-z0-9-]+\.(trycloudflare\.com|lhr\.life|localhost\.run|loca\.lt)/g;

const sagen = (text = '') => console.log(text);

/** Die jüngste Nennung gewinnt: Nach einem Neuaufbau der Verbindung steht die
 *  alte Adresse noch weiter oben im Protokoll. */
function letzteAdresse(text) {
  const treffer = text.match(MUSTER);
  return treffer?.length ? treffer[treffer.length - 1] : null;
}

function ausDatei() {
  const datei = path.join(datenordner, 'tunnel.log');
  if (!fs.existsSync(datei)) return null;
  try {
    return letzteAdresse(fs.readFileSync(datei, 'utf8'));
  } catch {
    return null;
  }
}

function ausDocker() {
  // Kein Docker auf dem Gerät ist der Normalfall auf einem Laptop – das ist
  // kein Fehler, sondern nur eine Quelle weniger.
  const lauf = spawnSync('docker', ['compose', 'logs', 'cloudflared'], {
    cwd: wurzel,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (lauf.error || lauf.status !== 0) return null;
  return letzteAdresse(`${lauf.stdout ?? ''}${lauf.stderr ?? ''}`);
}

function netzAdressen() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((karte) => karte && karte.family === 'IPv4' && !karte.internal)
    .map((karte) => karte.address);
}

sagen('');
sagen('  Abenteuer-Almanach – so ist er erreichbar');
sagen('');
sagen(`  Auf diesem Gerät : http://localhost:${PORT}`);
for (const adresse of netzAdressen()) {
  sagen(`  Im selben Netz   : http://${adresse}:${PORT}`);
}

// Beide Quellen fragen, nicht nur die erste, die etwas sagt: Wer den Tunnel
// erst ohne und später mit Docker gestartet hat, hätte sonst die alte Adresse
// von damals vor sich – und die führt ins Leere.
const gefunden = [
  ['npm run tunnel', ausDatei()],
  ['Docker', ausDocker()],
].filter(([, adresse]) => adresse);

const verschieden = new Set(gefunden.map(([, adresse]) => adresse));

if (verschieden.size === 1) {
  sagen(`  Von überall      : ${[...verschieden][0]}`);
  sagen('');
  sagen('  Die letzte Adresse ist geliehen und wechselt, wenn der Tunnel neu');
  sagen('  startet. Nach einem Neustart also noch einmal hier nachsehen und');
  sagen('  der Runde die neue schicken.');
} else if (verschieden.size > 1) {
  sagen('');
  sagen('  Es liegen zwei Adressen vor – der Tunnel wurde einmal so und einmal');
  sagen('  anders gestartet. Es gilt die des Tunnels, der gerade läuft:');
  sagen('');
  for (const [quelle, adresse] of gefunden) {
    sagen(`    ${adresse}   (aus: ${quelle})`);
  }
  sagen('');
  sagen('  Im Zweifel einfach ausprobieren: Die tote Adresse antwortet gar');
  sagen('  nicht, die lebende zeigt die Anmeldeseite.');
} else {
  sagen('  Von überall      : – kein Tunnel gefunden –');
  sagen('');
  sagen('  Im selben Netz spielt die Runde auch ohne Tunnel: Die Adresse oben');
  sagen('  genügt für alle, die im gleichen WLAN sitzen.');
  sagen('');
  sagen('  Für Mitspieler anderswo einen Tunnel starten:');
  sagen('    npm run tunnel                       (ohne Docker)');
  sagen('    docker compose --profile tunnel up -d  (auf dem Pi)');
  sagen('');
  sagen('  Läuft er schon, braucht er nach dem Start meist zehn bis zwanzig');
  sagen('  Sekunden bis zur Adresse. Dann noch einmal versuchen.');
}
sagen('');
