import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Board from '../components/tabletop/Board.jsx';
import SceneBar from '../components/tabletop/SceneBar.jsx';
import TokenPanel from '../components/tabletop/TokenPanel.jsx';
import Initiative from '../components/Initiative.jsx';
import { charactersApi, encounterApi, notesApi, scenesApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useLive, useLiveStatus } from '../lib/live.jsx';
import { IconMap, IconPlus, IconScroll, IconSwords, IconUsers } from '../components/icons.jsx';

/** Nebel-Änderungen werden gebündelt gesendet, nicht Feld für Feld. */
const PINSEL_MS = 120;

function Handzettel() {
  const { generation } = useLiveStatus();
  const [notizen, setNotizen] = useState([]);

  const laden = useCallback(() => {
    notesApi
      .list()
      .then((alle) => setNotizen(alle.filter((n) => n.visibility === 'runde')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (generation > 0) laden();
  }, [generation, laden]);
  useLive('notizen:aktualisiert', laden);

  if (notizen.length === 0) {
    return <p className="text-sepia italic">Noch hat die Spielleitung nichts ausgeteilt.</p>;
  }

  return (
    <ul className="space-y-3">
      {notizen.map((n) => (
        <li key={n.id} className="border border-rule bg-panel-soft p-3">
          <h3 className="font-display text-[15px] font-semibold text-ink">{n.title}</h3>
          {n.tags.length > 0 && (
            <p className="mt-0.5 flex flex-wrap gap-1">
              {n.tags.map((t) => (
                <span key={t} className="border border-rule px-1.5 text-[13px] text-faint">
                  {t}
                </span>
              ))}
            </p>
          )}
          <p className="mt-1.5 whitespace-pre-wrap text-sepia">{n.content}</p>
        </li>
      ))}
    </ul>
  );
}

function AmTisch() {
  const { presence } = useLiveStatus();
  return presence.length === 0 ? (
    <p className="text-sepia italic">Gerade ist niemand sonst am Tisch.</p>
  ) : (
    <ul className="space-y-1.5">
      {presence.map((p) => (
        <li key={p.id} className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-ink">{p.name}</span>
          <span className="font-display text-[10px] tracking-[0.14em] text-faint uppercase">
            {p.role === 'sl' ? 'Spielleitung' : 'Runde'}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Tabletop() {
  const { user, isDm } = useAuth();
  const { generation } = useLiveStatus();

  const [scene, setScene] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [fog, setFog] = useState(() => new Set());
  const [combatants, setCombatants] = useState([]);
  const [activeCombatantId, setActiveCombatantId] = useState(null);
  const [meine, setMeine] = useState([]);
  const [mode, setMode] = useState('bewegen');
  const [gewaehlt, setGewaehlt] = useState(null);
  const [pings, setPings] = useState([]);
  const [reiter, setReiter] = useState('kampf');
  const [seite, setSeite] = useState(false);

  const pinselPuffer = useRef({ auf: new Set(), zu: new Set() });
  const pinselZeit = useRef(null);

  /* --- Laden ------------------------------------------------------------ */

  const ladeSzene = useCallback(async () => {
    const aktiv = await scenesApi.active();
    setScene(aktiv);
    setTokens(aktiv?.tokens ?? []);
    setFog(new Set(aktiv?.fog ?? []));
  }, []);

  const ladeKampf = useCallback(async () => {
    const kampf = await encounterApi.get();
    setCombatants(kampf.combatants);
    setActiveCombatantId(kampf.activeCombatantId);
  }, []);

  useEffect(() => {
    if (generation === 0) return;
    ladeSzene().catch(() => {});
    ladeKampf().catch(() => {});
    charactersApi
      .list()
      .then((alle) => setMeine(alle.filter((c) => c.ownerId === user.id).map((c) => c.id)))
      .catch(() => {});
  }, [generation, ladeSzene, ladeKampf, user.id]);

  /* --- Live ------------------------------------------------------------- */

  useLive('szene', (neu) => {
    setScene(neu);
    setTokens(neu?.tokens ?? []);
    setFog(new Set(neu?.fog ?? []));
  });

  useLive('figur', (token) => {
    setTokens((alle) => {
      const index = alle.findIndex((t) => t.id === token.id);
      if (index === -1) return [...alle, token];
      const kopie = [...alle];
      kopie[index] = token;
      return kopie;
    });
  });

  useLive('figur:entfernt', ({ id }) => {
    setTokens((alle) => alle.filter((t) => t.id !== id));
    setGewaehlt((g) => (g === id ? null : g));
  });

  useLive('nebel', ({ sceneId, cells, revealed }) => {
    if (scene && sceneId !== scene.id) return;
    setFog((alt) => {
      const naechste = new Set(alt);
      for (const cell of cells) {
        if (revealed) naechste.add(cell);
        else naechste.delete(cell);
      }
      return naechste;
    });
  });

  useLive('kampf', (kampf) => {
    setCombatants(kampf.combatants);
    setActiveCombatantId(kampf.activeCombatantId);
  });

  useLive('ping', (ping) => {
    const key = `${ping.at}-${ping.name}`;
    setPings((alle) => [...alle, { ...ping, key }]);
    setTimeout(() => setPings((alle) => alle.filter((p) => p.key !== key)), 2600);
  });

  /* --- Handlungen ------------------------------------------------------- */

  const darfBewegen = useCallback(
    (token) => isDm || (!token.hidden && !!token.characterId && meine.includes(token.characterId)),
    [isDm, meine]
  );

  const figurBewegen = useCallback(
    (id, x, y) => {
      setTokens((alle) => alle.map((t) => (t.id === id ? { ...t, x, y } : t)));
      scenesApi.moveToken(id, { x, y }).catch(() => ladeSzene());
    },
    [ladeSzene]
  );

  /** Malen fühlt sich flüssig an, weil der Nebel zuerst lokal weicht. */
  const nebelMalen = useCallback(
    (cells, revealed) => {
      if (!scene) return;
      setFog((alt) => {
        const naechste = new Set(alt);
        for (const cell of cells) {
          if (revealed) naechste.add(cell);
          else naechste.delete(cell);
        }
        return naechste;
      });

      const topf = revealed ? pinselPuffer.current.auf : pinselPuffer.current.zu;
      for (const cell of cells) topf.add(cell);

      if (pinselZeit.current) return;
      pinselZeit.current = setTimeout(() => {
        pinselZeit.current = null;
        const { auf, zu } = pinselPuffer.current;
        pinselPuffer.current = { auf: new Set(), zu: new Set() };
        if (auf.size) scenesApi.fog(scene.id, [...auf], true).catch(() => {});
        if (zu.size) scenesApi.fog(scene.id, [...zu], false).catch(() => {});
      }, PINSEL_MS);
    },
    [scene]
  );

  const zeigen = useCallback((punkt) => {
    scenesApi.ping(Math.round(punkt.x), Math.round(punkt.y)).catch(() => {});
  }, []);

  const gewaehlteFigur = useMemo(() => tokens.find((t) => t.id === gewaehlt) ?? null, [tokens, gewaehlt]);

  /* --- Anzeige ---------------------------------------------------------- */

  if (!scene) {
    return (
      <div className="-mx-4 -mt-5">
        {isDm && (
          <SceneBar
            scene={null}
            mode={mode}
            onMode={setMode}
            onChanged={ladeSzene}
            onFogAll={() => {}}
            onTokensFromEncounter={() => {}}
          />
        )}
        <div className="m-4 flex flex-col items-center justify-center gap-3 border border-dashed border-rule-strong p-12 text-center">
          <IconMap size={34} className="text-faint" />
          <p className="text-sepia italic">
            {isDm
              ? 'Noch liegt keine Karte auf dem Tisch. Lade eine hoch, dann sieht sie die ganze Runde.'
              : 'Die Spielleitung hat noch keine Karte aufgelegt.'}
          </p>
        </div>
      </div>
    );
  }

  const reiterListe = [
    { id: 'kampf', label: 'Kampf', Icon: IconSwords },
    { id: 'handzettel', label: 'Handzettel', Icon: IconScroll },
    { id: 'tisch', label: 'Am Tisch', Icon: IconUsers },
    ...(isDm ? [{ id: 'figur', label: 'Figur', Icon: IconPlus }] : []),
  ];

  return (
    <div className="-mx-4 -mt-5 flex flex-col lg:h-[calc(100vh-4.6rem)] lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {isDm && (
          <SceneBar
            scene={scene}
            mode={mode}
            onMode={setMode}
            onChanged={ladeSzene}
            onFogAll={async (revealed) => {
              await scenesApi.fogAll(scene.id, revealed);
              ladeSzene();
            }}
            onTokensFromEncounter={async () => {
              await scenesApi.tokensFromEncounter(scene.id);
              ladeSzene();
            }}
          />
        )}

        <div className="relative h-[58vh] border-y border-rule lg:h-auto lg:flex-1 lg:border-y-0">
          <Board
            scene={scene}
            fog={fog}
            tokens={tokens}
            combatants={combatants}
            activeCombatantId={activeCombatantId}
            dm={isDm}
            mode={mode}
            canMoveToken={darfBewegen}
            onMoveToken={figurBewegen}
            onPaintFog={nebelMalen}
            onPing={zeigen}
            pings={pings}
            selectedTokenId={gewaehlt}
            onSelectToken={(id) => {
              setGewaehlt(id);
              if (isDm) setReiter('figur');
            }}
          />

          <div className="pointer-events-none absolute top-3 left-3 bg-black/45 px-2.5 py-1 font-display text-[12px] tracking-[0.12em] text-[#e8cf8d] uppercase">
            {scene.name}
          </div>

          <button
            onClick={() => setSeite((s) => !s)}
            className="absolute top-3 right-3 border border-gold bg-black/55 px-3 py-2 font-display text-[11px] tracking-[0.10em] text-[#e8cf8d] uppercase lg:hidden"
          >
            {seite ? 'Karte' : 'Kampf & Runde'}
          </button>
        </div>
      </div>

      <aside
        className={`w-full shrink-0 border-rule bg-panel lg:block lg:w-[22rem] lg:overflow-y-auto lg:border-l ${
          seite ? 'block' : 'hidden'
        }`}
      >
        <div className="flex border-b border-rule">
          {reiterListe.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setReiter(id)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 font-display text-[11px] tracking-[0.08em] uppercase ${
                reiter === id ? 'border-b-2 border-gold text-ink' : 'text-sepia'
              }`}
            >
              <Icon size={15} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          {reiter === 'kampf' && <Initiative variant="tafel" />}
          {reiter === 'handzettel' && <Handzettel />}
          {reiter === 'tisch' && <AmTisch />}
          {reiter === 'figur' && isDm && (
            <>
              <button
                onClick={async () => {
                  const neu = await scenesApi.addToken(scene.id, {
                    name: 'Neue Figur',
                    x: Math.round(scene.width / 2),
                    y: Math.round(scene.height / 2),
                  });
                  setGewaehlt(neu.id);
                  ladeSzene();
                }}
                className="btn btn-seal mb-4 w-full"
              >
                <IconPlus size={16} /> Figur auslegen
              </button>
              <TokenPanel
                token={gewaehlteFigur}
                onChanged={ladeSzene}
                onRemoved={() => {
                  setGewaehlt(null);
                  ladeSzene();
                }}
              />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
