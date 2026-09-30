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
 *
 * Nur wenn der Server den Kanal *verweigert* (abgemeldet, aus der Kampagne
 * genommen), gibt der Browser auf. Dann wird nachgefragt, woran es liegt –
 * die Tore in App.jsx schicken einen zur Anmeldung oder Kampagnenauswahl –,
 * und liegt es an nichts davon, nach einer Pause neu angesetzt.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setClientId } from './api.js';
import { useAuth } from './auth.jsx';
import { useCampaign } from './campaign.jsx';

// Der Behälter für den Kanal; `null` heißt: kein Anbieter darüber.
const LiveContext = createContext(null);

// Wie lange nach einer Absage gewartet wird, bevor der Kanal neu ansetzt.
const NEUER_ANLAUF_MS = 5000;

/** Der Anbieter: öffnet den Kanal, solange jemand angemeldet ist und eine Kampagne gewählt hat. */
export function LiveProvider({ children }) {
  const { user, refresh: anmeldungPruefen } = useAuth();
  const { refresh: kampagnePruefen } = useCampaign();
  const [connected, setConnected] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [presence, setPresence] = useState([]);
  // Zählt hoch, wenn der Browser aufgegeben hat und wir selbst neu ansetzen.
  const [anlauf, setAnlauf] = useState(0);
  // Die angemeldeten Zuhörer: Ereignisname -> Menge von Funktionen.
  // Bewusst ein useRef und kein useState: Ein- und Austragen soll *kein*
  // neues Rendern auslösen, und der Inhalt muss sofort sichtbar sein, nicht
  // erst im nächsten Durchgang.
  const handlers = useRef(new Map());
  // Die offene Quelle und die Ereignisnamen, auf die sie schon horcht.
  const quelleRef = useRef(null);
  const horcht = useRef(new Set());

  // Nachfragen, woran eine Absage lag. Über ein ref statt als Abhängigkeit:
  // Beide Prüfungen bauen `user` neu, und hinge der Kanal daran, setzte er
  // sofort neu an – bei einem Server, der hartnäckig abweist, in einer
  // Schleife ohne Pause.
  const nachfragen = useRef(() => {});
  useEffect(() => {
    nachfragen.current = () => {
      anmeldungPruefen();
      kampagnePruefen();
    };
  });
  // Dasselbe für `user`: Der Kanal hängt am *Konto*, nicht an einer
  // bestimmten Abschrift davon.
  const kontoId = user?.id ?? null;

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

  /**
   * Einen Ereignisnamen an der Quelle anmelden – einmal je Name und Quelle.
   *
   * SSE kennt kein „horche auf alles“: Jeder Name braucht sein eigenes
   * `addEventListener`. Früher stand hier eine von Hand gepflegte Liste,
   * und die lief dem Server davon – `beute` und `chronik` kamen nie an, die
   * Beutekiste und die Chronik standen bei allen anderen still, bis jemand
   * neu lud. Jetzt meldet sich jeder Name an, sobald ein Bauteil darauf
   * horcht; eine Liste, die veralten könnte, gibt es nicht mehr.
   */
  const anmelden = useCallback(
    (quelle, name) => {
      if (horcht.current.has(name)) return;
      horcht.current.add(name);
      quelle.addEventListener(name, (e) => emit(name, JSON.parse(e.data)));
    },
    [emit]
  );

  useEffect(() => {
    if (!kontoId) {
      setConnected(false);
      setPresence([]);
      setClientId(null);
      return undefined;
    }

    // EventSource ist der eingebaute SSE-Klient des Browsers. Er verbindet
    // sich selbst, hält die Verbindung und versucht es nach einem Abriss
    // von allein wieder – darum steht hier keine einzige Zeile dafür.
    const quelle = new EventSource('/api/stream');
    quelleRef.current = quelle;
    horcht.current = new Set();

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

    // Wer schon horcht, bevor die Quelle stand (die Seiten hängen sich beim
    // ersten Zeichnen an), wird hier nachgetragen; alle Späteren meldet
    // `subscribe` selbst an.
    for (const name of handlers.current.keys()) anmelden(quelle, name);

    let neuAnsetzen = null;
    quelle.onerror = () => {
      setConnected(false);
      // CONNECTING: Funkloch oder Neustart – der Browser versucht es selbst.
      if (quelle.readyState !== EventSource.CLOSED) return;
      // CLOSED: Der Server hat abgewiesen. Fragen, woran es liegt; die Tore
      // in App.jsx übernehmen, falls Anmeldung oder Kampagne weg sind.
      nachfragen.current();
      neuAnsetzen = setTimeout(() => setAnlauf((n) => n + 1), NEUER_ANLAUF_MS);
    };

    // Das Aufräumen: React ruft diese Funktion, wenn die Komponente
    // verschwindet oder sich das Konto ändert. Ohne das Schließen liefe nach
    // jedem Kampagnenwechsel eine Verbindung mehr mit.
    return () => {
      clearTimeout(neuAnsetzen);
      quelle.close();
      quelleRef.current = null;
      setConnected(false);
      setClientId(null);
    };
  }, [kontoId, emit, anmelden, anlauf]);

  /**
   * Einen Zuhörer eintragen. Gibt die Funktion zurück, die ihn wieder
   * austrägt – genau die Form, die useEffect zum Aufräumen erwartet.
   */
  const subscribe = useCallback(
    (event, handler) => {
      if (!handlers.current.has(event)) handlers.current.set(event, new Set());
      handlers.current.get(event).add(handler);
      if (quelleRef.current) anmelden(quelleRef.current, event);
      return () => handlers.current.get(event)?.delete(handler);
    },
    [anmelden]
  );

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
