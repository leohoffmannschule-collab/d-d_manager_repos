/**
 * Die Handlungen aus dem Grundregelwerk – zum Nachschlagen, nicht zum
 * Ausfüllen. Zugeklappt, weil sie sich nie ändern; wer sie einmal kennt,
 * braucht sie nicht jeden Abend vor Augen.
 */
import { useState } from 'react';
import { STANDARD_AKTIONEN, aktionArtLabel } from '../../../lib/dnd5e.js';
import { IconBook } from '../../icons.jsx';

export default function Standardaktionen() {
  const [offen, setOffen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        className="btn btn-plate"
        aria-expanded={offen}
      >
        <IconBook size={16} />
        {offen ? 'Standardhandlungen zuklappen' : 'Was am Tisch immer geht'}
      </button>

      {offen && (
        <ul className="mt-3 divide-y divide-dotted divide-rule border border-rule bg-panel-soft/60">
          {STANDARD_AKTIONEN.map((a) => (
            <li key={a.name} className="px-3.5 py-2">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <b className="font-display text-ink">{a.name}</b>
                <span className="border border-rule px-1.5 font-display text-[10px] tracking-[0.12em] text-faint uppercase">
                  {aktionArtLabel(a.art)}
                </span>
              </div>
              <p className="text-[15px] text-sepia">{a.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
