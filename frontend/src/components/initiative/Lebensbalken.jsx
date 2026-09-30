/** Ein Balken für die Trefferpunkte, wo Zahlen zu viel verraten würden. */
import { ZUSTAND, benenne } from '../../lib/beschriftung.js';
import { prozent } from '../../lib/stilwerte.js';

export default function Lebensbalken({ hp, maxHp, status }) {
  if (hp == null) {
    return <span className="text-[15px] text-faint italic">{benenne(ZUSTAND, status, '—')}</span>;
  }
  const anteil = maxHp ? Math.max(0, Math.min(1, hp / maxHp)) : 0;
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex h-2 w-12 overflow-hidden border border-rule-strong bg-panel-soft">
        {/* Derselbe Balken wie unter einer Figur auf dem Tisch (siehe
            stile/spieltisch/figuren.css) – über der Hälfte grün, darunter rot. Eine
            Farbe, ein Name, zwei Stellen, die ihn benutzen. */}
        <span
          className={`figur-balken ${anteil > 0.5 ? 'figur-balken-gut' : 'figur-balken-schlecht'}`}
          style={{ '--anteil': prozent(anteil) }}
        />
      </span>
      <span className="font-display text-[14px] text-sepia">
        {hp}
        {maxHp ? `/${maxHp}` : ''}
      </span>
    </span>
  );
}
