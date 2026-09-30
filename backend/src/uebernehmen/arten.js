/**
 * Die Arten, die umziehen können – und in welcher Reihenfolge.
 *
 * Jede Art weiß, wie sie heißt, wie man alle ihre Stücke einer Kampagne
 * findet, wie ein einzelnes, und wie man es kopiert.
 */
import { db, getState } from '../db.js';
import { muenzen } from '../beute.js';
import { kopiereCharakter, kopiereGegenstand, kopiereMuenzen, kopiereNotiz, kopiereSzene } from './stuecke.js';

/**
 * Charaktere stehen mit Bedacht vorn: Figuren und getragene Gegenstände
 * suchen drüben ihren gleichnamigen Charakter, und den gibt es nur, wenn er
 * schon dort ist.
 */
export const ARTEN = {
  charaktere: {
    // `label` steht über der Liste, `eins` und `viele` stehen in Sätzen:
    // „1 Charakter“ liest sich, „1 Charaktere“ nicht.
    label: 'Charaktere',
    eins: 'Charakter',
    viele: 'Charaktere',
    // Unberührte Vorlagen bleiben hier: Jede Kampagne bringt dieselben zwölf
    // von selbst mit, und zwölf Abziehbilder daneben hülfen niemandem. Wer
    // eine Vorlage bearbeitet hat, hat daraus etwas Eigenes gemacht – das
    // kommt mit. Und wer eine einzelne ausdrücklich kopiert, bekommt sie
    // ohnehin: Diese Ausnahme gilt nur für „alles auf einmal“.
    alle: (von) =>
      db
        .prepare(
          `SELECT * FROM characters
            WHERE campaign_id = ?
              AND NOT (id LIKE 'vorlage-%--' || ? AND created_at = updated_at)
            ORDER BY created_at`
        )
        .all(von, von),
    einzeln: (id, von) => db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereCharakter,
  },
  notizen: {
    label: 'Notizen und Handzettel',
    eins: 'Notiz',
    viele: 'Notizen',
    alle: (von) => db.prepare('SELECT * FROM notes WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM notes WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereNotiz,
  },
  szenen: {
    label: 'Szenen mit Figuren',
    eins: 'Szene',
    viele: 'Szenen',
    alle: (von) => db.prepare('SELECT * FROM scenes WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM scenes WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereSzene,
  },
  beute: {
    label: 'Beutekiste',
    eins: 'Fundstück',
    viele: 'Fundstücke',
    alle: (von) => db.prepare('SELECT * FROM stash_items WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM stash_items WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereGegenstand,
    // Die Kiste ist mehr als ihre Gegenstände: Münzen liegen nicht als Zeile
    // in einer Tabelle, sondern als Stand am Tisch.
    dazu: kopiereMuenzen,
  },
};

/**
 * Ist das eine der Arten oben? `Object.hasOwn` und nicht `art in ARTEN`:
 * `in` fände auch „toString“ auf der Prototypkette.
 */
export const istArt = (art) => Object.hasOwn(ARTEN, art);

/** Was liegt in dieser Kampagne? Für die Frage „was nehme ich mit?“. */
export function umfang(campaignId) {
  const zahlen = {};
  for (const [art, eintrag] of Object.entries(ARTEN)) zahlen[art] = eintrag.alle(campaignId).length;
  // `null` statt einer leeren Börse: „nie etwas hineingelegt“ ist für die
  // Frage „was nehme ich mit?“ etwas anderes als „gerade leer“.
  const gelegt = getState('beute', campaignId, null);
  return { ...zahlen, muenzen: gelegt ? muenzen(campaignId) : null };
}
