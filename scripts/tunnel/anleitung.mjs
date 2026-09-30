/**
 * Wenn kein Weg nach außen da ist: sagen, wie man weiterkommt.
 *
 * Der Almanach lädt selbst nichts herunter. Er sagt, welche Datei von
 * cloudflared zu diesem Gerät passt und wohin sie gehört – und was ohne
 * jeden Tunnel möglich bleibt (im selben WLAN spielen).
 */
import { hatDocker, sagen, wurzel } from './grundlagen.mjs';

// Welche Datei der cloudflared-Veröffentlichung zu welchem System passt.
const HOLEN = {
  'linux-arm64': 'cloudflared-linux-arm64',
  'linux-x64': 'cloudflared-linux-amd64',
  'linux-arm': 'cloudflared-linux-arm',
  'darwin-arm64': 'cloudflared-darwin-arm64.tgz',
  'darwin-x64': 'cloudflared-darwin-amd64.tgz',
  'win32-x64': 'cloudflared-windows-amd64.exe',
};

/** Die passende Adresse zum Herunterladen, samt Befehlen, wo es sie gibt. */
export function cloudflaredHolen() {
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

/** Was zu tun ist, wenn keiner der drei Anbieter bereitsteht. */
export function anleitung() {
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
