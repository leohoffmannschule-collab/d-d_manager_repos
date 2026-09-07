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
 * Legt die Vorlagen an, sofern das noch nie geschehen ist.
 *
 * Ohne Besitzer: Blätter ohne `owner_id` gehören der Spielleitung – so steht
 * es schon in der Charakterverwaltung. Das ist hier gerade recht, denn beim
 * allerersten Start gibt es noch gar kein Konto, dem man sie zuschreiben
 * könnte.
 */
export function saeVorlagen({ erzwingen = false } = {}) {
  if (!erzwingen && getState(SCHLUESSEL)) return { gesaet: 0, schonGesaet: true };

  const jetzt = new Date().toISOString();
  const einfuegen = db.prepare(
    `INSERT OR IGNORE INTO characters (id, name, system, data, owner_id, shared, npc, created_at, updated_at)
     VALUES (?, ?, 'dnd5e', ?, NULL, 0, 1, ?, ?)`
  );

  let gesaet = 0;
  for (const vorlage of VORLAGEN) {
    const { changes } = einfuegen.run(vorlage.id, vorlage.name, JSON.stringify(vorlage.data), jetzt, jetzt);
    if (changes) gesaet += 1;
  }

  setState(SCHLUESSEL, jetzt);
  return { gesaet, schonGesaet: false };
}
