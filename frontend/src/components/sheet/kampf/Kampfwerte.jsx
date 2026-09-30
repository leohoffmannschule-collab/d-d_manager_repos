/**
 * Rüstungsklasse, Initiative, Bewegung, Trefferwürfel – und der Knopf, der
 * die Initiative gleich würfelt.
 *
 * Die *Initiative gesamt* unten ist gerechnet, nicht eingetragen:
 * Geschicklichkeitsmodifikator plus der Bonus darüber. Der Knopf daneben
 * würfelt sie für alle sichtbar (lib/wuerfeln.js) – in die Kampfliste
 * trägt sie sich aber erst über „Eigene Initiative würfeln“ in der
 * Kampfliste selbst ein (components/Initiative.jsx). Hier weiß das Blatt
 * nicht, ob gerade gekämpft wird.
 */
import { abilityModifier, formatModifier } from '../../../lib/dnd5e.js';
import { Card, NumberField, TextField, Toggle, WeiteField } from '../../ui.jsx';
import Wurfknopf from './Wurfknopf.jsx';

export default function Kampfwerte({ data, update }) {
  const initiative = abilityModifier(data.abilities.dex) + (data.combat.initiativeBonus || 0);

  return (
  <Card title="Kampfwerte">
    <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
      <NumberField
        label="Rüstungsklasse"
        value={data.combat.armorClass}
        onChange={(v) => update('combat.armorClass', v)}
      />
      <NumberField
        label="Initiative-Bonus"
        value={data.combat.initiativeBonus}
        onChange={(v) => update('combat.initiativeBonus', v)}
      />
      <WeiteField
        label="Bewegung"
        fuss={data.combat.speed}
        units={data.units}
        onChange={(v) => update('combat.speed', v)}
      />
      <TextField label="Trefferwürfel" value={data.combat.hitDice} onChange={(v) => update('combat.hitDice', v)} />
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-rule pt-3">
      <span className="text-sepia italic">Initiative gesamt</span>
      <Wurfknopf name="Initiative" label={formatModifier(initiative)} modifier={initiative} />
      <Toggle
        checked={!!data.inspiration}
        onChange={(v) => update('inspiration', v)}
        label={<span className="text-ink">Inspiration</span>}
      />
    </div>
  </Card>
  );
}
