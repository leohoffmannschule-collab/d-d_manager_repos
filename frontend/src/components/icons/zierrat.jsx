/**
 * Zierrat: der vierstrahlige Stern vor jeder Rubrik und der Wappenschild
 * hinter jedem Attribut.
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

/**
 * Der Wappenschild hinter einem Attribut auf der Übersicht des Blattes.
 *
 * Wie er aussieht – Füllung, Randfarbe, Randstärke –, steht im Stilblatt
 * (`.wappenschild` in stile/bauteile.css); ab einem Modifikator von +3
 * wird er golden (`stark`), eine kleine Freude beim Steigern.
 */
export function Wappenschild({ stark = false }) {
  return (
    <svg viewBox="0 0 74 88" className={`wappenschild ${stark ? 'wappenschild-stark' : ''}`} aria-hidden="true">
      <path d="M4 5h66v42c0 20-14 30-33 36C18 77 4 67 4 47z" />
    </svg>
  );
}
