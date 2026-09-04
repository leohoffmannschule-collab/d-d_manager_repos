import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setClientId } from './api.js';
import { useAuth } from './auth.jsx';

const LiveContext = createContext(null);

/**
 * Der Draht zum Server. Solange jemand angemeldet ist, hängt hier eine
 * offene Verbindung (Server-Sent Events), über die Änderungen an Kampf,
 * Spieltisch, Würfen und Charakteren hereinkommen.
 *
 * Der Browser baut die Verbindung nach einem Abbruch von selbst wieder auf.
 * Damit die Seiten danach nichts verpassen, zählt `generation` bei jeder
 * neuen Verbindung hoch – wer das beobachtet, lädt seinen Stand einfach neu.
 */
export function LiveProvider({ children }) {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [presence, setPresence] = useState([]);
  const handlers = useRef(new Map());

  const emit = useCallback((event, data) => {
    for (const handler of handlers.current.get(event) ?? []) {
      try {
        handler(data);
      } catch (err) {
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

    const quelle = new EventSource('/api/stream');

    quelle.addEventListener('willkommen', (e) => {
      const data = JSON.parse(e.data);
      setClientId(data.clientId);
      setConnected(true);
      setGeneration((g) => g + 1);
    });

    quelle.addEventListener('anwesenheit', (e) => setPresence(JSON.parse(e.data)));

    // Alle übrigen Ereignisse wandern an die angemeldeten Zuhörer.
    for (const name of [
      'kampf',
      'szene',
      'figur',
      'figur:entfernt',
      'nebel',
      'ping',
      'klang',
      'wurf',
      'wuerfe:geleert',
      'charakter:aktualisiert',
      'charakter:entfernt',
      'notizen:aktualisiert',
      'runde:aktualisiert',
    ]) {
      quelle.addEventListener(name, (e) => emit(name, JSON.parse(e.data)));
    }

    quelle.onerror = () => setConnected(false);

    return () => {
      quelle.close();
      setConnected(false);
      setClientId(null);
    };
  }, [user, emit]);

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

/** Auf ein Ereignis hören. Der Handler darf sich bei jedem Rendern ändern. */
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

  const schluessel = events.join('|');
  useEffect(() => {
    const abmelden = schluessel
      .split('|')
      .filter(Boolean)
      .map((name) => subscribe(name, (daten) => ref.current?.(daten, name)));
    return () => abmelden.forEach((ab) => ab());
  }, [schluessel, subscribe]);
}

export function useLiveStatus() {
  const { connected, generation, presence } = useLiveContext();
  return { connected, generation, presence };
}
