import { Link, useNavigate } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useCharaktere } from '../lib/daten.jsx';
import { IconCrown, IconEye, IconEyeOff, IconPlus, IconScroll } from '../components/icons.jsx';

function subtitle(count) {
  if (count === 0) return 'Noch ist keine Seele verzeichnet';
  if (count === 1) return 'Ein Gefährte ist in diesem Almanach verzeichnet';
  return `${count} Gefährten sind in diesem Almanach verzeichnet`;
}


/** Ein Blatt in der Übersicht. Zweimal gebraucht: für die Runde und hinter dem Schirm. */
function Blatt({ c, user, isDm, onOeffnen, onAbschrift, onLoeschen }) {
  const hp = c.hp;
  const eigenes = c.ownerId === user.id;
  const ratio = hp?.max ? Math.max(0, Math.min(1, (hp.current ?? 0) / hp.max)) : null;

  return (
    <div
      onClick={onOeffnen}
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
          {c.npc ? (
            <p className="flex items-center gap-1.5 text-[14px] text-gold">
              <IconEyeOff size={12} /> nur für die Spielleitung
            </p>
          ) : (
            !eigenes && (
              <p className="flex items-center gap-1.5 text-[14px] text-faint">
                <IconEye size={12} />
                {c.ownerName ? `Blatt von ${c.ownerName}` : 'ohne Besitzer'}
              </p>
            )
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
        <button onClick={onAbschrift} className="min-h-9 text-sepia hover:text-ink">
          Abschrift
        </button>
        {(eigenes || isDm) && (
          <button onClick={onLoeschen} className="min-h-9 text-rubric hover:underline">
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isDm } = useAuth();
  const { charaktere: characters, laden, fehler } = useCharaktere();
  const runde = (characters ?? []).filter((c) => !c.npc);
  const nsc = (characters ?? []).filter((c) => c.npc);
  const error = fehler?.message ?? '';

  async function handleDuplicate(id, e) {
    e.preventDefault();
    e.stopPropagation();
    await charactersApi.duplicate(id);
    laden();
  }

  async function handleDelete(id, name, e) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`„${name}“ wirklich unwiderruflich aus dem Almanach tilgen?`)) return;
    await charactersApi.remove(id);
    laden();
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
            Deine Gefährten
          </h1>
          <p className="mt-1 text-sepia italic">{subtitle(runde.length)}</p>
        </div>
        <Link to="/neu" className="btn btn-seal">
          <IconPlus size={17} />
          Neuer Charakter
        </Link>
      </div>

      {error && <p className="panel border-rubric p-4 text-rubric">{error}</p>}

      {characters === null && !error && <p className="text-sepia italic">Die Seiten werden aufgeschlagen …</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {runde.map((c) => (
          <Blatt
            key={c.id}
            c={c}
            user={user}
            isDm={isDm}
            onOeffnen={() => navigate(`/charaktere/${c.id}`)}
            onAbschrift={(e) => handleDuplicate(c.id, e)}
            onLoeschen={(e) => handleDelete(c.id, c.name, e)}
          />
        ))}
      </div>

      {/* Die Blätter hinter dem Schirm. Sie stehen bewusst getrennt: Was der
          Runde gehört, soll nicht zwischen den Wirtsleuten und Räubern liegen. */}
      {nsc.length > 0 && (
        <>
          <h2 className="mt-9 mb-1 flex items-center gap-2.5 font-display text-lg font-semibold tracking-[0.08em] text-ink uppercase">
            <IconCrown size={20} className="text-gold" />
            Hinter dem Schirm
          </h2>
          <p className="mb-4 text-sepia italic">
            {nsc.length === 1 ? 'Ein NSC-Blatt' : `${nsc.length} NSC-Blätter`} – nur du siehst sie.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {nsc.map((c) => (
              <Blatt
                key={c.id}
                c={c}
                user={user}
                isDm={isDm}
                onOeffnen={() => navigate(`/charaktere/${c.id}`)}
                onAbschrift={(e) => handleDuplicate(c.id, e)}
                onLoeschen={(e) => handleDelete(c.id, c.name, e)}
              />
            ))}
          </div>
        </>
      )}

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
