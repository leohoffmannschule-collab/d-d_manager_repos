/**
 * Kleiner Punkt, der zeigt, ob der Draht zum Spieltisch steht.
 *
 * Unscheinbar, aber wichtig: Wer im Funkloch sitzt, sieht sonst eine Karte,
 * auf der sich nichts mehr bewegt, und hält sie für richtig.
 */
export default function Verbindung({ connected }) {
  return (
    <span
      title={connected ? 'Mit dem Spieltisch verbunden' : 'Verbindung unterbrochen – es wird neu geknüpft'}
      className={`h-2 w-2 shrink-0 rounded-full ${connected ? 'bg-gold-soft' : 'animate-pulse bg-rubric'}`}
    />
  );
}
