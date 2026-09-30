/**
 * Was von einem Zauber in der Zeile steht, ohne ihn aufzuschlagen:
 * Zeit · Reichweite · Dauer · Rettungswurf – nur, was ausgefüllt ist.
 */
export default function Kurzzeile({ spell }) {
  const teile = [spell.time, spell.range, spell.duration, spell.save].filter(Boolean);
  if (teile.length === 0) return null;
  return <p className="truncate text-[13px] text-faint">{teile.join(' · ')}</p>;
}
