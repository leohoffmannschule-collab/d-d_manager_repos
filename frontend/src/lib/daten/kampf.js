/**
 * Der Kampf und was ihn füttert: die laufende Reihenfolge, das Bestiarium
 * und die vorbereiteten Begegnungen.
 *
 * Der laufende Kampf horcht auf Live-Ereignisse – daran hängen mehrere
 * Fenster gleichzeitig. Bestiarium und Begegnungen tun das nicht: An ihnen
 * arbeitet die Spielleitung allein, und meist an genau einem Schirm.
 */
import { useCallback } from 'react';
import { encounterApi, encountersApi, libraryApi } from '../api.js';
import { useLive } from '../live.jsx';
import { useDaten } from './grundlage.js';

/* --- Kampf --------------------------------------------------------------- */

/** Der laufende Kampf: Reihenfolge, wer dran ist, alle Kämpfer. */
export function useKampf() {
  const holen = useCallback(() => encounterApi.get(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, {
    round: 1,
    activeCombatantId: null,
    combatants: [],
  });

  // Der Server schickt den vollständigen Stand mit – kein Nachladen nötig.
  // Das gilt auch, wenn jemand die Trefferpunkte auf seinem *Blatt* ändert:
  // Der Server zieht den verknüpften Kämpfer nach und verschickt den Kampf
  // (routes/characters.js). Früher lud hier jedes Fenster bei jedem
  // gespeicherten Tastendruck an irgendeinem Blatt die Kampfliste neu.
  useLive('kampf', setDaten);

  return { kampf: daten, laden, fehler, laedt };
}

/* --- Bestiarium und Begegnungen ------------------------------------------ */

/**
 * Das Bestiarium – Statblöcke für Monster und NSC.
 *
 * Kein useLive: Die Sammlung ändert nur die Spielleitung selbst, und die
 * sitzt in aller Regel an genau einem Schirm. Dafür lohnt kein Ereignis.
 */
export function useBestiarium() {
  const holen = useCallback(() => libraryApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { eintraege: daten ?? [], laden, fehler, laedt };
}

/** Vorbereitete Begegnungen („Wache am Stadttor“, „3 Goblins“). */
export function useBegegnungen() {
  const holen = useCallback(() => encountersApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { begegnungen: daten ?? [], laden, fehler, laedt };
}
