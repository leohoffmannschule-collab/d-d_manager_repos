import { IconHeart } from '../../icons.jsx';


/**
 * Die drei Kreise für Erfolge bzw. Fehlschläge beim Rettungswurf gegen den
 * Tod. Ein Klick auf den bereits gefüllten Kreis nimmt ihn wieder zurück –
 * verklickt hat man sich hier schneller als irgendwo sonst.
 */
export default function Todeszeichen({ label, count, onChange, filledClass }) {
  return (
    <div>
      <p className="mb-1.5 font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</p>
      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(count === n ? n - 1 : n)}
            className={`h-7 w-7 rounded-full border-2 ${n <= count ? filledClass : 'border-rule-strong'}`}
            aria-label={`${label} ${n}`}
          />
        ))}
      </div>
    </div>
  );
}
