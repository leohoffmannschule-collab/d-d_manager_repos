/**
 * Was der Server beim Start sagt – und wenn er nicht starten kann.
 *
 * Der Almanach läuft bei den meisten auf einem Gerät, vor dem niemand sitzt.
 * Was beim Start im Fenster steht, ist deshalb die eine Gelegenheit, Klartext
 * zu reden: welche Datenbank, welcher Ordner, unter welchen Adressen die
 * Runde ihn erreicht – und was fehlt, bevor es mitten im Spielabend auffällt.
 */
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { db, dataDir, driver, mediaDir } from '../db.js';
import { umgebung } from '../umgebung.js';
import { countUsers } from '../auth.js';

/**
 * Karten und Bildnisse liegen als Dateien neben der Datenbank. Beim Umzug auf
 * ein anderes Gerät bleibt der Ordner gern zurück (oder landet eine Ebene zu
 * tief) – dann steht jeder Eintrag noch, aber der Spieltisch bleibt leer. Das
 * fällt sonst erst mitten im Spielabend auf, deshalb steht es beim Start da.
 */
function fehlendeBilder() {
  const alle = db.prepare('SELECT filename FROM media').all();
  const fehlen = alle.filter(({ filename }) => !fs.existsSync(path.join(mediaDir, filename)));
  return { gesamt: alle.length, fehlen: fehlen.length };
}

/** Die IPv4-Adressen dieses Geräts im Heimnetz – für iPad und Telefon am Tisch. */
function localAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}

/**
 * Der Bericht, sobald der Server lauscht.
 *
 * @param {object} lage
 * @param {number} lage.PORT
 * @param {boolean} lage.hasFrontend  liefert dieser Server die Oberfläche mit?
 * @param {object} lage.domaene       die feste Adresse aus `DOMAENE` (domaene.js)
 * @param {number} lage.geraeumt      wie viele Kampagnen die Papierkorbfrist gerade überschritten haben
 */
export function berichteStart({ PORT, hasFrontend, domaene, geraeumt }) {
  console.log('');
  console.log('  Abenteuer-Almanach läuft');
  console.log(`  Datenbank      : ${driver}`);
  // Wer zwei Ordner nebeneinander betreibt – den laufenden Almanach und einen
  // zum Ausprobieren –, sieht hier auf einen Blick, welcher von beiden gerade
  // spricht. Beide heißen sonst gleich und sehen gleich aus.
  console.log(`  Datenordner    : ${dataDir}`);
  console.log(`  Oberfläche     : ${hasFrontend ? 'wird mit ausgeliefert' : 'separat über "npm run dev" (Port 5173)'}`);
  if (domaene.adresse) {
    console.log(`  Für die Runde  : ${domaene.adresse}   (solange der Weg nach außen offen ist)`);
  }
  console.log(`  Auf diesem PC  : http://localhost:${PORT}`);
  for (const address of localAddresses()) {
    console.log(`  Im Netzwerk    : http://${address}:${PORT}   (für iPad/iPhone)`);
  }
  if (domaene.gesetzt && !domaene.adresse) {
    console.log('');
    console.log(`  DOMAENE=${domaene.roh} ergibt keinen Domainnamen – bitte in .env nachsehen.`);
    console.log('  Erwartet wird der nackte Name, etwa: DOMAENE=www.deinemudda.fun');
  }
  if (umgebung.grund === 'node_zu_alt') {
    console.log('');
    console.log('  Es liegt eine .env daneben, aber dieses Node kann sie nicht lesen');
    console.log(`  (${process.version}, nötig wäre 20.12 oder neuer). Alles darin bleibt unbeachtet.`);
  }
  if (umgebung.grund === 'fehler') {
    console.log('');
    console.log(`  Die .env ließ sich nicht lesen: ${umgebung.fehler}`);
  }
  const bilder = fehlendeBilder();
  if (bilder.fehlen > 0) {
    console.log('');
    console.log(`  ${bilder.fehlen} von ${bilder.gesamt} Bildern fehlen auf der Platte.`);
    console.log(`  Erwartet werden sie in: ${mediaDir}`);
    console.log('  Beim Umzug ist der Ordner "medien" wohl nicht (oder eine Ebene zu tief) mitgekommen.');
  }
  if (geraeumt > 0) {
    console.log('');
    console.log(`  ${geraeumt} Kampagne(n) im Papierkorb waren über die Frist – endgültig entfernt.`);
  }
  if (countUsers() === 0) {
    console.log('');
    console.log('  Noch kein Konto vorhanden: Das erste angelegte Konto führt die Spielleitung.');
  }
  console.log('');
}

/**
 * Zwei Almanache auf demselben Port gehen nicht – und das ist gut so.
 *
 * Wer einen zweiten Ordner zum Ausprobieren betreibt, soll ihn nicht
 * versehentlich neben den laufenden stellen: Über die Domain käme sonst mal
 * der eine und mal der andere. Statt eines Stapelauszugs sagt der Almanach
 * deshalb geradeheraus, was zu tun ist.
 */
export function portBelegt(err, PORT) {
  if (err.code !== 'EADDRINUSE') throw err;
  console.log('');
  console.log(`  Auf Port ${PORT} lauscht schon jemand – sehr wahrscheinlich ein anderer Almanach.`);
  console.log('  Es kann immer nur einer den Port haben, und nur wer ihn hat, wird über die');
  console.log('  Domain ausgeliefert.');
  console.log('');
  console.log('  Also: im anderen Fenster mit Strg+C beenden, dann hier neu starten.');
  console.log(`  (Oder diesen hier auf einen eigenen Port legen: PORT=3002 in die .env.)`);
  console.log('');
  process.exit(1);
}
