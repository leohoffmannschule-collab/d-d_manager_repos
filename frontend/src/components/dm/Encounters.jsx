/**
 * Vorbereitete Begegnungen: „Wache am Stadttor“, „3 Goblins und ein Wolf“.
 *
 * Der Unterschied zum Bestiarium: Dort steht *ein* Statblock, hier eine
 * ganze Aufstellung samt Anzahl. Einmal gebaut, steht sie mit einem Klick
 * auf dem Tisch – mit gewürfelter Initiative und wahlweise verborgen, bis
 * der Hinterhalt zuschnappt.
 *
 * Ein Posten hält alle nötigen Werte **selbst** fest und verweist nur
 * nebenbei auf das Bestiarium. Deshalb lässt sich eine Begegnung auch dann
 * noch stellen, wenn der Statblock dahinter längst gelöscht wurde.
 *
 * Umgekehrt geht es auch: „Kampf sichern“ macht aus der laufenden
 * Aufstellung eine Begegnung – gleichnamige Gegner werden dabei wieder zu
 * einer Gruppe zusammengefasst.
 *
 * Diese Datei zeigt die Liste der Begegnungen und hält den Entwurf; gebaut
 * wird in begegnungen/Bauplan.jsx, Zeile für Zeile in begegnungen/Posten.jsx.
 */
import { useState } from 'react';
import { encountersApi } from '../../lib/api.js';
import { useBegegnungen, useBestiarium } from '../../lib/daten.js';
import { IconPlus, IconSwords, IconTrash } from '../icons.jsx';
import Bauplan from './begegnungen/Bauplan.jsx';

/** Der leere Entwurf, mit dem „Neue Begegnung“ beginnt. */
const LEER = { name: '', notes: '', entries: [] };

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
