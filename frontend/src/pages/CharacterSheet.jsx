import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { setPath, fileToResizedDataUrl } from '../lib/setPath.js';
import { withDefaults } from '../lib/dnd5e.js';
import { useLive } from '../lib/live.jsx';
import { IconCheck, IconEye, IconQuill } from '../components/icons.jsx';
import OverviewTab from '../components/sheet/OverviewTab.jsx';
import CombatTab from '../components/sheet/CombatTab.jsx';
import InventoryTab from '../components/sheet/InventoryTab.jsx';
import SpellsTab from '../components/sheet/SpellsTab.jsx';
import BackgroundTab from '../components/sheet/BackgroundTab.jsx';
import FreeformSheet from '../components/sheet/FreeformSheet.jsx';

// Die Figurenschmiede bringt three.js mit. Das lädt erst, wenn jemand den
// Reiter aufschlägt – wer nur sein Blatt führt, wartet nicht darauf.
const MiniTab = lazy(() => import('../components/sheet/MiniTab.jsx'));

const DND_TABS = [
  { key: 'overview', label: 'Übersicht', Component: OverviewTab },
  { key: 'combat', label: 'Kampf', Component: CombatTab },
  { key: 'inventory', label: 'Inventar', Component: InventoryTab },
  { key: 'spells', label: 'Zauber', Component: SpellsTab },
  { key: 'background', label: 'Hintergrund', Component: BackgroundTab },
  { key: 'mini', label: 'Figur', Component: MiniTab },
];

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [tab, setTab] = useState('overview');
  const saveTimer = useRef(null);
  // Solange hier noch ungesicherte Änderungen liegen, darf nichts von außen
  // hereinschreiben – sonst überholt die Spielleitung den eigenen Federstrich.
  const offeneAenderung = useRef(false);

  useEffect(() => {
    setCharacter(null);
    charactersApi
      .get(id)
      // Blätter aus früheren Fassungen kennen die neuen Felder noch nicht.
      .then((geladen) =>
        setCharacter(geladen.system === 'dnd5e' ? { ...geladen, data: withDefaults(geladen.data) } : geladen)
      )
      .catch((err) => setError(err.message));
  }, [id]);

  // Teilt die Spielleitung im Kampf Schaden aus, wandern die Trefferpunkte
  // von selbst aufs Blatt.
  useLive('charakter:aktualisiert', (nachricht) => {
    if (nachricht.id !== id || offeneAenderung.current || !nachricht.hp) return;
    setCharacter((prev) =>
      prev ? { ...prev, data: setPath(prev.data, 'combat.hp', { ...prev.data?.combat?.hp, ...nachricht.hp }) } : prev
    );
  });

  const persist = useCallback(
    (next) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      offeneAenderung.current = true;
      setSaveStatus('pending');
      saveTimer.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await charactersApi.update(id, { name: next.name, data: next.data });
          setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('error');
          setError(err.message);
        } finally {
          offeneAenderung.current = false;
        }
      }, 600);
    },
    [id]
  );

  function updateName(name) {
    setCharacter((prev) => {
      const next = { ...prev, name };
      persist(next);
      return next;
    });
  }

  function updateData(path, value) {
    setCharacter((prev) => {
      const next = { ...prev, data: setPath(prev.data, path, value) };
      persist(next);
      return next;
    });
  }

  // Für Vorgänge, die viele Felder auf einmal betreffen – etwa eine Rast.
  function replaceData(data) {
    setCharacter((prev) => {
      const next = { ...prev, data };
      persist(next);
      return next;
    });
  }

  async function handlePortrait(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file);
    updateData('portrait', dataUrl);
  }

  async function handleDelete() {
    if (!confirm(`„${character.name}“ wirklich unwiderruflich aus dem Almanach tilgen?`)) return;
    await charactersApi.remove(id);
    navigate('/');
  }

  if (error) return <p className="panel border-rubric p-4 text-rubric">{error}</p>;
  if (!character) return <p className="text-sepia italic">Das Blatt wird aufgeschlagen …</p>;

  const isDnd = character.system === 'dnd5e';
  const hp = character.data?.combat?.hp;
  // Fremde Blätter liegen offen auf dem Tisch, aber schreiben darf nur, wem
  // sie gehören (und die Spielleitung).
  const schreibbar = character.editable !== false;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 grow basis-64 items-center gap-4">
          <label
            className={`group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-panel-soft ring-2 ring-gold ring-offset-2 ring-offset-[var(--color-ground)] ${
              schreibbar ? 'cursor-pointer' : ''
            }`}
          >
            {character.data.portrait ? (
              <img src={character.data.portrait} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-rubric">
                {character.name.trim().charAt(0).toUpperCase() || '?'}
              </span>
            )}
            <span className="absolute inset-0 hidden items-center justify-center bg-black/55 font-display text-[11px] tracking-[0.1em] text-[#f0dca8] uppercase group-hover:flex">
              Bildnis
            </span>
            <input type="file" accept="image/*" onChange={handlePortrait} disabled={!schreibbar} className="hidden" />
          </label>

          <div className="min-w-0 flex-1">
            <input
              value={character.name}
              onChange={(e) => updateName(e.target.value)}
              readOnly={!schreibbar}
              className="w-full border-0 bg-transparent p-0 font-display text-2xl font-semibold text-ink focus:outline-none sm:text-3xl"
              aria-label="Name des Charakters"
            />
            <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px]">
              <span className="text-sepia italic">
                {isDnd
                  ? [character.data.race, character.data.className, `Stufe ${character.data.level}`]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Freies System'}
              </span>
              <span className="h-1 w-1 rounded-full bg-gold" />
              {schreibbar ? (
                <SaveStatus status={saveStatus} />
              ) : (
                <span className="flex items-center gap-1.5 text-faint">
                  <IconEye size={14} />
                  Blatt von {character.ownerName ?? 'jemand anderem'} – nur zum Lesen
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {isDnd && hp && (
            <div className="flex flex-col items-center gap-1 border border-rule bg-panel/70 px-4 py-2">
              <span className="font-display text-[10px] tracking-[0.18em] text-faint uppercase">Trefferpunkte</span>
              <span className="font-display text-2xl font-bold text-rubric">
                {hp.current ?? 0}
                <span className="text-[15px] text-faint"> / {hp.max ?? 0}</span>
              </span>
            </div>
          )}

          {schreibbar && (
            <button onClick={handleDelete} className="min-h-11 px-2 text-[15px] text-rubric hover:underline">
              Löschen
            </button>
          )}
        </div>
      </div>

      {isDnd ? (
        <>
          <div className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-rule-strong px-4">
            {DND_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 border px-4 py-3 font-display text-[14px] tracking-[0.08em] ${
                  tab === t.key
                    ? '-mb-px border-rule-strong border-b-panel bg-panel text-rubric'
                    : 'border-transparent text-sepia'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <fieldset disabled={!schreibbar} className="min-w-0 border-0 p-0">
            <Suspense fallback={<p className="text-sepia italic">Die Schmiede wird angeheizt …</p>}>
              {DND_TABS.map(
                (t) =>
                  tab === t.key && (
                    <t.Component key={t.key} data={character.data} update={updateData} replace={replaceData} />
                  )
              )}
            </Suspense>
          </fieldset>
        </>
      ) : (
        <fieldset disabled={!schreibbar} className="min-w-0 border-0 p-0">
          <FreeformSheet data={character.data} update={updateData} />
        </fieldset>
      )}
    </div>
  );
}

function SaveStatus({ status }) {
  if (status === 'idle') return null;

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-[#5f7a4e]">
        <IconCheck size={13} />
        In der Chronik verzeichnet
      </span>
    );
  }

  if (status === 'error') {
    return <span className="text-rubric">Konnte nicht gespeichert werden</span>;
  }

  return (
    <span className="flex items-center gap-1.5 text-faint">
      <IconQuill size={14} />
      {status === 'saving' ? 'Wird eingetragen …' : 'Tinte trocknet …'}
    </span>
  );
}
