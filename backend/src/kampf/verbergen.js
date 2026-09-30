/**
 * Kämpfer und Figur zeigen sich gemeinsam – oder gar nicht.
 *
 * Ein Gegner steht an zwei Stellen: als Zeile in der Kampfliste und als
 * Figur auf der Karte (verbunden über `tokens.combatant_id`). Früher hatte
 * jede Stelle ihren eigenen Schalter „verborgen“. Wer den Hinterhalt
 * auslöste, musste beide umlegen – und vergaß er einen, stand der Gegner
 * entweder unsichtbar auf der Karte, aber schon in der Initiative, oder
 * sichtbar auf der Karte, obwohl die Kampfliste ihn noch verschwieg. Beides
 * verrät am Tisch mehr, als es soll.
 *
 * Jetzt gilt: Wer eine der beiden Seiten verbirgt oder aufdeckt, tut es für
 * beide. Die Wege rufen dafür `verbergeGemeinsam` und verschicken danach,
 * was sich geändert hat.
 */
import { db } from '../db.js';

/**
 * Setzt „verborgen“ für einen Kämpfer und alle Figuren, die an ihm hängen.
 *
 * Schreibt mehr als eine Zeile – wer das aufruft, tut es innerhalb von
 * `transaktion()`, zusammen mit der Änderung, die den Anstoß gab. Nur Zeilen
 * dieser Kampagne werden angefasst, auch wenn die Kennung von woanders käme.
 *
 * @param {string} combatantId
 * @param {boolean|number} verborgen
 * @param {string} campaignId
 * @returns {{ figuren: number }} wie viele Figuren sich dabei geändert haben
 */
export function verbergeGemeinsam(combatantId, verborgen, campaignId) {
  const wert = verborgen ? 1 : 0;
  db.prepare('UPDATE combatants SET hidden = ? WHERE id = ? AND campaign_id = ?').run(wert, combatantId, campaignId);
  const figuren = db
    .prepare(
      `UPDATE tokens SET hidden = ?
        WHERE combatant_id = ? AND hidden != ?
          AND scene_id IN (SELECT id FROM scenes WHERE campaign_id = ?)`
    )
    .run(wert, combatantId, wert, campaignId);
  return { figuren: Number(figuren.changes) };
}
