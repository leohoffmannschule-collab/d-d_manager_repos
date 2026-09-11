#!/usr/bin/env node
/**
 * Der Weg nach außen – ohne Docker, ohne Portfreigabe, ohne Konto.
 *
 *   npm run tunnel
 *
 * Ein Programm ruft von innen nach außen an und hält die Leitung offen; die
 * Runde erreicht den Almanach über die Adresse, die es sich dafür leiht. Drei
 * Anbieter kommen dafür infrage, und dieses Skript probiert sie in dieser
 * Reihenfolge durch, bis einer da ist:
 *
 *   1. cloudflared        – am robustesten, aber ein eigenes Programm, das
 *                            erst geholt werden muss (unter Windows eine .exe)
 *   2. ssh → localhost.run – kein Herunterladen nötig: SSH bringt praktisch
 *                            jedes Windows, macOS und Linux schon mit. Braucht
 *                            aber ausgehendes Port 22, das mancher
 *                            Firmenrechner sperrt.
 *   3. npx localtunnel     – kommt über npm, lädt also nichts Kompiliertes
 *                            nach. Zeigt Mitspielern beim ersten Aufruf eine
 *                            Zwischenseite, und der freie Dienst ist bekannt
 *                            launisch.
 *
 * Wer einen bestimmten Weg erzwingen will: TUNNEL_ANBIETER=cloudflared,
 * TUNNEL_ANBIETER=ssh oder TUNNEL_ANBIETER=localtunnel vor den Befehl stellen.
 *
 * **Mit einem TUNNEL_ZIEL läuft es andersherum.** Dann wird nichts geliehen:
 * Der Almanach ruft den eigenen Vorposten an – einen kleinen Server, auf den
 * die eigene Domain zeigt – und hängt sich dort in dessen nginx. Die Adresse
 * wechselt nie wieder, gleichgültig in welchem Netz der Rechner steht, und die
 * Runde tippt vor jedem Spielabend dieselbe. Gebraucht wird dafür nur `ssh`,
 * das ohnehin auf dem Rechner liegt – heruntergeladen wird nichts.
 * Eingerichtet wird der Vorposten einmal mit `scripts/vorposten.sh`; siehe
 * docs/EINRICHTUNG.md, Schritt 6.5.
 *
 * Auf dem Pi macht den Schnelltunnel der Container aus docker-compose.yml.
 * Auf einem Laptop gibt es keinen Container – dieses Skript startet das
 * gewählte Programm direkt und schreibt sein Protokoll nach `data/tunnel.log`,
 * damit `npm run adresse` die Adresse dort wiederfindet.
 *
 * Beenden mit Strg+C. Der Almanach selbst läuft davon unbeirrt weiter; nur
 * der Weg von außen ist dann wieder zu.
 */
import '../backend/src/umgebung.js';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { festeAdresse } from '../backend/src/domaene.js';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 3001;
const datenordner = process.env.DATA_DIR || path.join(wurzel, 'backend', 'data');
const protokoll = path.join(datenordner, 'tunnel.log');
const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const sagen = (text = '') => console.log(text);

