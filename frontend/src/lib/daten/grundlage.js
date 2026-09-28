/**
 * Das Fundament der Datenschicht: einmal laden, bei jeder neuen
 * Live-Verbindung nachladen, Fehler festhalten.
 *
 * Jeder Haken im Ordner `daten/` baut darauf auf. Wer einen neuen schreibt,
 * fängt hier an: `useDaten` nimmt eine Funktion, die etwas vom Server holt,
 * und gibt die Daten samt Nachlade-Handgriff zurück.
 */
import { useCallback, useEffect, useState } from 'react';
import { useLiveStatus } from '../live.jsx';

/**
 * Gemeinsames Fundament aller Haken: einmal laden, bei jeder neuen
 * Live-Verbindung nachladen, Fehler festhalten.
 *
 * `generation` zählt hoch, sobald die Verbindung (neu) steht. Nach einem
 * Funkloch wird dadurch alles nachgezogen, was in der Zwischenzeit geschah.
 */
export function useDaten(holen, anfang = null) {
  // Wichtig: `holen` muss vom Aufrufer mit useCallback festgehalten werden.
  // Eine bei jedem Rendern neue Funktion löste unten den useEffect erneut
  // aus – das wäre eine Endlosschleife aus Laden und Neuzeichnen.
  const { generation } = useLiveStatus();
  const [daten, setDaten] = useState(anfang);
  const [fehler, setFehler] = useState(null);
  const [laedt, setLaedt] = useState(true);

  // `laden` gibt das Geladene auch zurück – manchmal braucht der Aufrufer
  // den frischen Stand sofort und nicht erst beim nächsten Rendern.
  const laden = useCallback(async () => {
    try {
      const frisch = await holen();
      setDaten(frisch);
      setFehler(null);
      return frisch;
    } catch (err) {
      setFehler(err);
      return null;
    } finally {
      setLaedt(false);
    }
  }, [holen]);

  // Erst laden, wenn der Live-Draht steht (generation > 0). Zwei Fliegen:
  // Der erste Ladevorgang passiert nicht zu früh, und nach jedem Abriss
  // wird alles nachgezogen, was während der Unterbrechung geschah.
  useEffect(() => {
    if (generation > 0) laden();
  }, [generation, laden]);

  return { daten, setDaten, laden, fehler, laedt };
}
