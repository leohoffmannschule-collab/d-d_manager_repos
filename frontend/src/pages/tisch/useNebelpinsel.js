/**
 * Den Nebel malen, ohne dass es ruckelt: sofort örtlich, gebündelt zum
 * Server.
 *
 * Jeder Pinselstrich trifft Dutzende Felder, und jedes davon sofort zu
 * schicken hieße Dutzende Anfragen je Strich. Stattdessen weicht der Nebel
 * hier sofort (`nebelSetzen`), die Felder sammeln sich in einem Puffer, und
 * alle PINSEL_MS geht gebündelt hinaus, was sich angesammelt hat.
 */
import { useCallback, useRef } from 'react';
import { scenesApi } from '../../lib/api.js';

// So lange werden Pinselstriche gesammelt, bevor sie gebündelt hinausgehen.
// 120 ms fühlen sich noch unmittelbar an, sparen aber aus einem Strich über
// dreißig Felder eine einzige Anfrage statt dreißig.
const PINSEL_MS = 120;

/**
 * @param {object|null} scene        die aufgelegte Szene
 * @param {(felder: string[], auf: boolean) => void} nebelSetzen  örtlich anzeigen
 * @param {() => void} ladeSzene     bei einem Fehler: den Stand des Servers holen
 * @returns {(felder: string[], auf: boolean) => void} der Rückruf für Board.onPaintFog
 */
export function useNebelpinsel(scene, nebelSetzen, ladeSzene) {
  // Zwei Töpfe, weil ein Strich beides enthalten kann: aufgedeckte und
  // wieder verhüllte Felder. Mengen (Set), damit ein doppelt überstrichenes
  // Feld nur einmal hinausgeht.
  const pinselPuffer = useRef({ auf: new Set(), zu: new Set() });
  const pinselZeit = useRef(null);

  /**
   * Malen fühlt sich flüssig an, weil der Nebel zuerst lokal weicht.
   *
   * Schlägt das Senden fehl, wird die Szene neu geladen – sonst sähe die
   * Spielleitung aufgedecktes Land, das die Runde nie zu sehen bekommt.
   * Ein Strich, der beim Verlassen des Tisches noch im Puffer liegt, geht
   * trotzdem hinaus: Der Zeitgeber läuft weiter, und das ist gewollt.
   */
  return useCallback(
    (cells, revealed) => {
      if (!scene) return;
      nebelSetzen(cells, revealed);

      const topf = revealed ? pinselPuffer.current.auf : pinselPuffer.current.zu;
      for (const cell of cells) topf.add(cell);

      if (pinselZeit.current) return;
      pinselZeit.current = setTimeout(() => {
        pinselZeit.current = null;
        const { auf, zu } = pinselPuffer.current;
        pinselPuffer.current = { auf: new Set(), zu: new Set() };
        if (auf.size) scenesApi.fog(scene.id, [...auf], true).catch(() => ladeSzene());
        if (zu.size) scenesApi.fog(scene.id, [...zu], false).catch(() => ladeSzene());
      }, PINSEL_MS);
    },
    [scene, nebelSetzen, ladeSzene]
  );
}
