import { useCallback, useEffect, useState } from 'react';
import { IconClose, IconD20, IconD20Detailed, IconEyeOff, IconTrash } from './icons.jsx';
import { diceApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLive, useLiveStatus } from '../lib/live.jsx';

const DICE = [4, 6, 8, 10, 12, 20, 100];

function Wurfzeile({ wurf, hervorgehoben }) {
  const wuerfe = wurf.details
    .flatMap((d) => d.rolls ?? [])
    .slice(0, 12)
    .join(', ');

  return (
    <li className={`px-3.5 py-2.5 ${hervorgehoben ? 'border-l-[3px] border-gold bg-gold/15' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: wurf.color ?? '#a3927a' }} />
            <span className="truncate font-display text-[12px] tracking-[0.08em] text-sepia uppercase">
              {wurf.userName}
            </span>
            {wurf.secret && <IconEyeOff size={12} className="text-rubric" />}
          </span>
          <span className={hervorgehoben ? 'text-ink' : 'text-sepia'}>
            {wurf.label ? `${wurf.label} · ` : ''}
            {wurf.expression}
            {wuerfe && <span className="text-faint"> [{wuerfe}]</span>}
          </span>
        </div>
        <span className={`font-display font-bold ${hervorgehoben ? 'text-2xl text-rubric' : 'text-lg text-sepia'}`}>
          {wurf.total}
        </span>
      </div>
    </li>
  );
}

export default function DiceRoller() {
  const { isDm } = useAuth();
  const { generation } = useLiveStatus();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(1);
  const [modifier, setModifier] = useState(0);
  const [ausdruck, setAusdruck] = useState('');
  const [modus, setModus] = useState('normal');
  const [verdeckt, setVerdeckt] = useState(false);
  const [history, setHistory] = useState([]);
  const [neu, setNeu] = useState(false);
  const [fehler, setFehler] = useState('');

  const laden = useCallback(() => {
    diceApi
      .history(40)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  useEffect(() => {
    if (generation > 0) laden();
  }, [generation, laden]);

  // Würfe der anderen laufen live ein – auch bei geschlossenem Beutel.
  useLive('wurf', (wurf) => {
    setHistory((h) => (h.some((w) => w.id === wurf.id) ? h : [wurf, ...h].slice(0, 40)));
    if (!open) setNeu(true);
  });
  useLive('wuerfe:geleert', () => setHistory([]));

  async function wuerfeln(expression, label = '') {
    setFehler('');
    try {
      const eigener = await diceApi.roll({ expression, mode: modus, label, secret: isDm && verdeckt });
      // Sofort eintragen, statt die ganze Chronik neu zu holen. Trifft der
      // eigene Wurf gleich darauf über den Live-Kanal ein, fängt ihn die
      // Prüfung auf die Kennung oben ab.
      setHistory((h) => (h.some((w) => w.id === eigener.id) ? h : [eigener, ...h].slice(0, 40)));
      setModus('normal');
    } catch (err) {
      setFehler(err.message);
    }
  }

  const schnellWurf = (sides) => {
    const mod = Number(modifier) || 0;
    wuerfeln(`${count}W${sides}${mod ? (mod > 0 ? `+${mod}` : mod) : ''}`);
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setNeu(false);
          laden();
        }}
        className="fixed right-4 bottom-24 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-rubric text-[#f0dca8] shadow-lg shadow-black/40 ring-2 ring-gold active:scale-95 md:bottom-6"
        aria-label="Würfelbeutel öffnen"
      >
        <IconD20Detailed size={32} />
        {neu && <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-gold-soft ring-2 ring-rubric" />}
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

            <p className="mb-4 text-[15px] text-sepia italic">Jeder Wurf steht sofort bei allen am Tisch.</p>

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
                <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                  Modifikator
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={modifier}
                  onChange={(e) => setModifier(Number(e.target.value) || 0)}
                  className="field-box font-display text-lg"
                />
              </label>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ['normal', 'gerade heraus'],
                ['advantage', 'Vorteil'],
                ['disadvantage', 'Nachteil'],
              ].map(([wert, text]) => (
                <button
                  key={wert}
                  onClick={() => setModus(wert)}
                  className={`min-h-11 border px-3.5 font-display text-[12px] tracking-[0.10em] uppercase ${
                    modus === wert ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
                  }`}
                >
                  {text}
                </button>
              ))}
              {isDm && (
                <button
                  onClick={() => setVerdeckt((v) => !v)}
                  className={`flex min-h-11 items-center gap-2 border px-3.5 font-display text-[12px] tracking-[0.10em] uppercase ${
                    verdeckt ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
                  }`}
                  title="Nur die Spielleitung sieht diesen Wurf"
                >
                  <IconEyeOff size={14} /> verdeckt
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2.5">
              {DICE.map((sides) => (
                <button
                  key={sides}
                  onClick={() => schnellWurf(sides)}
                  className="btn-plate h-13 px-0 py-3 text-[15px] tracking-[0.06em] text-ink"
                >
                  W{sides}
                </button>
              ))}
              {isDm && (
                <button
                  onClick={() => diceApi.clear().then(() => setHistory([]))}
                  disabled={history.length === 0}
                  className="flex h-13 items-center justify-center gap-1.5 border border-dashed border-rule-strong py-3 text-[15px] text-sepia italic disabled:opacity-40"
                >
                  <IconTrash size={15} /> leeren
                </button>
              )}
            </div>

            <form
              className="mt-3 flex gap-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (!ausdruck.trim()) return;
                wuerfeln(ausdruck.trim());
                setAusdruck('');
              }}
            >
              <input
                value={ausdruck}
                onChange={(e) => setAusdruck(e.target.value)}
                placeholder="eigener Ausdruck, z. B. 2W6+3"
                className="field-box flex-1"
              />
              <button type="submit" className="btn btn-seal px-5">
                Werfen
              </button>
            </form>

            {fehler && <p className="mt-3 text-rubric">{fehler}</p>}

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2.5">
                <span className="font-display text-[11px] tracking-[0.16em] text-faint uppercase">Wurfchronik</span>
                <span className="h-px flex-1 bg-rule" />
              </div>

              {history.length === 0 ? (
                <p className="text-sepia italic">Der Beutel ist noch ungeöffnet.</p>
              ) : (
                <ul className="space-y-1">
                  {history.map((wurf, index) => (
                    <Wurfzeile key={wurf.id} wurf={wurf} hervorgehoben={index === 0} />
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
