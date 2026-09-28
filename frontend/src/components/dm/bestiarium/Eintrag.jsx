/**
 * Ein Eintrag in der Liste: zugeklappt die Kopfzeile, aufgeklappt der
 * ganze Statblock.
 *
 * Die drei Griffe rechts sind der eigentliche Zweck des Bestiariums:
 * „In den Kampf“ legt so viele Kämpfer an, wie in der Zahl davor stehen,
 * und würfelt gleich die Initiative. Der zweite tut dasselbe verborgen –
 * für den Hinterhalt, von dem die Runde noch nichts wissen soll.
 */
import { mediaApi, libraryApi } from '../../../lib/api.js';
import { IconEyeOff, IconSwords, IconTrash } from '../../icons.jsx';
import { ATTRIBUTE } from './felder.js';

export default function Eintrag({ e, offen, onAufklappen, anzahl, onAnzahl, onAendern, onLoeschen }) {
  return (
    <li className="panel p-3.5">
      <div className="flex flex-wrap items-center gap-3">
        {e.mediaId && (
          <img src={mediaApi.url(e.mediaId)} alt="" className="h-12 w-12 shrink-0 object-contain" />
        )}
        <button onClick={onAufklappen} className="min-w-0 flex-1 text-left">
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
            value={anzahl}
            onChange={(ev) => onAnzahl(Math.max(1, Number(ev.target.value) || 1))}
            className="h-11 w-16 border border-rule bg-panel-soft text-center font-display text-ink"
            aria-label="Anzahl"
          />
          <button
            onClick={() =>
              libraryApi.addToEncounter(e.id, { count: anzahl, rollInitiative: true })
            }
            className="btn btn-seal px-3.5"
            title="In den Kampf holen, Initiative wird gewürfelt"
          >
            <IconSwords size={16} /> In den Kampf
          </button>
          <button
            onClick={() =>
              libraryApi.addToEncounter(e.id, {
                count: anzahl,
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
            <button onClick={onAendern} className="btn btn-plate">
              Bearbeiten
            </button>
            <button
              onClick={onLoeschen}
              className="flex min-h-12 items-center gap-2 border border-rule px-4 text-sepia hover:border-rubric hover:text-rubric"
            >
              <IconTrash size={16} /> Löschen
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
