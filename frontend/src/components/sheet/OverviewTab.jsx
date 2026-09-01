import { ABILITIES, SKILLS, abilityModifier, formatModifier, proficiencyBonus } from '../../lib/dnd5e.js';
import { Card, TextField, NumberField, Toggle } from '../ui.jsx';

const SHORT_ABILITY = { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' };

function AbilityShield({ label, score, modifier, onChange }) {
  const strong = modifier >= 3;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-display text-[10px] tracking-[0.12em] text-faint uppercase">{label}</span>
      <div className="relative w-full max-w-[86px]">
        <svg
          viewBox="0 0 74 88"
          className={strong ? 'fill-panel-soft text-gold' : 'fill-panel-soft text-rule-strong'}
          stroke="currentColor"
          strokeWidth={strong ? 2.5 : 1.5}
        >
          <path d="M4 5h66v42c0 20-14 30-33 36C18 77 4 67 4 47z" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <input
            type="number"
            inputMode="numeric"
            value={score}
            onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-12 border-0 bg-transparent p-0 text-center font-display text-2xl font-bold text-ink focus:outline-none"
            aria-label={label}
          />
          <span className="font-display text-[15px] text-rubric">{formatModifier(modifier)}</span>
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab({ data, update }) {
  const pb = proficiencyBonus(data.level);
  const perception = data.skills.perception ?? { proficient: false, expertise: false };
  const passivePerception =
    10 +
    abilityModifier(data.abilities.wis) +
    (perception.expertise ? 2 * pb : perception.proficient ? pb : 0);

  return (
    <div className="flex flex-col gap-4">
      <Card title="Charakter">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3">
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
        <p className="mt-4 border-t border-dashed border-rule pt-3 text-sepia italic">
          Übungsbonus <span className="font-display font-semibold text-rubric not-italic">{formatModifier(pb)}</span>
        </p>
      </Card>

      <Card title="Attribute">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ABILITIES.map((a) => (
            <AbilityShield
              key={a.key}
              label={a.label}
              score={data.abilities[a.key]}
              modifier={abilityModifier(data.abilities[a.key])}
              onChange={(v) => update(`abilities.${a.key}`, v)}
            />
          ))}
        </div>
      </Card>

      <Card title="Rettungswürfe">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {ABILITIES.map((a) => {
            const proficient = data.savingThrows[a.key];
            const mod = abilityModifier(data.abilities[a.key]) + (proficient ? pb : 0);
            return (
              <div key={a.key} className="flex items-center justify-between gap-2 border border-rule px-3 py-1">
                <Toggle
                  checked={proficient}
                  onChange={(v) => update(`savingThrows.${a.key}`, v)}
                  label={a.label}
                />
                <span className="font-display font-semibold text-rubric">{formatModifier(mod)}</span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Fertigkeiten">
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {SKILLS.map((s) => {
            const state = data.skills[s.key] ?? { proficient: false, expertise: false };
            const bonus = (state.expertise ? 2 : state.proficient ? 1 : 0) * pb;
            const mod = abilityModifier(data.abilities[s.ability]) + bonus;
            return (
              <div key={s.key} className="flex items-center justify-between gap-2 border-b border-dotted border-rule">
                <Toggle
                  checked={state.proficient}
                  onChange={(v) =>
                    update(`skills.${s.key}`, { ...state, proficient: v, expertise: v ? state.expertise : false })
                  }
                  label={
                    <>
                      {s.label} <span className="text-[14px] text-faint">({SHORT_ABILITY[s.ability]})</span>
                    </>
                  }
                />
                <div className="flex items-center gap-3">
                  {state.proficient && (
                    <button
                      type="button"
                      onClick={() => update(`skills.${s.key}`, { ...state, expertise: !state.expertise })}
                      className={`border px-1.5 py-0.5 font-display text-[10px] tracking-[0.12em] uppercase ${
                        state.expertise ? 'border-gold bg-gold/20 text-rubric' : 'border-rule text-faint'
                      }`}
                      title="Expertise – doppelter Übungsbonus"
                    >
                      Exp
                    </button>
                  )}
                  <span
                    className={`w-9 text-right font-display font-semibold ${
                      state.proficient ? 'text-rubric' : 'text-sepia'
                    }`}
                  >
                    {formatModifier(mod)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 border-t border-dashed border-rule pt-3 text-sepia italic">
          Passive Wahrnehmung <span className="font-display font-semibold text-ink not-italic">{passivePerception}</span>
        </p>
      </Card>
    </div>
  );
}
