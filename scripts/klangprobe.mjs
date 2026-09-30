#!/usr/bin/env node
/**
 * Die Klangprobe: Rechnet der Almanach die Stelle im Stück richtig aus?
 *
 *   npm run klangprobe
 *
 * Das Gleichschalten der Musik hängt an einer einzigen kleinen Rechnung.
 * Der Server sagt allen dasselbe – „bei Sekunde `position`, gemessen um
 * `stand`, und es läuft“ –, und jedes Fenster rechnet daraus selbst aus, wo
 * es stehen müsste. Stimmt diese Rechnung nicht, läuft die Runde
 * auseinander, und niemand sieht, woran es liegt.
 *
 * Geprüft wird hier nur sie. Ob Spotify danach wirklich Ton macht, kann
 * kein Skript beantworten: Das hängt am Browser, am angemeldeten Konto und
 * daran, ob jemand auf „Mithören“ getippt hat.
 */
import { zielstelle } from '../frontend/src/components/klang/spotifyRahmen.js';

let bestanden = 0;
const maengel = [];

function nah(ist, soll, was, spanne = 0.01) {
  if (Math.abs(ist - soll) <= spanne) bestanden += 1;
  else maengel.push(`${was} – erwartet ${soll}, war ${ist}`);
}

const T0 = Date.parse('2026-01-01T20:00:00.000Z');
/** Ein Zeitpunkt `n` Sekunden nach T0 – die Probe rechnet mit einer festen Uhr. */
const sek = (n) => T0 + n * 1000;

/* --- Es läuft: die Stelle wächst mit der Zeit ---------------------------- */

const laeuft = { spielt: true, position: 30, stand: new Date(T0).toISOString() };
nah(zielstelle(laeuft, T0), 30, 'Im selben Augenblick gilt die gemeldete Stelle');
nah(zielstelle(laeuft, sek(10)), 40, 'Zehn Sekunden später sind es zehn Sekunden mehr');
nah(zielstelle(laeuft, sek(90)), 120, 'Und anderthalb Minuten später anderthalb Minuten mehr');

/* --- Es ist angehalten: die Zeit steht ----------------------------------- */

const haelt = { spielt: false, position: 42.5, stand: new Date(T0).toISOString() };
nah(zielstelle(haelt, T0), 42.5, 'Angehalten gilt die Stelle unverändert');
nah(zielstelle(haelt, sek(600)), 42.5, 'Auch nach zehn Minuten Pause');

/* --- Was fehlt oder unsinnig ist, führt nicht in den Abgrund ------------- */

nah(zielstelle(null), 0, 'Ohne Klang steht der Zeiger auf null');
nah(zielstelle({}), 0, 'Ohne Angaben ebenso');
nah(zielstelle({ spielt: true, position: 12 }), 12, 'Ohne Zeitstempel bleibt die nackte Stelle stehen');
nah(zielstelle({ spielt: true, position: 5, stand: 'kein Datum' }), 5, 'Ein unlesbares Datum ändert nichts');

// Eine Uhr, die nachgeht (oder ein Zeitstempel aus der Zukunft), darf nicht
// in eine negative Stelle führen – dort kann kein Spieler hinspringen.
nah(
  zielstelle({ spielt: true, position: 0, stand: new Date(sek(60)).toISOString() }, T0),
  0,
  'Eine Stelle vor dem Anfang gibt es nicht'
);

/* --- Bericht ------------------------------------------------------------- */

console.log('');
if (maengel.length === 0) {
  console.log(`  Der Klang läuft im Takt: ${bestanden} Prüfungen bestanden.`);
  console.log('');
  process.exit(0);
}
console.log(`  ${bestanden} Prüfungen bestanden, ${maengel.length} nicht:`);
for (const m of maengel) console.log(`   – ${m}`);
console.log('');
process.exit(1);
