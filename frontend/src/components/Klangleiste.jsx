import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useKlang } from '../lib/klang.jsx';
import { ambienceApi } from '../lib/api.js';
import { sichererKontext } from '../lib/spotify.js';
import { IconClose, IconNote, IconPause, IconPlay, IconSkip, IconSpeaker, IconSpeakerOff } from './icons.jsx';

/**
 * Die Klangleiste – für alle am Tisch, nicht nur für die Spielleitung.
 *
 * Der DM legt auf, jeder hört bei sich. Deshalb sitzen hier die Regler, die
 * wirklich jedem gehören: eigene Lautstärke, Stummschalten, und die Wahl, ob
 * der Ton aus diesem Fenster kommt oder aus einem anderen Spotify-Gerät.
 */
export default function Klangleiste() {
  const { isDm } = useAuth();
  const {
    klang,
    einrichtung,
    verbunden,
    kontoName,
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
    HIER,
  } = useKlang();

  const [offen, setOffen] = useState(false);
  // Der Pegelregler des DM wirkt sofort, meldet sich aber erst nach kurzem
  // Innehalten beim Server – sonst schickte jedes Ziehen ein Dutzend Befehle
  // an alle Fenster der Runde.
  const [pegel, setPegel] = useState(klang?.volume ?? 45);
  const laeuft = !!klang?.uri && klang.playing;

  useEffect(() => {
    setPegel(klang?.volume ?? 45);
    // Nur bei einer neuen Auflage übernehmen; das eigene Echo darf den
    // Regler nicht unter dem Finger wegziehen.
  }, [klang?.ambienceId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (offen && verbunden) geraeteLaden();
  }, [offen, verbunden, geraeteLaden]);

  // Ohne hinterlegte Spotify-Anwendung gibt es hier nichts zu bedienen. Wer
  // sie einrichten darf, erfährt im Reiter „Klang“, wie.
  if (!einrichtung.eingerichtet) return null;

  const titel = klang?.name || 'Nichts aufgelegt';

  return (
    <>
      <button
        onClick={() => setOffen((o) => !o)}
        title={laeuft ? `Klang: ${titel}` : 'Klangteppich'}
        aria-label="Klangteppich"
        className={`fixed right-4 bottom-44 z-40 flex h-12 w-12 items-center justify-center rounded-full border ring-2 ring-gold/70 md:bottom-26 ${
          laeuft && bereit ? 'border-gold bg-leather text-gold-soft' : 'border-rule bg-panel text-sepia'
        }`}
      >
        <IconNote size={19} />
        {laeuft && !bereit && (
          <span className="absolute top-0.5 right-0.5 h-2.5 w-2.5 rounded-full bg-rubric ring-2 ring-panel" />
        )}
      </button>

      {offen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[rgba(40,28,14,0.55)] px-4 pb-4 md:items-center md:pb-0"
             onClick={() => setOffen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="panel w-full max-w-md space-y-4 p-5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[13px] tracking-[0.14em] text-rubric uppercase">Klangteppich</h2>
                <p className="mt-1 truncate font-display text-[17px] text-ink" title={titel}>
                  {titel}
                </p>
                <p className="text-[15px] text-sepia italic">
                  {!klang?.uri
                    ? 'Die Spielleitung hat nichts aufgelegt.'
                    : klang.playing
                      ? bereit
                        ? 'läuft'
                        : 'liegt auf – hier ist es noch still'
                      : 'pausiert'}
                </p>
              </div>
              {klang?.imageUrl && <img src={klang.imageUrl} alt="" className="h-14 w-14 shrink-0 border border-rule object-cover" />}
              <button onClick={() => setOffen(false)} className="text-sepia hover:text-rubric" aria-label="Schließen">
                <IconClose size={18} />
              </button>
            </div>

            {!sichererKontext() && (
              <p className="border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2.5 text-sepia">
                Über diese Adresse lässt sich Spotify nicht verbinden – der Browser gibt Ton nur über eine
                verschlüsselte Verbindung frei. Ruf den Almanach über den Tunnel auf, nicht über die Adresse im
                Heimnetz.
              </p>
            )}

            {fehler && <p className="border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2.5 text-sepia">{fehler}</p>}

            {!verbunden ? (
              <>
                <p className="text-sepia">
                  Verbinde dein eigenes Spotify, dann hörst du, was am Tisch aufgelegt wird. Für die Wiedergabe im
                  Browser verlangt Spotify Premium; ohne Premium kannst du unten ein anderes Gerät wählen.
                </p>
                <button onClick={verbinden} disabled={!sichererKontext()} className="btn btn-seal w-full disabled:opacity-60">
                  Mit Spotify verbinden
                </button>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {!zuhoeren ? (
                    <button onClick={zuhoerenStarten} className="btn btn-seal flex-1">
                      <IconPlay size={16} /> Zuhören
                    </button>
                  ) : (
                    <button onClick={zuhoerenBeenden} className="btn btn-plate flex-1">
                      <IconPause size={16} /> Nicht mehr zuhören
                    </button>
                  )}
                  <button
                    onClick={() => setStumm(!stumm)}
                    className={`flex h-12 w-12 items-center justify-center border ${
                      stumm ? 'border-rubric text-rubric' : 'border-rule text-sepia hover:text-ink'
                    }`}
                    aria-label={stumm ? 'Ton wieder an' : 'Stumm'}
                  >
                    {stumm ? <IconSpeakerOff size={17} /> : <IconSpeaker size={17} />}
                  </button>
                  {bereit && (
                    <button onClick={ueberspringen} className="flex h-12 w-12 items-center justify-center border border-rule text-sepia hover:text-ink" aria-label="Nächstes Stück">
                      <IconSkip size={17} />
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1 flex items-center justify-between font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                    <span>Meine Lautstärke</span>
                    <span>{lautstaerke} %</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={lautstaerke}
                    onChange={(e) => setLautstaerke(Number(e.target.value))}
                    className="w-full accent-[var(--rubric,#8c2f24)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                    Ton kommt aus
                  </span>
                  <select value={ausgabe} onChange={(e) => setAusgabe(e.target.value)} className="field-box w-full">
                    <option value={HIER}>diesem Fenster (braucht Premium)</option>
                    {geraeteListe.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.type})
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[14px] text-faint italic">
                    Handy, Rechner oder Lautsprecher, auf denen Spotify offen ist. Für die Liste muss dort einmal
                    etwas gelaufen sein.
                  </span>
                </label>

                <p className="flex items-center justify-between border-t border-dashed border-rule pt-3 text-[14px] text-faint">
                  <span>{kontoName ? `verbunden als ${kontoName}` : 'mit Spotify verbunden'}</span>
                  <button onClick={trennen} className="min-h-9 text-sepia hover:text-rubric hover:underline">
                    trennen
                  </button>
                </p>
              </>
            )}

            {/* Die Spielleitung legt für alle auf – dafür braucht sie selbst kein
                verbundenes Spotify. Wer am Laptop ohne Premium leitet, steuert
                hier trotzdem, was die Runde hört. */}
            {isDm && klang?.uri && (
              <div className="space-y-2 border-t border-dashed border-rule pt-3">
                <span className="flex items-center justify-between font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                  <span>Für alle: Pegel dieser Auflage</span>
                  <span>{pegel} %</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={pegel}
                  onChange={(e) => setPegel(Number(e.target.value))}
                  onPointerUp={() => ambienceApi.lautstaerke(pegel)}
                  onKeyUp={() => ambienceApi.lautstaerke(pegel)}
                  onBlur={() => ambienceApi.lautstaerke(pegel)}
                  className="w-full accent-[var(--gold,#c4a052)]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => (klang.playing ? ambienceApi.pause() : ambienceApi.weiter())}
                    className="btn-plate min-h-11 flex-1 text-[13px]"
                  >
                    {klang.playing ? 'Für alle pausieren' : 'Für alle weiter'}
                  </button>
                  <button onClick={() => ambienceApi.stille()} className="btn-plate min-h-11 flex-1 text-[13px]">
                    Stille
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
