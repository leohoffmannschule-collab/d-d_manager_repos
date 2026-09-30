/**
 * Eine Zeile im Bauplan einer Begegnung: wer, wie viele, verborgen oder
 * nicht.
 *
 * Die Werte (TP, RK) stehen im Posten selbst und nicht nur im Bestiarium –
 * siehe den Kopf von Encounters.jsx, warum.
 */
import { mediaApi } from '../../../lib/api.js';
import { IconEyeOff, IconTrash } from '../../icons.jsx';

export default function Posten({ eintrag, onChange, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border border-rule bg-panel-soft px-3 py-2">
      {eintrag.mediaId && <img src={mediaApi.url(eintrag.mediaId)} alt="" className="h-10 w-10 object-contain" />}
      <span className="min-w-0 flex-1 truncate text-ink">
        {eintrag.name}
        <span className="text-faint"> · {eintrag.hp} TP · RK {eintrag.ac}</span>
      </span>
      <input
        type="number"
        min={1}
        max={20}
        value={eintrag.count}
        onChange={(e) => onChange({ ...eintrag, count: Math.max(1, Number(e.target.value) || 1) })}
        className="h-11 w-16 border border-rule bg-panel text-center font-display text-ink"
        aria-label="Anzahl"
      />
      <button
        type="button"
        onClick={() => onChange({ ...eintrag, hidden: !eintrag.hidden })}
        className={`flex h-11 w-11 items-center justify-center border ${
          eintrag.hidden ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
        }`}
        title={eintrag.hidden ? 'tritt verborgen auf' : 'tritt offen auf'}
      >
        <IconEyeOff size={16} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
        aria-label="Entfernen"
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
}
