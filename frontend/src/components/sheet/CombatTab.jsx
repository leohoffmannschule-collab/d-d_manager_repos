import { useState } from 'react';
import {
  CONDITIONS,
  EXHAUSTION_STEPS,
  abilityModifier,
  formatModifier,
} from '../../lib/dnd5e.js';
import { kurzeRast, langeRast } from '../../lib/rasten.js';
import { ausdruckWurf, blattWurf } from '../../lib/wuerfeln.js';
import { newId } from '../../lib/id.js';
import { Card, NumberField, Stepper, TextField, TextAreaField, Toggle } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';
import { IconCandle, IconD20, IconHeart, IconPlus, IconSun, IconTrash } from '../icons.jsx';

const ATTACK_FIELDS = [
  { key: 'name', label: 'Angriff / Zauber', wide: true },
  { key: 'bonus', label: 'Bonus' },
  { key: 'damage', label: 'Schaden / Art' },
  { key: 'notes', label: 'Anmerkungen', wide: true },
];

const AUFFRISCHUNG = [
  ['kurz', 'kurze Rast'],
  ['lang', 'lange Rast'],
  ['keine', 'von Hand'],
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

/** Ein Knopf, der einen Wurf für alle sichtbar auf den Tisch legt. */
function Wurfknopf({ label, modifier, name }) {
  return (
    <button
      type="button"
      onClick={() => blattWurf(name, modifier)}
      title={`${name} würfeln`}
      className="flex min-h-9 items-center gap-1 border border-transparent px-1.5 font-display font-semibold text-rubric hover:border-gold"
    >
      <IconD20 size={13} className="text-faint" />
      {label}
    </button>
  );
}

function Trefferwuerfel({ data, update }) {
  const pool = data.combat.hitDicePool;
  const uebrig = Math.max(0, (pool.total || 0) - (pool.used || 0));
  const konMod = abilityModifier(data.abilities.con);

  async function ausgeben() {
    if (uebrig <= 0) return;
    const wurf = await ausdruckWurf('Trefferwürfel', `1W${pool.size}${konMod ? formatModifier(konMod) : ''}`);
    const geheilt = Math.max(0, wurf.total);
    update('combat.hitDicePool.used', (pool.used || 0) + 1);
    update('combat.hp.current', Math.min(data.combat.hp.max, (data.combat.hp.current ?? 0) + geheilt));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <NumberField
        label="Würfelart (W)"
        value={pool.size}
        min={4}
        onChange={(v) => update('combat.hitDicePool.size', v)}
        className="w-24"
      />
      <NumberField
        label="Vorrat"
        value={pool.total}
        min={0}
        onChange={(v) => update('combat.hitDicePool.total', v)}
        className="w-24"
      />
      <NumberField
        label="Verbraucht"
        value={pool.used}
        min={0}
        onChange={(v) => update('combat.hitDicePool.used', v)}
        className="w-24"
      />
      <button
        type="button"
        onClick={ausgeben}
        disabled={uebrig <= 0}
        className="btn btn-plate disabled:opacity-40"
        title={`1W${pool.size} ${formatModifier(konMod)} würfeln und gutschreiben`}
      >
        <IconHeart size={16} />
        Würfel ausgeben ({uebrig})
      </button>
    </div>
  );
}

function Ressourcen({ data, update }) {
  const liste = data.resources ?? [];

  const setzen = (id, feld, wert) =>
    update(
      'resources',
      liste.map((r) => (r.id === id ? { ...r, [feld]: wert } : r))
    );

  return (
    <div className="space-y-2">
      {liste.length === 0 && (
        <p className="text-sepia italic">
          Hier hinein kommt, was gezählt werden muss: Wutanfälle, Ki-Punkte, bardische Inspiration,
          Handauflegen, Zauberkraft.
        </p>
      )}

      {liste.map((r) => (
        <div key={r.id} className="flex flex-wrap items-end gap-2.5 border border-rule bg-panel-soft p-2.5">
          <TextField
            label="Name"
            value={r.name}
            onChange={(v) => setzen(r.id, 'name', v)}
            className="min-w-[9rem] flex-1"
          />
          <Stepper label="Übrig" value={r.current} onChange={(v) => setzen(r.id, 'current', v)} max={r.max || 99} />
          <NumberField label="Höchstens" value={r.max} min={0} onChange={(v) => setzen(r.id, 'max', v)} className="w-24" />
          <label className="block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              Erneuert sich
            </span>
            <select
              value={r.recharge}
              onChange={(e) => setzen(r.id, 'recharge', e.target.value)}
              className="field-box w-32"
            >
              {AUFFRISCHUNG.map(([wert, text]) => (
                <option key={wert} value={wert}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => update('resources', liste.filter((x) => x.id !== r.id))}
            className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
            aria-label="Entfernen"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          update('resources', [...liste, { id: newId(), name: '', current: 0, max: 0, recharge: 'lang' }])
        }
        className="btn btn-plate"
      >
        <IconPlus size={16} /> Ressource anlegen
      </button>
    </div>
  );
}

export default function CombatTab({ data, update, replace }) {
  const [rastOffen, setRastOffen] = useState(false);
  const initiative = abilityModifier(data.abilities.dex) + (data.combat.initiativeBonus || 0);
  const deathSaves = data.combat.deathSaves;
  const zustaende = data.combat.conditions ?? [];
  const erschoepfung = data.combat.exhaustion ?? 0;
  const konzentration = data.combat.concentration ?? { active: false, spell: '' };

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

      <Card title="Trefferpunkte">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Stepper label="Aktuelle TP" value={data.combat.hp.current} onChange={(v) => update('combat.hp.current', v)} min={-99} max={999} />
          <Stepper label="Maximale TP" value={data.combat.hp.max} onChange={(v) => update('combat.hp.max', v)} min={0} max={999} />
          <Stepper label="Temporäre TP" value={data.combat.hp.temp} onChange={(v) => update('combat.hp.temp', v)} min={0} max={999} />
        </div>

        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">Trefferwürfel</p>
          <Trefferwuerfel data={data} update={update} />
        </div>

        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">
            Rettungswürfe gegen den Tod
          </p>
          <div className="flex flex-wrap items-end gap-8">
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
            <button type="button" onClick={() => blattWurf('Rettungswurf gegen den Tod', 0)} className="btn btn-plate">
              <IconD20 size={16} /> Würfeln
            </button>
          </div>
        </div>
      </Card>

      <Card title="Rasten">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              replace(kurzeRast(data));
              setRastOffen(true);
            }}
            className="btn btn-plate"
          >
            <IconCandle size={16} /> Kurze Rast
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Lange Rast: Trefferpunkte voll, Zauberplätze frei, eine Stufe Erschöpfung weniger?')) return;
              replace(langeRast(data));
              setRastOffen(true);
            }}
            className="btn btn-seal"
          >
            <IconSun size={16} /> Lange Rast
          </button>
        </div>
        <p className="mt-3 text-sepia italic">
          {rastOffen
            ? 'Die Rast ist verzeichnet. Trefferwürfel gibst du oben einzeln aus.'
            : 'Kurze Rast erneuert, was sich kurz erneuert. Die lange Rast füllt Trefferpunkte, Zauberplätze und die Hälfte der Trefferwürfel.'}
        </p>
      </Card>

      <Card title="Zustand">
        <div className="mb-4">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Zustände</span>
          <div className="flex flex-wrap gap-1.5">
            {CONDITIONS.map((zustand) => {
              const an = zustaende.includes(zustand);
              return (
                <button
                  key={zustand}
                  type="button"
                  onClick={() =>
                    update(
                      'combat.conditions',
                      an ? zustaende.filter((z) => z !== zustand) : [...zustaende, zustand]
                    )
                  }
                  className={`min-h-9 border px-2 py-1 ${
                    an ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
                  }`}
                >
                  {zustand}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4 border-t border-dashed border-rule pt-4">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            Erschöpfung – {EXHAUSTION_STEPS[erschoepfung]}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((stufe) => (
              <button
                key={stufe}
                type="button"
                onClick={() => update('combat.exhaustion', stufe)}
                className={`h-11 w-11 border font-display ${
                  stufe === erschoepfung
                    ? 'border-rubric bg-rubric text-rubric-ink'
                    : stufe < erschoepfung
                      ? 'border-rubric bg-rubric/20 text-rubric'
                      : 'border-rule text-sepia'
                }`}
              >
                {stufe}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-dashed border-rule pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <Toggle
              checked={konzentration.active}
              onChange={(v) => update('combat.concentration', { ...konzentration, active: v })}
              label={<span className="text-ink">Konzentration</span>}
            />
            <TextField
              label="worauf"
              value={konzentration.spell}
              onChange={(v) => update('combat.concentration', { ...konzentration, spell: v })}
              className="min-w-[10rem] flex-1"
              placeholder="z. B. Segnen"
            />
          </div>
          {konzentration.active && (
            <p className="mt-2 text-sepia italic">
              Bei Schaden ein Rettungswurf auf Konstitution gegen SG 10 oder die Hälfte des Schadens – was höher ist.
            </p>
          )}
        </div>
      </Card>

      <Card title="Widerstand und Sinne">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextAreaField
            label="Resistenzen"
            rows={2}
            value={data.combat.defenses.resistances}
            onChange={(v) => update('combat.defenses.resistances', v)}
          />
          <TextAreaField
            label="Immunitäten"
            rows={2}
            value={data.combat.defenses.immunities}
            onChange={(v) => update('combat.defenses.immunities', v)}
          />
          <TextAreaField
            label="Verwundbarkeiten"
            rows={2}
            value={data.combat.defenses.vulnerabilities}
            onChange={(v) => update('combat.defenses.vulnerabilities', v)}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label="Dunkelsicht (Fuß)"
            value={data.combat.senses.darkvision}
            min={0}
            onChange={(v) => update('combat.senses.darkvision', v)}
          />
          <TextField
            label="Weitere Sinne"
            value={data.combat.senses.notes}
            onChange={(v) => update('combat.senses.notes', v)}
            className="sm:col-span-2"
            placeholder="Blindsicht 10 Fuß, Erschütterungssinn …"
          />
        </div>
      </Card>

      <Card title="Klassenressourcen">
        <Ressourcen data={data} update={update} />
      </Card>

      <Card title="Eingestimmte Gegenstände">
        <p className="mb-3 text-sepia italic">Auf mehr als drei magische Gegenstände lässt sich niemand einstimmen.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((platz) => (
            <TextField
              key={platz}
              label={`Platz ${platz + 1}`}
              value={data.attunement?.[platz] ?? ''}
              onChange={(v) => {
                const naechste = [...(data.attunement ?? ['', '', ''])];
                naechste[platz] = v;
                update('attunement', naechste);
              }}
            />
          ))}
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
        {data.attacks?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-rule pt-3">
            {data.attacks
              .filter((a) => a.name)
              .map((a) => (
                <span key={a.id ?? a.name} className="flex">
                  <button
                    type="button"
                    onClick={() => blattWurf(`${a.name} (Angriff)`, Number(String(a.bonus).replace('+', '')) || 0)}
                    className="btn-plate min-h-11 px-3 text-[13px]"
                  >
                    {a.name}
                  </button>
                  {a.damage && (
                    <button
                      type="button"
                      onClick={() => ausdruckWurf(`${a.name} (Schaden)`, String(a.damage).replace(/[^0-9dwW+-]/g, ''))}
                      className="btn-plate min-h-11 border-l-0 px-3 text-[13px] text-rubric"
                      title={`Schaden ${a.damage}`}
                    >
                      Schaden
                    </button>
                  )}
                </span>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
