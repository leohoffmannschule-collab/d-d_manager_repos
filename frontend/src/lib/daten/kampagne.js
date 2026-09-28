/**
 * Was einer Kampagne gehört: Charaktere, Beute, Notizen, Chronik.
 *
 * Alles hier wandert mit der Geschichte. Wer die Kampagne wechselt, sieht
 * andere Helden, eine andere Kiste, andere Notizen – der Server filtert das,
 * nicht diese Datei.
 */
import { useCallback, useMemo } from 'react';
import {
  charactersApi,
  chronicleApi,
  notesApi,
  stashApi,
} from '../api.js';
import { useAuth } from '../auth.jsx';
import { useLive, useLiveAlle } from '../live.jsx';
import { useDaten } from './grundlage.js';

/* --- Charaktere ---------------------------------------------------------- */

export function useCharaktere() {
  const { user } = useAuth();
  const holen = useCallback(() => charactersApi.list(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, null);

  // Trefferpunkte und Namen laufen live ein, statt neu geladen zu werden.
  // Beachte: Das Ereignis *ändert* nur vorhandene Einträge. Ein ganz neues
  // Blatt taucht hier nicht von selbst auf – dafür gibt es `laden()`.
  useLive('charakter:aktualisiert', (nachricht) => {
    setDaten((liste) => {
      if (!liste) return liste;
      const index = liste.findIndex((c) => c.id === nachricht.id);
      if (index === -1) return liste;
      const kopie = [...liste];
      kopie[index] = { ...kopie[index], ...nachricht };
      return kopie;
    });
  });
  useLive('charakter:entfernt', ({ id }) => {
    setDaten((liste) => liste?.filter((c) => c.id !== id) ?? liste);
  });

  // Zwei fertige Ausschnitte, weil beide an mehreren Stellen gebraucht
  // werden: die eigenen Blätter und die, die jemand geteilt hat.
  const meine = useMemo(() => (daten ?? []).filter((c) => c.ownerId === user?.id), [daten, user?.id]);
  const geteilte = useMemo(() => (daten ?? []).filter((c) => c.shared), [daten]);

  return { charaktere: daten, meine, geteilte, laden, fehler, laedt };
}

/* --- Beute --------------------------------------------------------------- */

/** Die gemeinsame Kiste: Gefundenes und Münzen. */
export function useBeute() {
  const holen = useCallback(() => stashApi.get(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, { items: [], coins: {} });
  useLive('beute', setDaten);
  return { kiste: daten, setKiste: setDaten, laden, fehler, laedt };
}

/* --- Notizen und Handzettel ---------------------------------------------- */

/**
 * Notizen der Spielleitung. `handzettel` sind die ausgeteilten davon –
 * die einzigen, die ein Spielerfenster überhaupt geliefert bekommt.
 */
export function useNotizen() {
  const holen = useCallback(() => notesApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('notizen:aktualisiert', laden);

  const handzettel = useMemo(() => (daten ?? []).filter((n) => n.visibility === 'runde'), [daten]);
  return { notizen: daten ?? [], handzettel, laden, fehler, laedt };
}

/* --- Chronik ------------------------------------------------------------- */

/** Die Sitzungen der Chronik. `offene` ist die gerade laufende, falls eine läuft. */
export function useSitzungen() {
  const holen = useCallback(() => chronicleApi.sessions(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLiveAlle(['chronik:sitzung', 'chronik:geaendert'], laden);

  const offene = useMemo(() => (daten ?? []).find((s) => s.laufend) ?? null, [daten]);
  return { sitzungen: daten ?? [], offene, laden, fehler, laedt };
}

/** Eine einzelne Sitzung samt ihren Einträgen. */
export function useSitzung(id) {
  const holen = useCallback(() => (id ? chronicleApi.session(id) : Promise.resolve(null)), [id]);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, null);

  // Neue Einträge laufen einzeln ein, solange man die offene Sitzung ansieht.
  useLive('chronik', (eintrag) => {
    setDaten((s) => (s && s.id === eintrag.sessionId ? { ...s, entries: [...s.entries, eintrag] } : s));
  });
  useLive('chronik:geaendert', laden);

  return { sitzung: daten, setSitzung: setDaten, laden, fehler, laedt };
}
