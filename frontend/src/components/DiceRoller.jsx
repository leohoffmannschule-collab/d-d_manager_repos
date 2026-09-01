import { useState } from 'react';
import { IconClose, IconD20, IconD20Detailed } from './icons.jsx';
import { newId } from '../lib/id.js';

const DICE = [4, 6, 8, 10, 12, 20, 100];

function rollDie(sides) {
  return 1 + Math.floor(Math.random() * sides);
}

export default function DiceRoller() {
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [history, setHistory] = useState([]);

  function roll(sides) {
    const rolls = Array.from({ length: count }, () => rollDie(sides));
    const total = rolls.reduce((sum, r) => sum + r, 0) + Number(modifier || 0);
    const entry = {
      id: newId(),
      label: `${count}W${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
      rolls,
      total,
    };
    setHistory((h) => [entry, ...h].slice(0, 20));
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-24 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-rubric text-[#f0dca8] shadow-lg shadow-black/40 ring-2 ring-gold active:scale-95 md:bottom-6"
        aria-label="Würfelbeutel öffnen"
      >
        <IconD20Detailed size={32} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(40,28,14,0.55)] md:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto border-t-2 border-gold bg-panel px-5 pt-5 pb-8 shadow-2xl md:border md:border-rule"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-rubric">
                <IconD20 size={20} />
                <h2 className="font-display text-[17px] font-semibold tracking-[0.12em] uppercase">Würfelbeutel</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center border border-rule text-sepia"
                aria-label="Schließen"
              >
                <IconClose size={16} />
              </button>
            </div>

            <div className="mb-4 flex gap-3">
              <label className="flex-1">
                <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Anzahl</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
                  className="field-box font-display text-lg"
                />
              </label>
              <label className="flex-1">
                <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Modifikator</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={modifier}
                  onChange={(e) => setModifier(Number(e.target.value) || 0)}
                  className="field-box font-display text-lg"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {DICE.map((sides) => (
                <button
                  key={sides}
                  onClick={() => roll(sides)}
                  className="btn-plate h-13 px-0 text-[15px] tracking-[0.06em] text-ink"
                >
                  W{sides}
                </button>
              ))}
              <button
                onClick={() => setHistory([])}
                disabled={history.length === 0}
                className="flex h-13 items-center justify-center border border-dashed border-rule-strong text-[15px] text-sepia italic disabled:opacity-40"
              >
                leeren
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="font-display text-[11px] tracking-[0.16em] text-faint uppercase">Wurfchronik</span>
                <span className="h-px flex-1 bg-rule" />
              </div>

              {history.length === 0 ? (
                <p className="text-sepia italic">Der Beutel ist noch ungeöffnet.</p>
              ) : (
                <ul className="space-y-1">
                  {history.map((entry, index) => (
                    <li
                      key={entry.id}
                      className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${
                        index === 0 ? 'border-l-[3px] border-gold bg-gold/15' : ''
                      }`}
                    >
                      <span className={index === 0 ? 'text-ink' : 'text-sepia'}>
                        {entry.label} <span className="text-faint">[{entry.rolls.join(', ')}]</span>
                      </span>
                      <span
                        className={`font-display font-bold ${index === 0 ? 'text-2xl text-rubric' : 'text-lg text-sepia'}`}
                      >
                        {entry.total}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
