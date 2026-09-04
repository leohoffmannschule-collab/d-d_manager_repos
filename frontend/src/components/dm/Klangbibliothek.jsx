import { useMemo, useState } from 'react';
import { ambienceApi } from '../../lib/api.js';
import { useKlangbibliothek } from '../../lib/daten.jsx';
import { useKlang } from '../../lib/klang.jsx';
import { nachschlagen, rueckkehrAdresse } from '../../lib/spotify.js';
import { Rubric } from '../ui.jsx';
import { IconNote, IconPause, IconPlay, IconSearch, IconTrash } from '../icons.jsx';

const LEER = { name: '', uri: '', tags: '', notes: '', shuffle: true, volume: 45, imageUrl: '' };

/** Wenn noch keine Spotify-Anwendung hinterlegt ist, steht hier der Weg dorthin. */
function Einrichtung() {
  const adresse = rueckkehrAdresse();
  return (
    <div className="panel space-y-3 p-4">
      <Rubric>Spotify einrichten</Rubric>
      <p className="text-sepia leading-relaxed">
        Der Almanach braucht eine eigene Spotify-Anwendung – einmalig, kostenlos und in fünf Minuten erledigt.
        Er speichert dabei niemandes Zugangsdaten: Jeder am Tisch meldet sich in seinem eigenen Browser an, und
        auf dem Pi steht nur, welche Wiedergabeliste gerade laufen soll.
      </p>
      <ol className="list-decimal space-y-1.5 pl-5 leading-relaxed text-ink marker:text-rubric">
        <li>
          Auf <span className="font-display">developer.spotify.com/dashboard</span> anmelden und
          <span className="font-display"> Create app</span> wählen.
        </li>
        <li>
          Als <span className="font-display">Redirect URI</span> genau das hier eintragen:
          <code className="mt-1 block border border-rule bg-panel-soft px-2.5 py-1.5 break-all text-ink">{adresse}</code>
          <span className="text-[14px] text-faint italic">
            Spotify verlangt eine https-Adresse – also die Tunnel-Adresse, unter der die Runde den Almanach
            aufruft, nicht die Adresse im Heimnetz.
          </span>
        </li>
        <li>
          Bei <span className="font-display">Which API/SDKs</span> die Haken bei
          <span className="font-display"> Web API</span> und <span className="font-display">Web Playback SDK</span>.
        </li>
        <li>
          Die <span className="font-display">Client ID</span> kopieren und auf dem Pi als Umgebungsvariable
          <code className="mx-1 border border-rule bg-panel-soft px-1.5 text-ink">SPOTIFY_CLIENT_ID</code>
          hinterlegen (in <span className="font-display">.env</span> oder im docker-compose), dann den Almanach
          neu starten.
        </li>
      </ol>
      <p className="text-sepia italic">
        Zum Zuhören im Browser braucht jeder Spotify Premium – das ist Spotifys Regel. Wer nur ein Gratiskonto
        hat, kann den Ton in der Klangleiste auf ein anderes Gerät umleiten.
      </p>
    </div>
  );
}

