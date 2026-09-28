/**
 * Aus Zahlen Sätze machen – für „Alles in eine andere Kampagne“.
 *
 * Reine Rechnung, kein JSX: Diese vier Funktionen wissen nichts von React
 * und lassen sich deshalb auch einzeln prüfen. Sie stehen hier zusammen,
 * weil sie nur miteinander Sinn ergeben – aus `{ charaktere: 2 }` und den
 * Bezeichnungen des Servers wird „2 Charaktere“ und am Ende ein Satz, der
 * sich lesen lässt.
 *
 * Die Ein- und Mehrzahl kommt vom Server mit (`eins`, `viele`). Das ist
 * Absicht: „1 Charaktere“ liest sich nicht, und wo die Wörter stehen,
 * stehen auch die Zahlen dazu.
 */

/** Liegt in dieser Art überhaupt etwas? Die Kiste zählt auch ohne Gegenstände, wenn Münzen darin sind. */
export function inhalt(umfang, art) {
  if (umfang[art] > 0) return true;
  return art === 'beute' && !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
}

/** „1 Charakter“, „3 Charaktere“ – die Mehrzahl kommt aus dem Umfang selbst. */
export function stueck(art, anzahl) {
  return anzahl === 1 ? art.eins : art.viele;
}

/** Ein Teil der Aufzählung, samt Münzen, wo welche in der Kiste liegen. */
export function satzteil(umfang, art) {
  const anzahl = umfang[art] ?? 0;
  const stueckzahl = anzahl ? `${anzahl} ${stueck(umfang.arten[art], anzahl)}` : '';
  const klimpert = art === 'beute' && !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
  if (!klimpert) return stueckzahl;
  return stueckzahl ? `${stueckzahl} samt Münzen` : 'die Münzen';
}

/** „a, b und c“ – nicht „a, b, c“: Es soll sich lesen wie ein Satz. */
export function aufzaehlen(teile) {
  const gefuellt = teile.filter(Boolean);
  if (gefuellt.length < 2) return gefuellt.join('');
  return `${gefuellt.slice(0, -1).join(', ')} und ${gefuellt.at(-1)}`;
}

/** „3“ – oder „3 + Münzen“, wenn in der Kiste auch etwas klimpert. */
export function menge(umfang, art) {
  const zahl = umfang[art] ?? 0;
  if (art !== 'beute') return String(zahl);
  const klimpert = !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
  if (!klimpert) return String(zahl);
  return zahl ? `${zahl} + Münzen` : 'nur Münzen';
}
