import { useCallback, useMemo, useRef, useState } from 'react';
import Board from '../components/tabletop/Board.jsx';
import SceneBar from '../components/tabletop/SceneBar.jsx';
import TokenPanel from '../components/tabletop/TokenPanel.jsx';
import Initiative from '../components/Initiative.jsx';
import Beute from '../components/Beute.jsx';
import { scenesApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useCharaktere, useKampf, useNotizen, usePings, useSzene } from '../lib/daten.jsx';
import { useLive } from '../lib/live.jsx';
import { IconHeart, IconMap, IconPlus, IconScroll, IconSwords } from '../components/icons.jsx';

/** Nebel-Änderungen werden gebündelt gesendet, nicht Feld für Feld. */
const PINSEL_MS = 120;

function Handzettel() {
  const { handzettel } = useNotizen();

  if (handzettel.length === 0) {
    return <p className="text-sepia italic">Noch hat die Spielleitung nichts ausgeteilt.</p>;
  }

  return (
    <ul className="space-y-3">
      {handzettel.map((n) => (
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

export default function Tabletop() {
  const { isDm } = useAuth();

  const {
    szene: scene,
    figuren: tokens,
    nebel: fog,
    sicht,
    nebelSetzen,
    figurSetzen,
    laden: ladeSzene,
    laedt: laedtSzene,
  } = useSzene();
  const { kampf } = useKampf();
  const { meine } = useCharaktere();
  const pings = usePings();

  const combatants = kampf.combatants;
  const activeCombatantId = kampf.activeCombatantId;
  const meineKennungen = useMemo(() => meine.map((c) => c.id), [meine]);

  const [mode, setMode] = useState('bewegen');
  const [gewaehlt, setGewaehlt] = useState(null);
  const [reiter, setReiter] = useState('kampf');
  const [seite, setSeite] = useState(false);

  const pinselPuffer = useRef({ auf: new Set(), zu: new Set() });
  const pinselZeit = useRef(null);

  // Eine entfernte Figur darf nicht ausgewählt bleiben.
  useLive('figur:entfernt', ({ id }) => setGewaehlt((g) => (g === id ? null : g)));

  /* --- Handlungen ------------------------------------------------------- */

  const darfBewegen = useCallback(
    (token) => isDm || (!token.hidden && !!token.characterId && meineKennungen.includes(token.characterId)),
    [isDm, meineKennungen]
  );

  const figurBewegen = useCallback(
    (id, x, y) => {
      figurSetzen(id, x, y);
      scenesApi.moveToken(id, { x, y }).catch(() => ladeSzene());
    },
    [figurSetzen, ladeSzene]
  );

  /** Malen fühlt sich flüssig an, weil der Nebel zuerst lokal weicht. */
  const nebelMalen = useCallback(
    (cells, revealed) => {
      if (!scene) return;
      nebelSetzen(cells, revealed);

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
    [scene, nebelSetzen]
  );

  const zeigen = useCallback((punkt) => {
    scenesApi.ping(Math.round(punkt.x), Math.round(punkt.y)).catch(() => {});
  }, []);

  const gewaehlteFigur = useMemo(() => tokens.find((t) => t.id === gewaehlt) ?? null, [tokens, gewaehlt]);

  /* --- Anzeige ---------------------------------------------------------- */

  const reiterListe = [
    { id: 'kampf', label: 'Kampf', Icon: IconSwords },
    { id: 'beute', label: 'Beute', Icon: IconHeart },
    { id: 'handzettel', label: 'Handzettel', Icon: IconScroll },
    ...(isDm && scene ? [{ id: 'figur', label: 'Figur', Icon: IconPlus }] : []),
  ];

  return (
    <div className="-mx-4 -mt-5 flex flex-col lg:h-[calc(100vh-4.6rem)] lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {isDm && (
          <SceneBar
            scene={scene}
            laedtSzene={laedtSzene}
            tokens={tokens}
            mode={mode}
            onMode={setMode}
            onChanged={ladeSzene}
            onFogAll={async (revealed) => {
              if (!scene) return;
              await scenesApi.fogAll(scene.id, revealed);
              ladeSzene();
            }}
            onTokensFromEncounter={async () => {
              if (!scene) return;
              await scenesApi.tokensFromEncounter(scene.id);
              ladeSzene();
            }}
          />
        )}

        <div className="relative h-[58vh] border-y border-rule lg:h-auto lg:flex-1 lg:border-y-0">
          {scene ? (
            <Board
              scene={scene}
              fog={fog}
              tokens={tokens}
              combatants={combatants}
              activeCombatantId={activeCombatantId}
              dm={isDm}
              sicht={sicht}
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
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#14100a] px-6 text-center">
              <IconMap size={34} className="text-[#5a4526]" />
              <p className="max-w-sm text-[#a89372] italic">
                {isDm
                  ? 'Noch liegt keine Karte auf dem Tisch. Lade eine hoch – bis dahin lässt sich rechts trotzdem kämpfen, teilen und lesen.'
                  : 'Die Spielleitung hat noch keine Karte aufgelegt. Kampf, Beute und Handzettel stehen rechts trotzdem bereit.'}
              </p>
            </div>
          )}

          {scene && (
            <div className="pointer-events-none absolute top-3 left-3 bg-black/45 px-2.5 py-1 font-display text-[12px] tracking-[0.12em] text-[#e8cf8d] uppercase">
              {scene.name}
            </div>
          )}

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
          {reiter === 'beute' && <Beute />}
          {reiter === 'handzettel' && <Handzettel />}
          {reiter === 'figur' && isDm && scene && (
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
