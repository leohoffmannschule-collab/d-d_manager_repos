/**
 * Abschnitte des ausgeführten Blattes: die Zahlen, auf die man am Tisch
 * schaut – Attribute, Rettungswürfe, Sinne und Fertigkeiten.
 *
 * Gerechnet wird in lib/regeln/ (über lib/dnd5e.js); hier steht nur, wie
 * das Ergebnis auf dem Papier aussieht.
 */
import {
  ABILITIES,
  PASSIVE_FERTIGKEITEN,
  SKILLS,
  abilityModifier,
  formatModifier,
  passiverWert,
  weiteMitEinheit,
} from '../../dnd5e.js';
import { KURZ, esc, escAbsatz, feld } from '../werkzeug.js';

/** Die sechs Attributkästen: Wert groß, Modifikator darunter. */
export function attribute(data) {
  const kaesten = ABILITIES.map((a) => {
    const wert = data.abilities[a.key];
    return `<div class="attribut">
      <span class="label">${esc(a.label)}</span>
      <span class="zahl">${esc(wert)}</span>
      <span class="mod">${esc(formatModifier(abilityModifier(wert)))}</span>
    </div>`;
  }).join('');
  return `<div class="attribute">${kaesten}</div>`;
}

/** Die Liste der Rettungswürfe; geübte sind hervorgehoben und tragen den Übungsbonus `pb`. */
export function rettungswuerfe(data, pb) {
  const reihen = ABILITIES.map((a) => {
    const geuebt = data.savingThrows[a.key];
    const mod = abilityModifier(data.abilities[a.key]) + (geuebt ? pb : 0);
    return `<li${geuebt ? ' class="geuebt"' : ''}><span>${esc(a.label)}</span><b>${esc(formatModifier(mod))}</b></li>`;
  }).join('');
  const vermerk = data.savingThrowNote
    ? `<p class="hinweis"><i>Vermerk:</i> ${escAbsatz(data.savingThrowNote)}</p>`
    : '';
  return `<ul class="werteliste">${reihen}</ul>${vermerk}`;
}

/** Die drei passiven Werte und alles, was auch ohne Licht wahrgenommen wird. */
export function sinne(data) {
  const passive = PASSIVE_FERTIGKEITEN.map((f) => feld(f.label, passiverWert(data, f.key))).join('');
  const weiten = [
    ['Sichtweite', 'sight'],
    ['Dunkelsicht', 'darkvision'],
    ['Blindsicht', 'blindsight'],
    ['Erschütterungssinn', 'tremorsense'],
    ['Wahrer Blick', 'truesight'],
  ]
    .filter(([, key]) => Number(data.combat.senses?.[key]) > 0)
    .map(([label, key]) => feld(label, weiteMitEinheit(data.combat.senses[key], data.units)))
    .join('');
  const weitere = data.combat.senses?.notes ? feld('Weitere Sinne', data.combat.senses.notes) : '';
  return `<div class="raster">${passive}${weiten}${weitere}</div>`;
}

/** Die Liste der Fertigkeiten mit ihrem Bonus: ● geübt, ●● Expertise (doppelter Übungsbonus). */
export function fertigkeiten(data, pb) {
  const reihen = SKILLS.map((s) => {
    const stand = data.skills[s.key] ?? { proficient: false, expertise: false };
    const bonus = (stand.expertise ? 2 : stand.proficient ? 1 : 0) * pb;
    const mod = abilityModifier(data.abilities[s.ability]) + bonus;
    const marke = stand.expertise ? ' ●●' : stand.proficient ? ' ●' : '';
    return `<li${stand.proficient ? ' class="geuebt"' : ''}><span>${esc(s.label)} <i>(${KURZ[s.ability]})</i>${marke}</span><b>${esc(
      formatModifier(mod)
    )}</b></li>`;
  }).join('');
  return `<ul class="werteliste zweispaltig">${reihen}</ul>`;
}