function laeuft(befehl, args) {
  const lauf = spawnSync(befehl, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return !lauf.error && lauf.status === 0;
}

/**
 * Drei Stellen, in dieser Reihenfolge: eine ausdrücklich genannte, der
 * Suchpfad des Systems, und – für den Fall, dass man das Programm nur
 * heruntergeladen und nicht installiert hat – neben dem Almanach selbst.
 */
function findeCloudflared() {
  if (process.env.CLOUDFLARED) {
    return laeuft(process.env.CLOUDFLARED, ['--version']) ? process.env.CLOUDFLARED : null;
  }
  if (laeuft('cloudflared', ['--version'])) return 'cloudflared';
  const daneben = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  for (const ordner of [wurzel, datenordner]) {
    const pfad = path.join(ordner, daneben);
    if (fs.existsSync(pfad) && laeuft(pfad, ['--version'])) return pfad;
  }
  return null;
}

const hatDocker = () => laeuft('docker', ['version']);

/* --- Die drei Anbieter ---------------------------------------------------- */

const ANBIETER = [
  {
    id: 'cloudflared',
    name: 'Cloudflare-Schnelltunnel',
    verfuegbar: findeCloudflared,
    starten: (pfad) =>
      spawn(pfad, ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], {
        stdio: ['ignore', 'pipe', 'pipe'],
      }),
    muster: /https:\/\/[a-z0-9-]+\.trycloudflare\.com/g,
    hinweis: null,
  },
  {
    id: 'ssh',
    name: 'SSH-Tunnel über localhost.run',
    // `ssh` selbst zeigt an; ob localhost.run gerade erreichbar ist, zeigt
    // sich erst beim Verbindungsaufbau – wie bei den beiden anderen auch.
    verfuegbar: () => (laeuft('ssh', ['-V']) ? 'ssh' : null),
    starten: () =>
      spawn(
        'ssh',
        [
          '-o', 'StrictHostKeyChecking=accept-new',
          '-o', 'BatchMode=yes',
          '-o', 'ServerAliveInterval=60',
          '-R', `80:localhost:${PORT}`,
          'nokey@localhost.run',
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      ),
    muster: /https:\/\/[a-z0-9-]+\.(lhr\.life|localhost\.run)/g,
    hinweis: [
      '  Braucht ausgehendes Port 22. Sperrt der Firmenrechner das, meldet',
      '  sich ssh sofort mit „Connection refused“ oder „timed out“ – dann',
      '  hilft nur einer der beiden anderen Wege.',
      '  Die Verbindung von localhost.run steht meist einige Stunden; bricht',
      '  sie ab, einfach noch einmal npm run tunnel.',
    ],
  },
  {
    id: 'localtunnel',
    name: 'localtunnel (über npx)',
    // Immer "verfügbar": npx kommt mit jedem Node, das dieses Projekt
    // ohnehin voraussetzt. Ob der freie Dienst gerade mitspielt, zeigt sich
    // erst beim Start.
    verfuegbar: () => (laeuft(NPX, ['--version']) ? NPX : null),
    starten: (npx) =>
      spawn(npx, ['--yes', 'localtunnel', '--port', String(PORT)], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
      }),
    muster: /https:\/\/[a-z0-9-]+\.loca\.lt/g,
    hinweis: [
      '  Lädt beim ersten Mal ein kleines Paket über npm nach – dafür reicht',
      '  eine gewöhnliche Internetverbindung, nichts wird installiert.',
      '  Mitspieler sehen beim allerersten Aufruf eine Zwischenseite, die',
      '  nach einem „Tunnel-Passwort“ fragt: Das ist die eigene, öffentliche',
      '  IP-Adresse, die dort schon eingetragen ist – nur „Click to Submit“.',
      '  Kein Login, kein echtes Passwort. Der freie Dienst ist gelegentlich',
      '  überlastet; klappt es nicht, hilft oft ein zweiter Versuch.',
    ],
  },
];

function waehleAnbieter() {
  const erzwungen = process.env.TUNNEL_ANBIETER;
  if (erzwungen) {
    const eintrag = ANBIETER.find((a) => a.id === erzwungen);
    if (!eintrag) {
      sagen('');
      sagen(`  TUNNEL_ANBIETER=${erzwungen} kennt der Almanach nicht.`);
      sagen(`  Möglich: ${ANBIETER.map((a) => a.id).join(', ')}`);
      sagen('');
      process.exit(1);
    }
    const pfad = eintrag.verfuegbar();
    if (!pfad) {
      sagen('');
      sagen(`  ${eintrag.name} ist erzwungen (TUNNEL_ANBIETER=${erzwungen}), aber nicht da.`);
      sagen('');
      process.exit(1);
    }
    return { eintrag, pfad };
  }
  for (const eintrag of ANBIETER) {
    const pfad = eintrag.verfuegbar();
    if (pfad) return { eintrag, pfad };
  }
  return null;
}

/* --- Wenn nichts davon da ist: sagen, wie man weiterkommt ----------------- */

const HOLEN = {
  'linux-arm64': 'cloudflared-linux-arm64',
  'linux-x64': 'cloudflared-linux-amd64',
  'linux-arm': 'cloudflared-linux-arm',
  'darwin-arm64': 'cloudflared-darwin-arm64.tgz',
  'darwin-x64': 'cloudflared-darwin-amd64.tgz',
  'win32-x64': 'cloudflared-windows-amd64.exe',
};

function cloudflaredHolen() {
  sagen('  cloudflared von Hand holen und neben dieses Projekt legen:');
  const datei = HOLEN[`${process.platform}-${process.arch}`];
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
  sagen(`    (Die Datei gehört nach ${wurzel})`);
}

function anleitung() {
  sagen('');
  sagen('  Keiner der drei Wege nach außen ist auf diesem Gerät einsatzbereit:');
  sagen('  cloudflared fehlt, ssh fehlt, und selbst npx (das mit Node kommt)');
  sagen('  meldet sich nicht – das ist ungewöhnlich und meist ein PATH-Problem.');
  sagen('');
  if (hatDocker()) {
    sagen('  Docker ist da – dann geht es über den Container:');
    sagen('    docker compose --profile tunnel up -d');
    sagen('    npm run adresse');
    sagen('');
  }
  cloudflaredHolen();
  sagen('');
  sagen('  Wenn dieser Rechner gar nichts herunterladen darf, ist keiner der');
  sagen('  drei Wege einzurichten. Zwei Möglichkeiten bleiben:');
  sagen('    - Im selben WLAN spielen: npm run adresse nennt die Adresse,');
  sagen('      die alle im Haus erreichen. Dafür braucht es gar nichts.');
  sagen('    - Den Tunnel auf einem anderen Gerät laufen lassen – auf dem');
  sagen('      Raspberry Pi etwa, der ohnehin durchläuft.');
  sagen('');
}

