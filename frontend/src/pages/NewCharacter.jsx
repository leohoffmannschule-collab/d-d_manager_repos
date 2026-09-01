import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charactersApi, compendiumApi } from '../lib/api.js';
import { defaultCharacterData, defaultFreeformData } from '../lib/dnd5e.js';

export default function NewCharacter() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [system, setSystem] = useState('dnd5e');
  const [race, setRace] = useState('');
  const [className, setClassName] = useState('');
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [apiWarning, setApiWarning] = useState('');

  useEffect(() => {
    if (system !== 'dnd5e') return;
    Promise.all([compendiumApi.list('races'), compendiumApi.list('classes')])
      .then(([raceData, classData]) => {
        setRaces(raceData.results ?? []);
        setClasses(classData.results ?? []);
      })
      .catch(() => setApiWarning('D&D 5e API gerade nicht erreichbar – Rasse/Klasse können später manuell eingetragen werden.'));
  }, [system]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let data;
      if (system === 'dnd5e') {
        data = defaultCharacterData();
        data.race = race;
        data.className = className;
      } else {
        data = defaultFreeformData();
      }
      const character = await charactersApi.create({ name: name.trim(), system, data });
      navigate(`/charaktere/${character.id}`);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-display text-2xl text-parchment-50">Neuer Charakter</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-parchment-100/70">Name des Charakters</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Elara Nachtwind"
            className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-parchment-50 placeholder:text-parchment-100/30 focus:border-gold-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-parchment-100/70">System</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSystem('dnd5e')}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                system === 'dnd5e' ? 'border-gold-500 bg-ink-800 text-gold-400' : 'border-ink-700 bg-ink-900 text-parchment-100/60'
              }`}
            >
              D&amp;D 5e
              <span className="mt-0.5 block text-xs font-normal opacity-70">Vollständiges Charakterblatt</span>
            </button>
            <button
              type="button"
              onClick={() => setSystem('freeform')}
              className={`rounded-xl border px-3 py-3 text-sm font-medium ${
                system === 'freeform' ? 'border-gold-500 bg-ink-800 text-gold-400' : 'border-ink-700 bg-ink-900 text-parchment-100/60'
              }`}
            >
              Anderes System
              <span className="mt-0.5 block text-xs font-normal opacity-70">Freie Abschnitte</span>
            </button>
          </div>
        </div>

        {system === 'dnd5e' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-parchment-100/70">Volk</label>
              <input
                list="race-options"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder="z. B. Elf"
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-parchment-50 focus:border-gold-500 focus:outline-none"
              />
              <datalist id="race-options">
                {races.map((r) => (
                  <option key={r.index} value={r.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-parchment-100/70">Klasse</label>
              <input
                list="class-options"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="z. B. Magier"
                className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-2.5 text-parchment-50 focus:border-gold-500 focus:outline-none"
              />
              <datalist id="class-options">
                {classes.map((c) => (
                  <option key={c.index} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>
        )}

        {apiWarning && <p className="text-xs text-parchment-100/50">{apiWarning}</p>}
        {error && <p className="rounded-lg bg-red-900/40 p-3 text-sm text-red-200">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-gold-500 py-3 font-semibold text-ink-950 shadow active:scale-95 disabled:opacity-60"
        >
          {saving ? 'Wird erstellt…' : 'Charakter erschaffen'}
        </button>
      </form>
    </div>
  );
}
