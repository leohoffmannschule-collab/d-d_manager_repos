import { db, getState, setState } from '../db.js';
import { blattAus } from './bauen.js';
import { HELDEN } from './helden.js';

/**
 * Die Vorlagen säen.
 *
 * Ein frischer Almanach ist leer, und ein leerer Almanach ist schwer zu
 * beurteilen: Man sieht nicht, was ein Blatt alles trägt, bevor man selbst
 * eines ausgefüllt hat. Deshalb liegen von Anfang an zwölf fertige Charaktere
 * hinter dem Schirm – einer je Klasse, einer je Spezies.
 *
 * Sie liegen als **NSC-Blätter**: Die Spielleitung sieht sie, die Runde nicht.
 * Wer eine Vorlage übernehmen will, macht eine Abschrift davon (*Abschrift*
 * auf der Übersicht), trägt sich als Besitzerin ein und nimmt sie damit vom
 * Schirm auf den Tisch. Die Vorlage selbst bleibt liegen.
 *
 * Gesät wird **genau einmal**. Wer eine Vorlage löscht, hat sie gelöscht – sie
 * wächst beim nächsten Start nicht nach. Wer sie zurückhaben will, ruft
 * `npm run vorlagen` auf.
 */

const SCHLUESSEL = 'vorlagen:gesaet';

/** Die zwölf Vorlagen, fertig als Charakterblatt. */
export const VORLAGEN = HELDEN.map((held) => ({
  id: `vorlage-${held.schluessel}`,
  name: held.name,
  klasse: held.klasse,
  spezies: held.spezies,
  data: blattAus(held),
}));

/**
 * Legt die Vorlagen in einer Kampagne an, sofern das dort noch nie geschehen
 * ist. Eine Kampagne ist die neue „frische Installation“: Jede neu
 * angelegte Kampagne bekommt ihre eigenen zwölf Vorlagen, unabhängig davon,
 * was in anderen Kampagnen liegt oder schon gelöscht wurde.
 *
 * Ohne Besitzer: Blätter ohne `owner_id` gehören der Spielleitung – so steht
 * es schon in der Charakterverwaltung. Das ist hier gerade recht, denn beim
 * Anlegen einer Kampagne steht noch nicht fest, wer darin später welchen
 * Charakter führt.
 */
export function saeVorlagen(campaignId, { erzwingen = false } = {}) {
  if (!erzwingen && getState(SCHLUESSEL, campaignId)) return { gesaet: 0, schonGesaet: true };

  const jetzt = new Date().toISOString();
  const einfuegen = db.prepare(
    `INSERT OR IGNORE INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, 'dnd5e', ?, NULL, 0, 1, ?, ?, ?)`
  );

  let gesaet = 0;
  for (const vorlage of VORLAGEN) {
    // Die Vorlagen-Kennung ist rundenweit fest verdrahtet; je Kampagne braucht
    // sie ihre eigene, sonst träfe „INSERT OR IGNORE“ eine fremde Kampagne.
    const id = `${vorlage.id}--${campaignId}`;
    const { changes } = einfuegen.run(id, vorlage.name, JSON.stringify(vorlage.data), campaignId, jetzt, jetzt);
    if (changes) gesaet += 1;
  }

  setState(SCHLUESSEL, campaignId, jetzt);
  return { gesaet, schonGesaet: false };
}