function Entwurfsblatt({ entwurf, setEntwurf, clientId, onSpeichern, onAbbrechen }) {
  const [suchtNamen, setSuchtNamen] = useState(false);

  /** Aus einem eingefügten Link Namen und Bild holen – spart Tipperei. */
  async function nachtragen(link) {
    if (!clientId || !link.trim()) return;
    setSuchtNamen(true);
    try {
      const uri = link.trim();
      const kennung = uri.match(/(playlist|album|track|artist)[:/]([A-Za-z0-9]{22})/);
      if (!kennung) return;
      const gefunden = await nachschlagen(clientId, `spotify:${kennung[1]}:${kennung[2]}`);
      if (gefunden?.name) {
        setEntwurf((v) => ({ ...v, name: v.name.trim() || gefunden.name, imageUrl: gefunden.imageUrl }));
      }
    } catch {
      // Nicht verbunden oder Liste privat – dann trägt der DM den Namen selbst ein.
    } finally {
      setSuchtNamen(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSpeichern(entwurf);
      }}
      className="panel space-y-3 p-4"
    >
      <Rubric>{entwurf.id ? 'Ambiente ändern' : 'Neue Ambiente'}</Rubric>

      <input
        value={entwurf.uri}
        onChange={(e) => setEntwurf((v) => ({ ...v, uri: e.target.value }))}
        onBlur={(e) => nachtragen(e.target.value)}
        placeholder="Spotify-Link einfügen (Teilen → Link kopieren)"
        className="field-box"
      />
      <input
        value={entwurf.name}
        onChange={(e) => setEntwurf((v) => ({ ...v, name: e.target.value }))}
        placeholder={suchtNamen ? 'Name wird bei Spotify nachgeschlagen …' : 'Name, z. B. Schankraum am Abend'}
        className="field-box font-display text-lg"
      />
      <input
        value={entwurf.tags}
        onChange={(e) => setEntwurf((v) => ({ ...v, tags: e.target.value }))}
        placeholder="Schlagworte, z. B. Taverne, ruhig, Stadt"
        className="field-box"
      />
      <textarea
        value={entwurf.notes}
        onChange={(e) => setEntwurf((v) => ({ ...v, notes: e.target.value }))}
        rows={2}
        placeholder="Wozu passt das? Wann willst du es auflegen?"
        className="field-box resize-y leading-relaxed"
      />

      <div className="flex flex-wrap items-end gap-4">
        <label className="block flex-1">
          <span className="mb-1 flex items-center justify-between font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            <span>Pegel</span>
            <span>{entwurf.volume} %</span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={entwurf.volume}
            onChange={(e) => setEntwurf((v) => ({ ...v, volume: Number(e.target.value) }))}
            className="w-full accent-[var(--gold,#c4a052)]"
          />
          <span className="mt-1 block text-[14px] text-faint italic">
            Damit stimmst du Kampfmusik gegen Schankraum ab. Wie laut es im Zimmer wird, stellt jeder selbst.
          </span>
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sepia">
          <input
            type="checkbox"
            checked={entwurf.shuffle}
            onChange={(e) => setEntwurf((v) => ({ ...v, shuffle: e.target.checked }))}
            className="h-4 w-4 accent-[var(--rubric,#8c2f24)]"
          />
          bunt gemischt
        </label>
      </div>

      <div className="flex gap-2.5">
        <button type="submit" className="btn btn-seal">
          Speichern
        </button>
        <button type="button" onClick={onAbbrechen} className="btn btn-plate">
          Zurück
        </button>
      </div>
    </form>
  );
}

/**
 * Die Klangbibliothek der Spielleitung.
 *
 * Wie die Kartenbibliothek: einmal sammeln, an jedem Abend mit einem Griff
 * auflegen. Was hier steht, hört die Runde erst, wenn es aufgelegt ist.
 */
