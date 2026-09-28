/**
 * Kurze und lange Rast.
 *
 * Beide ändern ein Dutzend Felder auf einmal – die Regeln dafür stehen
 * nicht hier, sondern in lib/rasten.js. Hier steht nur der Knopf, der sie
 * anwendet, und der Satz darunter, der sagt, was gerade geschehen ist.
 */
import { useState } from 'react';
import { kurzeRast, langeRast } from '../../../lib/rasten.js';
import { Card } from '../../ui.jsx';
import { IconCandle, IconSun } from '../../icons.jsx';

export default function Rasten({ data, replace }) {
  const [rastOffen, setRastOffen] = useState(false);

  return (
  <Card title="Rasten">
    <div className="flex flex-wrap gap-2.5">
      <button
        type="button"
        onClick={() => {
          replace(kurzeRast(data));
          setRastOffen(true);
        }}
        className="btn btn-plate"
      >
        <IconCandle size={16} /> Kurze Rast
      </button>
      <button
        type="button"
        onClick={() => {
          if (!confirm('Lange Rast: Trefferpunkte voll, Zauberplätze frei, eine Stufe Erschöpfung weniger?')) return;
          replace(langeRast(data));
          setRastOffen(true);
        }}
        className="btn btn-seal"
      >
        <IconSun size={16} /> Lange Rast
      </button>
    </div>
    <p className="mt-3 text-sepia italic">
      {rastOffen
        ? 'Die Rast ist verzeichnet. Trefferwürfel gibst du oben einzeln aus.'
        : 'Kurze Rast erneuert, was sich kurz erneuert. Die lange Rast füllt Trefferpunkte, Zauberplätze und die Hälfte der Trefferwürfel.'}
    </p>
  </Card>
  );
}
