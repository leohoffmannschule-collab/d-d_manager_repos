/**
 * Zeilen in Objekte – und die kleinen Fragen, die jeder Weg des Kampfes
 * stellt.
 *
 * Die Datenbank kennt `max_hp`, der Almanach kennt `maxHp`; hier wird das
 * eine ins andere übersetzt. Dazu die beiden Rechnungen, die mehr als einmal
 * gebraucht werden: die Reihenfolge der Kämpfer und der Zustand eines
 * Kämpfers, wenn die Runde seine Trefferpunkte nicht sehen darf.
 */
import { db, getState } from '../db.js';

/** Die drei Arten von Kämpfern: Held, NSC, Monster. */
export const TYPEN = new Set(['pc', 'npc', 'monster']);

/** Runde und wer dran ist – das steht im kleinen Schlüssel-Wert-Speicher. */
export function meta(campaignId) {
  return getState('kampf', campaignId, { round: 1, activeCombatantId: null });
}

export function rowToCombatant(row) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    initiative: row.initiative,
    hp: row.hp,
    maxHp: row.max_hp,
    ac: row.ac,
    conditions: JSON.parse(row.conditions),
    notes: row.notes,
    characterId: row.character_id,
    mediaId: row.media_id,
    hidden: !!row.hidden,
  };
}

/** Nach Initiative absteigend, bei Gleichstand alphabetisch. */
export function alleKaempfer(campaignId) {
  return db
    .prepare('SELECT * FROM combatants WHERE campaign_id = ? ORDER BY initiative DESC, name COLLATE NOCASE')
    .all(campaignId)
    .map(rowToCombatant);
}

/**
 * Wie es um einen Kämpfer steht, ohne seine Trefferpunkte zu verraten.
 *
 * Zurück kommt ein unveränderlicher Schlüssel, kein fertiger Satz. Wie er
 * genannt wird, entscheidet die Oberfläche; der Server legt sich nicht auf
 * eine Sprache fest.
 */
export function zustand(hp, maxHp) {
  if (!maxHp || hp <= 0) return hp <= 0 ? 'kampfunfaehig' : 'unversehrt';
  const anteil = hp / maxHp;
  if (anteil >= 1) return 'unversehrt';
  if (anteil > 0.66) return 'leicht_verletzt';
  if (anteil > 0.33) return 'verwundet';
  return 'schwer_verwundet';
}

/** Einen einzelnen Kämpfer holen – aber nur aus der eigenen Kampagne. */
export const holen = (id, campaignId) => db.prepare('SELECT * FROM combatants WHERE id = ? AND campaign_id = ?').get(id, campaignId);
