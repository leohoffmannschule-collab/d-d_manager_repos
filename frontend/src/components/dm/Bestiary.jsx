import { Suspense, lazy, useMemo, useState } from 'react';
import { compendiumApi, libraryApi, mediaApi } from '../../lib/api.js';
import { useBestiarium } from '../../lib/daten.jsx';
import { Rubric } from '../ui.jsx';
import { IconBook, IconEyeOff, IconPlus, IconSearch, IconSwords, IconTrash } from '../icons.jsx';

// three.js kommt erst mit, wenn wirklich jemand eine Figur gießt.
const MiniForge = lazy(() => import('../mini/MiniForge.jsx'));

const LEER = {
  name: '',
  category: 'monster',
  ac: '',
  hp: '',
  speed: '',
  stats: { str: '', dex: '', con: '', int: '', wis: '', cha: '' },
  abilities: '',
  actions: '',
  notes: '',
  tags: [],
  mini: null,
  mediaId: null,
};

const ATTRIBUTE = [
  ['str', 'ST'],
  ['dex', 'GE'],
  ['con', 'KO'],
  ['int', 'IN'],
  ['wis', 'WE'],
  ['cha', 'CH'],
];

function Formular({ eintrag, onSpeichern, onAbbrechen }) {
  const [werte, setWerte] = useState(eintrag ?? LEER);
  const [schmiede, setSchmiede] = useState(false);
  const setzen = (feld, wert) => setWerte((w) => ({ ...w, [feld]: wert }));

  async function figurGiessen({ config, figur }) {
    const bild = await mediaApi.upload(figur, 'gegner.png');
    setWerte((w) => ({ ...w, mini: config, mediaId: bild.id }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!werte.name.trim()) return;
        onSpeichern({ ...werte, tags: typeof werte.tags === 'string' ? werte.tags.split(',').map((t) => t.trim()).filter(Boolean) : werte.tags });
      }}
      className="panel space-y-3 p-4"
    >
      <Rubric>{eintrag ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}</Rubric>

      <div className="flex flex-wrap gap-3">
        <label className="min-w-[12rem] flex-1">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Name</span>
          <input value={werte.name} onChange={(e) => setzen('name', e.target.value)} className="field-box" />
        </label>
        <label>
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Art</span>
          <select value={werte.category} onChange={(e) => setzen('category', e.target.value)} className="field-box w-32">
            <option value="monster">Monster</option>
            <option value="npc">NSC</option>
          </select>
        </label>
        {[
          ['RK', 'ac'],
          ['TP', 'hp'],
        ].map(([label, feld]) => (
          <label key={feld}>
            <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
            <input
              type="number"
              value={werte[feld] ?? ''}
              onChange={(e) => setzen(feld, e.target.value)}
              className="field-box w-20 font-display"
            />
          </label>
        ))}
        <label className="min-w-[8rem] flex-1">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Bewegung</span>
          <input value={werte.speed} onChange={(e) => setzen('speed', e.target.value)} className="field-box" placeholder="30 Fuß" />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ATTRIBUTE.map(([feld, label]) => (
          <label key={feld}>
            <span className="mb-1 block text-center font-display text-[10px] tracking-[0.16em] text-faint uppercase">
              {label}
            </span>
            <input
              type="number"
              value={werte.stats?.[feld] ?? ''}
              onChange={(e) => setzen('stats', { ...werte.stats, [feld]: e.target.value })}
              className="field-box text-center font-display"
            />
          </label>
        ))}
      </div>

      {[
        ['Fähigkeiten', 'abilities', 3],
        ['Aktionen', 'actions', 4],
        ['Notizen', 'notes', 2],
      ].map(([label, feld, rows]) => (
        <label key={feld} className="block">
          <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</span>
          <textarea
            value={werte[feld]}
            rows={rows}
            onChange={(e) => setzen(feld, e.target.value)}
            className="field-box resize-y leading-relaxed"
          />
        </label>
      ))}

      <label className="block">
        <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
          Schlagworte, mit Komma getrennt
        </span>
        <input
          value={Array.isArray(werte.tags) ? werte.tags.join(', ') : werte.tags}
          onChange={(e) => setzen('tags', e.target.value)}
          className="field-box"
          placeholder="Wald, Untote"
        />
      </label>

      <div className="border-t border-dashed border-rule pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => setSchmiede((s) => !s)} className="btn btn-plate">
            {schmiede ? 'Schmiede schließen' : 'Figur gießen'}
          </button>
          {werte.mediaId && (
            <span className="flex items-center gap-2 text-sepia italic">
              <img src={mediaApi.url(werte.mediaId)} alt="" className="h-10 w-10 object-contain" />
              Figur bereit – sie steht künftig mit auf dem Spieltisch.
            </span>
          )}
        </div>
        {schmiede && (
          <div className="mt-4">
            <Suspense fallback={<p className="text-sepia italic">Die Schmiede wird angeheizt …</p>}>
              <MiniForge
                config={werte.mini}
                onChange={(c) => setzen('mini', c)}
                onSave={figurGiessen}
                gespeichert={!!werte.mediaId}
                hinweis="Nach dem Gießen den Eintrag unten aufnehmen, damit die Figur erhalten bleibt."
              />
            </Suspense>
          </div>
        )}
      </div>

      <div className="flex gap-2.5">
        <button type="submit" className="btn btn-seal">
          Aufnehmen
        </button>
        <button type="button" onClick={onAbbrechen} className="btn btn-plate">
          Zurück
        </button>
      </div>
    </form>
  );
}

