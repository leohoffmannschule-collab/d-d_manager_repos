/**
 * Der Kopf des Charakterblattes: Bildnis, Name, Volk · Klasse · Stufe, der
 * Speicherstand – und rechts Trefferpunkte, Mitnehmen, Einlesen und Löschen.
 *
 * „Mitnehmen“ und „Einlesen“ sind ein Paar: Die mitgenommene Datei lässt
 * sich bearbeiten – auch von einer KI – und mit „Einlesen“ wieder in dieses
 * Blatt übernehmen, nach einer Vorschau (components/BlattEinlesen.jsx).
 *
 * Fremde Blätter (`schreibbar === false`) zeigen statt des Speicherstands,
 * wem sie gehören; Bildnis und Name lassen sich dann nicht ändern.
 */
import { IconCheck, IconDownload, IconEye } from '../../components/icons.jsx';
import BlattEinlesen from '../../components/BlattEinlesen.jsx';
import Speicherstand from './Speicherstand.jsx';

export default function Blattkopf({
  character,
  isDnd,
  hp,
  schreibbar,
  saveStatus,
  mitnehmen,
  onName,
  onPortrait,
  onMitnehmen,
  onErsetzen,
  onLoeschen,
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-4">
      <div className="flex min-w-0 grow basis-64 items-center gap-4">
        <label
          className={`group relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-panel-soft ring-2 ring-gold ring-offset-2 ring-offset-[var(--color-ground)] ${
            schreibbar ? 'cursor-pointer' : ''
          }`}
        >
          {character.data.portrait ? (
            <img src={character.data.portrait} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-display text-4xl font-semibold text-rubric">
              {character.name.trim().charAt(0).toUpperCase() || '?'}
            </span>
          )}
          <span className="absolute inset-0 hidden items-center justify-center bg-black/55 font-display text-[11px] tracking-[0.1em] text-[var(--marke-schrift)] uppercase group-hover:flex">
            Bildnis
          </span>
          <input type="file" accept="image/*" onChange={onPortrait} disabled={!schreibbar} className="hidden" />
        </label>

        <div className="min-w-0 flex-1">
          <input
            value={character.name}
            onChange={(e) => onName(e.target.value)}
            readOnly={!schreibbar}
            className="w-full border-0 bg-transparent p-0 font-display text-2xl font-semibold text-ink focus:outline-none sm:text-3xl"
            aria-label="Name des Charakters"
          />
          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px]">
            <span className="text-sepia italic">
              {isDnd
                ? [character.data.race, character.data.className, `Stufe ${character.data.level}`]
                    .filter(Boolean)
                    .join(' · ')
                : 'Freies System'}
            </span>
            <span className="h-1 w-1 rounded-full bg-gold" />
            {schreibbar ? (
              <Speicherstand status={saveStatus} />
            ) : (
              <span className="flex items-center gap-1.5 text-faint">
                <IconEye size={14} />
                Blatt von {character.ownerName ?? 'jemand anderem'} – nur zum Lesen
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {isDnd && hp && (
          <div className="flex flex-col items-center gap-1 border border-rule bg-panel/70 px-4 py-2">
            <span className="font-display text-[10px] tracking-[0.18em] text-faint uppercase">Trefferpunkte</span>
            <span className="font-display text-2xl font-bold text-rubric">
              {hp.current ?? 0}
              <span className="text-[15px] text-faint"> / {hp.max ?? 0}</span>
            </span>
          </div>
        )}

        <button
          onClick={onMitnehmen}
          disabled={mitnehmen === 'laeuft'}
          className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px] disabled:opacity-60"
          title="Als eigenständige Datei sichern – sie braucht weder Netz noch Server"
        >
          {mitnehmen === 'fertig' ? <IconCheck size={15} /> : <IconDownload size={15} />}
          {mitnehmen === 'laeuft' ? 'wird abgeschrieben …' : mitnehmen === 'fertig' ? 'gesichert' : 'Mitnehmen'}
        </button>

        {schreibbar && <BlattEinlesen ziel={character} onErsetzen={onErsetzen} />}

        {schreibbar && (
          <button onClick={onLoeschen} className="min-h-11 px-2 text-[15px] text-rubric hover:underline">
            Löschen
          </button>
        )}
      </div>
    </div>
  );
}