export default function Klangbibliothek() {
  const { ambienten, laden, laedt } = useKlangbibliothek();
  const { klang, einrichtung } = useKlang();
  const [entwurf, setEntwurf] = useState(null);
  const [suche, setSuche] = useState('');
  const [meldung, setMeldung] = useState('');

  const treffer = useMemo(() => {
    const wort = suche.trim().toLowerCase();
    if (!wort) return ambienten;
    return ambienten.filter(
      (a) =>
        a.name.toLowerCase().includes(wort) ||
        a.notes.toLowerCase().includes(wort) ||
        a.tags.some((t) => t.toLowerCase().includes(wort))
    );
  }, [ambienten, suche]);

  async function speichern(werte) {
    const nutzlast = {
      name: werte.name,
      uri: werte.uri,
      imageUrl: werte.imageUrl,
      notes: werte.notes,
      shuffle: werte.shuffle,
      volume: werte.volume,
      tags: werte.tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (werte.id) await ambienceApi.update(werte.id, nutzlast);
      else await ambienceApi.create(nutzlast);
      setEntwurf(null);
      setMeldung('');
      laden();
    } catch (err) {
      setMeldung(err.message);
    }
  }

  if (!einrichtung.eingerichtet) return <Einrichtung />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[14rem] flex-1 items-center gap-2.5 border border-rule bg-panel-soft px-3">
          <IconSearch size={16} className="text-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Nach Name oder Schlagwort suchen"
            className="min-h-11 flex-1 bg-transparent text-ink outline-none"
          />
        </label>
        <button onClick={() => setEntwurf(LEER)} className="btn btn-seal">
          <IconNote size={16} /> Neue Ambiente
        </button>
        {klang?.uri && (
          <button onClick={() => ambienceApi.stille()} className="btn btn-plate">
            Stille
          </button>
        )}
      </div>

      <p className="text-sepia italic">
        {laedt
          ? 'Die Bibliothek wird aufgeschlagen …'
          : ambienten.length === 0
            ? 'Noch ist nichts gesammelt. Füge einen Spotify-Link ein – eine Wiedergabeliste, ein Album oder ein einzelnes Stück.'
            : `${ambienten.length} ${ambienten.length === 1 ? 'Ambiente wartet' : 'Ambienten warten'} auf ihren Einsatz.`}
      </p>

      {meldung && <p className="border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2.5 text-sepia">{meldung}</p>}

      {entwurf && (
        <Entwurfsblatt
          key={entwurf.id ?? 'neu'}
          entwurf={entwurf}
          setEntwurf={setEntwurf}
          clientId={einrichtung.clientId}
          onSpeichern={speichern}
          onAbbrechen={() => setEntwurf(null)}
        />
      )}

      <ul className="space-y-2">
        {treffer.map((a) => {
          const liegt = klang?.ambienceId === a.id;
          return (
            <li key={a.id} className={`panel flex flex-wrap items-center gap-3 p-3 ${liegt ? 'border-gold' : ''}`}>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-rule bg-panel-soft">
                {a.imageUrl ? (
                  <img src={a.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <IconNote size={18} className="text-faint" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[16px] text-ink">
                  {a.name}
                  {liegt && <span className="ml-2 text-[13px] tracking-[0.10em] text-gold uppercase">liegt auf</span>}
                </h3>
                <p className="text-[14px] text-faint">
                  {a.kind === 'playlist' ? 'Wiedergabeliste' : a.kind === 'album' ? 'Album' : a.kind === 'artist' ? 'Künstler' : 'Stück'}
                  {a.shuffle && ' · gemischt'} · Pegel {a.volume} %
                  {a.tags.length > 0 && ` · ${a.tags.join(', ')}`}
                </p>
                {a.notes && <p className="mt-0.5 text-sepia">{a.notes}</p>}
              </div>

              <div className="flex gap-1.5">
                {liegt && klang.playing ? (
                  <button onClick={() => ambienceApi.pause()} className="btn btn-plate min-h-12 text-[13px]">
                    <IconPause size={15} /> Pause
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        if (liegt) await ambienceApi.weiter();
                        else await ambienceApi.auflegen(a.id);
                      } catch (err) {
                        setMeldung(err.message);
                      }
                    }}
                    className="btn btn-seal min-h-12 text-[13px]"
                  >
                    <IconPlay size={15} /> Auflegen
                  </button>
                )}
                <button
                  onClick={() => setEntwurf({ ...a, tags: a.tags.join(', ') })}
                  className="btn-plate min-h-12 px-3 text-[13px]"
                >
                  Ändern
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`„${a.name}“ aus der Klangbibliothek nehmen?`)) return;
                    await ambienceApi.remove(a.id);
                    laden();
                  }}
                  className="flex h-12 w-12 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                  aria-label={`${a.name} löschen`}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {ambienten.length > 0 && treffer.length === 0 && (
        <p className="text-sepia italic">Zu „{suche}“ liegt nichts in der Bibliothek.</p>
      )}
    </div>
  );
}
