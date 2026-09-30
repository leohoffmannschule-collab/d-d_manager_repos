/**
 * Die Initiative der Gegner: ein W20 plus ihr Bonus.
 *
 * Nach den Regeln würfelt jedes Wesen seine Initiative als W20 plus seinen
 * Geschicklichkeitsmodifikator. Lange würfelte der Almanach für Gegner aus
 * Bestiarium und Begegnungen einen nackten W20 – ein flinker Assassine
 * (GE 18, +4) ging so im Schnitt vier Plätze später in den Kampf als nach
 * dem Regelwerk, ein träger Oger (GE 8, −1) einen früher.
 *
 * Deshalb trägt jeder Kämpfer jetzt seinen Bonus (`combatants.initiative_bonus`).
 * Er kommt aus der Geschicklichkeit des Statblocks, wandert mit in
 * vorbereitete Begegnungen und wird bei jedem Wurf hinzugezählt – auch
 * später, wenn die Spielleitung „Initiative würfeln“ drückt.
 *
 * Helden würfeln selbst (am Blatt steht ihr eigener Bonus); ihr Wert hier
 * bleibt 0.
 */
import { db } from '../db.js';
import { rollD20 } from '../dice.js';
import { clamp, toNumber } from '../werte.js';

/** Der Modifikator zu einem Attributswert: 10–11 → 0, 18 → +4, 8 → −1. Ohne Wert 0. */
export function bonusAusGeschick(geschick) {
  if (geschick == null || geschick === '') return 0;
  const wert = Number(geschick);
  return Number.isFinite(wert) ? Math.floor((wert - 10) / 2) : 0;
}

/**
 * Ein Bonus, wie er aus einer Anfrage kommt – als ganze Zahl in vernünftigen
 * Grenzen. Selbst ein Drache kommt selten über +10; −5 bis +20 lässt Raum
 * für Hausregeln, ohne dass ein Tippfehler den Kampf auf den Kopf stellt.
 */
export const saubererBonus = (wert, vorgabe = 0) => clamp(Math.trunc(toNumber(wert, vorgabe)), -5, 20);

/**
 * Der Bonus aus dem Statblock eines Bestiariumseintrags – für Begegnungen,
 * deren Posten vor dieser Änderung gespeichert wurden und ihn noch nicht
 * selbst tragen. Gibt es den Eintrag nicht mehr, ist er 0.
 */
export function bonusAusBestiarium(libraryId) {
  if (!libraryId) return 0;
  const row = db.prepare('SELECT stats FROM library WHERE id = ?').get(libraryId);
  if (!row) return 0;
  try {
    return bonusAusGeschick(JSON.parse(row.stats)?.dex);
  } catch {
    return 0;
  }
}

/** Ein Initiativewurf: W20 plus Bonus. */
export const initiativeWurf = (bonus = 0) => rollD20() + (Number(bonus) || 0);
