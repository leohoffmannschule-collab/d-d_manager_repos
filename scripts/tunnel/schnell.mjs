/**
 * Der Schnelltunnel: eine geliehene Adresse, die bei jedem Start wechselt.
 *
 * Das gewählte Programm (anbieter.mjs) wird gestartet, seine Ausgabe nach
 * `data/tunnel.log` mitgeschrieben, und sobald die geliehene Adresse darin
 * auftaucht, steht sie groß im Fenster – zum Weitersagen an die Runde.
 */
import fs from 'node:fs';
import { anleitung } from './anleitung.mjs';
import { ANBIETER, waehleAnbieter } from './anbieter.mjs';
import { PORT, datenordner, protokoll, sagen } from './grundlagen.mjs';

/** Einen Anbieter wählen, starten, die Adresse ansagen, bis Strg+C. */
export function schnellTunnel() {
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
