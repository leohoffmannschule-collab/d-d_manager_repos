import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ambienceApi } from './api.js';
import { useAuth } from './auth.jsx';
import { useLive, useLiveStatus } from './live.jsx';
import * as spotify from './spotify.js';

const KlangContext = createContext(null);

const EIGENE_LAUTSTAERKE = 'almanach.klang.lautstaerke';
const STUMM = 'almanach.klang.stumm';
const AUSGABE = 'almanach.klang.ausgabe';
const HIER = 'dieses-fenster';

const merken = (schluessel, wert) => {
  try {
    localStorage.setItem(schluessel, String(wert));
  } catch {
    /* privates Fenster – dann gilt es nur für diesmal */
  }
};

const gemerkt = (schluessel, ersatz) => {
  try {
    const wert = localStorage.getItem(schluessel);
    return wert === null ? ersatz : wert;
  } catch {
    return ersatz;
  }
};

/**
 * Der Klangteppich im Browser.
 *
 * Der Server sagt, *was* laufen soll. Dieser Halter kümmert sich darum, dass
 * es hier auch klingt: Spotify-Anmeldung, Abspielwerk, eigene Lautstärke.
 *
 * Zwei Dinge kann er nicht überspringen, weil der Browser sie verlangt:
 * eine sichere Verbindung (also der Tunnel, nicht die nackte LAN-Adresse)
 * und einen Klick, bevor zum ersten Mal Ton kommt. Deshalb gibt es den
 * Knopf „Zuhören“ – ohne ihn bleibt jedes Fenster still.
 */
