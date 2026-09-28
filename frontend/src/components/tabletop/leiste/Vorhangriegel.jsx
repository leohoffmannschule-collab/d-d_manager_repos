/**
 * Der rote Riegel über der ganzen Leiste: Der Vorhang ist zu.
 *
 * Das ist die auffälligste Anzeige der ganzen Oberfläche, und das mit Absicht.
 * Wer den Vorhang vergisst, baut in Ruhe auf – und spielt dann vor einer
 * Runde, die nichts sieht. Also nimmt der Hinweis die volle Breite ein und
 * ist zugleich der Knopf, der ihn wieder öffnet.
 */
import { scenesApi } from '../../../lib/api.js';
import { IconFog } from '../../icons.jsx';

export default function Vorhangriegel({ onChanged }) {
  return (
    <button
      onClick={async () => {
        await scenesApi.vorhang(false);
        onChanged?.();
      }}
      className="flex w-full items-center justify-center gap-2.5 border-b border-rubric bg-rubric px-3 py-2.5 font-display text-[12px] tracking-[0.14em] text-rubric-ink uppercase"
    >
      <IconFog size={15} />
      Der Vorhang ist zu – die Runde sieht nichts. Jetzt öffnen
    </button>
  );
}
