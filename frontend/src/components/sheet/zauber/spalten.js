/**
 * Die Spalten eines Zaubers – und wie ein Kompendiumseintrag sie füllt.
 *
 * Eigene Datei ohne JSX, weil zwei Stellen sie brauchen: die Suche, die
 * einen gefundenen Zauber gleich mit seinen Spalten ins Blatt legt, und die
 * aufgeschlagene Zeile, die dieselben Spalten als Felder zeigt.
 */

/**
 * Die Spalten, die auf dem gedruckten Blatt neben jedem Zauber stehen.
 * Wer sie gefüllt hat, muss am Abend nichts mehr nachschlagen: Reichweite,
 * Wirkzeit und Dauer stehen da, wo der Zauber steht.
 */
export const ZAUBER_SPALTEN = [
  { key: 'source', label: 'Quelle', platz: 'w-full sm:w-auto sm:flex-1' },
  { key: 'save', label: 'RW / Angriff' },
  { key: 'time', label: 'Zeit' },
  { key: 'range', label: 'Reichweite' },
  { key: 'components', label: 'Komponenten' },
  { key: 'duration', label: 'Dauer' },
  { key: 'page', label: 'Seite' },
];

/**
 * Was der Kompendiumseintrag über einen Zauber verrät, in die Spalten des
 * Blattes übersetzt. „Quelle“ bleibt leer – die weiß nur, wer den Zauber
 * bekommen hat: aus der Klasse, aus der Abstammung, aus einem Talent.
 */
export function spaltenAus(detail) {
  if (!detail) return {};
  const komponenten = (detail.components ?? []).join(', ');
  const rettung = detail.dc?.dc_type?.name
    ? `${detail.dc.dc_type.name}-RW`
    : detail.attack_type
      ? 'Angriff'
      : '';
  return {
    save: rettung,
    time: detail.casting_time ?? '',
    range: detail.range ?? '',
    components: komponenten + (detail.material ? ' (M)' : ''),
    duration: detail.duration ?? '',
  };
}
