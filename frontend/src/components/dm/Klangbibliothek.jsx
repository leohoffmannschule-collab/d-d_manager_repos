import { useMemo, useState } from 'react';
import { ambienceApi } from '../../lib/api.js';
import { useKlang, useKlangbibliothek } from '../../lib/daten.jsx';
import { Rubric } from '../ui.jsx';
import { IconLink, IconNote, IconPlay, IconSearch, IconTrash } from '../icons.jsx';

const LEER = { name: '', uri: '', tags: '', notes: '' };

const ART = {
  playlist: 'Wiedergabeliste',
  album: 'Album',
  track: 'Stück',
  artist: 'Künstler',
};

function Entwurfsblatt({ entwurf, setEntwurf, onSpeichern, onAbbrechen }) {
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
        placeholder="Spotify-Link einfügen (in Spotify: Teilen → Link kopieren)"
        className="field-box"
      />
      <input
        value={entwurf.name}
        onChange={(e) => setEntwurf((v) => ({ ...v, name: e.target.value }))}
        placeholder="Name, z. B. Schankraum am Abend"
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
        placeholder="Wozu passt das? Steht am Tisch mit dabei."
        className="field-box resize-y leading-relaxed"
      />

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
 * Hier liegen Spotify-Links – gesammelt wie Karten, an jedem Abend mit einem
 * Griff aufgelegt. „Auflegen“ spielt nichts ab; es sagt der Runde, was jetzt
 * dran ist, und legt ihr den Verweis hin. Jeder öffnet ihn in seinem eigenen
 * Spotify und dreht so laut auf, wie er mag.
 */
export default function Klangbibliothek() {
  const { ambienten, laden, laedt } = useKlangbibliothek();
  const { klang } = useKlang();
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

  const teilen = (text) => text.split(',').map((t) => t.trim()).filter(Boolean);

  async function speichern(werte) {
    try {
      await (werte.id ? ambienceApi.update(werte.id, { ...werte, tags: teilen(werte.tags) })
                      : ambienceApi.create({ ...werte, tags: teilen(werte.tags) }));
      setEntwurf(null);
      setMeldung('');
      laden();
    } catch (err) {
      setMeldung(err.message);
    }
  }

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
            ? 'Noch ist nichts hinterlegt. Füge einen Spotify-Link ein – eine Wiedergabeliste, ein Album oder ein einzelnes Stück.'
            : `${ambienten.length} ${ambienten.length === 1 ? 'Ambiente wartet' : 'Ambienten warten'} auf ihren Einsatz.`}
      </p>

      <p className="border-l-[3px] border-gold bg-gold/10 px-3.5 py-2.5 text-sepia">
        Der Almanach spielt nichts ab – er sagt der Runde, was dran ist, und legt den Verweis hin.
        Jeder öffnet ihn in seinem eigenen Spotify. Das geht mit jedem Konto, auch ohne Premium.
      </p>

      {meldung && <p className="border-l-[3px] border-rubric bg-rubric/10 px-3.5 py-2.5 text-sepia">{meldung}</p>}

      {entwurf && (
        <Entwurfsblatt
          key={entwurf.id ?? 'neu'}
          entwurf={entwurf}
          setEntwurf={setEntwurf}
          onSpeichern={speichern}
          onAbbrechen={() => setEntwurf(null)}
        />
      )}

      <ul className="space-y-2">
        {treffer.map((a) => {
          const liegt = klang?.ambienceId === a.id;
          return (
            <li key={a.id} className={`panel flex flex-wrap items-center gap-3 p-3 ${liegt ? 'border-gold' : ''}`}>
              <IconNote size={17} className={`shrink-0 ${liegt ? 'text-gold' : 'text-faint'}`} />

              <div className="min-w-0 flex-1">
                <h3 className="truncate font-display text-[16px] text-ink">
                  {a.name}
                  {liegt && <span className="ml-2 text-[13px] tracking-[0.10em] text-gold uppercase">liegt auf</span>}
                </h3>
                <p className="text-[14px] text-faint">
                  {ART[a.kind] ?? 'Ambiente'}
                  {a.tags.length > 0 && ` · ${a.tags.join(', ')}`}
                </p>
                {a.notes && <p className="mt-0.5 text-sepia">{a.notes}</p>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={async () => {
                    try {
                      await ambienceApi.auflegen(a.id);
                    } catch (err) {
                      setMeldung(err.message);
                    }
                  }}
                  className="btn btn-seal min-h-12 text-[13px]"
                  title="Der Runde zeigen, dass jetzt das hier läuft"
                >
                  <IconPlay size={15} /> Auflegen
                </button>
                <a
                  href={a.webUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-plate flex min-h-12 items-center gap-1.5 px-3 text-[13px]"
                  title="Zum Anhören in Spotify öffnen"
                >
                  <IconLink size={15} /> Öffnen
                </a>
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
