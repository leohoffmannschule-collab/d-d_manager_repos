import { abilityModifier, formatModifier } from '../../lib/dnd5e.js';
import { Card, NumberField, Stepper, TextField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const ATTACK_FIELDS = [
  { key: 'name', label: 'Angriff / Zauber', wide: true },
  { key: 'bonus', label: 'Bonus' },
  { key: 'damage', label: 'Schaden / Art' },
  { key: 'notes', label: 'Anmerkungen', wide: true },
];

function DeathSaveRow({ label, count, onChange, filledClass }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(count === n ? n - 1 : n)}
            className={`h-7 w-7 rounded-full border-2 ${n <= count ? filledClass : 'border-rule-strong'}`}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function CombatTab({ data, update }) {
  const initiative = abilityModifier(data.abilities.dex) + (data.combat.initiativeBonus || 0);
  const deathSaves = data.combat.deathSaves;

  return (
    <div className="flex flex-col gap-4">
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
          <NumberField label="Bewegung (Fuß)" value={data.combat.speed} onChange={(v) => update('combat.speed', v)} />
          <TextField label="Trefferwürfel" value={data.combat.hitDice} onChange={(v) => update('combat.hitDice', v)} />
        </div>
        <p className="mt-4 border-t border-dashed border-rule pt-3 text-sepia italic">
          Initiative gesamt{' '}
          <span className="font-display font-semibold text-rubric not-italic">{formatModifier(initiative)}</span>
        </p>
      </Card>

      <Card title="Trefferpunkte">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stepper label="Aktuelle TP" value={data.combat.hp.current} onChange={(v) => update('combat.hp.current', v)} min={-99} max={999} />
          <Stepper label="Maximale TP" value={data.combat.hp.max} onChange={(v) => update('combat.hp.max', v)} min={0} max={999} />
          <Stepper label="Temporäre TP" value={data.combat.hp.temp} onChange={(v) => update('combat.hp.temp', v)} min={0} max={999} />
        </div>

        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">
            Rettungswürfe gegen den Tod
          </p>
          <div className="flex flex-wrap gap-8">
            <DeathSaveRow
              label="Erfolge"
              count={deathSaves.successes}
              onChange={(v) => update('combat.deathSaves.successes', v)}
              filledClass="border-gold bg-gold"
            />
            <DeathSaveRow
              label="Fehlschläge"
              count={deathSaves.failures}
              onChange={(v) => update('combat.deathSaves.failures', v)}
              filledClass="border-rubric bg-rubric"
            />
          </div>
        </div>
      </Card>

      <Card title="Angriffe & Zaubertricks">
        <RepeatingRows
          items={data.attacks}
          onChange={(rows) => update('attacks', rows)}
          fields={ATTACK_FIELDS}
          addLabel="Angriff hinzufügen"
          emptyText="Noch nichts eingetragen – die Waffen ruhen."
        />
      </Card>
    </div>
  );
}
