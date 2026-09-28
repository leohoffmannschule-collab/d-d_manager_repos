/**
 * Das Bestiarium: die Sammlung von Statblöcken, aus denen im Kampf Kämpfer
 * werden.
 *
 * Zwei Wege hinein: von Hand eintippen, oder aus dem Kompendium übernehmen.
 * Übernommen wird dabei eine **Abschrift** – der Eintrag gehört danach dem
 * Almanach und lässt sich beliebig verbiegen, ohne dass das Kompendium dazu
 * erreichbar sein muss.
 *
 * Ein Weg hinaus: „in den Kampf“, wahlweise mehrfach und wahlweise
 * verborgen. Der Server würfelt dabei gleich die Initiative und legt für
 * jeden Gegner einen Kämpfer an.
 *
 * Das Bestiarium gehört der **ganzen Runde**, nicht einer Kampagne: Ein
 * Goblin bleibt ein Goblin, gleich in welcher Geschichte er auftritt.
 *
 * Diese Datei ist das Regal: suchen, filtern, auflisten. Was an einem
 * einzelnen Eintrag hängt, steht nebenan in bestiarium/:
 *
 *   bestiarium/Eintrag.jsx          eine Zeile, zugeklappt oder ganz offen
 *   bestiarium/Formular.jsx         eintragen und ändern
 *   bestiarium/AusDemKompendium.jsx die Abschrift aus der 5e-API
 *   bestiarium/felder.js            das leere Blatt und die sechs Attribute
 */
import { useMemo, useState } from 'react';
import { libraryApi } from '../../lib/api.js';
import { useBestiarium } from '../../lib/daten.js';
import { IconBook, IconPlus, IconSearch } from '../icons.jsx';
import AusDemKompendium from './bestiarium/AusDemKompendium.jsx';
import Eintrag from './bestiarium/Eintrag.jsx';
import Formular from './bestiarium/Formular.jsx';
import { LEER } from './bestiarium/felder.js';

/** Bestiarium: Statblöcke anlegen und mit einem Klick in den Kampf holen. */
export default function Bestiary() {
  const { eintraege, laden } = useBestiarium();
  const [suche, setSuche] = useState('');
  const [filter, setFilter] = useState('alle');
  const [formular, setFormular] = useState(null);
  const [kompendium, setKompendium] = useState(false);
  const [anzahl, setAnzahl] = useState({});
  const [aufgeklappt, setAufgeklappt] = useState(null);

  const treffer = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return eintraege.filter((e) => {
      if (filter !== 'alle' && e.category !== filter) return false;
      if (!begriff) return true;
      return (
        e.name.toLowerCase().includes(begriff) ||
        e.tags.some((t) => t.toLowerCase().includes(begriff)) ||
        e.notes.toLowerCase().includes(begriff)
      );
    });
  }, [eintraege, suche, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2.5">
        <label className="flex min-w-[12rem] flex-1 items-center gap-2.5 border border-rule bg-panel-soft px-3">
          <IconSearch size={16} className="text-faint" />
          <input
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder="Im Bestiarium suchen"
            className="min-h-11 flex-1 bg-transparent text-ink outline-none"
          />
        </label>
        {[
          ['alle', 'Alle'],
          ['monster', 'Monster'],
          ['npc', 'NSC'],
        ].map(([wert, label]) => (
          <button
            key={wert}
            onClick={() => setFilter(wert)}
            className={`min-h-11 border px-3.5 font-display text-[12px] tracking-[0.10em] uppercase ${
              filter === wert ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
            }`}
          >
            {label}
          </button>
        ))}
        <button onClick={() => setFormular(LEER)} className="btn btn-seal">
          <IconPlus size={16} /> Neu
        </button>
        <button onClick={() => setKompendium((k) => !k)} className="btn btn-plate">
          <IconBook size={16} /> Kompendium
        </button>
      </div>

      {kompendium && (
        <AusDemKompendium
          onFertig={() => {
            setKompendium(false);
            laden();
          }}
        />
      )}

      {formular && (
        <Formular
          key={formular.id ?? 'neu'}
          eintrag={formular.id ? formular : null}
          onAbbrechen={() => setFormular(null)}
          onSpeichern={async (werte) => {
            if (werte.id) await libraryApi.update(werte.id, werte);
            else await libraryApi.create(werte);
            setFormular(null);
            laden();
          }}
        />
      )}

      {treffer.length === 0 ? (
        <p className="text-sepia italic">
          Das Bestiarium ist noch leer. Trag etwas ein oder hol es aus dem Kompendium.
        </p>
      ) : (
        <ul className="space-y-2">
          {treffer.map((e) => (
            <Eintrag
              key={e.id}
              e={e}
              offen={aufgeklappt === e.id}
              onAufklappen={() => setAufgeklappt(aufgeklappt === e.id ? null : e.id)}
              anzahl={anzahl[e.id] ?? 1}
              onAnzahl={(zahl) => setAnzahl((a) => ({ ...a, [e.id]: zahl }))}
              onAendern={() => setFormular(e)}
              onLoeschen={async () => {
                if (!bestaetigeLoeschen(e.name)) return;
                await libraryApi.remove(e.id);
                laden();
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function bestaetigeLoeschen(name) {
  return confirm(`„${name}“ aus dem Bestiarium tilgen?`);
}
