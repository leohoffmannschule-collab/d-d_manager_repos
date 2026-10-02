/**
 * Das Blatt zum Mitnehmen.
 *
 * Erzeugt eine einzelne HTML-Datei, die alles enthält, was auf dem Blatt
 * steht – samt Bildnis als eingebettetem Bild. Sie braucht keinen Server,
 * kein Netz und keine App: doppelklicken genügt, auf jedem Rechner, Tablet
 * oder Telefon. Gedruckt sieht sie aus wie ein Charakterbogen.
 *
 * Am Ende der Datei steckt außerdem der vollständige Datensatz, in einem
 * `<template>` – Daten, kein Skript. Die Datei ist damit zugleich eine
 * Sicherung: „Blatt einlesen“ in der Übersicht legt daraus wieder ein Blatt
 * an oder bringt das vorhandene auf ihren Stand (blattEinfuhr.js).
 *
 * **Die Datei darf bearbeitet zurückkommen** – von Hand oder von einer KI.
 * Dafür steht ganz oben eine Anleitung für KI-Assistenten (als Kommentar,
 * im Browser unsichtbar), und jeder sichtbare Wert trägt den Pfad, unter
 * dem er im Datensatz steht. Ändert jemand nur die sichtbare Seite, findet
 * das Einlesen die Änderung daran wieder. Beides steht in blatt/datensatz.js
 * und blatt/werkzeug.js (`marke`).
 *
 * Diese Datei setzt nur noch zusammen; gebaut wird nebenan:
 *
 *   blatt/werkzeug.js    entschärfen, einrahmen, markieren, Bilder einbetten
 *   blatt/abschnitte.js  je eine Funktion für je eine Karte des Bogens
 *   blatt/koerper.js     welche Karte in welcher Reihenfolge
 *   blatt/datensatz.js   der Datensatz und die Anleitung für eine KI
 *   blatt/glossar.js     welcher Wert wo steht und wie er heißt
 *   blatt/stil/*.css     das Aussehen, als richtige Stilblätter
 *
 * **Skript enthält die Datei keines.** Früher trug sie einen Druckknopf mit
 * einer Zeile JavaScript; jetzt steht dort, wie man druckt (Strg+P, am iPad
 * Teilen → Drucken) – das kann jeder Browser ohnehin, und die Datei führt
 * nichts aus.
 *
 * **Das Stilblatt ist die eine Stelle im ganzen Almanach, an der CSS in
 * einer Seite eingebettet steht** – und zwar nur in dieser erzeugten
 * Datei, nicht im Quelltext: Geschrieben wird es als richtige .css-Dateien
 * (blatt/stil/), eingesetzt erst beim Bauen. Anders geht es nicht, ohne
 * die Datei unbrauchbar zu machen: Sie muss mit einem Doppelklick auf
 * jedem Gerät funktionieren, ohne Netz und ohne Almanach dahinter – ein
 * Verweis auf eine zweite Datei ginge beim Verschicken per Mail oder beim
 * Öffnen aus der Dateien-App verloren. Die Stilprobe lässt diese eine
 * Stelle zu und keine andere.
 */
import { withDefaults } from './dnd5e.js';
import { alsDatenUrl, esc, zaubertexte } from './blatt/werkzeug.js';
import { dnd5eKoerper, freiKoerper } from './blatt/koerper.js';
import { datensatzBlock, kiAnleitung } from './blatt/datensatz.js';

// Das Stilblatt liegt als echte .css-Dateien in blatt/stil/ und wird beim
// Bauen als Text hereingeholt (`?raw` ist Vites Weg dafür). So hat es im
// Editor alles, was CSS haben soll – Hervorhebung, Prüfung, Formatierung –,
// landet aber trotzdem eingebettet in der fertigen Datei, die ja ohne Netz
// und ohne Almanach funktionieren muss.
//
// Die Reihenfolge der Teile ist die der Kaskade: Ein späterer darf einen
// früheren überschreiben (leiste.css enthält die Fassung für Papier und
// muss deshalb zuletzt kommen).
import GRUND from './blatt/stil/grund.css?raw';
import BOGEN from './blatt/stil/bogen.css?raw';
import LISTEN from './blatt/stil/listen.css?raw';
import ZAUBERBLOCK from './blatt/stil/zauberblock.css?raw';
import LEISTE from './blatt/stil/leiste.css?raw';

