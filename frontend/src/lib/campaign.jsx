/**
 * Die aktive Kampagne der eigenen Sitzung.
 *
 * Konten sind rundenweit gemeinsam, aber was am Tisch entsteht, gehört zu
 * genau einer Kampagne – festgehalten server-seitig in der Sitzung, hier nur
 * gespiegelt. Ohne Anmeldung gibt es nichts zu holen.
 *
 * Dass die aktive Kampagne an der *Sitzung* hängt und nicht am Konto, hat
 * eine angenehme Folge: Dieselbe Spielleitung kann in zwei Browserfenstern
 * in zwei Kampagnen sitzen. Und es hat eine Pflicht: Jeder Wechsel muss zum
 * Server (`switchTo`), sonst wüsste der bei der nächsten Anfrage nichts
 * davon und lieferte weiter die alte Kampagne.
 *
 * Aufgebaut wie lib/auth.jsx – ein Anbieter oben, `useCampaign()` unten.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { campaignsApi } from './api.js';
import { useAuth } from './auth.jsx';

// Der Behälter für den Zustand; `null` heißt: kein Anbieter darüber.
const CampaignContext = createContext(null);

/** Der Anbieter: hält Liste und aktive Kampagne und reicht beides samt Handgriffen weiter. */
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
    } catch {
      // Server nicht erreichbar: Der bisherige Stand bleibt stehen. Ohne das
      // catch liefe die Ablehnung als „unhandled rejection“ ins Leere, denn
      // aufgerufen wird refresh aus einem useEffect, der nicht wartet.
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
      /** In eine andere Kampagne wechseln. Siehe App.jsx, was danach passiert. */
      async switchTo(id) {
        await campaignsApi.activate(id);
        setActiveId(id);
      },
      /**
       * Umbenennen. Danach wird die Liste neu geholt, damit der neue Name
       * überall steht, wo er steht – Umschalter, Überschriften, der Satz
       * über dem Löschen-Feld.
       */
      async rename(id, name) {
        const neu = await campaignsApi.rename(id, name);
        await refresh();
        return neu;
      },
      async create(name) {
        const neu = await campaignsApi.create(name);
        setActiveId(neu.id);
        await refresh();
        return neu;
      },
      /**
       * In den Papierkorb. War es die gerade offene Kampagne, steht man
       * danach ohne aktive da – das Tor schickt einen dann zur Auswahl.
       */
      async remove(id, name) {
        const weg = await campaignsApi.remove(id, name);
        if (id === activeId) setActiveId(null);
        await refresh();
        return weg;
      },
      async restore(id) {
        await campaignsApi.restore(id);
        await refresh();
      },
      // Diese beiden reichen nur durch: Der Papierkorb hat keinen Zustand
      // hier oben, die Ansicht holt ihn sich, wenn sie ihn braucht.
      purge: (id, name) => campaignsApi.purge(id, name),
      papierkorb: () => campaignsApi.papierkorb(),
    }),
    [campaigns, activeId, loading, refresh]
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

/**
 * Die aktive Kampagne, die Liste aller Kampagnen und die Handgriffe dazu
 * (wechseln, anlegen, umbenennen, wegräumen).
 *
 * Wirft, wenn kein CampaignProvider darüber steht – lieber sofort und laut
 * als später mit einem rätselhaften `undefined`.
 */
export function useCampaign() {
  const context = useContext(CampaignContext);
  if (!context) throw new Error('useCampaign braucht den CampaignProvider.');
  return context;
}
