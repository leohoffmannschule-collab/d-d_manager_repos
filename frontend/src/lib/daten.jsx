import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ambienceApi,
  authApi,
  charactersApi,
  chatApi,
  chronicleApi,
  diceApi,
  encounterApi,
  encountersApi,
  libraryApi,
  mapsApi,
  notesApi,
  scenesApi,
  stashApi,
} from './api.js';
import { useAuth } from './auth.jsx';
import { ausBase64, mitFeldern, rasterBereich } from './rasterkarte.js';
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
 *
 * Alles hier sind *Haken* (React Hooks): Funktionen, deren Name mit `use`
 * beginnt und die nur aus einer Komponente heraus aufgerufen werden dürfen.
 * Sie geben Daten samt Nachlade-Handgriff zurück, etwa:
 *
 *     const { charaktere, laden } = useCharaktere();
 *
 * Drei Muster kehren immer wieder, und wer sie kennt, versteht die ganze
 * Datei:
 *
 *   1. *Laden* über useDaten – einmal beim Verbinden, danach auf Zuruf.
 *   2. *Horchen* über useLive – der Server schiebt Änderungen nach.
 *   3. *Vorgreifen* – bei Figuren und Nebel wird die Änderung sofort
 *      örtlich angezeigt und erst danach zum Server geschickt. Ohne das
 *      ruckelte jede gezogene Figur um die Laufzeit der Anfrage hinterher.
 */

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
  useLive('kampf', setDaten);
  // Trefferpunkte stehen auf dem Blatt *und* am Kämpfer. Ändert jemand das
  // Blatt, muss die Kampfliste nachziehen.
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
  const [nebel, setNebel] = useState(null);

  // Hinter dem Vorhang kommt nur `{ vorhang: true }` an – keine Maße, kein
  // Raster, nichts zum Rechnen. Die Szene gilt dann als nicht vorhanden.
  const vorhang = szene?.vorhang === true;
  const gelegt = szene?.id ? szene : null;

  useEffect(() => {
    setFiguren(gelegt?.tokens ?? []);
    setNebel(gelegt ? ausBase64(gelegt.fogBits ?? '', rasterBereich(gelegt)) : null);
  }, [gelegt]);

  /**
   * Was gerade wirklich zu sehen ist – gerechnet hat das der Server, aus
   * Lichtquellen und den Sinnen der eigenen Figuren. `null` heißt „alles,
   * was aufgedeckt ist“: helle Szene, kein Nebel, oder keine eigene Figur
   * auf der Karte.
   */
  const sicht = useMemo(
    () => (gelegt?.sichtBits ? ausBase64(gelegt.sichtBits, rasterBereich(gelegt)) : null),
    [gelegt]
  );

  // Die ganze Szene neu – etwa beim Auflegen einer anderen Karte.
  useLive('szene', (neu) => setSzene(neu));

  // Alle Figuren auf einmal: Ein Nebelstrich hat eine Figur auf- oder
  // zugedeckt, damit ändert sich für die Runde die ganze sichtbare Liste.
  useLive('figuren', (liste) => setFiguren(liste ?? []));

  // Eine einzelne Figur – der häufige Fall beim Ziehen.
  useLive('figur', (figur) => {
    setFiguren((alle) => {
      // Unbekannte Kennung heißt: neu dazugekommen, also anhängen.
      const index = alle.findIndex((t) => t.id === figur.id);
      if (index === -1) return [...alle, figur];
      const kopie = [...alle];
      kopie[index] = figur;
      return kopie;
    });
  });

  useLive('figur:entfernt', ({ id }) => setFiguren((alle) => alle.filter((t) => t.id !== id)));

  // Einzelne Pinselstriche wandern weiterhin als "x,y" – ein Strich ist klein,
  // dafür lohnt kein Umpacken.
  useLive('nebel', ({ sceneId, cells, revealed }) => {
    if (szene && sceneId !== szene.id) return;
    setNebel((alt) => mitFeldern(alt, cells, revealed));
  });

  /**
   * Nebel malen: erst örtlich, damit es sich flüssig anfühlt.
   *
   * Diese Funktion schickt *nichts* zum Server – das macht der Aufrufer
   * (pages/Tabletop.jsx), und zwar gebündelt, damit aus einem Strich über
   * dreißig Felder nicht dreißig Anfragen werden.
   */
  const nebelSetzen = useCallback((felder, offen) => {
    setNebel((alt) => mitFeldern(alt, felder, offen));
  }, []);

  /** Figur bewegen: ebenfalls erst örtlich, dann zum Server. */
  const figurSetzen = useCallback((id, x, y) => {
    setFiguren((alle) => alle.map((t) => (t.id === id ? { ...t, x, y } : t)));
  }, []);

  return { szene: gelegt, vorhang, figuren, nebel, sicht, nebelSetzen, figurSetzen, laden, fehler, laedt };
}

/** Alle Szenen der Spielleitung, samt Vermerk, welche aufliegt. */
export function useSzenenListe() {
  const holen = useCallback(() => scenesApi.list(), []);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  useLive('szene', laden);
  return { szenen: daten ?? [], laden, fehler, laedt };
}

/**
 * Kurz aufleuchtende Zeigefinger – nichts davon wird gespeichert.
 *
 * Der Schlüssel aus Zeitpunkt und Name unterscheidet zwei Zeigefinger
 * derselben Person; React braucht für jede Liste stabile Schlüssel.
 */
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

/* --- Runde: Konten und Einladungen --------------------------------------- */

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

/* --- Kartenbibliothek ---------------------------------------------------- */

/**
 * Die Vorbereitungs-Bibliothek des DM. Karten liegen hier, bevor sie jemand
 * sieht – deshalb lädt der Haken nichts, solange die Rolle nicht stimmt: ein
 * Spielerfenster würde sonst bei jedem Start ein 403 einsammeln.
 */
export function useKarten() {
  const { isDm } = useAuth();
  const holen = useCallback(() => (isDm ? mapsApi.list() : Promise.resolve([])), [isDm]);
  const { daten, laden, fehler, laedt } = useDaten(holen, []);
  return { karten: daten ?? [], laden, fehler, laedt };
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