// Die Erklärköpfe der Stilblätter richten sich an Mitarbeitende am Code und
// haben im Blatt der Spielerin nichts verloren – also weg damit.
const ohneKopf = (text) => text.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');
const STIL = [GRUND, BOGEN, LISTEN, ZAUBERBLOCK, LEISTE].map(ohneKopf).join('\n');

/**
 * Das fertige HTML-Dokument als Zeichenkette.
 *
 * `async`, weil Bildnisse als `data:`-URL geladen und eingebettet werden –
 * ein Verweis auf den Server würde außerhalb des Almanachs ins Leere zeigen.
 */
export async function blattAlsHtml(character) {
  const istDnd = character.system === 'dnd5e';
  const data = istDnd ? withDefaults(character.data) : character.data;

  const portrait = await alsDatenUrl(data.portrait);

  const stand = new Date().toLocaleString('de-DE');
  const texte = istDnd ? await zaubertexte(data.spellcasting?.spells) : {};
  const koerper = istDnd
    ? dnd5eKoerper(character, data, { portrait }, texte)
    : freiKoerper(character, data, { portrait });

  return `<!doctype html>
${kiAnleitung(character.system)}
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(character.name)} – Abenteuer-Almanach</title>
<style>${STIL}</style>
</head>
<body>
<div class="leiste">
  <span class="druckhinweis">Drucken: Strg+P · am iPad Teilen → Drucken</span>
  <span>Stand: ${esc(stand)} · Diese Datei braucht weder Netz noch Server.</span>
</div>
<div class="blatt">
${koerper}
<p class="hinweis hinweis-fuss">
  Abgeschrieben aus dem Abenteuer-Almanach. Diese Datei lässt sich bearbeiten – von Hand oder von
  einer KI – und mit „Blatt einlesen“ wieder in den Almanach holen. Bis dahin gilt am Spieltisch
  das Blatt im Almanach.
</p>
</div>
${datensatzBlock(character, data)}
</body>
</html>`;
}

/**
 * Dasselbe als Datei, die der Browser zum Sichern anbietet.
 *
 * Der Umweg über einen unsichtbaren `<a download>` und eine Blob-URL ist der
 * übliche Weg, im Browser eine Datei zu erzeugen, die es nie auf einem
 * Server gab. Das `revokeObjectURL` danach gibt den Speicher wieder frei.
 */
export async function ladeBlattHerunter(character) {
  const html = await blattAlsHtml(character);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const datum = new Date().toISOString().slice(0, 10);
  // Umlaute werden umschrieben: Ein Dateiname mit „ä“ überlebt weder jeden
  // Browser noch jeden USB-Stick, und „Kapitaen Sturmhand“ liest sich immer
  // noch wie der Gemeinte.
  const UMSCHRIFT = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };
  const name =
    character.name
      .replace(/[äöüÄÖÜß]/g, (z) => UMSCHRIFT[z])
      .replace(/[^\w -]/g, '')
      .trim() || 'Charakterblatt';

  const anker = document.createElement('a');
  anker.href = url;
  anker.download = `${name}-${datum}.html`;
  anker.rel = 'noopener';
  document.body.appendChild(anker);
  anker.click();
  anker.remove();

  // Nicht sofort freigeben: Der Browser liest den Inhalt erst nach dem Klick,
  // und auf einem iPad kann das einen Moment dauern. Wird die Adresse zu früh
  // eingezogen, bricht die Sicherung mittendrin ab.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
