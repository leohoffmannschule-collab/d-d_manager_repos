import { Card, TextAreaField, TextField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const FEATURE_FIELDS = [
  { key: 'name', label: 'Merkmal', wide: true },
  { key: 'source', label: 'Quelle' },
  { key: 'description', label: 'Beschreibung', type: 'textarea', wide: true },
];

export default function BackgroundTab({ data, update }) {
  const traits = data.traits;
  const proficiencies = data.proficiencies;

  return (
    <div className="flex flex-col gap-4">
      <Card title="Wesenszüge">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextAreaField
            label="Persönlichkeit"
            value={traits.personality}
            onChange={(v) => update('traits.personality', v)}
          />
          <TextAreaField label="Ideale" value={traits.ideals} onChange={(v) => update('traits.ideals', v)} />
          <TextAreaField label="Bindungen" value={traits.bonds} onChange={(v) => update('traits.bonds', v)} />
          <TextAreaField label="Makel" value={traits.flaws} onChange={(v) => update('traits.flaws', v)} />
        </div>
      </Card>

      <Card title="Chronik">
        <TextAreaField value={traits.backstory} onChange={(v) => update('traits.backstory', v)} rows={7} />
      </Card>

      <Card title="Übungen & Sprachen">
        <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
          <TextField label="Rüstungen" value={proficiencies.armor} onChange={(v) => update('proficiencies.armor', v)} />
          <TextField label="Waffen" value={proficiencies.weapons} onChange={(v) => update('proficiencies.weapons', v)} />
          <TextField label="Werkzeuge" value={proficiencies.tools} onChange={(v) => update('proficiencies.tools', v)} />
          <TextField
            label="Sprachen"
            value={proficiencies.languages}
            onChange={(v) => update('proficiencies.languages', v)}
          />
        </div>
      </Card>

      <Card title="Merkmale & Züge">
        <RepeatingRows
          items={data.features}
          onChange={(rows) => update('features', rows)}
          fields={FEATURE_FIELDS}
          addLabel="Merkmal hinzufügen"
          emptyText="Noch keine besonderen Merkmale verzeichnet."
        />
      </Card>

      <Card title="Lose Notizen">
        <TextAreaField value={traits.notes} onChange={(v) => update('traits.notes', v)} rows={5} />
      </Card>
    </div>
  );
}
