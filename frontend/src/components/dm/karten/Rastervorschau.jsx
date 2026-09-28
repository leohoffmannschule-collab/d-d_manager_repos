import { useEffect, useRef, useState } from 'react';
import { mediaApi } from '../../../lib/api.js';
import { IconMap } from '../../icons.jsx';

/**
 * Ein Rasternetz über der Vorschau. Damit lässt sich die Feldgröße
 * ausrichten, ohne die Karte erst auf den Tisch legen zu müssen – und die
 * Runde sieht dabei nichts von der Karte, die als Nächstes dran ist.
 */
export default function Rastervorschau({ karte, entwurf }) {
  const rahmen = useRef(null);
  const [breite, setBreite] = useState(0);

  useEffect(() => {
    const el = rahmen.current;
    if (!el) return undefined;
    const beobachter = new ResizeObserver(([eintrag]) => setBreite(eintrag.contentRect.width));
    beobachter.observe(el);
    setBreite(el.clientWidth);
    return () => beobachter.disconnect();
  }, []);

  // Die Vorschau ist kleiner als die Karte; das Raster muss im selben
  // Verhältnis schrumpfen, sonst zeigt sie etwas anderes als der Tisch.
  const faktor = karte.width > 0 && breite > 0 ? breite / karte.width : 0;
  const feld = entwurf.gridSize * faktor;
  const linie = 'rgba(196, 160, 82, 0.55)';

  return (
    <div ref={rahmen} className="relative overflow-hidden border border-rule bg-panel-soft">
      {karte.mediaId ? (
        <img src={mediaApi.url(karte.mediaId)} alt="" className="block w-full" />
      ) : (
        <div className="flex h-40 items-center justify-center text-faint">
          <IconMap size={28} />
        </div>
      )}
      {feld >= 4 && (
        <div
          aria-hidden="true"
          className="karten-raster pointer-events-none absolute inset-0"
          // Das Netz selbst steht in stile/spieltisch.css (.karten-raster) –
          // hier nur Linienfarbe, Feldgröße und Versatz der Vorschau.
          style={{
            '--linie': linie,
            '--feld': `${feld}px`,
            '--versatz-x': `${entwurf.gridOffsetX * faktor}px`,
            '--versatz-y': `${entwurf.gridOffsetY * faktor}px`,
          }}
        />
      )}
    </div>
  );
}