/* --- Der eigene Vorposten: SSH-Rücktunnel --------------------------------- */

/**
 * Der Weg zur eigenen Domain, ohne auf diesem Rechner irgendetwas zu
 * installieren.
 *
 * Ein Laptop hat keine feste Adresse im Netz: Er steht mal hier, mal dort,
 * meist hinter einem Router, der ihm gar keine eigene öffentliche Adresse
 * gibt. Die Domain kann also nicht auf ihn zeigen. Sie zeigt stattdessen auf
 * einen **Vorposten** – einen kleinen Server, der immer am selben Fleck steht
 * (bei Oracle ist so einer dauerhaft kostenlos). Dort liegen die Domain, das
 * Zertifikat und ein nginx.
 *
 * Und weil der Laptop hinausrufen darf, auch wenn niemand hineinrufen kann,
 * dreht dieser Tunnel die Richtung um: Der Laptop ruft beim Vorposten an
 * (`ssh -R`) und sagt ihm dabei, er möge alles, was auf seinem Port 3001
 * ankommt, durch diese Leitung zurückschicken. nginx auf dem Vorposten reicht
 * die Anfragen von der Domain genau dorthin.
 *
 *   Browser → www.deinemudda.fun → nginx (Vorposten) → SSH-Leitung → Almanach
 *
 * Gebraucht wird dafür nur `ssh`, und das bringt Windows 10 und 11, macOS und
 * Linux längst mit. **Auf diesem Rechner wird nichts heruntergeladen und nichts
 * installiert** – genau der Punkt, an dem cloudflared und Tailscale scheitern.
 *
 * Eingerichtet wird der Vorposten einmal, mit `scripts/vorposten.sh`; siehe
 * docs/EINRICHTUNG.md, Schritt 6.5.
 */

/** Zwischen zwei Versuchen – wächst, damit ein totes Ziel nicht gehämmert wird. */
const WARTEN = [2, 5, 10, 20, 30, 60];

