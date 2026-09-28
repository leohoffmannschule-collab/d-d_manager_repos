/**
 * Der Spieltisch: die aufgelegte Szene, die Szenenliste, Zeigefinger und
 * die Kartenbibliothek.
 *
 * Hier steckt das Heikelste der ganzen Datenschicht, und zwar aus einem
 * Grund: Eine gezogene Figur muss sofort dort liegen, wo der Finger sie
 * hinzieht. Deshalb wird örtlich *vorgegriffen* – die Änderung wird erst
 * angezeigt und dann zum Server geschickt. Käme jede Figur erst nach der
 * Antwort an, ruckelte das Ziehen um die Laufzeit der Anfrage hinterher.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { mapsApi, scenesApi } from '../api.js';
import { useAuth } from '../auth.jsx';
import { ausBase64, mitFeldern, rasterBereich } from '../rasterkarte.js';
import { useLive } from '../live.jsx';
import { useDaten } from './grundlage.js';

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
  // Die laufenden Zeitgeber, damit sie beim Verlassen des Tisches nicht
  // noch in einen Zustand schreiben, den es nicht mehr gibt.
  const zeitgeber = useRef(new Set());

  useEffect(() => {
    const laufend = zeitgeber.current;
    return () => {
      for (const t of laufend) clearTimeout(t);
      laufend.clear();
    };
  }, []);

  useLive('ping', (ping) => {
    const key = `${ping.at}-${ping.name}`;
    setPings((alle) => [...alle, { ...ping, key }]);
    const t = setTimeout(() => {
      zeitgeber.current.delete(t);
      setPings((alle) => alle.filter((p) => p.key !== key));
    }, dauer);
    zeitgeber.current.add(t);
  });

  return pings;
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
