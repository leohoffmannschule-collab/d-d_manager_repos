import { useState } from 'react';

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
      id: crypto.randomUUID(),
      label: `${count}W${sides}${modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
      rolls,
      total,
      time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    };
    setHistory((h) => [entry, ...h].slice(0, 20));
  }

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-20 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-2xl font-bold text-ink-950 shadow-lg shadow-black/40 active:scale-95 md:bottom-6"
        aria-label="Würfel öffnen"
      >
        🎲
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 md:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-900 p-5 pb-8 shadow-2xl md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl text-gold-400">Würfel</h2>
              <button onClick={() => setOpen(false)} className="rounded-full p-2 text-parchment-100/70 hover:bg-ink-800">
                ✕
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm text-parchment-100/70">
                Anzahl
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
                  className="ml-2 w-16 rounded-lg border border-ink-700 bg-ink-800 px-2 py-1 text-parchment-50"
                />
              </label>
              <label className="text-sm text-parchment-100/70">
                Modifikator
                <input
                  type="number"
                  value={modifier}
                  onChange={(e) => setModifier(Number(e.target.value) || 0)}
                  className="ml-2 w-16 rounded-lg border border-ink-700 bg-ink-800 px-2 py-1 text-parchment-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {DICE.map((sides) => (
                <button
                  key={sides}
                  onClick={() => roll(sides)}
                  className="rounded-xl border border-ink-700 bg-ink-800 py-3 text-sm font-semibold text-parchment-50 active:scale-95"
                >
                  W{sides}
                </button>
              ))}
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-parchment-100/70">Verlauf</h3>
                {history.length > 0 && (
                  <button onClick={() => setHistory([])} className="text-xs text-parchment-100/50 underline">
                    leeren
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-parchment-100/40">Noch keine Würfe.</p>
              ) : (
                <ul className="space-y-1.5">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between rounded-lg bg-ink-800/60 px-3 py-2 text-sm">
                      <span className="text-parchment-100/70">
                        {entry.label} <span className="text-parchment-100/40">[{entry.rolls.join(', ')}]</span>
                      </span>
                      <span className="font-display text-lg text-gold-400">{entry.total}</span>
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
