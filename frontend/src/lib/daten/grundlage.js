/**
 * Das Fundament der Datenschicht: einmal laden, bei jeder neuen
 * Live-Verbindung nachladen, Fehler festhalten.
 *
 * Jeder Haken im Ordner `daten/` baut darauf auf. Wer einen neuen schreibt,
 * fängt hier an: `useDaten` nimmt eine Funktion, die etwas vom Server holt,
 * und gibt die Daten samt Nachlade-Handgriff zurück.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveStatus } from '../live.jsx';

/**
 * Gemeinsames Fundament aller Haken: einmal laden, bei jeder neuen
 * Live-Verbindung nachladen, Fehler festhalten.
 *
 * `generation` zählt hoch, sobald die Verbindung (neu) steht. Nach einem
 * Funkloch wird dadurch alles nachgezogen, was in der Zwischenzeit geschah.
 *
 * @template T
 * @param {() => Promise<T>} holen mit useCallback festgehalten (siehe unten)
 * @param {T} [anfang] was bis zur ersten Antwort gilt
 * @returns {{ daten: T, setDaten: Function, laden: () => Promise<T|null>, fehler: Error|null, laedt: boolean }}
 */
export function useDaten(holen, anfang = null) {
  // Wichtig: `holen` muss vom Aufrufer mit useCallback festgehalten werden.
  // Eine bei jedem Rendern neue Funktion löste unten den useEffect erneut
  // aus – das wäre eine Endlosschleife aus Laden und Neuzeichnen.
  const { generation } = useLiveStatus();
  const [daten, setDaten] = useState(anfang);
  const [fehler, setFehler] = useState(null);
  const [laedt, setLaedt] = useState(true);
  // Welcher Ladevorgang der jüngste ist. Zwei können sich überholen – etwa
  // das Nachladen nach einem Funkloch und ein Live-Ereignis, das ebenfalls
  // `laden` ruft. Ohne diese Zählung gewönne, wer *zuletzt ankommt*, nicht
  // wer zuletzt gefragt hat, und ein alter Stand überschriebe den neuen.
  const juengster = useRef(0);

  // `laden` gibt das Geladene auch zurück – manchmal braucht der Aufrufer
  // den frischen Stand sofort und nicht erst beim nächsten Rendern.
  const laden = useCallback(async () => {
    const dieser = ++juengster.current;
    try {
      const frisch = await holen();
      if (dieser === juengster.current) {
        setDaten(frisch);
        setFehler(null);
      }
      return frisch;
    } catch (err) {
      if (dieser === juengster.current) setFehler(err);
      return null;
    } finally {
      if (dieser === juengster.current) setLaedt(false);
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
