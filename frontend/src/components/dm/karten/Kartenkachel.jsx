/**
 * Eine Karte in der Übersicht: Bild, Name, Schlagworte, drei Griffe.
 *
 * „Auflegen“ holt die zuletzt gelegte Szene samt Nebel zurück – man macht da
 * weiter, wo die Runde aufgehört hat. „frisch“ steht nur da, wenn es schon
 * eine Szene gibt, und beginnt eine neue unter vollem Nebel. Das Bild selbst
 * ist der Knopf zum Aufschlagen.
 */
import { mediaApi } from '../../../lib/api.js';
import { IconMap, IconTrash } from '../../icons.jsx';

export default function Kartenkachel({ karte, onAufschlagen, onAuflegen, onLoeschen }) {
  return (
    <li className="panel flex flex-col overflow-hidden">
      <button
        onClick={onAufschlagen}
        className="block aspect-[4/3] w-full overflow-hidden border-b border-rule bg-panel-soft"
        title="Aufschlagen und ausrichten"
      >
        {karte.thumbMediaId || karte.mediaId ? (
          <img
            src={mediaApi.url(karte.thumbMediaId ?? karte.mediaId)}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-faint">
            <IconMap size={26} />
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-[16px] text-ink" title={karte.name}>
            {karte.name}
          </h3>
          <p className="text-[14px] text-faint">
            {karte.width}×{karte.height} · Feld {karte.gridSize}
            {karte.szenen > 0 && ` · ${karte.szenen} ${karte.szenen === 1 ? 'Szene' : 'Szenen'}`}
          </p>
          {karte.tags.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1">
              {karte.tags.map((t) => (
                <span key={t} className="border border-rule px-1.5 text-[13px] text-sepia">
                  {t}
                </span>
              ))}
            </p>
          )}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => onAuflegen(karte)}
            className="btn btn-seal flex-1 text-[13px]"
            title={karte.szenen > 0 ? 'Die vorhandene Szene samt Nebel zurückholen' : 'Als neue Szene auf den Tisch'}
          >
            <IconMap size={15} /> Auflegen
          </button>
          {karte.szenen > 0 && (
            <button
              onClick={() => onAuflegen(karte, true)}
              className="btn-plate min-h-12 px-3 text-[13px]"
              title="Neue Szene aus dieser Karte – alles wieder verhüllt"
            >
              frisch
            </button>
          )}
          <button
            onClick={() => onLoeschen(karte)}
            className="flex h-12 w-12 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
            aria-label={`${karte.name} löschen`}
          >
            <IconTrash size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
