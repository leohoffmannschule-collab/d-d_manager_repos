/**
 * Das Gerüst der gesetzten Handbücher: HTML-Kopf, Titelblatt, Inhalt.
 *
 * Eigene Datei, weil zwei Werkzeuge es brauchen: der Drucksatz der
 * einzelnen Handbücher (scripts/drucksatz.mjs) und das Buch
 * (scripts/handbuch.mjs), das dasselbe Titelblatt trägt.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { schuetzen } from './markdown.mjs';

const hier = path.dirname(fileURLToPath(import.meta.url));

/**
 * Der Zierrat unter dem Titel – als Verweis auf das Bild, das neben die
 * gesetzte Seite gelegt wird (siehe `beigaben`). Früher stand das SVG als
 * Text in jeder Seite; jetzt ist es eine eigene Datei (zierat.svg).
 */
export const ZIERAT = '<img class="zierat-bild" src="zierat.svg" alt="" width="160" height="16">';

/**
 * Was eine gesetzte Seite neben sich braucht: ihr Stilblatt und das Bild
 * des Zierrats. Beides wird in den Ordner der Seite geschrieben, damit sie
 * darauf verweisen kann, statt es in sich zu tragen – auch der Browser, der
 * sie zum PDF druckt, lädt es von dort.
 *
 * @param {string} ordner   wohin die Seite geschrieben wird
 * @param {string} name     Dateiname des Stilblatts (etwa „buch.css“)
 * @param {string} stil     sein Inhalt, schon ohne Erklärkopf
 */
export function beigaben(ordner, name, stil) {
  fs.mkdirSync(ordner, { recursive: true });
  fs.writeFileSync(path.join(ordner, name), stil);
  fs.copyFileSync(path.join(hier, 'zierat.svg'), path.join(ordner, 'zierat.svg'));
}

/**
 * Das Gerüst einer gesetzten Seite: Kopf mit Verweis aufs Stilblatt,
 * Titelblatt mit Zierrat, dann der Inhalt.
 *
 * @param {object} teile
 * @param {string} teile.titel      groß auf dem Titelblatt und im Fenstertitel
 * @param {string} teile.unter      die Zeile darunter
 * @param {string} teile.koerper    das gesetzte HTML
 * @param {string} teile.stilDatei  Name des Stilblatts neben der Seite (von `beigaben` geschrieben)
 * @returns {string} ein vollständiges HTML-Dokument
 */
export function seite({ titel, unter, koerper, stilDatei }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${schuetzen(titel)} – Abenteuer-Almanach</title>
<link rel="stylesheet" href="${stilDatei}">
</head>
<body>

<div class="titelblatt">
  <div class="marke">Abenteuer-Almanach</div>
  <h1>${schuetzen(titel)}</h1>
  <div class="unter">${schuetzen(unter)}</div>
  <div class="zierat">${ZIERAT}</div>
</div>

${koerper}

</body>
</html>`;
}
