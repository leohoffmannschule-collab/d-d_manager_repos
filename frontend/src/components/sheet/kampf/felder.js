/**
 * Die Spalten der wiederkehrenden Zeilen auf dem Kampfreiter.
 *
 * Reine Beschreibung, kein Verhalten: Welche Felder hat ein Angriff, eine
 * Aktion, und wann frischt eine Ressource auf. RepeatingRows baut daraus
 * die Eingabezeilen (siehe components/RepeatingRows.jsx).
 */
import { AKTION_ARTEN } from '../../../lib/dnd5e.js';

/** Die Spalten einer Angriffszeile: Name, Bonus, Schaden, Anmerkungen. */
export const ATTACK_FIELDS = [
  { key: 'name', label: 'Angriff / Zauber', wide: true },
  { key: 'bonus', label: 'Bonus' },
  { key: 'damage', label: 'Schaden / Art' },
  { key: 'notes', label: 'Anmerkungen', wide: true },
];

/** Die Felder einer eigenen Aktion: was, was sie kostet (Aktion, Bonusaktion …), was sie bewirkt. */
export const AKTION_FIELDS = [
  { key: 'name', label: 'Was', wide: true },
  { key: 'art', label: 'Kostet', type: 'select', options: AKTION_ARTEN },
  { key: 'description', label: 'Wirkung', type: 'textarea', wide: true },
];

/** Wann eine Ressource zurückkommt – nach kurzer oder langer Rast oder nur von Hand (siehe lib/rasten.js). */
export const AUFFRISCHUNG = [
  ['kurz', 'kurze Rast'],
  ['lang', 'lange Rast'],
  ['keine', 'von Hand'],
];
