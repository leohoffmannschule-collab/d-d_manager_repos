/**
 * Die Beutekiste einer Kampagne: was darin liegt, und wie man es teilt.
 *
 * Zwei Arten Inhalt, zwei Arten Ablage: Gegenstände sind Zeilen in
 * `stash_items`, die Münzen dagegen ein einzelner Stand im
 * Schlüssel-Wert-Speicher (`beute`). Wer „die Kiste“ braucht – der Weg
 * routes/stash.js, das Kopieren in eine andere Kampagne in uebernehmen.js –,
 * holt sie hier, damit beide dasselbe unter „Kiste“ verstehen.
 *
 * Die Rechnung des Teilens steht ebenfalls hier und nicht im Weg: Sie ist
 * reine Arithmetik ohne Datenbank und damit das, was man als Erstes
 * nachprüfen will, wenn am Tisch jemand fragt, wo sein Kupferstück blieb.
 */
import { db, getState } from './db.js';
import { toNumber } from './werte.js';

/** Die Münzsorten, von der größten zur kleinsten. */
export const MUENZEN = ['pp', 'gp', 'ep', 'sp', 'cp'];
export const KEINE_MUENZEN = Object.freeze({ pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 });
export const MUENZNAME = { pp: 'Platin', gp: 'Gold', ep: 'Elektrum', sp: 'Silber', cp: 'Kupfer' };

// Der übliche Umrechnungskurs: alles in Kupfer, dann wieder hinauf.
const KURS = { pp: 1000, gp: 100, ep: 50, sp: 10, cp: 1 };

/* --- Was in der Kiste liegt ---------------------------------------------- */

export function rowToItem(row) {
  return {
    id: row.id,
    name: row.name,
    qty: row.qty,
    weight: row.weight,
    notes: row.notes,
    holderId: row.holder_id,
    createdAt: row.created_at,
  };
}

/** Die Münzen, immer mit allen fünf Sorten – auch wenn nie etwas hineinkam. */
export const muenzen = (campaignId) => ({ ...KEINE_MUENZEN, ...getState('beute', campaignId, null) });

export const gegenstaende = (campaignId) =>
  db.prepare('SELECT * FROM stash_items WHERE campaign_id = ? ORDER BY created_at').all(campaignId).map(rowToItem);

/** Die ganze Kiste, so wie sie über den Live-Kanal und `GET /api/stash` geht. */
export const kiste = (campaignId) => ({ items: gegenstaende(campaignId), coins: muenzen(campaignId) });

/* --- Rechnen ------------------------------------------------------------- */

/** Eine Münzsorte als Zahl – kaputte oder fehlende Werte zählen als nichts. */
const anzahl = (vorrat, sorte) => toNumber(vorrat?.[sorte], 0);

export const inKupfer = (vorrat) => MUENZEN.reduce((summe, m) => summe + anzahl(vorrat, m) * KURS[m], 0);

/**
 * Kupfer wieder in Münzen fassen – ohne Elektrum, das am Tisch ohnehin
 * niemand haben will.
 */
export function ausKupfer(kupfer) {
  let rest = Math.max(0, Math.floor(kupfer));
  const heraus = { ...KEINE_MUENZEN };
  for (const m of ['pp', 'gp', 'sp', 'cp']) {
    heraus[m] = Math.floor(rest / KURS[m]);
    rest -= heraus[m] * KURS[m];
  }
  return heraus;
}

/**
 * Beute teilen, so wie es am Tisch wirklich zugeht.
 *
 * Es wird von der größten Münze zur kleinsten gegangen. Was sich nicht glatt
 * aufteilen lässt, wird in kleinere Münzen gewechselt und weitergereicht –
 * niemals umgekehrt. Sonst bekäme jemand ein Platinstück ausgezahlt, das die
 * Runde nie besessen hat: Aus 43 Gold werden 14 Gold je Kopf und nicht
 * „1 Platin, 4 Gold“.
 *
 * Elektrum wird dabei nur angenommen, nie ausgegeben: Wer welches in der
 * Kiste hat, bekommt es in Silber gewechselt zurück. An kaum einem Tisch
 * will jemand Elektrumstücke gereicht bekommen.
 *
 * Am Ende bleibt höchstens eine Handvoll Kupfer übrig, die sich nicht mehr
 * teilen lässt. Wer die bekommt, ist eine Frage für den Tisch.
 *
 * @param {object} vorrat  Münzen je Sorte
 * @param {number} anteile wie viele Köpfe, mindestens 1
 * @returns {{ proKopf: object, rest: object, restInKupfer: number }}
 */
export function teile(vorrat, anteile) {
  const proKopf = { ...KEINE_MUENZEN };
  // Vorhandenes Elektrum wandert gleich in den Übertrag und kommt weiter
  // unten als Silber und Kupfer wieder heraus.
  let uebertrag = anzahl(vorrat, 'ep') * KURS.ep;

  for (const m of ['pp', 'gp', 'sp', 'cp']) {
    const vorhanden = anzahl(vorrat, m) * KURS[m] + uebertrag;
    const stuecke = Math.floor(vorhanden / KURS[m]);
    proKopf[m] = Math.floor(stuecke / anteile);
    uebertrag = vorhanden - proKopf[m] * anteile * KURS[m];
  }

  return { proKopf, rest: ausKupfer(uebertrag), restInKupfer: uebertrag };
}
