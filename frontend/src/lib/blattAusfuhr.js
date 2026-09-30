/**
 * Das Blatt zum Mitnehmen.
 *
 * Erzeugt eine einzelne HTML-Datei, die alles enthält, was auf dem Blatt
 * steht – samt Bildnis als eingebettetem Bild. Sie braucht keinen Server,
 * kein Netz und keine App: doppelklicken genügt, auf jedem Rechner, Tablet
 * oder Telefon. Gedruckt sieht sie aus wie ein Charakterbogen.
 *
 * Am Ende der Datei steckt außerdem der vollständige Datensatz. Die Datei
 * ist damit zugleich eine Sicherung, aus der sich ein verlorenes Blatt
 * wiederherstellen lässt.
 *
 * Diese Datei setzt nur noch zusammen; gebaut wird nebenan:
 *
 *   blatt/werkzeug.js    entschärfen, einrahmen, Bilder einbetten
 *   blatt/abschnitte.js  je eine Funktion für je eine Karte des Bogens
 *   blatt/koerper.js     welche Karte in welcher Reihenfolge
 *   blatt/stil/*.css     das Aussehen, als richtige Stilblätter
 *   blatt/drucken.js     der Druckknopf, als richtiges Skript
 *
 * Die fertige Datei trägt ihr Stilblatt und ihr Skript in sich – sie muss
 * ohne Netz funktionieren, einen Verweis auf eine zweite Datei gäbe es beim
 * Doppelklick nicht. Geschrieben aber werden beide als echte Dateien; hier
 * werden sie beim Bauen nur eingesetzt.
 */
import { withDefaults } from './dnd5e.js';
import { alsDatenUrl, esc, zaubertexte } from './blatt/werkzeug.js';
import { dnd5eKoerper, freiKoerper } from './blatt/koerper.js';

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
import ROHSKRIPT from './blatt/drucken.js?raw';

// Die Erklärköpfe von Stilblatt und Skript richten sich an Mitarbeitende am
// Code und haben im Blatt der Spielerin nichts verloren – also weg damit.
const ohneKopf = (text) => text.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');
const STIL = [GRUND, BOGEN, LISTEN, ZAUBERBLOCK, LEISTE].map(ohneKopf).join('\n');
const SKRIPT = ohneKopf(ROHSKRIPT);

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

  // Der Datensatz reist mit, damit die Datei zugleich eine Sicherung ist.
  // `<` wird maskiert, sonst könnte ein Text im Blatt das Skript beenden.
  const daten = JSON.stringify(
    { name: character.name, system: character.system, data, stand: new Date().toISOString() },
    null,
    2
  ).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(character.name)} – Abenteuer-Almanach</title>
<style>${STIL}</style>
</head>
<body>
<div class="leiste">
  <button id="drucken" type="button">Drucken</button>
  <span>Stand: ${esc(stand)} · Diese Datei braucht weder Netz noch Server.</span>
</div>
<div class="blatt">
${koerper}
<p class="hinweis hinweis-fuss">
  Abgeschrieben aus dem Abenteuer-Almanach. Änderungen in dieser Datei wandern nicht zurück –
  am Spieltisch gilt das Blatt im Almanach.
</p>
</div>
<script type="application/json" id="almanach-daten">${daten}</script>
<script>${SKRIPT}</script>
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
