/**
 * Die Verzeichnisse des Handbuchs – aus dem Code geschrieben.
 *
 * Jedes Verzeichnis ist ein kleines Modul in referenz/, das den Code liest
 * und ein Markdown-Kapitel zurückgibt. Dieses Modul ruft sie der Reihe nach
 * und schreibt die Ergebnisse nach docs/buch/referenz/. Die Dateien dort
 * werden mit eingecheckt, damit man sie auch auf GitHub lesen kann – von
 * Hand ändern lohnt aber nicht: Der nächste Lauf von `npm run handbuch`
 * schreibt sie neu.
 */
import fs from 'node:fs';
import path from 'node:path';
import { BEFEHLE } from './referenz/befehle.mjs';
import { DATEIVERZEICHNISSE } from './referenz/dateien.mjs';
import { DATENBANK } from './referenz/datenbank.mjs';
import { EINSTELLUNGEN } from './referenz/einstellungen.mjs';
import { EREIGNISSE } from './referenz/ereignisse.mjs';
import { PRUEFNETZ } from './referenz/pruefnetz.mjs';
import { REGELN } from './referenz/regeln.mjs';
import { VORLAGEN } from './referenz/vorlagen.mjs';
import { WEGE } from './referenz/wege.mjs';

/** Die Verzeichnisse, in der Reihenfolge ihrer Dateinamen. */
const VERZEICHNISSE = [
  ...DATEIVERZEICHNISSE,
  WEGE,
  DATENBANK,
  EREIGNISSE,
  EINSTELLUNGEN,
  BEFEHLE,
  VORLAGEN,
  REGELN,
  PRUEFNETZ,
];

/**
 * Alle Verzeichnisse neu schreiben. Manche Verzeichnisse laden Module des
 * Almanachs (Regeln, Vorlagen) – deshalb asynchron.
 *
 * @param {string} wurzel  das Wurzelverzeichnis des Almanachs
 * @returns {Promise<string[]>} die geschriebenen Dateien
 */
export async function schreibeVerzeichnisse(wurzel) {
  const ziel = path.join(wurzel, 'docs', 'buch', 'referenz');
  fs.mkdirSync(ziel, { recursive: true });
  const geschrieben = [];
  for (const { datei, erzeugen } of VERZEICHNISSE) {
    const pfad = path.join(ziel, datei);
    fs.writeFileSync(pfad, (await erzeugen(wurzel)).trimEnd() + '\n');
    geschrieben.push(pfad);
  }
  return geschrieben;
}
