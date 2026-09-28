import { useEffect, useState } from 'react';
import { fehlertext } from '../lib/beschriftung.js';

/**
 * Das Sicherheitsnetz für Knöpfe, die ihren Fehler nicht selbst anzeigen.
 *
 * Viele Handgriffe am Tisch sind ein einzelner Aufruf ohne eigenes
 * Fehlerfeld: „Zug weiter“, „Figur entfernen“, „Runde holen“. Weist der
 * Server so einen Aufruf ab – 403, weil die Rolle inzwischen eine andere
 * ist, oder 409, weil die Kampagne weggeräumt wurde –, landete die Absage
 * bisher nur in der Konsole des Browsers. Am Tisch sah es aus, als hätte
 * der Knopf schlicht nicht funktioniert.
 *
 * Statt vierzig Knöpfe einzeln mit try/catch zu umwickeln, fängt diese eine
 * Stelle jede Absage, die niemand behandelt hat, und zeigt den Satz des
 * Servers (oder, wo einer hinterlegt ist, den aus lib/beschriftung.js).
 *
 * Nur Absagen *des Servers* – erkennbar am `status`, den lib/api.js
 * anheftet. Ein Programmierfehler in der Oberfläche bleibt ein
 * Programmierfehler und gehört in die Konsole, nicht in eine Meldung, mit
 * der am Tisch niemand etwas anfangen kann.
 */
const ANZEIGEDAUER_MS = 6000;

export default function Stoerung() {
  const [meldung, setMeldung] = useState(null);

  useEffect(() => {
    let zeitgeber = null;
    const unbehandelt = (ereignis) => {
      const grund = ereignis.reason;
      if (typeof grund?.status !== 'number') return;
      // Abgefangen und angezeigt – dann muss es nicht auch noch in die Konsole.
      ereignis.preventDefault();
      clearTimeout(zeitgeber);
      setMeldung(fehlertext(grund));
      zeitgeber = setTimeout(() => setMeldung(null), ANZEIGEDAUER_MS);
    };
    window.addEventListener('unhandledrejection', unbehandelt);
    return () => {
      window.removeEventListener('unhandledrejection', unbehandelt);
      clearTimeout(zeitgeber);
    };
  }, []);

  if (!meldung) return null;

  return (
    <div className="fixed inset-x-0 top-36 z-50 flex justify-center px-4" role="alert">
      <button
        type="button"
        onClick={() => setMeldung(null)}
        className="panel border-rubric px-4 py-2.5 text-left text-rubric shadow-lg"
        title="Schließen"
      >
        {meldung}
      </button>
    </div>
  );
}
