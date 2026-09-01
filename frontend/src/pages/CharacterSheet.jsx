import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { setPath, fileToResizedDataUrl } from '../lib/setPath.js';
import OverviewTab from '../components/sheet/OverviewTab.jsx';
import CombatTab from '../components/sheet/CombatTab.jsx';
import InventoryTab from '../components/sheet/InventoryTab.jsx';
import SpellsTab from '../components/sheet/SpellsTab.jsx';
import BackgroundTab from '../components/sheet/BackgroundTab.jsx';
import FreeformSheet from '../components/sheet/FreeformSheet.jsx';

const DND_TABS = [
  { key: 'overview', label: 'Übersicht', Component: OverviewTab },
  { key: 'combat', label: 'Kampf', Component: CombatTab },
  { key: 'inventory', label: 'Inventar', Component: InventoryTab },
  { key: 'spells', label: 'Zauber', Component: SpellsTab },
  { key: 'background', label: 'Hintergrund', Component: BackgroundTab },
];

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [tab, setTab] = useState('overview');
  const saveTimer = useRef(null);

  useEffect(() => {
    setCharacter(null);
    charactersApi
      .get(id)
      .then(setCharacter)
      .catch((err) => setError(err.message));
  }, [id]);

  const persist = useCallback(
    (next) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSaveStatus('pending');
      saveTimer.current = setTimeout(async () => {
        setSaveStatus('saving');
        try {
          await charactersApi.update(id, { name: next.name, data: next.data });
          setSaveStatus('saved');
        } catch {
          setSaveStatus('error');
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

  async function handlePortrait(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file);
    updateData('portrait', dataUrl);
  }

  async function handleDelete() {
    if (!confirm(`„${character.name}“ wirklich unwiderruflich löschen?`)) return;
    await charactersApi.remove(id);
    navigate('/');
  }

  if (error) return <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-200">{error}</p>;
  if (!character) return <p className="text-parchment-100/60">Lade Charakter…</p>;

  const isDnd = character.system === 'dnd5e';

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-ink-700 bg-ink-800">
          {character.data.portrait ? (
            <img src={character.data.portrait} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl">🛡️</span>
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs text-white opacity-0 group-hover:opacity-100">
            Ändern
          </span>
          <input type="file" accept="image/*" onChange={handlePortrait} className="hidden" />
        </label>

        <div className="min-w-0 flex-1">
          <input
            value={character.name}
            onChange={(e) => updateName(e.target.value)}
            className="w-full bg-transparent font-display text-2xl text-parchment-50 focus:outline-none"
          />
          <p className="text-xs text-parchment-100/50">
            {isDnd ? `${character.data.race || '–'} · ${character.data.className || '–'} · Stufe ${character.data.level}` : 'Freies System'}
            {' · '}
            <SaveStatus status={saveStatus} />
          </p>
        </div>

        <button onClick={handleDelete} className="rounded-lg px-3 py-2 text-xs text-red-300/80 hover:bg-red-900/30">
          Löschen
        </button>
      </div>

      {isDnd ? (
        <>
          <div className="mb-4 flex gap-1 overflow-x-auto pb-1">
            {DND_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                  tab === t.key ? 'bg-ink-800 text-gold-400' : 'text-parchment-100/60 hover:bg-ink-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {DND_TABS.map(
            (t) =>
              tab === t.key && (
                <t.Component key={t.key} data={character.data} update={(path, value) => updateData(path, value)} />
              )
          )}
        </>
      ) : (
        <FreeformSheet data={character.data} update={(path, value) => updateData(path, value)} />
      )}
    </div>
  );
}

function SaveStatus({ status }) {
  const labels = {
    idle: '',
    pending: 'Änderungen…',
    saving: 'Speichert…',
    saved: 'Gespeichert',
    error: 'Fehler beim Speichern',
  };
  return <span className={status === 'error' ? 'text-red-300' : ''}>{labels[status]}</span>;
}
