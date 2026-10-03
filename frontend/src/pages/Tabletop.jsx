/**
 * Der Spieltisch: Karte, Figuren, Nebel – und rechts die Leiste mit Kampf,
 * Beute und Handzetteln.
 *
 * Diese Seite ist der *Dirigent*, nicht der Zeichner. Gezeichnet wird in
 * components/tabletop/Board.jsx; die Werkzeugleiste der Spielleitung steckt
 * in SceneBar.jsx, die der Runde (Bewegen, Messen, Zeigen) in
 * Spielerleiste.jsx. Hier liegen nur der Zustand, der beide angeht (welches
 * Werkzeug, welche Figur gewählt, wie breit der Pinsel), und die Handgriffe,
 * die zum Server führen.
 *
 * Die wichtigste Eigenheit ist das *Vorgreifen*: Eine gezogene Figur und ein
 * Pinselstrich werden sofort örtlich angezeigt und erst danach geschickt.
 * Würde man auf die Antwort warten, ruckelte jeder Strich um die Laufzeit
 * der Anfrage hinterher.
 *
 *   tisch/useNebelpinsel.js  Nebelstriche sammeln und gebündelt schicken
 *   tisch/Seitenleiste.jsx   Kampf, Beute, Handzettel, Figur
 *   tisch/LeererTisch.jsx    was ohne Karte zu sehen ist
 *   tisch/Handzettel.jsx     die ausgeteilten Handzettel
 */
import { useCallback, useMemo, useState } from 'react';
import Board from '../components/tabletop/Board.jsx';
import SceneBar from '../components/tabletop/SceneBar.jsx';
import Spielerleiste from '../components/tabletop/Spielerleiste.jsx';
import { scenesApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useCharaktere, useKampf, usePings, useSzene } from '../lib/daten.js';
import { useLive } from '../lib/live.jsx';
import LeererTisch from './tisch/LeererTisch.jsx';
import Seitenleiste from './tisch/Seitenleiste.jsx';
import { useNebelpinsel } from './tisch/useNebelpinsel.js';

export default function Tabletop() {
  const { isDm } = useAuth();

  const {
    szene: scene,
    vorhang,
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
  // Wie breit der Nebelpinsel streicht – bleibt über den Werkzeugwechsel
  // hinweg stehen, damit man nicht nach jedem Griff neu einstellt.
  const [pinsel, setPinsel] = useState(1);
  const [gewaehlt, setGewaehlt] = useState(null);
  const [reiter, setReiter] = useState('kampf');
  const [seite, setSeite] = useState(false);

  // Eine entfernte Figur darf nicht ausgewählt bleiben.
  useLive('figur:entfernt', ({ id }) => setGewaehlt((g) => (g === id ? null : g)));

  /* --- Handlungen ------------------------------------------------------- */

  /**
   * Wer darf diese Figur ziehen? Die Spielleitung alles; ein Spieler nur,
   * was sichtbar an seinem eigenen Charakterblatt hängt.
   *
   * Auch das ist nur Höflichkeit – der Server prüft es noch einmal
   * (siehe backend/src/spieltisch/melden.js, `darfBewegen`).
   */
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

  // Nebelstriche weichen sofort und gehen gebündelt hinaus (tisch/useNebelpinsel.js).
  const nebelMalen = useNebelpinsel(scene, nebelSetzen, ladeSzene);

  // Ein verlorener Zeigefinger ist kein Fehler, den jemand sehen muss.
  const zeigen = useCallback((punkt) => {
    scenesApi.ping(Math.round(punkt.x), Math.round(punkt.y)).catch(() => {});
  }, []);

  const gewaehlteFigur = useMemo(() => tokens.find((t) => t.id === gewaehlt) ?? null, [tokens, gewaehlt]);

  return (
    <div className="-mx-4 -mt-5 flex flex-col lg:h-[calc(100vh-4.6rem)] lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Die Runde bekommt ihre Leiste nur, wenn eine Karte aufliegt – ohne
            gibt es nichts zu messen und nichts zu zeigen. */}
        {!isDm && scene && <Spielerleiste mode={mode} onMode={setMode} />}

        {isDm && (
          <SceneBar
            scene={scene}
            vorhang={vorhang}
            laedtSzene={laedtSzene}
            tokens={tokens}
            mode={mode}
            onMode={setMode}
            pinsel={pinsel}
            onPinsel={setPinsel}
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
              pinsel={pinsel}
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
            <LeererTisch vorhang={vorhang} isDm={isDm} />
          )}

          {scene && (
            <div className="tisch-marke pointer-events-none absolute top-3 left-3 bg-black/45 px-2.5 py-1 font-display text-[12px] tracking-[0.12em] uppercase">
              {scene.name}
            </div>
          )}

          <button
            onClick={() => setSeite((s) => !s)}
            className="tisch-marke absolute top-3 right-3 border border-gold bg-black/55 px-3 py-2 font-display text-[11px] tracking-[0.10em] uppercase lg:hidden"
          >
            {seite ? 'Karte' : 'Kampf & Runde'}
          </button>
        </div>
      </div>
      <Seitenleiste
        offen={seite}
        reiter={reiter}
        onReiter={setReiter}
        isDm={isDm}
        scene={scene}
        gewaehlteFigur={gewaehlteFigur}
        onFigurAuslegen={async () => {
          const neu = await scenesApi.addToken(scene.id, {
            name: 'Neue Figur',
            x: Math.round(scene.width / 2),
            y: Math.round(scene.height / 2),
          });
          setGewaehlt(neu.id);
          ladeSzene();
        }}
        onFigurGeaendert={ladeSzene}
        onFigurEntfernt={() => {
          setGewaehlt(null);
          ladeSzene();
        }}
      />
    </div>
  );
}
