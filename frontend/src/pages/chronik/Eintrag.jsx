/**
 * Eine Zeile der Chronik: Uhrzeit, Symbol, Satz.
 *
 * Der Satz kommt fertig vom Server (`text`), das Symbol aus `kind`. Eine
 * andere Oberfläche könnte aus `kind` und `meta` einen ganz eigenen Satz
 * bauen – deshalb trägt jeder Eintrag beides.
 */
import { CHRONIK_ART, benenne } from '../../lib/beschriftung.js';
import { IconQuill, IconTrash } from '../../components/icons.jsx';
import { SYMBOL, uhrzeit } from './kapitel.js';

export default function Eintrag({ eintrag, isDm, onLoeschen }) {
  const Symbol = SYMBOL[eintrag.kind] ?? IconQuill;
  return (
    <li className="group flex items-start gap-3 border-b border-dotted border-rule py-1.5">
      <span className="mt-0.5 w-11 shrink-0 font-display text-[12px] text-faint">{uhrzeit(eintrag.createdAt)}</span>
      <Symbol size={15} className={`mt-0.5 shrink-0 ${eintrag.secret ? 'text-rubric' : 'text-faint'}`} />
      <span className="min-w-0 flex-1 text-ink" title={benenne(CHRONIK_ART, eintrag.kind)}>
        {eintrag.text}
        {eintrag.secret && <span className="ml-2 text-[14px] text-rubric italic">verdeckt</span>}
      </span>
      {isDm && (
        <button
          onClick={() => onLoeschen(eintrag.id)}
          className="shrink-0 text-faint opacity-0 group-hover:opacity-100 hover:text-rubric"
          aria-label="Eintrag streichen"
        >
          <IconTrash size={14} />
        </button>
      )}
    </li>
  );
}
