/**
 * Ein Monster aus dem Kompendium übernehmen.
 *
 * Übernommen wird eine **Abschrift**: Werte, Fähigkeiten und Aktionen
 * werden in den eigenen Eintrag geschrieben, kein Verweis gespeichert. So
 * lässt sich der Goblin nach Belieben verbiegen, und er bleibt auch dann
 * da, wenn die 5e-API gerade nicht antwortet.
 */
import { useEffect, useMemo, useState } from 'react';
import { compendiumApi, libraryApi } from '../../../lib/api.js';
import { Rubric } from '../../ui.jsx';
import { IconPlus, IconSearch } from '../../icons.jsx';

export default function AusDemKompendium({ onFertig }) {
  const [monster, setMonster] = useState(null);
  const [suche, setSuche] = useState('');
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    compendiumApi
      .list('monsters')
      .then((antwort) => setMonster(antwort.results ?? []))
      .catch(() => setMonster([]));
  }, []);

  const treffer = useMemo(() => {
    if (!monster) return [];
    const begriff = suche.trim().toLowerCase();
    return (begriff ? monster.filter((m) => m.name.toLowerCase().includes(begriff)) : monster).slice(0, 40);
  }, [monster, suche]);

  return (
    <div className="panel p-4">
      <Rubric>Aus dem Kompendium übernehmen</Rubric>
      <label className="mb-3 flex items-center gap-2.5 border border-rule bg-panel-soft px-3">
        <IconSearch size={16} className="text-faint" />
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Monster suchen (englische Namen)"
          className="min-h-11 flex-1 bg-transparent text-ink outline-none"
        />
      </label>

      {monster === null ? (
        <p className="text-sepia italic">Das Kompendium wird aufgeschlagen …</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {treffer.map((m) => (
            <li key={m.index}>
              <button
                disabled={laedt}
                onClick={async () => {
                  setLaedt(true);
                  try {
                    const voll = await compendiumApi.detail('monsters', m.index);
                    await libraryApi.fromCompendium(voll);
                    onFertig?.();
                  } finally {
                    setLaedt(false);
                  }
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 border border-transparent px-2.5 text-left hover:border-gold"
              >
                <span className="text-ink">{m.name}</span>
                <IconPlus size={15} className="text-rubric" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
