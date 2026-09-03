import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLive, useLiveStatus } from '../lib/live.jsx';
import { IconEye, IconPlus, IconScroll } from '../components/icons.jsx';

function subtitle(count) {
  if (count === 0) return 'Noch ist keine Seele verzeichnet';
  if (count === 1) return 'Ein Gefährte ist in diesem Almanach verzeichnet';
  return `${count} Gefährten sind in diesem Almanach verzeichnet`;
}

export default function Dashboard() {
  const [characters, setCharacters] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, isDm } = useAuth();
  const { generation } = useLiveStatus();

  const laden = useCallback(() => {
    charactersApi
      .list()
      .then(setCharacters)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    laden();
  }, [laden, generation]);

  // Trefferpunkte der Mitspieler bewegen sich mit – so sieht die Runde
  // sofort, wenn es jemanden erwischt hat.
  useLive('charakter:aktualisiert', (nachricht) => {
    setCharacters((liste) => {
      if (!liste) return liste;
      const index = liste.findIndex((c) => c.id === nachricht.id);
      if (index === -1) return liste;
      const kopie = [...liste];
      kopie[index] = { ...kopie[index], ...nachricht };
      return kopie;
    });
  });
  useLive('charakter:entfernt', ({ id }) => {
    setCharacters((liste) => liste?.filter((c) => c.id !== id) ?? liste);
  });

  async function handleDuplicate(id, e) {
    e.preventDefault();
    e.stopPropagation();
    const copy = await charactersApi.duplicate(id);
    setCharacters((list) => [copy, ...list]);
  }

  async function handleDelete(id, name, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`„${name}“ wirklich unwiderruflich aus dem Almanach tilgen?`)) return;
    await charactersApi.remove(id);
    setCharacters((list) => list.filter((c) => c.id !== id));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
            Deine Gefährten
          </h1>
          <p className="mt-1 text-sepia italic">{subtitle(characters?.length ?? 0)}</p>
        </div>
        <Link to="/neu" className="btn btn-seal">
          <IconPlus size={17} />
          Neuer Charakter
        </Link>
      </div>

      {error && <p className="panel border-rubric p-4 text-rubric">{error}</p>}

      {characters === null && !error && <p className="text-sepia italic">Die Seiten werden aufgeschlagen …</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {characters?.map((c) => {
          const hp = c.hp;
          const eigenes = c.ownerId === user.id;
          const ratio = hp?.max ? Math.max(0, Math.min(1, (hp.current ?? 0) / hp.max)) : null;
          return (
            <div
              key={c.id}
              onClick={() => navigate(`/charaktere/${c.id}`)}
              className="panel flex cursor-pointer flex-col gap-3.5 p-4 transition hover:border-gold"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-soft ring-2 ring-gold ring-offset-2 ring-offset-[var(--color-panel)]">
                  {c.portrait ? (
                    <img src={c.portrait} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-3xl font-semibold text-rubric">
                      {c.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display text-xl font-semibold text-ink">{c.name}</h2>
                  <p className="truncate text-sepia italic">
                    {[c.race, c.classLevel].filter(Boolean).join(' · ') || 'Noch ohne Angaben'}
                  </p>
                  {!eigenes && (
                    <p className="flex items-center gap-1.5 text-[14px] text-faint">
                      <IconEye size={12} />
                      {c.ownerName ? `Blatt von ${c.ownerName}` : 'ohne Besitzer'}
                    </p>
                  )}
                </div>
              </div>

              {ratio !== null && (
                <div className="flex items-center gap-2.5">
                  <span className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">Trefferpunkte</span>
                  <span className="flex h-2.5 flex-1 overflow-hidden border border-rule-strong bg-panel-soft">
                    <span className="bg-rubric" style={{ width: `${ratio * 100}%` }} />
                  </span>
                  <span className="font-display text-[15px] font-semibold text-rubric">
                    {hp.current ?? 0}/{hp.max}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-4 border-t border-dashed border-rule pt-3">
                <button onClick={(e) => handleDuplicate(c.id, e)} className="min-h-9 text-sepia hover:text-ink">
                  Abschrift
                </button>
                {(eigenes || isDm) && (
                  <button onClick={(e) => handleDelete(c.id, c.name, e)} className="min-h-9 text-rubric hover:underline">
                    Löschen
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {characters?.length === 0 && (
        <Link
          to="/neu"
          className="flex flex-col items-center justify-center gap-3 border border-dashed border-rule-strong p-12 text-center text-sepia"
        >
          <IconScroll size={32} className="text-faint" />
          <span className="italic">Ein leeres Blatt wartet auf den ersten Helden</span>
          <span className="font-display text-[13px] tracking-[0.12em] text-rubric uppercase">Charakter erschaffen</span>
        </Link>
      )}
    </div>
  );
}
