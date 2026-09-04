#!/usr/bin/env node
/**
 * Sicherung des Almanachs.
 *
 *   node scripts/sicherung.mjs [Zielordner] [--medien] [--behalten=14]
 *
 * Die Datenbank wird *nicht* einfach kopiert. Der Almanach schreibt im
 * WAL-Verfahren: Eine Kopie mitten im Betrieb erwischt womöglich einen
 * halben Schreibvorgang und ist beim Zurückspielen wertlos. `VACUUM INTO`
 * dagegen schreibt einen in sich stimmigen Stand heraus, während die Runde
 * weiterspielt – und nebenbei einen aufgeräumten, kleineren.
 *
 * Die Bilder liegen als gewöhnliche Dateien daneben und ändern sich selten;
 * sie wandern nur mit `--medien` mit. So kann die Datenbank jede Nacht
 * gesichert werden, ohne jedes Mal alle Karten mitzuschleppen.
 */
import fs from 'node:fs';
import path from 'node:path';
import db, { mediaDir } from '../src/db.js';

const argumente = process.argv.slice(2);
const schalter = argumente.filter((a) => a.startsWith('--'));
const ziel = argumente.find((a) => !a.startsWith('--')) ?? path.join(process.env.DATA_DIR || 'data', 'sicherungen');

const mitMedien = schalter.includes('--medien');
const behalten = Number(schalter.find((a) => a.startsWith('--behalten='))?.split('=')[1] ?? 14);

const stempel = new Date()
  .toISOString()
  .slice(0, 16)
  .replace('T', '-')
  .replace(':', '');

fs.mkdirSync(ziel, { recursive: true });
const ordner = path.join(ziel, `almanach-${stempel}`);
fs.mkdirSync(ordner, { recursive: true });

// SQLite nimmt hier einen einfachen Pfad entgegen; Anführungszeichen im
// Zielnamen wären ein Problem, deshalb werden sie verdoppelt.
const datei = path.join(ordner, 'manager.sqlite3');
db.exec(`VACUUM INTO '${datei.replace(/'/g, "''")}'`);
console.log(`  Datenbank  : ${datei}  (${(fs.statSync(datei).size / 1024 / 1024).toFixed(1)} MB)`);

if (mitMedien && fs.existsSync(mediaDir)) {
  const bilder = path.join(ordner, 'medien');
  fs.cpSync(mediaDir, bilder, { recursive: true });
  const anzahl = fs.readdirSync(bilder).length;
  console.log(`  Bilder     : ${bilder}  (${anzahl} Dateien)`);
} else if (!mitMedien) {
  console.log('  Bilder     : übersprungen (mit --medien mitsichern)');
}

/* --- Alte Sicherungen wegräumen ----------------------------------------- */

if (behalten > 0) {
  const grenze = Date.now() - behalten * 24 * 60 * 60 * 1000;
  let entfernt = 0;
  for (const eintrag of fs.readdirSync(ziel)) {
    if (!eintrag.startsWith('almanach-')) continue;
    const pfad = path.join(ziel, eintrag);
    if (pfad === ordner) continue;
    if (fs.statSync(pfad).mtimeMs >= grenze) continue;
    fs.rmSync(pfad, { recursive: true, force: true });
    entfernt += 1;
  }
  if (entfernt > 0) console.log(`  Aufgeräumt : ${entfernt} ältere als ${behalten} Tage`);
}

console.log('  Fertig.');
