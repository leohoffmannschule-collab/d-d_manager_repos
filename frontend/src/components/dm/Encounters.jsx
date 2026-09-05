import { useState } from 'react';
import { encountersApi, mediaApi } from '../../lib/api.js';
import { useBegegnungen, useBestiarium } from '../../lib/daten.jsx';
import { Rubric } from '../ui.jsx';
import { IconEyeOff, IconPlus, IconSearch, IconSwords, IconTrash } from '../icons.jsx';

const LEER = { name: '', notes: '', entries: [] };

/** Eine Zeile im Bauplan einer Begegnung. */
function Posten({ eintrag, onChange, onRemove }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5 border border-rule bg-panel-soft px-3 py-2">
      {eintrag.mediaId && <img src={mediaApi.url(eintrag.mediaId)} alt="" className="h-10 w-10 object-contain" />}
      <span className="min-w-0 flex-1 truncate text-ink">
        {eintrag.name}
        <span className="text-faint"> · {eintrag.hp} TP · RK {eintrag.ac}</span>
      </span>
      <input
        type="number"
        min={1}
        max={20}
        value={eintrag.count}
        onChange={(e) => onChange({ ...eintrag, count: Math.max(1, Number(e.target.value) || 1) })}
        className="h-11 w-16 border border-rule bg-panel text-center font-display text-ink"
        aria-label="Anzahl"
      />
      <button
        type="button"
        onClick={() => onChange({ ...eintrag, hidden: !eintrag.hidden })}
        className={`flex h-11 w-11 items-center justify-center border ${
          eintrag.hidden ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
        }`}
        title={eintrag.hidden ? 'tritt verborgen auf' : 'tritt offen auf'}
      >
        <IconEyeOff size={16} />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
        aria-label="Entfernen"
      >
        <IconTrash size={16} />
      </button>
    </div>
  );
}

function Bauplan({ entwurf, setEntwurf, bestiarium, onSpeichern, onAbbrechen }) {
  const [suche, setSuche] = useState('');
  const treffer = bestiarium.filter((e) => e.name.toLowerCase().includes(suche.trim().toLowerCase()));

  const hinzu = (e) =>
    setEntwurf((v) => ({
      ...v,
      entries: [
        ...v.entries,
        {
          libraryId: e.id,
          name: e.name,
          type: e.category,
          hp: e.hp ?? 0,
          ac: e.ac ?? 10,
          count: 1,
          hidden: false,
          mediaId: e.mediaId ?? null,
        },
      ],
    }));

  return (
    <form
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!entwurf.name.trim()) return;
        onSpeichern(entwurf);
      }}
      className="panel space-y-4 p-4"
    >
      <Rubric>{entwurf.id ? 'Begegnung ändern' : 'Neue Begegnung'}</Rubric>

      <input
        value={entwurf.name}
        onChange={(e) => setEntwurf((v) => ({ ...v, name: e.target.value }))}
        placeholder="Name, z. B. Hinterhalt am Wegkreuz"
        className="field-box font-display text-lg"
      />
      <textarea
        value={entwurf.notes}
        onChange={(e) => setEntwurf((v) => ({ ...v, notes: e.target.value }))}
        rows={3}
        placeholder="Wie tritt die Begegnung auf? Was wollen die Gegner? Wann geben sie auf?"
        className="field-box resize-y leading-relaxed"
      />

      <div className="space-y-2">
        {entwurf.entries.map((e, i) => (
          <Posten
            key={`${e.libraryId ?? e.name}-${i}`}
            eintrag={e}
            onChange={(neu) =>
              setEntwurf((v) => ({ ...v, entries: v.entries.map((x, j) => (j === i ? neu : x)) }))
            }
            onRemove={() => setEntwurf((v) => ({ ...v, entries: v.entries.filter((_, j) => j !== i) }))}
          />
        ))}
        {entwurf.entries.length === 0 && (
          <p className="text-sepia italic">Noch steht niemand bereit. Hol dir unten Gegner aus dem Bestiarium.</p>
        )}
      </div>

      <div className="border-t border-dashed border-rule pt-3">
        <label className="mb-2 flex items-center gap-2.5 border border-rule bg-panel-soft px-3">
          <IconSearch size={16} className="text-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Aus dem Bestiarium holen"
            className="min-h-11 flex-1 bg-transparent text-ink outline-none"
          />
        </label>
        <div className="flex max-h-44 flex-wrap gap-1.5 overflow-y-auto">
          {treffer.slice(0, 30).map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => hinzu(e)}
              className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]"
            >
              <IconPlus size={14} /> {e.name}
            </button>
          ))}
          {bestiarium.length === 0 && <p className="text-sepia italic">Das Bestiarium ist noch leer.</p>}
        </div>
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
 * Vorbereitete Begegnungen: einmal zusammenstellen, an jedem Abend wieder
 * stellen. Wer zwischendurch etwas Gutes improvisiert hat, sichert den
 * laufenden Kampf mit einem Knopf.
 */
