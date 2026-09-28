/**
 * Was der ganzen Runde gehört, nicht einer einzelnen Kampagne: die Konten,
 * die Einladungen und der Klangteppich.
 *
 * Die Klangbibliothek ist Vorbereitung und lädt deshalb nur hinter dem
 * Schirm der Spielleitung – ein Spielerfenster würde sonst bei jedem Start
 * ein 403 einsammeln. Was gerade *läuft*, hören dagegen alle.
 */
import { useCallback, useMemo } from 'react';
import { ambienceApi, authApi } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLive } from '../live.jsx';
import { useDaten } from './grundlage.js';

/* --- Konten und Einladungen ---------------------------------------------- */

/** Alle Konten des Almanachs – nur die Spielleitung darf sie sehen. */
export function useKonten() {
  const holen = useCallback(() => authApi.users(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('runde:aktualisiert', laden);
  return { konten: daten ?? [], laden, fehler, laedt };
}

/** Einladungscodes. `offene` sind die noch nicht eingelösten. */
export function useEinladungen() {
  const holen = useCallback(() => authApi.invites(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  const offene = useMemo(() => (daten ?? []).filter((e) => !e.used_at), [daten]);
  return { einladungen: daten ?? [], offene, laden, fehler, laedt };
}

/* --- Klangteppich -------------------------------------------------------- */

/**
 * Die hinterlegten Ambienten des DM. Wie die Kartenbibliothek gehört sie zur
 * Vorbereitung und lädt deshalb nur hinter dem Schirm.
 */
export function useKlangbibliothek() {
  const { isDm } = useAuth();
  const holen = useCallback(() => (isDm ? ambienceApi.list() : Promise.resolve([])), [isDm]);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { ambienten: daten ?? [], laden, fehler, laedt };
}

/** Was gerade über dem Tisch liegt – das sieht die ganze Runde. */
export function useKlang() {
  const holen = useCallback(() => ambienceApi.aktiv(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, null);
  useLive('klang', (neu) => setDaten(neu));
  return { klang: daten, laden, fehler, laedt };
}
