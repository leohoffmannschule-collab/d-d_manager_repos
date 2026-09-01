import { useEffect, useMemo, useState } from 'react';
import { ABILITIES, SPELL_LEVELS, abilityModifier, formatModifier, proficiencyBonus } from '../../lib/dnd5e.js';
import { compendiumApi } from '../../lib/api.js';
import { Card, Stepper, Toggle } from '../ui.jsx';

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

  function updateSpell(id, patch) {
    updateSpellcasting('spells', spellcasting.spells.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSpell(id) {
    updateSpellcasting('spells', spellcasting.spells.filter((s) => s.id !== id));
  }

  const sortedSpells = useMemo(
    () => [...spellcasting.spells].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)),
    [spellcasting.spells]
  );

  return (
    <div className="space-y-4">
      <Card title="Zauberwirken">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-parchment-100/60">Zauberattribut</span>
            <select
              value={spellcasting.ability}
              onChange={(e) => updateSpellcasting('ability', e.target.value)}
              className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-parchment-50 focus:border-gold-500 focus:outline-none"
            >
              {ABILITIES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-lg border border-ink-800 px-3 py-2">
            <p className="text-xs text-parchment-100/50">Zauber-SG</p>
            <p className="font-display text-lg text-gold-400">{saveDC}</p>
          </div>
          <div className="rounded-lg border border-ink-800 px-3 py-2">
            <p className="text-xs text-parchment-100/50">Angriffsbonus</p>
            <p className="font-display text-lg text-gold-400">{formatModifier(attackBonus)}</p>
          </div>
        </div>
      </Card>

      <Card title="Zauberplätze">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {SPELL_LEVELS.map((lvl) => (
            <div key={lvl} className="rounded-xl border border-ink-800 bg-ink-800/40 p-2 text-center">
              <p className="mb-1 text-[11px] font-medium text-parchment-100/50">Grad {lvl}</p>
              <Stepper
                value={spellcasting.slots[lvl]?.used ?? 0}
                onChange={(v) => updateSpellcasting('slots', { ...spellcasting.slots, [lvl]: { ...spellcasting.slots[lvl], used: v } })}
                max={spellcasting.slots[lvl]?.max ?? 0}
              />
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-parchment-100/40">
                von
                <input
                  type="number"
                  min={0}
                  value={spellcasting.slots[lvl]?.max ?? 0}
                  onChange={(e) =>
                    updateSpellcasting('slots', {
                      ...spellcasting.slots,
                      [lvl]: { max: Number(e.target.value) || 0, used: Math.min(spellcasting.slots[lvl]?.used ?? 0, Number(e.target.value) || 0) },
                    })
                  }
                  className="w-10 rounded border border-ink-700 bg-ink-900 px-1 text-center"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Zauber hinzufügen (aus der D&D 5e API)">
        <SpellSearch onAdd={addSpell} />
      </Card>

      <Card title="Zauberliste">
        {sortedSpells.length === 0 && <p className="text-sm text-parchment-100/40">Noch keine Zauber eingetragen.</p>}
        <ul className="space-y-1.5">
          {sortedSpells.map((spell) => (
            <li key={spell.id} className="flex items-center justify-between gap-2 rounded-lg border border-ink-800 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs text-parchment-100/40">{spell.level === 0 ? 'T' : spell.level}</span>
                <span className="text-sm text-parchment-50">{spell.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={spell.prepared} onChange={(v) => updateSpell(spell.id, { prepared: v })} label="vorb." />
                <button onClick={() => removeSpell(spell.id)} className="text-xs text-red-300/80 hover:underline">
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function SpellSearch({ onAdd }) {
  const [allSpells, setAllSpells] = useState(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    compendiumApi
      .list('spells')
      .then((res) => setAllSpells(res.results ?? []))
      .catch(() => setError('D&D 5e API gerade nicht erreichbar.'));
  }, []);

  const results = useMemo(() => {
    if (!allSpells || !query.trim()) return [];
    const q = query.trim().toLowerCase();
    return allSpells.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 20);
  }, [allSpells, query]);

  async function handleAdd(entry) {
    try {
      const detail = await compendiumApi.detail('spells', entry.index);
      onAdd({ id: crypto.randomUUID(), index: entry.index, name: detail.name, level: detail.level ?? 0, prepared: false });
    } catch {
      onAdd({ id: crypto.randomUUID(), index: entry.index, name: entry.name, level: 0, prepared: false });
    }
    setQuery('');
  }

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Zauber suchen…"
        disabled={!allSpells}
        className="w-full rounded-lg border border-ink-700 bg-ink-800 px-3 py-2 text-parchment-50 placeholder:text-parchment-100/30 focus:border-gold-500 focus:outline-none disabled:opacity-50"
      />
      {error && <p className="mt-2 text-xs text-parchment-100/50">{error} Trage Zauber stattdessen manuell in der Liste unten ein.</p>}
      {results.length > 0 && (
        <ul className="mt-2 max-h-56 divide-y divide-ink-800 overflow-y-auto rounded-lg border border-ink-800">
          {results.map((r) => (
            <li key={r.index}>
              <button
                onClick={() => handleAdd(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-parchment-50 hover:bg-ink-800"
              >
                {r.name}
                <span className="text-xs text-parchment-100/40">+ hinzufügen</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