export default function Encounters() {
  const { begegnungen, laden } = useBegegnungen();
  const { eintraege: bestiarium } = useBestiarium();
  const [entwurf, setEntwurf] = useState(null);
  const [meldung, setMeldung] = useState('');

  async function speichern(werte) {
    if (werte.id) await encountersApi.update(werte.id, werte);
    else await encountersApi.create(werte);
    setEntwurf(null);
    laden();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <p className="flex-1 text-sepia italic">
          {begegnungen.length === 0
            ? 'Noch ist nichts vorbereitet.'
            : `${begegnungen.length} ${begegnungen.length === 1 ? 'Begegnung wartet' : 'Begegnungen warten'} auf ihren Auftritt.`}
        </p>
        <button onClick={() => setEntwurf(LEER)} className="btn btn-seal">
          <IconPlus size={16} /> Neue Begegnung
        </button>
        <button
          onClick={async () => {
            const name = prompt('Unter welchem Namen soll der laufende Kampf gesichert werden?');
            if (!name) return;
            try {
              await encountersApi.ausKampf(name);
              setMeldung('Der laufende Kampf ist als Begegnung gesichert.');
              laden();
            } catch (err) {
              setMeldung(err.message);
            }
          }}
          className="btn btn-plate"
        >
          Laufenden Kampf sichern
        </button>
      </div>

      {meldung && <p className="border-l-[3px] border-gold bg-gold/10 px-3.5 py-2.5 text-sepia">{meldung}</p>}

      {entwurf && (
        <Bauplan
          entwurf={entwurf}
          setEntwurf={setEntwurf}
          bestiarium={bestiarium}
          onSpeichern={speichern}
          onAbbrechen={() => setEntwurf(null)}
        />
      )}

      <ul className="space-y-2">
        {begegnungen.map((b) => {
          const koepfe = b.entries.reduce((summe, e) => summe + e.count, 0);
          return (
            <li key={b.id} className="panel p-4">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[17px] text-ink">{b.name}</h3>
                  <p className="text-[15px] text-sepia">
                    {koepfe} {koepfe === 1 ? 'Gegner' : 'Gegner'} ·{' '}
                    {b.entries.map((e) => `${e.count}× ${e.name}${e.hidden ? ' (verborgen)' : ''}`).join(', ') ||
                      'noch niemand'}
                  </p>
                  {b.notes && <p className="mt-1.5 whitespace-pre-wrap text-sepia">{b.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={async () => {
                      await encountersApi.stellen(b.id);
                      setMeldung(`„${b.name}“ steht im Kampf.`);
                    }}
                    className="btn btn-seal"
                    title="Alle Gegner in den Kampf stellen, Initiative wird gewürfelt"
                  >
                    <IconSwords size={16} /> Stellen
                  </button>
                  <button onClick={() => setEntwurf(b)} className="btn-plate min-h-12 px-3 text-[13px]">
                    Ändern
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Begegnung „${b.name}“ löschen?`)) return;
                      await encountersApi.remove(b.id);
                      laden();
                    }}
                    className="flex h-12 w-12 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                    aria-label="Löschen"
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
