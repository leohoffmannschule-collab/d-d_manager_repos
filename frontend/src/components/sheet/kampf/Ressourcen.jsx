import { newId } from '../../../lib/id.js';
import { AUFFRISCHUNG } from './felder.js';
import { NumberField, Stepper, TextField } from '../../ui.jsx';
import { IconPlus, IconTrash } from '../../icons.jsx';


/**
 * Selbstverwaltete Zähler: Handauflegen, Kampfrausch, Inspiration des
 * Barden. `recharge` sagt, wann sie sich füllen – bei kurzer oder langer
 * Rast; das wendet lib/rasten.js an.
 */
export default function Ressourcen({ data, update }) {
  const liste = data.resources ?? [];

  const setzen = (id, feld, wert) =>
    update(
      'resources',
      liste.map((r) => (r.id === id ? { ...r, [feld]: wert } : r))
    );

  return (
    <div className="space-y-2">
      {liste.length === 0 && (
        <p className="text-sepia italic">
          Hier hinein kommt, was gezählt werden muss: Wutanfälle, Ki-Punkte, bardische Inspiration,
          Handauflegen, Zauberkraft.
        </p>
      )}

      {liste.map((r) => (
        <div key={r.id} className="flex flex-wrap items-end gap-2.5 border border-rule bg-panel-soft p-2.5">
          <TextField
            label="Name"
            value={r.name}
            onChange={(v) => setzen(r.id, 'name', v)}
            className="min-w-[9rem] flex-1"
          />
          <Stepper label="Übrig" value={r.current} onChange={(v) => setzen(r.id, 'current', v)} max={r.max || 99} />
          <NumberField label="Höchstens" value={r.max} min={0} onChange={(v) => setzen(r.id, 'max', v)} className="w-24" />
          <label className="block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              Erneuert sich
            </span>
            <select
              value={r.recharge}
              onChange={(e) => setzen(r.id, 'recharge', e.target.value)}
              className="field-box w-32"
            >
              {AUFFRISCHUNG.map(([wert, text]) => (
                <option key={wert} value={wert}>
                  {text}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => update('resources', liste.filter((x) => x.id !== r.id))}
            className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
            aria-label="Entfernen"
          >
            <IconTrash size={16} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          update('resources', [...liste, { id: newId(), name: '', current: 0, max: 0, recharge: 'lang' }])
        }
        className="btn btn-plate"
      >
        <IconPlus size={16} /> Ressource anlegen
      </button>
    </div>
  );
}
