/**
 * Die Münzen in der Kiste – fünf Felder, eines je Sorte.
 *
 * Jede Änderung wird sofort örtlich angezeigt und im Hintergrund
 * gespeichert. Scheitert das Speichern, holt der Live-Kanal den wahren
 * Stand ohnehin gleich wieder herein; eine eigene Fehlermeldung wäre hier
 * nur Lärm.
 */
import { stashApi } from '../../lib/api.js';
import { MUENZEN } from './muenzen.js';

export default function Muenzen({ kiste, setKiste }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2.5">
        <span className="font-display text-[13px] tracking-[0.12em] text-rubric uppercase">Münzen</span>
        <span className="h-px flex-1 bg-rule" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {MUENZEN.map(([schluessel, label]) => (
          <label key={schluessel} className="block">
            <span className="mb-1 block font-display text-[10px] tracking-[0.14em] text-faint uppercase">
              {label}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={kiste.coins[schluessel] ?? 0}
              onChange={(e) => {
                const naechste = { ...kiste.coins, [schluessel]: Math.max(0, Number(e.target.value) || 0) };
                setKiste((k) => ({ ...k, coins: naechste }));
                stashApi.setCoins(naechste).catch(() => {});
              }}
              className="field-box text-center font-display"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
