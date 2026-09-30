/**
 * Nachtragen, was der Almanach nicht sehen konnte – nur für die
 * Spielleitung.
 *
 * Der Text gehört der Seite (Chronicle.jsx), nicht diesem Formular: So
 * bleibt ein halb getippter Nachtrag stehen, wenn zwischendurch eine andere
 * Sitzung aufgeschlagen wird.
 */
import { IconQuill } from '../../components/icons.jsx';

export default function Nachtrag({ notiz, onNotiz, onEintragen }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!notiz.trim()) return;
        onEintragen(notiz.trim());
      }}
      className="mt-4 flex gap-2.5 border-t border-dashed border-rule pt-4"
    >
      <input
        value={notiz}
        onChange={(e) => onNotiz(e.target.value)}
        placeholder="Nachtragen, was der Almanach nicht sehen konnte …"
        className="field-box flex-1"
      />
      <button type="submit" className="btn btn-seal px-5">
        <IconQuill size={16} /> Eintragen
      </button>
    </form>
  );
}
