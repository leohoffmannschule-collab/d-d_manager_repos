import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { campaignsApi } from './api.js';
import { useAuth } from './auth.jsx';

const CampaignContext = createContext(null);

/**
 * Die aktive Kampagne der eigenen Sitzung.
 *
 * Konten sind rundenweit gemeinsam, aber was am Tisch entsteht, gehört zu
 * genau einer Kampagne – festgehalten server-seitig in der Sitzung, hier nur
 * gespiegelt. Ohne Anmeldung gibt es nichts zu holen.
 */
export function CampaignProvider({ children }) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCampaigns([]);
      setActiveId(null);
      setLoading(false);
      return;
    }
    try {
      const { kampagnen, aktive } = await campaignsApi.list();
      setCampaigns(kampagnen);
      setActiveId(aktive);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      campaigns,
      activeId,
      loading,
      active: campaigns.find((k) => k.id === activeId) ?? null,
      refresh,
      async switchTo(id) {
        await campaignsApi.activate(id);
        setActiveId(id);
      },
      async create(name) {
        const neu = await campaignsApi.create(name);
        setActiveId(neu.id);
        await refresh();
        return neu;
      },
    }),
    [campaigns, activeId, loading, refresh]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('useCampaign braucht den CampaignProvider.');
  return context;
}
