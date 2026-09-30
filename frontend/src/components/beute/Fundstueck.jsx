/**
 * Ein Gegenstand in der Kiste: Name, Anzahl, Notiz – und wer ihn trägt.
 *
 * „Trägt“ heißt nur: Er steht bei diesem Charakter vermerkt. In dessen
 * Inventar wandert er dadurch nicht; das bleibt eine Entscheidung am Tisch.
 */
import { stashApi } from '../../lib/api.js';
import Kopierziel from '../Kopierziel.jsx';
import { IconTrash } from '../icons.jsx';

export default function Fundstueck({ fund: g, charaktere, isDm }) {
  return (
    <li className="border border-rule bg-panel-soft px-3 py-2">
      {/* Der Name steht auf eigener Zeile – in einer schmalen
          Seitenleiste bliebe daneben nur „Silberner S…“ übrig. */}
      <p className="text-ink">
        {g.qty > 1 && <span className="font-display text-rubric">{g.qty}× </span>}
        {g.name}
      </p>
      {g.notes && <p className="text-[15px] text-sepia italic">{g.notes}</p>}
      <div className="mt-1.5 flex items-center gap-2">
        <select
          value={g.holderId ?? ''}
          onChange={(e) => stashApi.updateItem(g.id, { holderId: e.target.value || null })}
          className="field-box min-w-0 flex-1 py-1 text-[15px]"
          title="Wer trägt es?"
        >
          <option value="">niemand trägt es</option>
          {charaktere.map((c) => (
            <option key={c.id} value={c.id}>
              trägt: {c.name}
            </option>
          ))}
        </select>
        {/* Ein Fund, der in zwei Geschichten vorkommen soll. Wer
            ihn drüben trägt, entscheidet sich über den Namen. */}
        {isDm && (
          <Kopierziel
            kopieren={(ziel) => stashApi.kopieren(g.id, ziel)}
            beschriftung="kopieren"
            nachOben
            klasse="min-h-11 shrink-0 px-1 text-[15px] text-sepia hover:text-ink"
          />
        )}
        <button
          onClick={() => stashApi.removeItem(g.id)}
          className="flex h-11 w-11 shrink-0 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
          aria-label="Aus der Kiste nehmen"
        >
          <IconTrash size={15} />
        </button>
      </div>
    </li>
  );
}
