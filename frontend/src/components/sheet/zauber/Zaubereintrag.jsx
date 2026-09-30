/**
 * Ein Zauber in der Liste – zugeklappt eine Zeile, aufgeschlagen alle
 * Spalten und der Text aus dem Kompendium.
 *
 * Der Eintrag hält keinen eigenen Zustand: Welcher Zauber offen ist, was
 * gerade nachgeschlagen wird und was schon nachgeschlagen wurde, merkt sich
 * der Reiter (SpellsTab). So bleibt ein nachgeschlagener Text erhalten,
 * wenn man einen anderen Zauber aufschlägt und wieder zurückkommt.
 *
 * @param {object} props
 * @param {object} props.spell        der Zauber aus `spellcasting.spells`
 * @param {number} props.grad         0 für Zaubertricks
 * @param {boolean} props.offen       aufgeschlagen?
 * @param {boolean} props.laedt       wird gerade nachgeschlagen?
 * @param {object|null} [props.detail] der Kompendiumseintrag, falls geladen
 * @param {() => void} props.onAufschlagen
 * @param {(feld: string, wert: unknown) => void} props.onAendern
 * @param {() => void} props.onEntfernen
 */
import CompendiumDetail from '../../CompendiumDetail.jsx';
import { IconBook } from '../../icons.jsx';
import { FieldLabel, TextField, Toggle } from '../../ui.jsx';
import Kurzzeile from './Kurzzeile.jsx';
import Zauberspalten from './Zauberspalten.jsx';

export default function Zaubereintrag({ spell, grad, offen, laedt, detail, onAufschlagen, onAendern, onEntfernen }) {
  return (
    <li className="px-3 py-1.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAufschlagen}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          title="Zauber aufschlagen"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-rule font-display text-[13px] text-rubric">
            {grad === 0 ? 'T' : grad}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-ink">{spell.name || 'ohne Namen'}</span>
            <Kurzzeile spell={spell} />
          </span>
          <IconBook
            size={14}
            className={offen ? 'shrink-0 text-rubric' : 'shrink-0 text-faint'}
          />
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <Toggle
            checked={spell.prepared}
            onChange={(v) => onAendern('prepared', v)}
            label={<span className="text-[15px] text-sepia">vorbereitet</span>}
          />
          <button
            onClick={onEntfernen}
            className="min-h-9 px-1 text-[15px] text-rubric hover:underline"
          >
            Entfernen
          </button>
        </div>
      </div>

      {offen && (
        <div className="mt-2 mb-1 border-l-[3px] border-gold bg-panel-soft/70 px-4 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <TextField
              label="Zaubername"
              value={spell.name}
              onChange={(v) => onAendern('name', v)}
              className="w-full sm:min-w-[12rem] sm:flex-1"
            />
            <label className="block w-24">
              <FieldLabel>Grad</FieldLabel>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={9}
                value={spell.level ?? 0}
                onChange={(e) =>
                  onAendern('level', Math.min(9, Math.max(0, Number(e.target.value) || 0)))
                }
                className="field-line font-display"
              />
            </label>
          </div>
          <div className="mt-2">
            <Zauberspalten spell={spell} setzen={onAendern} />
          </div>

          <div className="mt-3 border-t border-dotted border-rule pt-3">
            {laedt ? (
              <p className="text-sepia italic">Der Zauber wird nachgeschlagen …</p>
            ) : detail ? (
              <CompendiumDetail item={detail} />
            ) : (
              <p className="text-sepia italic">
                Zu diesem Zauber liegt kein Eintrag vor – er wurde von Hand eingetragen oder das
                Kompendium ist nicht erreichbar.
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
