import { AUSSEHEN_FELDER, MERKMAL_ARTEN, merkmalArtLabel } from '../../lib/dnd5e.js';
import { Card, TextAreaField, TextField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const FEATURE_FIELDS = [
  { key: 'name', label: 'Merkmal', wide: true },
  { key: 'category', label: 'Woher', type: 'select', options: MERKMAL_ARTEN },
  { key: 'source', label: 'Quelle' },
  { key: 'page', label: 'Seite' },
  { key: 'description', label: 'Beschreibung', type: 'textarea', wide: true },
];

/**
 * Die Merkmale nach Herkunft geordnet – erst was die Klasse gibt, dann die
 * Spezies, dann Talente. Wer am Tisch nachschlägt, sucht genau so; eine
 * ungeordnete Liste zwingt jedes Mal zum Durchlesen.
 */
function MerkmaleNachArt({ features }) {
  const gefuellt = features.filter((m) => m.name || m.description);
  if (gefuellt.length === 0) return null;

  return (
    <div className="mt-5 flex flex-col gap-4 border-t border-dashed border-rule pt-4">
      {MERKMAL_ARTEN.map(([art]) => {
        const dieser = gefuellt.filter((m) => (m.category ?? 'sonstiges') === art);
        if (dieser.length === 0) return null;
        return (
          <div key={art}>
            <p className="mb-1.5 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">
              {merkmalArtLabel(art)}
            </p>
            <ul className="divide-y divide-dotted divide-rule border border-rule bg-panel-soft/60">
              {dieser.map((m) => (
                <li key={m.id} className="px-3.5 py-2">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <b className="font-display text-ink">{m.name || 'ohne Namen'}</b>
                    {(m.source || m.page) && (
                      <span className="text-[13px] text-faint italic">
                        {[m.source, m.page].filter(Boolean).join(' ')}
                      </span>
                    )}
                  </div>
                  {m.description && <p className="text-[15px] whitespace-pre-line text-sepia">{m.description}</p>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export default function BackgroundTab({ data, update }) {
  const traits = data.traits;
  const proficiencies = data.proficiencies;
  const appearance = data.appearance ?? {};

  return (
    <div className="flex flex-col gap-4">
      <Card title="Erscheinung">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 md:grid-cols-3">
          {AUSSEHEN_FELDER.map((f) => (
            <TextField
              key={f.key}
              label={f.label}
              value={appearance[f.key]}
              onChange={(v) => update(`appearance.${f.key}`, v)}
            />
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-dashed border-rule pt-4 sm:grid-cols-2">
          <TextAreaField
            label="Erscheinungsbild"
            value={traits.look}
            onChange={(v) => update('traits.look', v)}
            placeholder="Wie du wirkst, wenn du einen Raum betrittst"
          />
          <TextAreaField
            label="Verbündete & Organisationen"
            value={traits.allies}
            onChange={(v) => update('traits.allies', v)}
            placeholder="Orden, Gilde, Familie, wer dir etwas schuldet"
          />
        </div>
      </Card>

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

      <Card title="Merkmale & Eigenschaften">
        <RepeatingRows
          items={data.features}
          onChange={(rows) => update('features', rows)}
          fields={FEATURE_FIELDS}
          addLabel="Merkmal hinzufügen"
          emptyText="Noch keine besonderen Merkmale verzeichnet."
        />
        <MerkmaleNachArt features={data.features} />
      </Card>

      <Card title="Lose Notizen">
        <TextAreaField value={traits.notes} onChange={(v) => update('traits.notes', v)} rows={5} />
      </Card>
    </div>
  );
}