function AusDemKompendium({ onFertig }) {
  const [monster, setMonster] = useState(null);
  const [suche, setSuche] = useState('');
  const [laedt, setLaedt] = useState(false);

  useEffect(() => {
    compendiumApi
      .list('monsters')
      .then((antwort) => setMonster(antwort.results ?? []))
      .catch(() => setMonster([]));
  }, []);

  const treffer = useMemo(() => {
    if (!monster) return [];
    const begriff = suche.trim().toLowerCase();
    return (begriff ? monster.filter((m) => m.name.toLowerCase().includes(begriff)) : monster).slice(0, 40);
  }, [monster, suche]);

  return (
    <div className="panel p-4">
      <Rubric>Aus dem Kompendium übernehmen</Rubric>
      <label className="mb-3 flex items-center gap-2.5 border border-rule bg-panel-soft px-3">
        <IconSearch size={16} className="text-faint" />
        <input
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Monster suchen (englische Namen)"
          className="min-h-11 flex-1 bg-transparent text-ink outline-none"
        />
      </label>

      {monster === null ? (
        <p className="text-sepia italic">Das Kompendium wird aufgeschlagen …</p>
      ) : (
        <ul className="max-h-64 space-y-1 overflow-y-auto">
          {treffer.map((m) => (
            <li key={m.index}>
              <button
                disabled={laedt}
                onClick={async () => {
                  setLaedt(true);
                  try {
                    const voll = await compendiumApi.detail('monsters', m.index);
                    await libraryApi.fromCompendium(voll);
                    onFertig?.();
                  } finally {
                    setLaedt(false);
                  }
                }}
                className="flex min-h-11 w-full items-center justify-between gap-3 border border-transparent px-2.5 text-left hover:border-gold"
              >
                <span className="text-ink">{m.name}</span>
                <IconPlus size={15} className="text-rubric" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

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
          {treffer.map((e) => {
            const offen = aufgeklappt === e.id;
            return (
              <li key={e.id} className="panel p-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  {e.mediaId && (
                    <img src={mediaApi.url(e.mediaId)} alt="" className="h-12 w-12 shrink-0 object-contain" />
                  )}
                  <button onClick={() => setAufgeklappt(offen ? null : e.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-display text-[17px] text-ink">{e.name}</p>
                    <p className="text-[15px] text-sepia">
                      {e.category === 'npc' ? 'NSC' : 'Monster'}
                      {e.ac != null && ` · RK ${e.ac}`}
                      {e.hp != null && ` · ${e.hp} TP`}
                      {e.speed && ` · ${e.speed}`}
                    </p>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={anzahl[e.id] ?? 1}
                      onChange={(ev) => setAnzahl((a) => ({ ...a, [e.id]: Math.max(1, Number(ev.target.value) || 1) }))}
                      className="h-11 w-16 border border-rule bg-panel-soft text-center font-display text-ink"
                      aria-label="Anzahl"
                    />
                    <button
                      onClick={() =>
                        libraryApi.addToEncounter(e.id, { count: anzahl[e.id] ?? 1, rollInitiative: true })
                      }
                      className="btn btn-seal px-3.5"
                      title="In den Kampf holen, Initiative wird gewürfelt"
                    >
                      <IconSwords size={16} /> In den Kampf
                    </button>
                    <button
                      onClick={() =>
                        libraryApi.addToEncounter(e.id, {
                          count: anzahl[e.id] ?? 1,
                          rollInitiative: true,
                          hidden: true,
                        })
                      }
                      className="btn-plate flex h-11 w-11 items-center justify-center"
                      title="Verborgen in den Kampf holen"
                    >
                      <IconEyeOff size={16} />
                    </button>
                  </div>
                </div>

                {offen && (
                  <div className="mt-3 space-y-3 border-t border-dashed border-rule pt-3">
                    {Object.values(e.stats ?? {}).some((v) => v != null) && (
                      <div className="grid grid-cols-6 gap-1.5">
                        {ATTRIBUTE.map(([feld, label]) => (
                          <div key={feld} className="border border-rule bg-panel-soft py-1.5 text-center">
                            <p className="font-display text-[10px] tracking-[0.14em] text-faint uppercase">{label}</p>
                            <p className="font-display text-[17px] text-ink">{e.stats?.[feld] ?? '–'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {[
                      ['Fähigkeiten', e.abilities],
                      ['Aktionen', e.actions],
                      ['Notizen', e.notes],
                    ]
                      .filter(([, text]) => text)
                      .map(([label, text]) => (
                        <div key={label}>
                          <p className="font-display text-[10px] tracking-[0.16em] text-faint uppercase">{label}</p>
                          <p className="whitespace-pre-wrap text-sepia">{text}</p>
                        </div>
                      ))}
                    <div className="flex gap-2.5">
                      <button onClick={() => setFormular(e)} className="btn btn-plate">
                        Bearbeiten
                      </button>
                      <button
                        onClick={async () => {
                          if (!bestaetigeLoeschen(e.name)) return;
                          await libraryApi.remove(e.id);
                          laden();
                        }}
                        className="flex min-h-12 items-center gap-2 border border-rule px-4 text-sepia hover:border-rubric hover:text-rubric"
                      >
                        <IconTrash size={16} /> Löschen
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function bestaetigeLoeschen(name) {
  return confirm(`„${name}“ aus dem Bestiarium tilgen?`);
}
