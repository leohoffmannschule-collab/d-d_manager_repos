/**
 * Der Kopf einer aufgeschlagenen Sitzung: der Titel (für die Spielleitung
 * gleich zum Umbenennen), das Protokoll zum Sichern, der Rückblick und das
 * Löschen.
 *
 * Der Titel wird beim Tippen nur örtlich geändert (`onTitel`) und erst beim
 * Verlassen des Feldes gespeichert (`onTitelFertig`) – eine Anfrage je
 * Umbenennung statt je Tastendruck.
 *
 * Den Rückblick gibt es nur, wenn der Server einen Sprachmodell-Schlüssel
 * hat (`ki.verfuegbar`); ohne ihn fehlt der Knopf ganz.
 */
import { IconTrash, IconUpload } from '../../components/icons.jsx';

export default function Sitzungskopf({
  sitzung,
  isDm,
  ki,
  laeuft,
  onTitel,
  onTitelFertig,
  onSichern,
  onRueckblick,
  onLoeschen,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-dashed border-rule pb-3">
      {isDm ? (
        <input
          value={sitzung.title}
          onChange={(e) => onTitel(e.target.value)}
          onBlur={(e) => onTitelFertig(e.target.value)}
          className="min-w-0 flex-1 border-0 bg-transparent p-0 font-display text-xl font-semibold text-ink focus:outline-none"
          aria-label="Titel der Sitzung"
        />
      ) : (
        <h2 className="min-w-0 flex-1 font-display text-xl font-semibold text-ink">{sitzung.title}</h2>
      )}
      <button onClick={onSichern}  className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]">
        <IconUpload size={14} /> Protokoll sichern
      </button>
      {isDm && ki.verfuegbar && (
        <button
          onClick={onRueckblick}
          disabled={laeuft}
          className="btn btn-plate disabled:opacity-60"
        >
          {laeuft ? 'wird geschrieben …' : 'Rückblick schreiben lassen'}
        </button>
      )}
      {isDm && (
        <button
          onClick={onLoeschen}
          className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
          aria-label="Sitzung löschen"
        >
          <IconTrash size={16} />
        </button>
      )}
    </div>
  );
}
