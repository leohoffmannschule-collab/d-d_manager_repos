import {
  ABILITIES,
  MASSSYSTEME,
  PASSIVE_FERTIGKEITEN,
  SKILLS,
  abilityModifier,
  experienceToNextLevel,
  formatModifier,
  levelFromExperience,
  passiverWert,
  proficiencyBonus,
  saveModifier,
} from '../../lib/dnd5e.js';
import { blattWurf } from '../../lib/wuerfeln.js';
import { Card, TextField, TextAreaField, NumberField, SelectField, Toggle } from '../ui.jsx';
import { IconD20 } from '../icons.jsx';

/**
 * Jeder Wert auf dem Blatt ist zugleich ein Würfelknopf: antippen, und der
 * Wurf steht bei allen am Tisch.
 */
function Wurfwert({ name, modifier, betont = false }) {
  return (
    <button
      type="button"
      onClick={() => blattWurf(name, modifier)}
      title={`${name} würfeln`}
      className={`flex min-h-9 items-center gap-1 border border-transparent px-1.5 font-display font-semibold hover:border-gold ${
        betont ? 'text-rubric' : 'text-sepia'
      }`}
    >
      <IconD20 size={12} className="text-faint" />
      {formatModifier(modifier)}
    </button>
  );
}

const SHORT_ABILITY = { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' };

function AbilityShield({ label, score, modifier, onChange, name }) {
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
          <button
            type="button"
            onClick={() => blattWurf(`${name}-Probe`, modifier)}
            title={`${name}-Probe würfeln`}
            className="font-display text-[15px] text-rubric hover:underline"
          >
            {formatModifier(modifier)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OverviewTab({ data, update }) {
  const pb = proficiencyBonus(data.level);
  const stufeAusErfahrung = levelFromExperience(data.experience);
  const fehlend = experienceToNextLevel(data.experience);
  const nachPunkten = data.experienceMode !== 'meilenstein';

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
          <SelectField
            label="Aufstieg"
            value={data.experienceMode}
            onChange={(v) => update('experienceMode', v)}
            options={[
              ['punkte', 'Erfahrungspunkte'],
              ['meilenstein', 'Meilensteine'],
            ]}
          />
          {nachPunkten && (
            <NumberField label="Erfahrung" min={0} value={data.experience} onChange={(v) => update('experience', v)} />
          )}
          <SelectField label="Maße" value={data.units} onChange={(v) => update('units', v)} options={MASSSYSTEME} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-dashed border-rule pt-3 text-sepia italic">
          <span>
            Übungsbonus <span className="font-display font-semibold text-rubric not-italic">{formatModifier(pb)}</span>
          </span>
          {nachPunkten ? (
            <>
              <span>
                Erfahrung trägt Stufe{' '}
                <span className="font-display font-semibold text-ink not-italic">{stufeAusErfahrung}</span>
                {fehlend !== null && ` · noch ${fehlend.toLocaleString('de-DE')} bis zur nächsten`}
              </span>
              {stufeAusErfahrung !== data.level && (
                <button
                  type="button"
                  onClick={() => update('level', stufeAusErfahrung)}
                  className="btn-plate min-h-9 px-2.5 text-[13px] not-italic"
                >
                  auf Stufe {stufeAusErfahrung} setzen
                </button>
              )}
            </>
          ) : (
            <span>Die Stufe steigt, wenn die Geschichte es hergibt – Punkte zählt hier niemand.</span>
          )}
        </div>
      </Card>

      <Card title="Attribute">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {ABILITIES.map((a) => (
            <AbilityShield
              key={a.key}
              label={a.label}
              name={a.label}
              score={data.abilities[a.key]}
              modifier={abilityModifier(data.abilities[a.key])}
              onChange={(v) => update(`abilities.${a.key}`, v)}
            />
          ))}
        </div>
      </Card>

      <Card title="Rettungswürfe">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {ABILITIES.map((a) => (
            <div key={a.key} className="flex items-center justify-between gap-2 border border-rule px-3 py-1">
              <Toggle
                checked={data.savingThrows[a.key]}
                onChange={(v) => update(`savingThrows.${a.key}`, v)}
                label={a.label}
              />
              <Wurfwert name={`Rettungswurf ${a.label}`} modifier={saveModifier(data, a.key)} betont />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-dashed border-rule pt-3">
          <TextAreaField
            label="Vermerk"
            rows={2}
            value={data.savingThrowNote}
            onChange={(v) => update('savingThrowNote', v)}
            placeholder="z. B. Vorteil auf Rettungswürfe, um Bezaubert zu vermeiden oder zu beenden"
          />
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
                  <Wurfwert name={s.label} modifier={mod} betont={state.proficient} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-rule pt-4">
          {PASSIVE_FERTIGKEITEN.map((f) => (
            <div key={f.key} className="border border-rule bg-panel-soft/60 px-3 py-2 text-center">
              <p className="font-display text-[10px] leading-tight tracking-[0.12em] text-faint uppercase">
                {f.label}
              </p>
              <p className="font-display text-2xl font-bold text-rubric">{passiverWert(data, f.key)}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[15px] text-sepia italic">
          Passive Werte gelten ohne Wurf – die Spielleitung schlägt sie nach, wenn sie nicht verraten will, dass
          überhaupt etwas zu bemerken war.
        </p>
      </Card>
    </div>
  );
}
