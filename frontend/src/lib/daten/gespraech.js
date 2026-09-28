/**
 * Was am Tisch gesagt und gewürfelt wird: Würfelchronik und Chat.
 *
 * Beide folgen demselben Muster: Die eigene Zeile landet sofort in der
 * Liste, weil das Echo über den Live-Kanal erst einen Wimpernschlag später
 * käme. Die Prüfung auf die Kennung verhindert, dass sie dann doppelt
 * dasteht.
 */
import { useCallback, useState } from 'react';
import { chatApi, diceApi } from '../api.js';
import { useLive } from '../live.jsx';
import { useDaten } from './grundlage.js';

/* --- Würfel -------------------------------------------------------------- */

/**
 * Die Wurfchronik. `ungelesen` treibt den Punkt am Würfelbeutel an, wenn
 * die Leiste gerade zugeklappt ist.
 *
 * `aufnehmen` gibt es nach außen, weil der eigene Wurf sofort dastehen soll
 * – das Echo über den Live-Kanal käme erst einen Wimpernschlag später. Die
 * Prüfung auf die Kennung verhindert, dass er dann doppelt erscheint.
 */
export function useWuerfe(anzahl = 40) {
  const holen = useCallback(() => diceApi.history(anzahl), [anzahl]);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, []);
  const [ungelesen, setUngelesen] = useState(false);

  const aufnehmen = useCallback(
    (wurf) => setDaten((liste) => (liste.some((w) => w.id === wurf.id) ? liste : [wurf, ...liste].slice(0, anzahl))),
    [setDaten, anzahl]
  );

  useLive('wurf', (wurf) => {
    aufnehmen(wurf);
    setUngelesen(true);
  });
  useLive('wuerfe:geleert', () => setDaten([]));

  return { wuerfe: daten ?? [], aufnehmen, ungelesen, gelesen: () => setUngelesen(false), laden, fehler, laedt };
}

/* --- Chat ---------------------------------------------------------------- */

/**
 * Der Chat am Tisch. Wie beim Würfelbeutel: Eigene Zeilen landen sofort in
 * der Liste, das Echo über den Live-Kanal erkennt sie an der Kennung wieder.
 * Geflüstertes kommt gar nicht erst an, wenn es einen nichts angeht – das
 * entscheidet der Server, nicht diese Datei.
 */
export function useChat(anzahl = 100) {
  const holen = useCallback(() => chatApi.history(anzahl), [anzahl]);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, []);
  const [ungelesen, setUngelesen] = useState(0);

  const aufnehmen = useCallback(
    (zeile) =>
      setDaten((liste) => (liste.some((n) => n.id === zeile.id) ? liste : [zeile, ...liste].slice(0, anzahl))),
    [setDaten, anzahl]
  );

  useLive('chat', (zeile) => {
    aufnehmen(zeile);
    setUngelesen((n) => n + 1);
  });
  useLive('chat:geleert', () => setDaten([]));

  return {
    zeilen: daten ?? [],
    aufnehmen,
    ungelesen,
    gelesen: () => setUngelesen(0),
    laden,
    fehler,
    laedt,
  };
}
