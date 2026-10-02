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
import { MUENZEN, feld, feldHtml, marke, zeilen, zelle } from '../werkzeug.js';

/** Die Tafel „Habe“: Münzen, Gegenstände mit Gewicht, getragene Last gegen die Traglast. */
export function inventar(data) {
  const getragen = getragenesGewicht(data.inventory);
  const { ueberladen, schieben } = traglastStufen(data.abilities.str);
  const einheit = gewichtEinheit(data.units);
  const muenzen = MUENZEN.filter(([k]) => data.currency[k])
    .map(([k, label]) => `${marke(`currency.${k}`, data.currency[k])} ${label}`)
    .join(' · ');
  // Die Stelle in der Liste bleibt erhalten – sie ist der Pfad (attunement.0 bis .2).
  const eingestimmt = (data.attunement ?? [])
    .map((name, i) => (name ? marke(`attunement.${i}`, name) : ''))
    .filter(Boolean);

  return `${muenzen ? feldHtml('Münzen', muenzen) : ''}
    ${zeilen(
      ['Gegenstand', 'Anzahl', `Gewicht (${einheit})`, 'Anmerkungen'],
      data.inventory.map((g) => {
        const gewicht = g.weight ? String(gewichtAnzeigen(g.weight, data.units)) : '';
        return [
          zelle('inventory', g, 'name'),
          zelle('inventory', g, 'qty'),
          g.id ? marke(`inventory.#${g.id}.weight`, gewicht, gewicht) : gewicht,
          zelle('inventory', g, 'notes'),
        ];
      })
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
    ${eingestimmt.length ? feldHtml('Angelegte magische Gegenstände', eingestimmt.join(', ')) : ''}`;
}
