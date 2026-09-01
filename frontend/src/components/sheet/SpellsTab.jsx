import { useEffect, useMemo, useState } from 'react';
import { ABILITIES, SPELL_LEVELS, abilityModifier, formatModifier, proficiencyBonus } from '../../lib/dnd5e.js';
import { compendiumApi } from '../../lib/api.js';
import { Card, FieldLabel, Stepper, Toggle } from '../ui.jsx';
import { IconPlus, IconSearch } from '../icons.jsx';
import { newId } from '../../lib/id.js';

function SpellSearch({ onAdd }) {
  const [allSpells, setAllSpells] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    compendiumApi
      .list('spells')
      .then((res) => setAllSpells(res.results ?? []))
      .catch(() => setError('Das Kompendium ist gerade nicht erreichbar.'));
  }, []);

  const results = useMemo(() => {
    if (!allSpells || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allSpells.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 20);
  }, [allSpells, query]);

  async function handleAdd(entry) {
    try {
      const detail = await compendiumApi.detail('spells', entry.index);
      onAdd({ id: newId(), index: entry.index, name: detail.name, level: detail.level ?? 0, prepared: false });
    } catch {
      onAdd({ id: newId(), index: entry.index, name: entry.name, level: 0, prepared: false });
    }
    setQuery('');
  }

  return (
    <div>
      <div className="flex items-center gap-2.5 border border-rule bg-panel-soft px-3.5">
        <IconSearch size={17} className="shrink-0 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zauber suchen …"
          disabled={!allSpells}
          className="min-h-11 w-full border-0 bg-transparent text-ink placeholder:text-faint placeholder:italic focus:outline-none disabled:opacity-50"
        />
      </div>

      {error && <p className="mt-2 text-[15px] text-faint italic">{error} Trage Zauber unten von Hand ein.</p>}

      {results.length > 0 && (
        <ul className="mt-2 max-h-60 divide-y divide-rule overflow-y-auto border border-rule">
          {results.map((r) => (
            <li key={r.index}>
              <button
                onClick={() => handleAdd(r)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 text-left text-ink hover:bg-gold/12"
              >
                {r.name}
                <IconPlus size={15} className="shrink-0 text-rubric" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SpellsTab({ data, update }) {
  const spellcasting = data.spellcasting;
  const pb = proficiencyBonus(data.level);
  const abilityMod = abilityModifier(data.abilities[spellcasting.ability]);
  const saveDC = spellcasting.manualSaveDC ?? 8 + pb + abilityMod;
  const attackBonus = spellcasting.manualAttackBonus ?? pb + abilityMod;

  function updateSpellcasting(key, value) {
    update('spellcasting', { ...spellcasting, [key]: value });
  }

  function addSpell(spell) {
    if (spellcasting.spells.some((s) => s.name === spell.name)) return;
    updateSpellcasting('spells', [...spellcasting.spells, spell]);
  }

  const sortedSpells = useMemo(
    () => [...spellcasting.spells].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [spellcasting.spells]
  );

  return (
    <div className="flex flex-col gap-4">
      <Card title="Zauberwirken">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <FieldLabel>Zauberattribut</FieldLabel>
            <select
              value={spellcasting.ability}
              onChange={(e) => updateSpellcasting('ability', e.target.value)}
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

      <Card title="Zauberplätze">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {SPELL_LEVELS.map((lvl) => {
            const slot = spellcasting.slots[lvl] ?? { max: 0, used: 0 };
            return (
              <div key={lvl} className="border border-rule bg-panel-soft/60 p-2.5 text-center">
                <p className="mb-1.5 font-display text-[10px] tracking-[0.14em] text-faint uppercase">Grad {lvl}</p>
                <Stepper
                  value={slot.used}
                  onChange={(v) => updateSpellcasting('slots', { ...spellcasting.slots, [lvl]: { ...slot, used: v } })}
                  max={slot.max}
                />
                <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[14px] text-faint">
                  von
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={slot.max}
                    onChange={(e) => {
                      const max = Number(e.target.value) || 0;
                      updateSpellcasting('slots', {
                        ...spellcasting.slots,
                        [lvl]: { max, used: Math.min(slot.used, max) },
                      });
                    }}
                    className="w-11 border border-rule bg-panel px-1 py-0.5 text-center font-display text-ink focus:border-rubric focus:outline-none"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Zauber aus dem Kompendium übernehmen">
        <SpellSearch onAdd={addSpell} />
      </Card>

      <Card title="Zauberliste">
        {sortedSpells.length === 0 ? (
          <p className="text-sepia italic">Noch keine Zauber verzeichnet.</p>
        ) : (
          <ul>
            {sortedSpells.map((spell) => (
              <li
                key={spell.id}
                className="flex items-center justify-between gap-3 border-b border-dotted border-rule py-1.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-rule font-display text-[13px] text-rubric">
                    {spell.level === 0 ? 'T' : spell.level}
                  </span>
                  <span className="truncate text-ink">{spell.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Toggle
                    checked={spell.prepared}
                    onChange={(v) =>
                      updateSpellcasting(
                        'spells',
                        spellcasting.spells.map((s) => (s.id === spell.id ? { ...s, prepared: v } : s))
                      )
                    }
                    label={<span className="text-[15px] text-sepia">vorbereitet</span>}
                  />
                  <button
                    onClick={() =>
                      updateSpellcasting(
                        'spells',
                        spellcasting.spells.filter((s) => s.id !== spell.id)
                      )
                    }
                    className="min-h-9 px-1 text-[15px] text-rubric hover:underline"
                  >
                    Entfernen
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
