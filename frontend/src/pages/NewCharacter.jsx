import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { charactersApi, compendiumApi } from '../lib/api.js';
import { defaultCharacterData, defaultFreeformData } from '../lib/dnd5e.js';
import { Card, FieldLabel } from '../components/ui.jsx';

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
      .catch(() =>
        setApiWarning('Das Kompendium ist gerade nicht erreichbar – Volk und Klasse lassen sich auch später eintragen.')
      );
  }, [system]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Ohne Namen kein Eintrag – bitte trage einen ein.');
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
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase">Neuer Eintrag</h1>
      <p className="mb-6 text-sepia italic">Wer soll in den Almanach aufgenommen werden?</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Card title="Name">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Elara Nachtwind"
            className="field-line font-display text-2xl"
          />
        </Card>

        <Card title="Regelwerk">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSystem('dnd5e')}
              className={`flex flex-col gap-1 border p-4 text-left ${
                system === 'dnd5e' ? 'border-gold bg-gold/12' : 'border-rule bg-panel-soft'
              }`}
            >
              <span className="font-display text-[15px] tracking-[0.08em] text-ink">D&amp;D 5e</span>
              <span className="text-sepia italic">Vollständiges Charakterblatt mit Kompendium</span>
            </button>
            <button
              type="button"
              onClick={() => setSystem('freeform')}
              className={`flex flex-col gap-1 border p-4 text-left ${
                system === 'freeform' ? 'border-gold bg-gold/12' : 'border-rule bg-panel-soft'
              }`}
            >
              <span className="font-display text-[15px] tracking-[0.08em] text-ink">Anderes System</span>
              <span className="text-sepia italic">Freie Abschnitte, selbst benannt</span>
            </button>
          </div>
        </Card>

        {system === 'dnd5e' && (
          <Card title="Herkunft">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <FieldLabel>Volk</FieldLabel>
                <input
                  list="race-options"
                  value={race}
                  onChange={(e) => setRace(e.target.value)}
                  placeholder="z. B. Elf"
                  className="field-line"
                />
                <datalist id="race-options">
                  {races.map((r) => (
                    <option key={r.index} value={r.name} />
                  ))}
                </datalist>
              </label>
              <label className="block">
                <FieldLabel>Klasse</FieldLabel>
                <input
                  list="class-options"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="z. B. Magier"
                  className="field-line"
                />
                <datalist id="class-options">
                  {classes.map((c) => (
                    <option key={c.index} value={c.name} />
                  ))}
                </datalist>
              </label>
            </div>
            {apiWarning && <p className="mt-3 text-[15px] text-faint italic">{apiWarning}</p>}
          </Card>
        )}

        {error && <p className="panel border-rubric p-4 text-rubric">{error}</p>}

        <button type="submit" disabled={saving} className="btn btn-seal w-full disabled:opacity-60">
          {saving ? 'Wird eingetragen …' : 'In den Almanach eintragen'}
        </button>
      </form>
    </div>
  );
}
