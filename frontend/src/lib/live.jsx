import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setClientId } from './api.js';
import { useAuth } from './auth.jsx';

const LiveContext = createContext(null);

/**
 * Der Draht zum Server. Solange jemand angemeldet ist, hängt hier eine
 * offene Verbindung (Server-Sent Events), über die Änderungen an Kampf,
 * Spieltisch, Würfen und Charakteren hereinkommen.
 *
 * Warum überhaupt? Ohne diesen Draht müsste jedes Fenster den Server
 * regelmäßig fragen „gibt es was Neues?“ – bei sechs Leuten am Tisch wären
 * das hunderte Anfragen je Minute, und eine gezogene Figur käme trotzdem
 * verspätet an. Mit ihm schickt der Server von sich aus.
 *
 * *Server-Sent Events* (SSE) ist dafür die kleine Lösung: eine gewöhnliche
 * HTTP-Verbindung, die offen bleibt und über die der Server Zeilen
 * nachschiebt. Einbahnstraße – wir schicken nichts darüber zurück, dafür
 * gibt es die normalen Aufrufe aus api.js. Das genügt hier vollauf und
 * spart eine zweite Technik (WebSockets) samt eigener Verwaltung.
 *
 * Der Browser baut die Verbindung nach einem Abbruch von selbst wieder auf.
 * Damit die Seiten danach nichts verpassen – während der Unterbrechung
 * gesendete Ereignisse sind weg –, zählt `generation` bei jeder neuen
 * Verbindung hoch. Wer das beobachtet, lädt seinen Stand einfach neu.
 */
export function LiveProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [presence, setPresence] = useState([]);
  // Die angemeldeten Zuhörer: Ereignisname -> Menge von Funktionen.
  // Bewusst ein useRef und kein useState: Ein- und Austragen soll *kein*
  // neues Rendern auslösen, und der Inhalt muss sofort sichtbar sein, nicht
  // erst im nächsten Durchgang.
  const handlers = useRef(new Map());

  /** Ein eingetroffenes Ereignis an alle weiterreichen, die darauf horchen. */
  const emit = useCallback((event, data) => {
    for (const handler of handlers.current.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
        // Ein stolpernder Zuhörer darf die anderen nicht mitreißen – sonst
        // bliebe wegen eines Fehlers in der Wurfanzeige der halbe Tisch stehen.
        console.error(`Fehler im Zuhörer für „${event}“`, err);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setConnected(false);
      setPresence([]);
      setClientId(null);
      return undefined;
    }

    // EventSource ist der eingebaute SSE-Klient des Browsers. Er verbindet
    // sich selbst, hält die Verbindung und versucht es nach einem Abriss
    // von allein wieder – darum steht hier keine einzige Zeile dafür.
    const quelle = new EventSource('/api/stream');

    // Die erste Zeile, die der Server schickt: unsere Fensterkennung. Sie
    // wandert ab jetzt bei jedem Aufruf mit (siehe api.js), damit der Server
    // uns das eigene Echo ersparen kann – sonst spränge eine gerade gezogene
    // Figur kurz zurück, weil die eigene Änderung als Ereignis zurückkommt.
    quelle.addEventListener('willkommen', (e) => {
      const data = JSON.parse(e.data);
      setClientId(data.clientId);
      setConnected(true);
      setGeneration((g) => g + 1);
    });

    quelle.addEventListener('anwesenheit', (e) => setPresence(JSON.parse(e.data)));

    // Alle übrigen Ereignisse wandern an die angemeldeten Zuhörer. Die
    // Liste muss von Hand gepflegt werden: SSE kennt kein „horche auf
    // alles“. Ein neuer Ereignisname im Server gehört also auch hierher –
    // sonst kommt er nirgends an.
    for (const name of [
      'kampf',
      'szene',
      'figur',
      'figuren',
      'figur:entfernt',
      'nebel',
      'ping',
      'klang',
      'wurf',
      'wuerfe:geleert',
      'chat',
      'chat:geleert',
      'charakter:aktualisiert',
      'charakter:entfernt',
      'notizen:aktualisiert',
      'runde:aktualisiert',
    ]) {
      quelle.addEventListener(name, (e) => emit(name, JSON.parse(e.data)));
    }

    quelle.onerror = () => setConnected(false);

    // Das Aufräumen: React ruft diese Funktion, wenn die Komponente
    // verschwindet oder sich `user` ändert. Ohne das Schließen liefe nach
    // jedem Kampagnenwechsel eine Verbindung mehr mit.
    return () => {
      quelle.close();
      setConnected(false);
      setClientId(null);
    };
  }, [user, emit]);

  /**
   * Einen Zuhörer eintragen. Gibt die Funktion zurück, die ihn wieder
   * austrägt – genau die Form, die useEffect zum Aufräumen erwartet.
   */
  const subscribe = useCallback((event, handler) => {
    if (!handlers.current.has(event)) handlers.current.set(event, new Set());
    handlers.current.get(event).add(handler);
    return () => handlers.current.get(event)?.delete(handler);
  }, []);

  const value = useMemo(
    () => ({ connected, generation, presence, subscribe }),
    [connected, generation, presence, subscribe]
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

function useLiveContext() {
  const context = useContext(LiveContext);
  if (!context) throw new Error('Live-Funktionen brauchen den LiveProvider.');
  return context;
}

/**
 * Auf ein Ereignis hören: `useLive('wurf', (wurf) => …)`.
 *
 * Der Kniff mit dem `ref`: Die übergebene Funktion ist bei jedem Rendern
 * eine neue. Würde man sie direkt anmelden, müsste man sie bei jedem
 * Rendern ab- und wieder anmelden. Stattdessen wird *einmal* eine feste
 * Hülle angemeldet, die immer die jüngste Fassung aus dem ref aufruft –
 * so sieht der Zuhörer nie veralteten Zustand, ohne ständiges Ummelden.
 */
export function useLive(event, handler) {
  const { subscribe } = useLiveContext();
  const ref = useRef(handler);

  // Nach jedem Rendern die jüngste Fassung hinterlegen, damit der einmal
  // angemeldete Zuhörer nie mit veraltetem Zustand arbeitet.
  useEffect(() => {
    ref.current = handler;
  });

  useEffect(() => {
    if (!event) return undefined;
    return subscribe(event, (data) => ref.current?.(data));
  }, [event, subscribe]);
}

/** Auf mehrere Ereignisse zugleich hören – für Datenhaken, die auf einiges achten. */
export function useLiveAlle(events, handler) {
  const { subscribe } = useLiveContext();
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  });

  // Ein Array ist bei jedem Rendern ein neues Objekt und taugt deshalb
  // nicht als Abhängigkeit – eine Zeichenkette daraus schon.
  const schluessel = events.join('|');
  useEffect(() => {
    const abmelden = schluessel
      .split('|')
      .filter(Boolean)
      .map((name) => subscribe(name, (daten) => ref.current?.(daten, name)));
    return () => abmelden.forEach((ab) => ab());
  }, [schluessel, subscribe]);
}

/** Für die Anzeige: Steht der Draht, und wer ist sonst noch am Tisch? */
export function useLiveStatus() {
  const { connected, generation, presence } = useLiveContext();
  return { connected, generation, presence };
}
