import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authApi,
  charactersApi,
  chronicleApi,
  diceApi,
  encounterApi,
  encountersApi,
  libraryApi,
  notesApi,
  scenesApi,
  stashApi,
} from './api.js';
import { useAuth } from './auth.jsx';
import { useLive, useLiveAlle, useLiveStatus } from './live.jsx';

/**
 * Die Datenschicht.
 *
 * Hier steckt alles, was mit dem Server zu tun hat: laden, auf Änderungen
 * horchen, nachladen. Die Bauteile darüber bekommen fertige Daten und einen
 * Handgriff zum Nachladen – mehr wissen sie nicht.
 *
 * Der Sinn davon zeigt sich beim Umbau: Wer die Oberfläche neu gestaltet oder
 * ganz austauscht, wirft Seiten und Bauteile weg und behält diese Datei. Das
 * mühsame Stück – wann geladen wird, welche Ereignisse welchen Zustand
 * betreffen, was beim erneuten Verbinden nachzuholen ist – bleibt erhalten.
 */

/**
 * Gemeinsames Fundament aller Haken: einmal laden, bei jeder neuen
 * Live-Verbindung nachladen, Fehler festhalten.
 *
 * `generation` zählt hoch, sobald die Verbindung (neu) steht. Nach einem
 * Funkloch wird dadurch alles nachgezogen, was in der Zwischenzeit geschah.
 */
export function useDaten(holen, anfang = null) {
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

  useEffect(() => {
    if (generation > 0) laden();
  }, [generation, laden]);

  return { daten, setDaten, laden, fehler, laedt };
}

/* --- Charaktere ---------------------------------------------------------- */

export function useCharaktere() {
  const { user } = useAuth();
  const holen = useCallback(() => charactersApi.list(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, null);

  // Trefferpunkte und Namen laufen live ein, statt neu geladen zu werden.
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

  const meine = useMemo(() => (daten ?? []).filter((c) => c.ownerId === user?.id), [daten, user?.id]);
  const geteilte = useMemo(() => (daten ?? []).filter((c) => c.shared), [daten]);

  return { charaktere: daten, meine, geteilte, laden, fehler, laedt };
}

/* --- Kampf --------------------------------------------------------------- */

export function useKampf() {
  const holen = useCallback(() => encounterApi.get(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, {
    round: 1,
    activeCombatantId: null,
    combatants: [],
  });

  // Der Server schickt den vollständigen Stand mit – kein Nachladen nötig.
  useLive('kampf', setDaten);
  useLive('charakter:aktualisiert', laden);

  return { kampf: daten, laden, fehler, laedt };
}

/* --- Spieltisch ---------------------------------------------------------- */

/**
 * Die aufgelegte Szene samt Figuren und Nebel. Figuren und Nebel kommen als
 * einzelne Änderungen herein, damit eine gezogene Figur nicht die ganze Karte
 * neu lädt.
 */
export function useSzene() {
  const holen = useCallback(() => scenesApi.active(), []);
  const { daten: szene, setDaten: setSzene, laden, fehler, laedt } = useDaten(holen, null);
  const [figuren, setFiguren] = useState([]);
  const [nebel, setNebel] = useState(() => new Set());

  useEffect(() => {
    setFiguren(szene?.tokens ?? []);
    setNebel(new Set(szene?.fog ?? []));
  }, [szene]);

  useLive('szene', (neu) => setSzene(neu));

  useLive('figur', (figur) => {
    setFiguren((alle) => {
      const index = alle.findIndex((t) => t.id === figur.id);
      if (index === -1) return [...alle, figur];
      const kopie = [...alle];
      kopie[index] = figur;
      return kopie;
    });
  });

  useLive('figur:entfernt', ({ id }) => setFiguren((alle) => alle.filter((t) => t.id !== id)));

  useLive('nebel', ({ sceneId, cells, revealed }) => {
    if (szene && sceneId !== szene.id) return;
    setNebel((alt) => {
      const naechste = new Set(alt);
      for (const feld of cells) {
        if (revealed) naechste.add(feld);
        else naechste.delete(feld);
      }
      return naechste;
    });
  });

  /** Nebel malen: erst örtlich, damit es sich flüssig anfühlt. */
  const nebelSetzen = useCallback((felder, offen) => {
    setNebel((alt) => {
      const naechste = new Set(alt);
      for (const feld of felder) {
        if (offen) naechste.add(feld);
        else naechste.delete(feld);
      }
      return naechste;
    });
  }, []);

  /** Figur bewegen: ebenfalls erst örtlich, dann zum Server. */
  const figurSetzen = useCallback((id, x, y) => {
    setFiguren((alle) => alle.map((t) => (t.id === id ? { ...t, x, y } : t)));
  }, []);

  return { szene, figuren, nebel, nebelSetzen, figurSetzen, laden, fehler, laedt };
}

/** Alle Szenen der Spielleitung, samt Vermerk, welche aufliegt. */
export function useSzenenListe() {
  const holen = useCallback(() => scenesApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('szene', laden);
  return { szenen: daten ?? [], laden, fehler, laedt };
}

/** Kurz aufleuchtende Zeigefinger – nichts davon wird gespeichert. */
export function usePings(dauer = 2600) {
  const [pings, setPings] = useState([]);

  useLive('ping', (ping) => {
    const key = `${ping.at}-${ping.name}`;
    setPings((alle) => [...alle, { ...ping, key }]);
    setTimeout(() => setPings((alle) => alle.filter((p) => p.key !== key)), dauer);
  });

  return pings;
}

/* --- Würfel -------------------------------------------------------------- */

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

/* --- Beute --------------------------------------------------------------- */

export function useBeute() {
  const holen = useCallback(() => stashApi.get(), []);
  const { daten, setDaten, laden, fehler, laedt } = useDaten(holen, { items: [], coins: {} });
  useLive('beute', setDaten);
  return { kiste: daten, setKiste: setDaten, laden, fehler, laedt };
}

/* --- Notizen und Handzettel ---------------------------------------------- */

export function useNotizen() {
  const holen = useCallback(() => notesApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('notizen:aktualisiert', laden);

  const handzettel = useMemo(() => (daten ?? []).filter((n) => n.visibility === 'runde'), [daten]);
  return { notizen: daten ?? [], handzettel, laden, fehler, laedt };
}

/* --- Bestiarium und Begegnungen ------------------------------------------ */

export function useBestiarium() {
  const holen = useCallback(() => libraryApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { eintraege: daten ?? [], laden, fehler, laedt };
}

export function useBegegnungen() {
  const holen = useCallback(() => encountersApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { begegnungen: daten ?? [], laden, fehler, laedt };
}

/* --- Runde: Konten und Einladungen --------------------------------------- */

export function useKonten() {
  const holen = useCallback(() => authApi.users(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('runde:aktualisiert', laden);
  return { konten: daten ?? [], laden, fehler, laedt };
}

export function useEinladungen() {
  const holen = useCallback(() => authApi.invites(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  const offene = useMemo(() => (daten ?? []).filter((e) => !e.used_at), [daten]);
  return { einladungen: daten ?? [], offene, laden, fehler, laedt };
}

/* --- Chronik ------------------------------------------------------------- */

export function useSitzungen() {
  const holen = useCallback(() => chronicleApi.sessions(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLiveAlle(['chronik:sitzung', 'chronik:geaendert'], laden);

  const offene = useMemo(() => (daten ?? []).find((s) => s.laufend) ?? null, [daten]);
  return { sitzungen: daten ?? [], offene, laden, fehler, laedt };
}

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
