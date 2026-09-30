/** Die Spalten eines Zaubers, wenn er aufgeschlagen ist. */
import { TextAreaField, TextField } from '../../ui.jsx';
import { ZAUBER_SPALTEN } from './spalten.js';

export default function Zauberspalten({ spell, setzen }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {ZAUBER_SPALTEN.map((spalte) => (
        <TextField
          key={spalte.key}
          label={spalte.label}
          value={spell[spalte.key]}
          onChange={(v) => setzen(spalte.key, v)}
          className={spalte.platz ?? 'min-w-[7rem] flex-1'}
        />
      ))}
      <TextAreaField
        label="Notizen"
        rows={2}
        value={spell.notes}
        onChange={(v) => setzen('notes', v)}
        className="w-full"
      />
    </div>
  );
}