function vpsTunnel() {
  const ziel = process.env.TUNNEL_ZIEL;
  const fern = Number(process.env.TUNNEL_FERNPORT) || PORT;

  if (!laeuft('ssh', ['-V'])) {
    sagen('');
    sagen('  Für den eigenen Vorposten braucht es `ssh` – und das meldet sich');
    sagen('  auf diesem Rechner nicht. Ungewöhnlich: Windows 10 und 11, macOS');
    sagen('  und Linux bringen es alle mit.');
    sagen('');
    sagen('  Unter Windows nachrüsten, ohne etwas herunterzuladen:');
    sagen('    Einstellungen → System → Optionale Features → Feature hinzufügen');
    sagen('    → OpenSSH-Client. Danach ein neues Fenster öffnen.');
    sagen('');
    process.exit(1);
  }

  const adresse = festeAdresse();

  sagen('');
  if (adresse.adresse) {
    sagen('  Die Runde erreicht den Almanach unter:');
    sagen('');
    sagen(`    ${adresse.adresse}`);
    sagen('');
    sagen('  Diese Adresse gehört dir und wechselt nicht mehr – auch nicht nach');
    sagen('  einem Neustart und auch nicht in einem fremden WLAN.');
  } else {
    sagen('  Es ist keine DOMAENE eingetragen. Der Tunnel steht gleich, aber der');
    sagen('  Almanach kann seiner Runde die Adresse nicht selbst nennen:');
    sagen('    DOMAENE=www.deinemudda.fun');
  }
  sagen('');
  sagen(`  Leitung: ${ziel}, dort Port ${fern} → hier Port ${PORT}`);
  sagen('  (Beenden mit Strg+C. Der Almanach läuft davon unbeirrt weiter.)');
  sagen('');
  // Kein "fertig" an dieser Stelle: `ssh -N` schweigt, wenn es klappt, und
  // sagt nur etwas, wenn es schiefgeht. Eine Erfolgsmeldung wäre geraten.
  sagen('  Baue die Leitung auf … Bleibt es still, steht sie.');
  sagen('');

  let versuch = 0;
  let aufgeben = false;
  let seitStart = 0;
  let laeuftGerade = null;

  // Einmal anmelden, nicht bei jedem Neuverbinden: Sonst stapeln sich die
  // Zuhörer, bis Node über zu viele klagt.
  for (const zeichen of ['SIGINT', 'SIGTERM']) {
    process.on(zeichen, () => {
      aufgeben = true;
      laeuftGerade?.kill(zeichen);
    });
  }

  function verbinden() {
    seitStart = Date.now();
    // -N: kein Befehl auf dem Vorposten, nur die Leitung. Genau deshalb genügt
    //     dort ein Benutzer ganz ohne Anmeldeschale.
    // ExitOnForwardFailure: lieber sofort abbrechen als eine Leitung offen
    //     halten, durch die nichts kommt – sonst stünde die Runde vor einem
    //     502 und hier sähe alles gut aus.
    const tunnel = spawn(
      'ssh',
      [
        '-N',
        '-o', 'ExitOnForwardFailure=yes',
        '-o', 'ServerAliveInterval=30',
        '-o', 'ServerAliveCountMax=3',
        '-o', 'StrictHostKeyChecking=accept-new',
        '-R', `${fern}:localhost:${PORT}`,
        ziel,
      ],
      { stdio: ['ignore', 'inherit', 'inherit'] }
    );
    laeuftGerade = tunnel;

    tunnel.on('exit', (code, signal) => {
      if (aufgeben || signal) {
        sagen('');
        sagen('  Tunnel geschlossen. Von außen kommt jetzt niemand mehr herein.');
        sagen('');
        process.exit(0);
      }

      // Stand die Leitung eine Weile, war es ein Abbruch und kein Fehler –
      // dann fangen wir beim kurzen Warten wieder an.
      if (Date.now() - seitStart > 60_000) versuch = 0;

      if (versuch === 0 && code !== 0) {
        sagen('');
        sagen(`  Die Leitung kam nicht zustande (Code ${code}) – die Meldung steht oben.`);
        sagen('  Meist eine dieser drei Ursachen:');
        sagen(`    - der Schlüssel liegt nicht beim Vorposten (ssh ${ziel} probieren)`);
        sagen(`    - Port ${fern} ist dort noch von einer alten Leitung belegt`);
        sagen('    - TUNNEL_ZIEL stimmt nicht');
      }

      const pause = WARTEN[Math.min(versuch, WARTEN.length - 1)];
      versuch += 1;
      sagen(`  Neuer Versuch in ${pause} s … (Strg+C beendet)`);
      setTimeout(verbinden, pause * 1000);
    });
  }

  verbinden();
}

/* --- Der Schnelltunnel: eine geliehene Adresse ---------------------------- */

function schnellTunnel() {
  const wahl = waehleAnbieter();
  if (!wahl) {
    anleitung();
    process.exit(1);
  }
  const { eintrag: anbieter, pfad } = wahl;

  fs.mkdirSync(datenordner, { recursive: true });
  // Frisch anfangen: Sonst fischt `npm run adresse` womöglich die Adresse von
  // vorgestern aus dem Protokoll und die Runde landet ins Leere.
  const schreiber = fs.createWriteStream(protokoll, { flags: 'w' });

  sagen('');
  sagen(`  Baue den Tunnel zu http://localhost:${PORT} auf … (${anbieter.name})`);
  sagen('  (Beenden mit Strg+C. Der Almanach läuft davon unbeirrt weiter.)');
  if (anbieter.hinweis) {
    sagen('');
    for (const zeile of anbieter.hinweis) sagen(zeile);
  }
  sagen('');

  const tunnel = anbieter.starten(pfad);

  // Nicht nur die erste Adresse: Baut die Verbindung neu auf, leiht sich der
  // Anbieter womöglich eine andere. Dann muss die Runde die neue bekommen –
  // also sagen wir jede, die sich von der zuletzt genannten unterscheidet.
  let gemeldet = null;
  function mitlesen(stueck) {
    const text = stueck.toString();
    schreiber.write(text);
    const treffer = text.match(anbieter.muster);
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
      sagen(`  ${anbieter.name} hat aufgegeben (Code ${code}). Das Protokoll steht in:`);
      sagen(`    ${protokoll}`);
      if (ANBIETER.some((a) => a.id !== anbieter.id && a.verfuegbar())) {
        sagen('');
        sagen('  Ein anderer Weg ist auf diesem Gerät auch da – erzwingen mit:');
        sagen(`    TUNNEL_ANBIETER=<${ANBIETER.map((a) => a.id).join('|')}> npm run tunnel`);
      }
      sagen('');
    }
    process.exit(code ?? 0);
  });
}

/* --- Los ------------------------------------------------------------------ */

// Mit eigenem Vorposten gibt es nichts zu wählen: Dann führt genau ein Weg
// hinaus, und die Adresse steht schon fest.
if (process.env.TUNNEL_ZIEL) vpsTunnel();
else schnellTunnel();
