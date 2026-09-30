/**
 * Das Gerüst der gesetzten Handbücher: HTML-Kopf, Titelblatt, Inhalt.
 *
 * Eigene Datei, weil zwei Werkzeuge es brauchen: der Drucksatz der
 * einzelnen Handbücher (scripts/drucksatz.mjs) und das Buch
 * (scripts/handbuch.mjs), das dasselbe Titelblatt trägt.
 */
import { schuetzen } from './markdown.mjs';

/** Der Zierrat unter dem Titel: zwei Linien, ein Ring, zwei Punkte – als SVG. */
export const ZIERAT = `<svg width="160" height="16" viewBox="0 0 160 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 8h58M102 8h58" stroke="currentColor" stroke-width="0.8" fill="none"/>
      <path d="M80 2c-3.6 0-6.5 2.7-6.5 6s2.9 6 6.5 6 6.5-2.7 6.5-6-2.9-6-6.5-6zm0 1.8c2.6 0 4.7 1.9 4.7 4.2s-2.1 4.2-4.7 4.2-4.7-1.9-4.7-4.2 2.1-4.2 4.7-4.2z" fill="currentColor"/>
      <circle cx="66" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="94" cy="8" r="1.5" fill="currentColor"/>
    </svg>`;

/**
 * Das Gerüst einer gesetzten Seite: Kopf mit eingebettetem Stilblatt,
 * Titelblatt mit Zierrat, dann der Inhalt.
 *
 * @param {object} teile
 * @param {string} teile.titel    groß auf dem Titelblatt und im Fenstertitel
 * @param {string} teile.unter    die Zeile darunter
 * @param {string} teile.koerper  das gesetzte HTML
 * @param {string} teile.stil     das Stilblatt, schon ohne Erklärkopf
 * @returns {string} ein vollständiges HTML-Dokument
 */
export function seite({ titel, unter, koerper, stil }) {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${schuetzen(titel)} – Abenteuer-Almanach</title>
<style>${stil}</style>
</head>
<body>

<div class="titelblatt">
  <div class="marke">Abenteuer-Almanach</div>
  <h1>${schuetzen(titel)}</h1>
  <div class="unter">${schuetzen(unter)}</div>
  <div class="zierat">
    ${ZIERAT}
  </div>
</div>

${koerper}

</body>
</html>`;
}
