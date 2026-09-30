/**
 * Abschnitt des ausgeführten Blattes: die Habe – Münzen, Gegenstände,
 * Gewicht und Traglast.
 */
import {
  getragenesGewicht,
  gewichtAnzeigen,
  gewichtEinheit,
  gewichtMitEinheit,
  traglastStufen,
} from '../../dnd5e.js';
import { MUENZEN, esc, feld, zeilen } from '../werkzeug.js';

export function inventar(data) {
  const getragen = getragenesGewicht(data.inventory);
  const { ueberladen, schieben } = traglastStufen(data.abilities.str);
  const einheit = gewichtEinheit(data.units);
  const muenzen = MUENZEN.filter(([k]) => data.currency[k])
    .map(([k, label]) => `${data.currency[k]} ${label}`)
    .join(' · ');
  const eingestimmt = (data.attunement ?? []).filter(Boolean);

  return `${muenzen ? feld('Münzen', muenzen) : ''}
    ${zeilen(
      ['Gegenstand', 'Anzahl', `Gewicht (${einheit})`, 'Anmerkungen'],
      data.inventory.map((g) => [
        esc(g.name),
        esc(g.qty),
        esc(g.weight ? gewichtAnzeigen(g.weight, data.units) : ''),
        esc(g.notes),
      ])
    )}
    ${
      data.inventory.length
        ? `<div class="raster schmal">
            ${feld('Getragenes Gewicht', gewichtMitEinheit(getragen, data.units))}
            ${feld('Überladen ab', gewichtMitEinheit(ueberladen, data.units))}
            ${feld('Schieben / Ziehen / Heben', gewichtMitEinheit(schieben, data.units))}
          </div>`
        : ''
    }
    ${eingestimmt.length ? feld('Angelegte magische Gegenstände', eingestimmt.join(', ')) : ''}`;
}
