/**
 * Die Karte „Zauberplätze“: je Grad verbraucht / höchstens.
 *
 * Zauberplätze sind Verbrauch, kein Vorrat – gezählt wird `used` gegen
 * `max`. Wird `max` gesenkt, rückt `used` mit, damit nie mehr verbraucht
 * als vorhanden ist. Eine lange Rast setzt `used` auf null (lib/rasten.js).
 */
import { SPELL_LEVELS } from '../../../lib/dnd5e.js';
import { Card, Stepper } from '../../ui.jsx';

export default function Zauberplaetze({ slots, onChange }) {
  return (
    <Card title="Zauberplätze">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {SPELL_LEVELS.map((lvl) => {
          const slot = slots[lvl] ?? { max: 0, used: 0 };
          return (
            <div key={lvl} className="border border-rule bg-panel-soft/60 p-2.5 text-center">
              <p className="mb-1.5 font-display text-[10px] tracking-[0.14em] text-faint uppercase">Grad {lvl}</p>
              <Stepper
                value={slot.used}
                onChange={(v) => onChange({ ...slots, [lvl]: { ...slot, used: v } })}
                max={slot.max}
              />
              <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[14px] text-faint">
                von
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={slot.max}
                  onChange={(e) => {
                    const max = Number(e.target.value) || 0;
                    onChange({
                      ...slots,
                      [lvl]: { max, used: Math.min(slot.used, max) },
                    });
                  }}
                  className="w-11 border border-rule bg-panel px-1 py-0.5 text-center font-display text-ink focus:border-rubric focus:outline-none"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
