import { ABILITIES, SKILLS, abilityModifier, formatModifier, proficiencyBonus } from '../../lib/dnd5e.js';
import { Card, TextField, NumberField, Toggle } from '../ui.jsx';

export default function OverviewTab({ data, update }) {
  const pb = proficiencyBonus(data.level);

  return (
    <div className="space-y-4">
      <Card title="Charakter">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <TextField label="Volk" value={data.race} onChange={(v) => update('race', v)} />
          <TextField label="Unterart" value={data.subrace} onChange={(v) => update('subrace', v)} />
          <TextField label="Klasse" value={data.className} onChange={(v) => update('className', v)} />
          <TextField label="Unterklasse" value={data.subclass} onChange={(v) => update('subclass', v)} />
          <NumberField label="Stufe" min={1} value={data.level} onChange={(v) => update('level', v)} />
          <TextField label="Hintergrund" value={data.background} onChange={(v) => update('background', v)} />
          <TextField label="Gesinnung" value={data.alignment} onChange={(v) => update('alignment', v)} />
          <TextField label="Spieler:in" value={data.playerName} onChange={(v) => update('playerName', v)} />
          <NumberField label="Erfahrung" min={0} value={data.experience} onChange={(v) => update('experience', v)} />
        </div>
        <p className="mt-3 text-xs text-parchment-100/50">Übungsbonus: {formatModifier(pb)}</p>
      </Card>

      <Card title="Attribute">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ABILITIES.map((a) => {
            const score = data.abilities[a.key];
            const mod = abilityModifier(score);
            return (
              <div key={a.key} className="rounded-xl border border-ink-800 bg-ink-800/40 p-2 text-center">
                <p className="text-[11px] font-medium uppercase tracking-wide text-parchment-100/50">{a.label}</p>
                <input
                  type="number"
                  inputMode="numeric"
                  value={score}
                  onChange={(e) => update(`abilities.${a.key}`, Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-lg border border-ink-700 bg-ink-900 py-1 text-center text-lg font-semibold text-parchment-50 focus:border-gold-500 focus:outline-none"
                />
                <p className="mt-1 font-display text-gold-400">{formatModifier(mod)}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Rettungswürfe">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ABILITIES.map((a) => {
            const proficient = data.savingThrows[a.key];
            const mod = abilityModifier(data.abilities[a.key]) + (proficient ? pb : 0);
            return (
              <div key={a.key} className="flex items-center justify-between rounded-lg border border-ink-800 px-3 py-2">
                <Toggle checked={proficient} onChange={(v) => update(`savingThrows.${a.key}`, v)} label={a.label} />
                <span className="font-display text-gold-400">{formatModifier(mod)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Fertigkeiten">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {SKILLS.map((s) => {
            const state = data.skills[s.key] ?? { proficient: false, expertise: false };
            const bonus = (state.expertise ? 2 : state.proficient ? 1 : 0) * pb;
            const mod = abilityModifier(data.abilities[s.ability]) + bonus;
            return (
              <div key={s.key} className="flex items-center justify-between rounded-lg border border-ink-800 px-3 py-1.5">
                <Toggle
                  checked={state.proficient}
                  onChange={(v) => update(`skills.${s.key}`, { ...state, proficient: v, expertise: v ? state.expertise : false })}
                  label={`${s.label} (${s.ability.toUpperCase()})`}
                />
                <div className="flex items-center gap-2">
                  {state.proficient && (
                    <label className="flex items-center gap-1 text-[11px] text-parchment-100/50">
                      <input
                        type="checkbox"
                        checked={state.expertise}
                        onChange={(e) => update(`skills.${s.key}`, { ...state, expertise: e.target.checked })}
                      />
                      Exp.
                    </label>
                  )}
                  <span className="w-8 text-right font-display text-gold-400">{formatModifier(mod)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-parchment-100/50">
          Passive Wahrnehmung: {10 + abilityModifier(data.abilities.wis) + (data.skills.perception.expertise ? 2 * pb : data.skills.perception.proficient ? pb : 0)}
        </p>
      </Card>
    </div>
  );
}
