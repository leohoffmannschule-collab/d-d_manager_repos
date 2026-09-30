/**
 * Die festen Listen der Kampfliste: Zustände, Farben und Namen der Arten.
 *
 * Eigene Datei, weil drei Bauteile sie brauchen (Zeile, Zustandswahl, das
 * Formular für neue Kämpfer) und keines von ihnen der natürliche Besitzer ist.
 */

// Die Zustände aus dem Regelwerk. Sie stehen auch in lib/dnd5e.js – dort
// fürs Charakterblatt, hier für die Kampfliste. Doppelt, weil beide Listen
// unabhängig wachsen dürfen: Im Kampf kommt „Erschöpft“ dazu, das auf dem
// Blatt eine eigene Stufenleiste hat.
export const ZUSTAENDE = [
  'Bezaubert',
  'Betäubt',
  'Blind',
  'Bewusstlos',
  'Erschöpft',
  'Festgesetzt',
  'Gelähmt',
  'Gepackt',
  'Handlungsunfähig',
  'Liegend',
  'Taub',
  'Verängstigt',
  'Vergiftet',
  'Versteinert',
  'Unsichtbar',
];

// Der farbige Rand links an jeder Zeile – dieselben Farben wie die Figuren,
// die aus dem Kampf auf den Tisch gelegt werden (siehe stile/farben.css).
export const TYP_FARBE = {
  pc: 'border-l-[var(--art-held)]',
  npc: 'border-l-[var(--art-nsc)]',
  monster: 'border-l-rubric',
};

/** Wie die Art eines Kämpfers unter seinem Namen heißt. */
export const TYP_NAME = { pc: 'Held', npc: 'NSC', monster: 'Monster' };
