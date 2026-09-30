/**
 * Zaubersuche im Kompendium. Gesucht wird örtlich in der einmal geladenen
 * Liste aller Zauber – deshalb ohne Verzögerung und ohne Anfrage je
 * Tastendruck.
 */
import { useEffect, useMemo, useState } from 'react';
import { compendiumApi } from '../../../lib/api.js';
import { newId } from '../../../lib/id.js';
import { IconPlus, IconSearch } from '../../icons.jsx';
import { spaltenAus } from './spalten.js';

export default function Zaubersuche({ onAdd }) {
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
    const grund = { id: newId(), index: entry.index, name: entry.name, level: 0, prepared: false };
    try {
      const detail = await compendiumApi.detail('spells', entry.index);
      onAdd({ ...grund, name: detail.name, level: detail.level ?? 0, ...spaltenAus(detail) });
    } catch {
      onAdd(grund);
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
