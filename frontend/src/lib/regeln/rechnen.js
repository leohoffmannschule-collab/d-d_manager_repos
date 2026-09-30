/**
 * Was das Regelwerk ausrechnen lässt.
 *
 * Jede dieser Funktionen steht für genau eine Regel aus dem
 * Spielerhandbuch – und jede steht **nur hier**. Das ist der Grund für die
 * eigene Datei: Der Übungsbonus taucht am Rettungswurf auf, an jeder
 * Fertigkeit, am Zauber-Schwierigkeitsgrad und am Zauberangriff. Stünde er
 * viermal da, wäre er beim nächsten Regelupdate dreimal richtig.
 *
 * Die Zahlen dahinter, kurz:
 *   Modifikator     = (Wert − 10) / 2, abgerundet
 *   Übungsbonus     = +2 ab Stufe 1, je vier Stufen einer mehr
 *   Passiver Wert   = 10 + Modifikator (ohne Würfel)
 *   Zauber-SG       = 8 + Übungsbonus + Modifikator
 *   Traglast        = Stärke × 15 Pfund
 */
import { SKILLS } from './listen.js';

/** Tragkraft nach den Grundregeln: Stärke mal 15 Pfund. */
export function carryingCapacity(strength) {
  return (Number(strength) || 0) * 15;
}

/**
 * Die drei Marken, die auf dem gedruckten Blatt stehen – alles in Pfund.
 * `ueberladen` ist zugleich die Tragkraft: Wer mehr schleppt, kommt nicht
 * mehr voran. Heben, schieben und ziehen geht doppelt so schwer.
 */
export function traglastStufen(strength) {
  const tragkraft = carryingCapacity(strength);
  return { ueberladen: tragkraft, schieben: tragkraft * 2 };
}

/** Was ein Rucksack voller Gegenstände wiegt, in Pfund. */
export function getragenesGewicht(inventory) {
  return (inventory ?? []).reduce((summe, g) => summe + (Number(g.weight) || 0) * (Number(g.qty) || 1), 0);
}

/** Der Modifikator eines Attributwerts: (Wert − 10) / 2, abgerundet. Unlesbares zählt als 0. */
export function abilityModifier(score) {
  const value = Number(score);
  if (Number.isNaN(value)) return 0;
  return Math.floor((value - 10) / 2);
}

/** Ein Modifikator mit Vorzeichen, wie er auf dem Blatt steht: „+3“, „−1“, „+0“. */
export function formatModifier(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/** Der Übungsbonus einer Stufe: +2 auf Stufe 1–4, +3 auf 5–8 … bis +6 auf 17–20. */
export function proficiencyBonus(level) {
  const lvl = Number(level) || 1;
  return Math.floor((lvl - 1) / 4) + 2;
}

/** Der Wurfbonus einer Fertigkeit, Übung und Expertise eingerechnet. */
export function skillModifier(data, skillKey) {
  const fertigkeit = SKILLS.find((s) => s.key === skillKey);
  if (!fertigkeit) return 0;
  const stand = data.skills?.[skillKey] ?? { proficient: false, expertise: false };
  const pb = proficiencyBonus(data.level);
  const bonus = (stand.expertise ? 2 : stand.proficient ? 1 : 0) * pb;
  return abilityModifier(data.abilities?.[fertigkeit.ability]) + bonus;
}

/** Der passive Wert einer Fertigkeit: zehn plus ihr Bonus. */
export function passiverWert(data, skillKey) {
  return 10 + skillModifier(data, skillKey);
}

/** Der Rettungswurfbonus eines Attributs. */
export function saveModifier(data, abilityKey) {
  return (
    abilityModifier(data.abilities?.[abilityKey]) +
    (data.savingThrows?.[abilityKey] ? proficiencyBonus(data.level) : 0)
  );
}

/** Zaubererschwerungsgrad und Zauberangriffsbonus. */
export function spellSaveDC(abilityScore, level) {
  return 8 + proficiencyBonus(level) + abilityModifier(abilityScore);
}

/** Der Zauberangriffsbonus: Übungsbonus plus Modifikator des Zauberattributs. */
export function spellAttackBonus(abilityScore, level) {
  return proficiencyBonus(level) + abilityModifier(abilityScore);
}

/** Ein von Hand eingetragener Wert – oder null, wenn gerechnet werden soll. */
const vonHand = (wert) => (wert === null || wert === undefined || wert === '' || !Number.isFinite(Number(wert)) ? null : Number(wert));

/**
 * Zauber-SG und Angriffsbonus eines Blattes, wie sie gelten.
 *
 * Gerechnet wird nach den Regeln aus Stufe und Zauberattribut. Manches
 * verschiebt das aber – ein Stab des Zauberers (+2 auf Angriff und SG), ein
 * Hexenmeister-Pakt, eine Hausregel –, und dafür gibt es die Felder „von
 * Hand“ (`manualSaveDC`, `manualAttackBonus`). Ist eines gesetzt, gilt es;
 * sonst die Rechnung. Zurück kommen beide Fassungen, damit die Oberfläche
 * die gerechnete als Vorschlag zeigen kann.
 *
 * Reiter und Blattausfuhr rufen dieselbe Funktion – so kann ein
 * mitgenommenes Blatt nicht mit einer anderen Zahl dastehen als das im
 * Almanach.
 */
export function zauberwerte(data) {
  const z = data.spellcasting ?? {};
  const attribut = data.abilities?.[z.ability];
  const berechneterSg = spellSaveDC(attribut, data.level);
  const berechneterBonus = spellAttackBonus(attribut, data.level);
  const sgVonHand = vonHand(z.manualSaveDC);
  const bonusVonHand = vonHand(z.manualAttackBonus);
  return {
    sg: sgVonHand ?? berechneterSg,
    bonus: bonusVonHand ?? berechneterBonus,
    berechneterSg,
    berechneterBonus,
    sgVonHand,
    bonusVonHand,
  };
}
