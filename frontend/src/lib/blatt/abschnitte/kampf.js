/**
 * Abschnitte des ausgeführten Blattes für den Kampf: Aktionen, Kampfwerte,
 * Zustand (Erschöpfung, Todesrettungswürfe) und begrenzte Ressourcen.
 */
import {
  EXHAUSTION_STEPS,
  abilityModifier,
  aktionArtLabel,
  formatModifier,
  weiteMitEinheit,
} from '../../dnd5e.js';
import { esc, escAbsatz, feld, zeilen } from '../werkzeug.js';

/** Was eine Aktion, Bonusaktion oder Reaktion kostet. */
export function aktionen(data) {
  const liste = (data.actions ?? []).filter((a) => a.name || a.description);
  if (liste.length === 0) return '';
  return zeilen(
    ['Was', 'Kostet', 'Wirkung'],
    liste.map((a) => [esc(a.name), esc(aktionArtLabel(a.art)), escAbsatz(a.description)])
  );
}

export function kampf(data) {
  const k = data.combat;
  const pool = k.hitDicePool ?? { size: 8, total: 1, used: 0 };
  const uebrig = Math.max(0, (pool.total || 0) - (pool.used || 0));
  const initiative = abilityModifier(data.abilities.dex) + (k.initiativeBonus || 0);
  const kreise = (anzahl) => '◯◯◯'.slice(0, 3 - anzahl).padStart(3, '●').split('').join(' ');

  return `<div class="raster">
      ${feld('Rüstungsklasse', k.armorClass)}
      ${feld('Initiative', formatModifier(initiative))}
      ${feld('Bewegung', weiteMitEinheit(k.speed, data.units))}
      ${feld('Trefferpunkte', `${k.hp.current} / ${k.hp.max}${k.hp.temp ? ` (+${k.hp.temp} temporär)` : ''}`)}
      ${feld('Trefferwürfel', `${uebrig} × W${pool.size} von ${pool.total}`)}
      <div class="feld breit"><span class="label">Rettungswürfe gegen den Tod</span><span class="wert">Erfolge ${kreise(
        k.deathSaves.successes
      )} &nbsp;·&nbsp; Fehlschläge ${kreise(k.deathSaves.failures)}</span></div>
    </div>`;
}

export function zustand(data) {
  const k = data.combat;
  const teile = [];
  if (k.conditions?.length) teile.push(feld('Zustände', k.conditions.join(', ')));
  if (k.exhaustion) teile.push(feld('Erschöpfung', `Stufe ${k.exhaustion} – ${EXHAUSTION_STEPS[k.exhaustion]}`));
  if (k.concentration?.active) teile.push(feld('Konzentration', k.concentration.spell || 'ja'));
  if (data.inspiration) teile.push(feld('Inspiration', 'vorhanden'));
  if (k.defenses?.resistances) teile.push(feld('Resistenzen', k.defenses.resistances));
  if (k.defenses?.immunities) teile.push(feld('Immunitäten', k.defenses.immunities));
  if (k.defenses?.vulnerabilities) teile.push(feld('Verwundbarkeiten', k.defenses.vulnerabilities));
  return teile.length ? `<div class="raster">${teile.join('')}</div>` : '';
}

export function ressourcen(data) {
  const liste = (data.resources ?? []).filter((r) => r.name);
  const teile = [];
  if (liste.length) {
    teile.push(
      zeilen(
        ['Ressource', 'Übrig', 'Erneuert sich'],
        liste.map((r) => [
          esc(r.name),
          `${esc(r.current)} / ${esc(r.max)}`,
          esc(r.recharge === 'kurz' ? 'kurze Rast' : r.recharge === 'lang' ? 'lange Rast' : 'von Hand'),
        ])
      )
    );
  }
  return teile.join('');
}
