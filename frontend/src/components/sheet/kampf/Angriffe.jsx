/**
 * Angriffe und Zaubertricks: die Liste zum Eintragen, und darunter für
 * jeden Eintrag zwei Knöpfe – Angriff und Schaden.
 *
 * Die Knöpfe entstehen aus dem, was in der Liste steht. Beim Schaden wird
 * alles bis auf Ziffern, `d`/`w` und Vorzeichen weggeworfen: „2d6 + 3
 * Hieb“ ist ein guter Eintrag für die Spielerin, aber ein schlechter
 * Würfelausdruck.
 */
import { ausdruckWurf, blattWurf } from '../../../lib/wuerfeln.js';
import { Card } from '../../ui.jsx';
import RepeatingRows from '../../RepeatingRows.jsx';
import { ATTACK_FIELDS } from './felder.js';

export default function Angriffe({ data, update }) {
  return (
  <Card title="Angriffe & Zaubertricks">
    <RepeatingRows
      items={data.attacks}
      onChange={(rows) => update('attacks', rows)}
      fields={ATTACK_FIELDS}
      addLabel="Angriff hinzufügen"
      emptyText="Noch nichts eingetragen – die Waffen ruhen."
    />
    {data.attacks?.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-rule pt-3">
        {data.attacks
          .filter((a) => a.name)
          .map((a) => (
            <span key={a.id ?? a.name} className="flex">
              <button
                type="button"
                onClick={() => blattWurf(`${a.name} (Angriff)`, Number(String(a.bonus).replace('+', '')) || 0)}
                className="btn-plate min-h-11 px-3 text-[13px]"
              >
                {a.name}
              </button>
              {a.damage && (
                <button
                  type="button"
                  onClick={() => ausdruckWurf(`${a.name} (Schaden)`, String(a.damage).replace(/[^0-9dwW+-]/g, ''))}
                  className="btn-plate min-h-11 border-l-0 px-3 text-[13px] text-rubric"
                  title={`Schaden ${a.damage}`}
                >
                  Schaden
                </button>
              )}
            </span>
          ))}
      </div>
    )}
  </Card>
  );
}
