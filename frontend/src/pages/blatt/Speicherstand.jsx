/**
 * Die kleine Anzeige neben dem Namen: „Tinte trocknet …“, „Wird
 * eingetragen …“, „In der Chronik verzeichnet“ – oder dass es nicht
 * geklappt hat.
 *
 * Sie ersetzt den Speichern-Knopf, den es absichtlich nicht gibt (siehe
 * useBlatt.js): Wer tippt, soll sehen, dass es ankommt.
 */
import { IconCheck, IconQuill } from '../../components/icons.jsx';

export default function Speicherstand({ status }) {
  if (status === 'idle') return null;

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-ok">
        <IconCheck size={13} />
        In der Chronik verzeichnet
      </span>
    );
  }

  if (status === 'error') {
    return <span className="text-rubric">Konnte nicht gespeichert werden</span>;
  }

  return (
    <span className="flex items-center gap-1.5 text-faint">
      <IconQuill size={14} />
      {status === 'saving' ? 'Wird eingetragen …' : 'Tinte trocknet …'}
    </span>
  );
}

