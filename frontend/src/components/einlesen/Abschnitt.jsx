/**
 * Eine Liste unter einer Überschrift – in den Vorschauen beim Einlesen:
 * „Auf der Seite geändert und übernommen“, „Hinweise“, „Was sich ändert“.
 *
 * Gebraucht von der Vorschau für eine Datei (Vorschau.jsx) und von der
 * Sammelvorschau für mehrere (Sammelvorschau.jsx).
 */

/** Wie viele Einträge höchstens einzeln dastehen. */
const HOECHSTENS = 40;

/**
 * Die Liste – oder nichts, wenn sie leer ist.
 *
 * @param {object} props
 * @param {string} props.titel
 * @param {string[]} props.eintraege
 * @param {string} [props.klasse]  die Textfarbe der Einträge
 */
export default function Abschnitt({ titel, eintraege, klasse = 'text-ink' }) {
  if (!eintraege?.length) return null;
  const sichtbar = eintraege.slice(0, HOECHSTENS);
  return (
    <div className="mb-4">
      <h3 className="mb-1.5 font-display text-[12px] tracking-[0.14em] text-sepia uppercase">{titel}</h3>
      <ul className={`list-disc space-y-1 pl-5 text-[15px] ${klasse}`}>
        {sichtbar.map((e, i) => (
          <li key={`${i}-${e}`}>{e}</li>
        ))}
      </ul>
      {eintraege.length > HOECHSTENS && (
        <p className="mt-1 text-[14px] text-faint italic">… und {eintraege.length - HOECHSTENS} weitere.</p>
      )}
    </div>
  );
}
