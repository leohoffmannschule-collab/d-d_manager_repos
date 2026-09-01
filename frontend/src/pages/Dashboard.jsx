import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';

export default function Dashboard() {
  const [characters, setCharacters] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    charactersApi
      .list()
      .then(setCharacters)
      .catch((err) => setError(err.message));
  }, []);

  async function handleDuplicate(id, e) {
    e.preventDefault();
    e.stopPropagation();
    const copy = await charactersApi.duplicate(id);
    setCharacters((list) => [copy, ...list]);
  }

  async function handleDelete(id, name, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`„${name}“ wirklich unwiderruflich löschen?`)) return;
    await charactersApi.remove(id);
    setCharacters((list) => list.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl text-parchment-50">Deine Charaktere</h1>
        <Link
          to="/neu"
          className="rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950 shadow active:scale-95"
        >
          + Neuer Charakter
        </Link>
      </div>

      {error && <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-200">{error}</p>}

      {characters === null && !error && <p className="text-parchment-100/60">Lade Charaktere…</p>}

      {characters?.length === 0 && (
        <div className="rounded-2xl border border-dashed border-ink-700 p-10 text-center text-parchment-100/60">
          <p className="mb-4 text-4xl">🧙</p>
          <p className="mb-4">Noch keine Abenteurer erschaffen.</p>
          <Link to="/neu" className="rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-semibold text-ink-950">
            Ersten Charakter erstellen
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {characters?.map((c) => (
          <div
            key={c.id}
            onClick={() => navigate(`/charaktere/${c.id}`)}
            className="cursor-pointer rounded-2xl border border-ink-800 bg-ink-900 p-4 shadow transition hover:border-gold-600/60"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink-800 text-2xl">
                {c.portrait ? (
                  <img src={c.portrait} alt="" className="h-full w-full object-cover" />
                ) : (
                  '🛡️'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-lg text-parchment-50">{c.name}</h2>
                <p className="truncate text-sm text-parchment-100/60">
                  {[c.race, c.classLevel].filter(Boolean).join(' · ') || 'Noch keine Details'}
                </p>
                {c.hp && (
                  <p className="mt-1 text-xs text-parchment-100/50">
                    TP {c.hp.current ?? '–'}/{c.hp.max ?? '–'}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-ink-800 pt-3 text-xs">
              <button onClick={(e) => handleDuplicate(c.id, e)} className="rounded-lg px-2 py-1 text-parchment-100/60 hover:bg-ink-800">
                Duplizieren
              </button>
              <button onClick={(e) => handleDelete(c.id, c.name, e)} className="rounded-lg px-2 py-1 text-red-300/80 hover:bg-red-900/30">
                Löschen
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
