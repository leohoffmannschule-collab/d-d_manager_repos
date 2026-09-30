/**
 * Die drei Anbieter eines geliehenen Weges nach außen – und welcher genommen
 * wird.
 *
 * Probiert wird in fester Reihenfolge (cloudflared, ssh → localhost.run,
 * npx localtunnel), bis einer da ist. `TUNNEL_ANBIETER` erzwingt einen.
 * Jeder Anbieter weiß, wie man ihn startet und woran man in seiner Ausgabe
 * die geliehene Adresse erkennt.
 */
import { spawn } from 'node:child_process';
import { NPX, PORT, findeCloudflared, laeuft, sagen } from './grundlagen.mjs';

/** Die Anbieter in der Reihenfolge, in der sie probiert werden. */
export const ANBIETER = [
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

/**
 * Der erste verfügbare Anbieter – oder der erzwungene.
 *
 * @returns {{ eintrag: object, pfad: string } | null}
 */
export function waehleAnbieter() {
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
