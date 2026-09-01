import { useEffect, useMemo, useState } from 'react';
import { compendiumApi } from '../lib/api.js';
import CompendiumDetail from '../components/CompendiumDetail.jsx';

const CATEGORIES = [
  { key: 'races', label: 'Völker' },
  { key: 'classes', label: 'Klassen' },
  { key: 'backgrounds', label: 'Hintergründe' },
  { key: 'feats', label: 'Talente' },
  { key: 'spells', label: 'Zauber' },
  { key: 'equipment', label: 'Ausrüstung' },
  { key: 'magic-items', label: 'Magische Gegenstände' },
  { key: 'monsters', label: 'Monster' },
  { key: 'conditions', label: 'Zustände' },
];

export default function Compendium() {
  const [category, setCategory] = useState('races');
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    setEntries(null);
    setError('');
    setSelected(null);
    setDetail(null);
    setQuery('');
    compendiumApi
      .list(category)
      .then((res) => setEntries(res.results ?? []))
      .catch(() => setError('D&D 5e API ist gerade nicht erreichbar. Bitte später erneut versuchen.'));
  }, [category]);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.name.toLowerCase().includes(q));
  }, [entries, query]);

  function openEntry(entry) {
    setSelected(entry.index);
    setDetail(null);
    setDetailLoading(true);
    compendiumApi
      .detail(category, entry.index)
      .then(setDetail)
      .catch(() => setDetail({ name: entry.name, desc: ['Details konnten nicht geladen werden.'] }))
      .finally(() => setDetailLoading(false));
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl text-parchment-50">Kompendium</h1>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
              category === c.key ? 'bg-ink-800 text-gold-400' : 'text-parchment-100/60 hover:bg-ink-900'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="mb-3 w-full rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-parchment-50 placeholder:text-parchment-100/30 focus:border-gold-500 focus:outline-none"
          />
          {error && <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-200">{error}</p>}
          {!error && entries === null && <p className="text-sm text-parchment-100/50">Lädt…</p>}
          <ul className="max-h-[60vh] divide-y divide-ink-800 overflow-y-auto rounded-xl border border-ink-800">
            {filtered.map((entry) => (
              <li key={entry.index}>
                <button
                  onClick={() => openEntry(entry)}
                  className={`block w-full px-3 py-2.5 text-left text-sm ${
                    selected === entry.index ? 'bg-ink-800 text-gold-400' : 'text-parchment-50 hover:bg-ink-900'
                  }`}
                >
                  {entry.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
          {!selected && <p className="text-sm text-parchment-100/40">Wähle links einen Eintrag aus.</p>}
          {detailLoading && <p className="text-sm text-parchment-100/50">Lädt Details…</p>}
          {detail && !detailLoading && <CompendiumDetail item={detail} />}
        </div>
      </div>
    </div>
  );
}
