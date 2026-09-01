import { useEffect, useMemo, useState } from 'react';
import { compendiumApi } from '../lib/api.js';
import CompendiumDetail from '../components/CompendiumDetail.jsx';
import { IconChevronRight, IconClock, IconSearch } from '../components/icons.jsx';

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
      .catch(() => setError('Das Kompendium ist gerade nicht erreichbar. Bitte später erneut aufschlagen.'));
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
      .catch(() => setDetail({ name: entry.name, desc: ['Dieser Eintrag ließ sich nicht laden.'] }))
      .finally(() => setDetailLoading(false));
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
        Kompendium
      </h1>
      <p className="mt-1 mb-5 text-sepia italic">Gesammeltes Wissen über Völker, Künste und Ungeheuer</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`min-h-11 border px-4 font-display text-[13px] tracking-[0.08em] ${
              category === c.key
                ? 'border-rubric-deep bg-rubric text-rubric-ink'
                : 'border-rule bg-panel/60 text-sepia hover:border-gold'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[300px_minmax(0,1fr)]">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 border border-rule bg-panel px-3.5">
            <IconSearch size={17} className="shrink-0 text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen …"
              className="min-h-11 w-full border-0 bg-transparent text-ink placeholder:text-faint placeholder:italic focus:outline-none"
            />
          </div>

          {error && <p className="panel border-rubric p-4 text-rubric">{error}</p>}
          {!error && entries === null && <p className="text-sepia italic">Der Band wird aufgeschlagen …</p>}

          {filtered.length > 0 && (
            <ul className="panel max-h-[60vh] divide-y divide-rule overflow-y-auto p-0">
              {filtered.map((entry) => (
                <li key={entry.index}>
                  <button
                    onClick={() => openEntry(entry)}
                    className={`flex min-h-12 w-full items-center justify-between gap-2 px-3.5 text-left ${
                      selected === entry.index ? 'bg-rubric text-rubric-ink' : 'text-ink hover:bg-gold/12'
                    }`}
                  >
                    <span className={selected === entry.index ? 'font-display text-[16px]' : ''}>{entry.name}</span>
                    {selected === entry.index && <IconChevronRight size={15} className="shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel p-5">
          {!selected && !detailLoading && (
            <p className="text-sepia italic">Wähle links einen Eintrag, um ihn aufzuschlagen.</p>
          )}
          {detailLoading && <p className="text-sepia italic">Die Seite wird gesucht …</p>}
          {detail && !detailLoading && (
            <>
              <CompendiumDetail item={detail} />
              <p className="mt-5 flex items-center gap-2 border-t border-dashed border-rule pt-3 text-[15px] text-faint italic">
                <IconClock size={15} />
                Aus dem SRD, örtlich verwahrt — auch ohne Botenreiter verfügbar
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
