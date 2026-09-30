/**
 * Die Karte „Zauberwirken“: Zauberattribut, Zauber-SG und Angriffsbonus.
 *
 * SG und Bonus werden im Reiter berechnet (SpellsTab) und hier nur
 * gezeigt – dieselben Zahlen braucht die Blattausfuhr, und dort rechnet
 * lib/blatt/ sie auf demselben Weg.
 */
import { ABILITIES, formatModifier } from '../../../lib/dnd5e.js';
import { Card, FieldLabel } from '../../ui.jsx';

export default function Zauberwirken({ ability, saveDC, attackBonus, onAbility }) {
  return (
    <Card title="Zauberwirken">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <FieldLabel>Zauberattribut</FieldLabel>
          <select
            value={ability}
            onChange={(e) => onAbility(e.target.value)}
            className="field-box"
          >
            {ABILITIES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <div className="border border-rule px-4 py-2">
          <p className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">Zauber-SG</p>
          <p className="font-display text-2xl font-bold text-rubric">{saveDC}</p>
        </div>
        <div className="border border-rule px-4 py-2">
          <p className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">Angriffsbonus</p>
          <p className="font-display text-2xl font-bold text-rubric">{formatModifier(attackBonus)}</p>
        </div>
      </div>
    </Card>
  );
}
