import { useState } from 'react';
import { useLive } from '../lib/live.jsx';
import { IconEyeOff } from './icons.jsx';

/**
 * Kurze Anzeige des jüngsten Wurfs – damit ein Wurf vom Charakterblatt
 * nicht stumm im Würfelbeutel verschwindet, sondern am Tisch auffällt.
 */
export default function Wurfmeldung() {
  const [wurf, setWurf] = useState(null);

  useLive('wurf', (neu) => {
    setWurf(neu);
    const kennung = neu.id;
    setTimeout(() => setWurf((aktuell) => (aktuell?.id === kennung ? null : aktuell)), 4500);
  });

  if (!wurf) return null;

  const wuerfe = wurf.details.flatMap((d) => d.rolls ?? []);
  const natuerlich = wurf.details.find((d) => d.token?.includes('W20'));
  const zwanzig = natuerlich?.chosen === 20 || (natuerlich?.rolls?.length === 1 && natuerlich.rolls[0] === 20);
  const eins = natuerlich?.chosen === 1 || (natuerlich?.rolls?.length === 1 && natuerlich.rolls[0] === 1);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-20 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={`panel flex items-center gap-3.5 px-4 py-2.5 shadow-lg ${
          zwanzig ? 'border-gold ring-1 ring-gold' : eins ? 'border-rubric' : ''
        }`}
      >
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: wurf.color ?? '#a3927a' }} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[11px] tracking-[0.12em] text-faint uppercase">
            {wurf.userName}
            {wurf.secret && <IconEyeOff size={11} className="ml-1.5 inline text-rubric" />}
          </span>
          <span className="text-ink">
            {wurf.label || wurf.expression}
            {wuerfe.length > 0 && <span className="text-faint"> [{wuerfe.slice(0, 8).join(', ')}]</span>}
          </span>
        </span>
        <span
          className={`font-display text-2xl font-bold ${
            zwanzig ? 'text-gold' : eins ? 'text-rubric' : 'text-rubric'
          }`}
        >
          {wurf.total}
        </span>
      </div>
    </div>
  );
}
