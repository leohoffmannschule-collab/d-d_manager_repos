/**
 * Der Bauplan einer Begegnung: welche Gegner in welcher Zahl, wer verborgen
 * beginnt. Posten kommen aus dem Bestiarium, tragen ihre Werte danach aber
 * selbst – deshalb übersteht eine Begegnung das Löschen des Statblocks.
 */
import { useState } from 'react';
import { Rubric } from '../../ui.jsx';
import { IconPlus, IconSearch } from '../../icons.jsx';
import Posten from './Posten.jsx';

export default function Bauplan({ entwurf, setEntwurf, bestiarium, onSpeichern, onAbbrechen }) {
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
