/**
 * Wer ist angemeldet? – die Antwort darauf, für die ganze Oberfläche.
 *
 * Das ist ein React-*Context*: ein Wert, den ein Anbieter (`AuthProvider`)
 * weit oben im Baum bereitstellt und den jede Komponente darunter mit
 * `useAuth()` abholen kann, ohne dass er durch jede Ebene durchgereicht
 * werden muss. Der Anbieter steht in main.jsx ganz außen.
 *
 * Gemerkt wird hier nur eine *Abschrift* dessen, was der Server weiß. Das
 * Anmeldekennzeichen selbst liegt in einem HttpOnly-Cookie: Der Browser
 * schickt es bei jeder Anfrage automatisch mit, und JavaScript kommt nicht
 * daran – das ist Absicht und der Grund, warum hier nirgends ein Token
 * herumliegt. Wer diesen Zustand also fälscht, gewinnt nichts: Der Server
 * fragt das Cookie, nicht uns.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from './api.js';

const AuthContext = createContext(null);

/**
 * Der Anbieter der Anmeldung: fragt beim Start den Server, wer man ist, und
 * reicht `user`, `isDm` und die Handgriffe (anmelden, abmelden, einrichten)
 * an alles darunter weiter.
 */
export function AuthProvider({ children }) {
  // `user` ist null, solange niemand angemeldet ist. `needsSetup` heißt:
  // Der Almanach ist noch jungfräulich, das erste Konto führt dann die
  // Spielleitung. `loading` verhindert, dass die Anmeldeseite kurz
  // aufblitzt, bevor der Server geantwortet hat.
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  // useCallback merkt sich dieselbe Funktion über mehrere Renderdurchgänge
  // hinweg. Hier nötig, weil `refresh` unten in der Abhängigkeitsliste von
  // useEffect steht: eine jedes Mal neue Funktion löste ihn endlos aus.
  const refresh = useCallback(async () => {
    try {
      const status = await authApi.status();
      setUser(status.user);
      setNeedsSetup(status.needsSetup);
    } catch {
      // Server nicht erreichbar – dann bleibt es beim abgemeldeten Zustand.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Alles, was `useAuth()` herausgibt. useMemo baut das Bündel nur neu,
  // wenn sich wirklich etwas geändert hat – sonst würde jede Komponente,
  // die daran hängt, bei jedem Rendern mit neu zeichnen.
  const value = useMemo(
    () => ({
      user,
      needsSetup,
      loading,
      // „sl“ steht für Spielleitung. Der Kurzname wird an Dutzenden
      // Stellen abgefragt, deshalb steht er hier einmal ausgerechnet.
      isDm: user?.role === 'sl',
      refresh,
      async login(name, password) {
        const { user: angemeldet } = await authApi.login(name, password);
        setUser(angemeldet);
        setNeedsSetup(false);
        return angemeldet;
      },
      async register(payload) {
        const { user: neu } = await authApi.register(payload);
        setUser(neu);
        setNeedsSetup(false);
        return neu;
      },
      async logout() {
        await authApi.logout();
        setUser(null);
        // Noch einmal nachfragen: Nach dem Abmelden kann der Almanach wieder
        // „einzurichten“ sein (wenn das letzte Konto gelöscht wurde), und
        // das erfährt die Anmeldeseite nur so.
        await refresh();
      },
    }),
    [user, needsSetup, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Der Zugriff für alle anderen: `const { user, isDm } = useAuth();`
 *
 * Der Fehler unten trifft nur, wer die Komponente außerhalb des Anbieters
 * einhängt – dann ist der Context leer. Eine klare Meldung ist an dieser
 * Stelle Gold wert; ohne sie käme irgendwo tief unten ein rätselhaftes
 * „cannot read property of null“.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth braucht den AuthProvider.');
  return context;
}
