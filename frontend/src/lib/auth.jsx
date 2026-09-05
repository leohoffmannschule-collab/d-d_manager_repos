import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const value = useMemo(
    () => ({
      user,
      needsSetup,
      loading,
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
        await refresh();
      },
    }),
    [user, needsSetup, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth braucht den AuthProvider.');
  return context;
}
