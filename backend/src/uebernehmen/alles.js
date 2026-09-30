/**
 * Alles Gewählte auf einmal kopieren – und der Zielkampagne Bescheid geben.
 */
import { transaktion } from '../db.js';
import { broadcast } from '../events.js';
import { kiste } from '../beute.js';
import { ARTEN } from './arten.js';

/**
 * Alles Gewählte aus einer Kampagne in eine andere.
 *
 * Die Reihenfolge gibt ARTEN vor, nicht der Aufrufer – sie ist keine
 * Geschmacksfrage, sondern hält die Verweise heil.
 *
 * Ganz oder gar nicht: Eine halb kopierte Kampagne – Charaktere da, Szenen
 * nicht – wäre schwerer zu beheben als ein klarer Fehlschlag.
 */
export function uebernimmAlles(von, ziel, arten) {
  const gewaehlt = Object.keys(ARTEN).filter((art) => arten.includes(art));
  return transaktion(() => {
    const bericht = {};
    for (const art of gewaehlt) {
      const eintrag = ARTEN[art];
      const stuecke = eintrag.alle(von);
      for (const row of stuecke) eintrag.kopiere(row, ziel);
      bericht[art] = stuecke.length;
      if (eintrag.dazu) bericht.muenzen = eintrag.dazu(von, ziel);
    }
    return bericht;
  });
}

/**
 * Wer drüben gerade ein Fenster offen hat, soll nicht erst neu laden müssen.
 *
 * Szenen fehlen hier mit Absicht: Was auf dem Tisch liegt, hängt an der
 * Sicht des Einzelnen und wird von spieltisch/melden.js verschickt.
 */
export function meldeNachZiel(art, ziel) {
  if (art === 'notizen') broadcast('notizen:aktualisiert', {}, { campaignId: ziel });
  if (art === 'beute') broadcast('beute', kiste(ziel), { campaignId: ziel });
}
