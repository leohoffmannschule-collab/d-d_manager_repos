#!/usr/bin/env node
/**
 * Die Einfuhrprobe: Wer benutzt etwas, das er nicht eingeführt hat?
 *
 *   npm run einfuhrprobe
 *
 * Beim Zerlegen großer Dateien in kleine passiert immer wieder dasselbe:
 * Eine Funktion wandert in eine neue Datei – und die Zeile `import { … }`
 * bleibt zurück. Der Bau merkt davon **nichts**: Für ihn ist ein unbekannter
 * Name einfach eine globale Variable, die es zur Laufzeit schon geben wird.
 * Auffallen tut es erst, wenn jemand die Seite öffnet und ein weißes Fenster
 * bekommt.
 *
 * Diese Probe schließt die Lücke, und zwar ohne ein zusätzliches Paket
 * (der Almanach soll mit dem auskommen, was er ohnehin braucht):
 *
 *   1. Sie sammelt aus allen Dateien, **was irgendwo ausgeführt wird** –
 *      jedes `export function`, `export const`, `export { … }`.
 *   2. Für jede Datei sammelt sie, was darin **eingeführt oder erklärt**
 *      wird: Einfuhren, Funktionen, Konstanten, Parameter, Zerlegungen.
 *   3. Gemeldet wird jeder Name, der **benutzt** wird, im Almanach
 *      ausgeführt wird – und in der Datei weder steht noch hereingeholt
 *      wurde.
 *
 * Das ist bewusst eng gefasst: Nur Namen, die es anderswo im Almanach
 * wirklich gibt, werden überhaupt betrachtet. Ein Tippfehler in einer
 * Variablen fällt hier nicht auf – eine vergessene Einfuhr dagegen immer.
 *
 * Die Teile:
 *   einfuhrprobe/leser.mjs  – nurCode(): Kommentare und Texte entfernen
 *   einfuhrprobe/namen.mjs  – ausgeführte, bekannte und benutzte Namen
 *   gemeinsam/dateien.mjs   – Dateien finden (teilt sie mit den anderen Proben)
 */
import fs from 'node:fs';
import { dateien, kurz, liegtIn } from './gemeinsam/dateien.mjs';
import { nurCode } from './einfuhrprobe/leser.mjs';
import { ausgefuehrteNamen, bekannteNamen, benutzteNamen } from './einfuhrprobe/namen.mjs';

const ORDNER = ['frontend/src', 'backend/src', 'scripts', 'backend/scripts'];

/* --- Der Durchgang -------------------------------------------------------- */

const alle = ORDNER.flatMap((ordner) => dateien(ordner));

/**
 * Wer kann wen überhaupt einführen?
 *
 * Oberfläche und Server sind zwei getrennte Welten: Der Browser bekommt nie
 * eine Datei aus backend/, der Server nie eine aus frontend/. Ein Name, den
 * nur der Server ausführt, kann in der Oberfläche also gar keine vergessene
 * Einfuhr sein – und umgekehrt. Ohne diese Trennung schlug die Probe an,
 * sobald der Server ein gewöhnliches Wort wie `jetzt` ausführte, das in der
 * Oberfläche irgendwo im Fließtext steht.
 *
 * Nur die Werkzeuge in scripts/ sehen beide Welten: Die Blatt- und die
 * Klangprobe prüfen Rechnungen der Oberfläche mit Node.
 */
const oberflaeche = alle.filter((d) => liegtIn(d, 'frontend'));
const server = alle.filter((d) => liegtIn(d, 'backend'));
const kataloge = {
  oberflaeche: ausgefuehrteNamen(oberflaeche),
  server: ausgefuehrteNamen(server),
  beide: ausgefuehrteNamen(alle),
};
const katalogFuer = (datei) =>
  liegtIn(datei, 'frontend') ? kataloge.oberflaeche : liegtIn(datei, 'backend') ? kataloge.server : kataloge.beide;

const maengel = [];

for (const datei of alle) {
  const code = nurCode(fs.readFileSync(datei, 'utf8'));
  const bekannt = bekannteNamen(code);
  const katalog = katalogFuer(datei);

  for (const name of benutzteNamen(code)) {
    if (!katalog.has(name)) continue;
    if (bekannt.has(name)) continue;
    // Die Datei, die den Namen selbst ausführt, kennt ihn natürlich.
    if (katalog.get(name) === datei) continue;
    maengel.push({ datei: kurz(datei), name, her: kurz(katalog.get(name)) });
  }
}

console.log('');
if (maengel.length === 0) {
  console.log(`  Alle Einfuhren gehen auf: ${alle.length} Dateien geprüft.`);
  console.log('');
  process.exit(0);
}

console.log(`  ${maengel.length} benutzte Namen ohne Einfuhr:`);
for (const m of maengel) {
  console.log(`   – ${m.datei}: „${m.name}“  (ausgeführt in ${m.her})`);
}
console.log('');
process.exit(1);