export function KlangProvider({ children }) {
  const { user } = useAuth();
  const { generation } = useLiveStatus();

  const [einrichtung, setEinrichtung] = useState({ clientId: '', eingerichtet: false });
  const [klang, setKlang] = useState(null);
  const [verbunden, setVerbunden] = useState(spotify.istVerbunden());
  const [zuhoeren, setZuhoeren] = useState(false);
  const [geraetId, setGeraetId] = useState(null);
  const [geraeteListe, setGeraeteListe] = useState([]);
  const [fehler, setFehler] = useState('');

  const [lautstaerke, setLautstaerkeRoh] = useState(() => Number(gemerkt(EIGENE_LAUTSTAERKE, 70)));
  const [stumm, setStummRoh] = useState(() => gemerkt(STUMM, '0') === '1');
  const [ausgabe, setAusgabeRoh] = useState(() => gemerkt(AUSGABE, HIER));

  const spieler = useRef(null);
  const baut = useRef(false);
  const letzteAuflage = useRef(null);
  const pegelBeimStart = useRef(0.3);
  const clientId = einrichtung.clientId;

  /* --- Was der Server sagt ---------------------------------------------- */

  const laden = useCallback(async () => {
    try {
      setKlang(await ambienceApi.aktiv());
    } catch {
      /* nicht angemeldet oder Server weg – die Leiste bleibt eben leer */
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    ambienceApi.einrichtung().then(setEinrichtung).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (generation > 0) laden();
  }, [generation, laden]);

  useLive('klang', (neu) => setKlang(neu));

  /* --- Eigene Regler ----------------------------------------------------- */

  const setLautstaerke = useCallback((wert) => {
    const zahl = Math.max(0, Math.min(100, Math.round(wert)));
    setLautstaerkeRoh(zahl);
    merken(EIGENE_LAUTSTAERKE, zahl);
  }, []);

  const setStumm = useCallback((wert) => {
    setStummRoh(wert);
    merken(STUMM, wert ? '1' : '0');
  }, []);

  const setAusgabe = useCallback((wert) => {
    setAusgabeRoh(wert);
    merken(AUSGABE, wert);
    // Das Ziel hat gewechselt; die nächste Auflage muss neu gestartet werden.
    letzteAuflage.current = null;
  }, []);

  // Der Pegel des DM stimmt die Stücke gegeneinander ab (Kampf lauter als
  // Schankraum), der eigene Regler entscheidet, wie laut es im Zimmer wird.
  const effektiv = useMemo(() => {
    if (stumm) return 0;
    return (lautstaerke / 100) * ((klang?.volume ?? 45) / 100);
  }, [stumm, lautstaerke, klang?.volume]);

  useEffect(() => {
    pegelBeimStart.current = effektiv;
  }, [effektiv]);

  /* --- Anmeldung --------------------------------------------------------- */

  const verbinden = useCallback(async () => {
    setFehler('');
    if (!clientId) return setFehler('Für den Almanach ist noch keine Spotify-Anwendung hinterlegt.');
    try {
      await spotify.anmelden(clientId);
    } catch (err) {
      setFehler(
        err.message === 'unsicherer_kontext'
          ? 'Spotify lässt sich nur über eine verschlüsselte Adresse verbinden – also über den Tunnel, nicht über die nackte Adresse im Heimnetz.'
          : err.message
      );
    }
  }, [clientId]);

  const trennen = useCallback(() => {
    spieler.current?.disconnect();
    spieler.current = null;
    setGeraetId(null);
    setZuhoeren(false);
    spotify.abmelden();
    setVerbunden(false);
  }, []);

  /* --- Abspielwerk ------------------------------------------------------- */

  // Nur was hier läuft, ist „dieses Fenster“; bei einem anderen Gerät
  // schicken wir bloß Befehle und brauchen kein eigenes Abspielwerk.
  const hierAbspielen = ausgabe === HIER;
  const ziel = hierAbspielen ? geraetId : ausgabe;
  const bereit = zuhoeren && !!ziel;

  useEffect(() => {
    if (!zuhoeren || !hierAbspielen || !clientId || spieler.current || baut.current) return undefined;
    baut.current = true;
    let abgebrochen = false;

    (async () => {
      try {
        const Spotify = await spotify.ladeSdk();
        if (abgebrochen) return;

        const werk = new Spotify.Player({
          name: `Abenteuer-Almanach – ${user?.name ?? 'Gast'}`,
          getOAuthToken: (fertig) => {
            spotify.token(clientId).then((t) => t && fertig(t));
          },
          volume: pegelBeimStart.current,
        });

        werk.addListener('ready', ({ device_id }) => setGeraetId(device_id));
        werk.addListener('not_ready', () => setGeraetId(null));
        werk.addListener('account_error', () =>
          setFehler('Im Browser abspielen kann nur Spotify Premium. Leg die Musik sonst auf einem anderen Gerät auf.')
        );
        werk.addListener('authentication_error', ({ message }) => setFehler(message));
        werk.addListener('initialization_error', ({ message }) => setFehler(message));
        werk.addListener('playback_error', ({ message }) => setFehler(message));

        const steht = await werk.connect();
        if (abgebrochen || !steht) return;
        spieler.current = werk;
        // Der Browser gibt erst nach einem Klick Ton frei. Der Knopf „Zuhören“
        // war einer – das hier meldet ihn beim Abspielwerk an.
        werk.activateElement?.();
      } catch (err) {
        if (!abgebrochen) setFehler(err.message);
      } finally {
        baut.current = false;
      }
    })();

    return () => {
      abgebrochen = true;
    };
  }, [zuhoeren, hierAbspielen, clientId, user?.name]);

  // Beim Verlassen der Seite das Gerät wieder abmelden.
  useEffect(
    () => () => {
      spieler.current?.disconnect();
      spieler.current = null;
    },
    []
  );

  const zuhoerenStarten = useCallback(async () => {
    setFehler('');
    if (!spotify.istVerbunden()) return verbinden();
    setVerbunden(true);
    setZuhoeren(true);
    // Läuft schon ein Werk, genügt die Freigabe innerhalb dieses Klicks.
    spieler.current?.activateElement?.();
  }, [verbinden]);

  const zuhoerenBeenden = useCallback(async () => {
    setZuhoeren(false);
    letzteAuflage.current = null;
    try {
      if (spieler.current) await spieler.current.pause();
      else if (ausgabe !== HIER) await spotify.pausieren(clientId, ausgabe);
    } catch {
      /* schon still */
    }
  }, [ausgabe, clientId]);

  /* --- Dem Server folgen -------------------------------------------------- */

  const uri = klang?.uri ?? null;
  const spielt = !!klang?.playing;
  const gemischt = !!klang?.shuffle;
  const seit = klang?.startedAt ?? null;

  useEffect(() => {
    if (!bereit) return;

    (async () => {
      try {
        if (!uri || !spielt) {
          if (letzteAuflage.current) await spotify.pausieren(clientId, ziel).catch(() => {});
          if (!uri) letzteAuflage.current = null;
          return;
        }

        // Erst eine neue Auflage startet von vorn. Ändert der DM nur die
        // Lautstärke, soll das Stück nicht von vorn beginnen.
        const auflage = `${uri}|${seit}|${ziel}`;
        if (auflage === letzteAuflage.current) {
          await spotify.weiter(clientId, ziel);
          return;
        }
        letzteAuflage.current = auflage;
        await spotify.auflegen(clientId, { uri, shuffle: gemischt, deviceId: ziel });
        setFehler('');
      } catch (err) {
        setFehler(err.message === 'nicht_verbunden' ? 'Die Spotify-Verbindung ist abgelaufen.' : err.message);
      }
    })();
  }, [bereit, ziel, clientId, uri, spielt, gemischt, seit]);

  // Lautstärke getrennt nachziehen – sie darf nichts neu starten.
  useEffect(() => {
    if (!bereit) return;
    if (spieler.current) spieler.current.setVolume(effektiv).catch(() => {});
    else spotify.ferneLautstaerke(clientId, effektiv * 100, ziel).catch(() => {});
  }, [effektiv, bereit, ziel, clientId]);

  const geraeteLaden = useCallback(async () => {
    if (!spotify.istVerbunden()) return [];
    try {
      const liste = await spotify.geraete(clientId);
      setGeraeteListe(liste);
      return liste;
    } catch {
      return [];
    }
  }, [clientId]);

  const ueberspringen = useCallback(async () => {
    if (!bereit) return;
    try {
      await spotify.naechstes(clientId, ziel);
    } catch (err) {
      setFehler(err.message);
    }
  }, [bereit, clientId, ziel]);

  const wert = useMemo(
    () => ({
      klang,
      laden,
      einrichtung,
      verbunden,
      kontoName: spotify.kontoName(),
      verbinden,
      trennen,
      zuhoeren,
      zuhoerenStarten,
      zuhoerenBeenden,
      bereit,
      lautstaerke,
      setLautstaerke,
      stumm,
      setStumm,
      ausgabe,
      setAusgabe,
      geraeteListe,
      geraeteLaden,
      ueberspringen,
      fehler,
      setFehler,
      HIER,
    }),
    [
      klang, laden, einrichtung, verbunden, verbinden, trennen, zuhoeren, zuhoerenStarten,
      zuhoerenBeenden, bereit, lautstaerke, setLautstaerke, stumm, setStumm, ausgabe,
      setAusgabe, geraeteListe, geraeteLaden, ueberspringen, fehler,
    ]
  );

  return <KlangContext.Provider value={wert}>{children}</KlangContext.Provider>;
}

export function useKlang() {
  const context = useContext(KlangContext);
  if (!context) throw new Error('useKlang braucht den KlangProvider.');
  return context;
}
