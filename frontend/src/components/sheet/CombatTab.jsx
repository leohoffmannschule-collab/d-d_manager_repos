import { abilityModifier, formatModifier } from '../../lib/dnd5e.js';
import { Card, NumberField, Stepper, TextField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const ATTACK_FIELDS = [
  { key: 'name', label: 'Angriff / Zauber', wide: true },
  { key: 'bonus', label: 'Bonus' },
  { key: 'damage', label: 'Schaden/Art' },
  { key: 'notes', label: 'Notizen', wide: true },
];

export default function CombatTab({ data, update }) {
  const initiative = abilityModifier(data.abilities.dex) + (data.combat.initiativeBonus || 0);
  const deathSaves = data.combat.deathSaves;

  return (
    <div className="space-y-4">
      <Card title="Kampfwerte">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="Rüstungsklasse" value={data.combat.armorClass} onChange={(v) => update('combat.armorClass', v)} />
          <NumberField label="Initiative-Bonus" value={data.combat.initiativeBonus} onChange={(v) => update('combat.initiativeBonus', v)} />
          <NumberField label="Bewegung (ft.)" value={data.combat.speed} onChange={(v) => update('combat.speed', v)} />
          <TextField label="Trefferwürfel" value={data.combat.hitDice} onChange={(v) => update('combat.hitDice', v)} />
        </div>
        <p className="mt-3 text-sm text-parchment-100/60">Initiative gesamt: <span className="font-display text-gold-400">{formatModifier(initiative)}</span></p>
      </Card>

      <Card title="Trefferpunkte">
        <div className="grid grid-cols-3 gap-3">
          <Stepper label="Max. TP" value={data.combat.hp.max} onChange={(v) => update('combat.hp.max', v)} min={0} max={999} />
          <Stepper label="Aktuelle TP" value={data.combat.hp.current} onChange={(v) => update('combat.hp.current', v)} min={-999} max={999} />
          <Stepper label="Temp. TP" value={data.combat.hp.temp} onChange={(v) => update('combat.hp.temp', v)} min={0} max={999} />
        </div>
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-parchment-100/60">Rettungswürfe gegen den Tod</p>
          <div className="flex flex-wrap gap-6">
            <DeathSaveRow label="Erfolge" count={deathSaves.successes} onChange={(v) => update('combat.deathSaves.successes', v)} />
            <DeathSaveRow label="Fehlschläge" count={deathSaves.failures} onChange={(v) => update('combat.deathSaves.failures', v)} />
          </div>
        </div>
      </Card>

      <Card title="Angriffe & Zaubertricks">
        <RepeatingRows
          items={data.attacks}
          onChange={(rows) => update('attacks', rows)}
          fields={ATTACK_FIELDS}
          addLabel="+ Angriff hinzufügen"
          emptyText="Keine Angriffe eingetragen."
        />
      </Card>
    </div>
  );
}

function DeathSaveRow({ label, count, onChange }) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-parchment-100/50">{label}</p>
      <div className="flex gap-1.5">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(count === n ? n - 1 : n)}
            className={`h-6 w-6 rounded-full border-2 ${
              n <= count ? 'border-gold-500 bg-gold-500' : 'border-ink-600'
            }`}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}
