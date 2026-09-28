/**
 * Das gewählte Aussehen setzen, bevor der erste Strich gezeichnet wird.
 *
 * Diese Datei läuft absichtlich *vor* der Oberfläche und außerhalb von
 * React: Sie hängt als gewöhnliches <script> im Kopf der index.html und
 * blockiert damit das Zeichnen für den Bruchteil, den sie braucht.
 *
 * Warum dieser Aufwand für eine Zeile? Weil sonst jeder Start im
 * Kerzenlicht mit einem hellen Aufblitzen beginnt: Die Seite erscheint in
 * der Standardfarbe, React lädt, useTheme() greift – und erst dann wird es
 * dunkel. Auf einem Raspberry Pi dauert das lange genug, um zu stören.
 *
 * Gelesen wird derselbe Schlüssel, den lib/useTheme.js schreibt. Ändert
 * sich dort der Name, muss er hier mit geändert werden – deshalb steht er
 * an beiden Stellen im Kommentar.
 *
 * localStorage kann werfen (privater Modus, gesperrte Website-Daten).
 * Dann eben Pergament: Ein Absturz vor dem ersten Bild wäre das Schlimmste,
 * was eine Farbeinstellung anrichten könnte.
 */
try {
  document.documentElement.dataset.theme = localStorage.getItem('almanach-theme') || 'pergament';
} catch (e) {
  document.documentElement.dataset.theme = 'pergament';
}
