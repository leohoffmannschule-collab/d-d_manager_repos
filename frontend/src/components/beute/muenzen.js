/**
 * Die fünf Münzsorten der Beutekiste, von der wertvollsten zur kleinsten –
 * und wie ein Münzhaufen in Worten klingt („14 Gold, 2 Silber“).
 *
 * Die Reihenfolge ist die, in der auch der Server teilt (backend/src/beute.js):
 * von oben nach unten, Unteilbares wird eine Stufe tiefer gewechselt.
 */

/** Die Münzsorten als [Schlüssel, Name], von der wertvollsten zur kleinsten. */
export const MUENZEN = [
  ['pp', 'Platin'],
  ['gp', 'Gold'],
  ['ep', 'Elektrum'],
  ['sp', 'Silber'],
  ['cp', 'Kupfer'],
];

/** Ein Münzhaufen in Worten: „14 Gold, 2 Silber“ – oder „nichts“. */
export const inWorten = (muenzen) =>
  MUENZEN.filter(([k]) => muenzen?.[k]).map(([k, label]) => `${muenzen[k]} ${label}`).join(', ') || 'nichts';
