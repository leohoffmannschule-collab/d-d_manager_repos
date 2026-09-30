/**
 * Ein Element mit Werten, die erst im Browser feststehen – ohne `style`.
 *
 * Der Haken `useLaufstil` (lib/laufstil.js) darf nicht in einer Schleife
 * stehen. In Listen – die Farbpunkte der Konten, die Zeilen im Chat, die
 * Farben im Figurenfeld – trägt deshalb jedes Element sein eigenes kleines
 * Bauteil:
 *
 *     <Laufwert als="span" className="farbpunkt h-3 w-3" werte={{ '--farbe': konto.color }} />
 *
 * Alles außer `als`, `werte` und `className` geht unverändert an das
 * Element (Rückrufe, aria-…, title, ref).
 */
import { useLaufstil } from '../lib/laufstil.js';

export default function Laufwert({ als: Element = 'span', werte, className = '', ...rest }) {
  const klasse = useLaufstil(werte);
  return <Element className={`${className} ${klasse}`.trim()} {...rest} />;
}
