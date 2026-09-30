/**
 * Der benannte Tunnel: die eigene Domain über `TUNNEL_TOKEN`.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { festeAdresse } from '../../backend/src/domaene.js';
import { cloudflaredHolen } from './anleitung.mjs';
import { PORT, datenordner, findeCloudflared, hatDocker, protokoll, sagen } from './grundlagen.mjs';

/**
 * Hier wird nichts geliehen. Das Kennwort sagt Cloudflare, welcher Tunnel das
 * ist und welche Domain daran hängt – es gibt also keine Adresse mitzulesen
 * und keine weiterzusagen. Was bleibt, ist die Leitung offenzuhalten.
 *
 * Nur cloudflared kann das: Die beiden Notwege (ssh, localtunnel) tragen
 * fremde Adressen, an eine eigene Domain kommen sie nicht heran. Anders als
 * beim Schnelltunnel ist hier aber auch kein Server nötig, auf den die Domain
 * zeigt – Cloudflares eigenes Netz übernimmt das, kostenlos und ohne
 * Kreditkarte. Einrichtung einmalig: docs/EINRICHTUNG.md, Schritt 6.5.
 */
export function benannterTunnel() {
  const pfad = findeCloudflared();
  if (!pfad) {
    sagen('');
    sagen('  Für die eigene Domain braucht es cloudflared – hier fehlt es noch.');
    sagen('  ssh und localtunnel helfen nicht weiter: Die tragen fremde');
    sagen('  Adressen, keine eigene.');
    sagen('');
    if (hatDocker()) {
      sagen('  Docker ist da – dann geht es über den Container:');
      sagen('    docker compose --profile domaene up -d');
      sagen('');
    }
    cloudflaredHolen();
    sagen('');
    process.exit(1);
  }

  const ziel = festeAdresse();
  fs.mkdirSync(datenordner, { recursive: true });
  const schreiber = fs.createWriteStream(protokoll, { flags: 'w' });

  sagen('');
  sagen(`  Baue den benannten Tunnel zu http://localhost:${PORT} auf …`);
  sagen('');
  if (ziel.adresse) {
    sagen('  Die Runde erreicht den Almanach unter:');
    sagen('');
    sagen(`    ${ziel.adresse}`);
    sagen('');
    sagen('  Diese Adresse gehört dir und wechselt nicht mehr – auch nicht nach');
    sagen('  einem Neustart und auch nicht in einem fremden WLAN. Einmal');
    sagen('  weitersagen genügt.');
  } else {
    sagen('  Welche Domain daran hängt, weiß Cloudflare aus dem Kennwort.');
    sagen('  Damit der Almanach sie selbst nennen kann, gehört sie in die .env:');
    sagen('    DOMAENE=www.deinemudda.fun');
  }
  sagen('');
  sagen('  (Beenden mit Strg+C. Der Almanach läuft davon unbeirrt weiter.)');
  sagen('');

  // Das Kennwort geht über die Umgebung, nicht über die Befehlszeile:
  // cloudflared liest `--token` auch aus TUNNEL_TOKEN, und was in der
  // Befehlszeile steht, könnte auf einem gemeinsam genutzten Rechner jeder
  // in der Prozessliste mitlesen.
  const tunnel = spawn(pfad, ['tunnel', '--no-autoupdate', 'run'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  // Ob das Kennwort taugt, zeigt sich erst an der ersten stehenden Verbindung.
  // Bis dahin sieht ein falsches genauso aus wie ein richtiges.
  let steht = false;
  function mitlesen(stueck) {
    const text = stueck.toString();
    schreiber.write(text);
    if (steht || !/Registered tunnel connection|Connection .* registered/i.test(text)) return;
    steht = true;
    sagen('  Die Leitung steht. Ab jetzt kommt die Runde herein.');
    sagen('');
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
    if (code !== 0) {
      sagen('');
      sagen(`  cloudflared hat aufgegeben (Code ${code}). Das Protokoll steht in:`);
      sagen(`    ${protokoll}`);
      if (!steht) {
        sagen('');
        sagen('  Die Verbindung kam nie zustande – meist stimmt das TUNNEL_TOKEN');
        sagen('  nicht. In Cloudflare unter Zero Trust → Networks → Tunnels das');
        sagen('  Kennwort noch einmal kopieren und in die .env übernehmen.');
      }
      sagen('');
    }
    process.exit(code ?? 0);
  });
}
