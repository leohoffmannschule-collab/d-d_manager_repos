/**
 * Zierrat: der vierstrahlige Stern vor jeder Rubrik.
 *
 * Kein Symbol im engeren Sinn – er bedeutet nichts, er schmückt. Deshalb
 * gefüllt statt gezeichnet und ohne den Rahmen aus rahmen.jsx.
 */
/** Vierstrahliger Stern – der goldene Zierrat vor jeder Rubrik. */
export function Fleuron({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5 14 9l6.5 1.5L15.5 15l1.5 6.5L12 18l-5 3.5L8.5 15 3.5 10.5 10 9z" />
    </svg>
  );
}
