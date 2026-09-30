/**
 * Die Beutekiste – am Spieltisch im Reiter „Beute“.
 *
 * Eintragen darf jede und jeder: Was die Runde findet, gehört erst einmal
 * allen. Auszahlen darf nur die Spielleitung, denn dabei wird in fremde
 * Charakterblätter geschrieben.
 *
 * Das Teilen rechnet der **Server** aus (backend/src/beute.js) – und
 * zwar so, wie es am Tisch wirklich zugeht: von der größten Münze zur
 * kleinsten, Unteilbares wird gewechselt und weitergereicht, nie umgekehrt.
 * Aus 43 Gold für drei werden so 14 Gold je Kopf und nicht „1 Platin, 4
 * Gold“. Was übrig bleibt, bleibt liegen – wer den Rest bekommt, ist eine
 * Frage für den Tisch und nicht für den Almanach.
 *
 * Die Teile liegen in beute/: Muenzen, Teilen (samt Auszahlen), Fundstueck,
 * NeuerFund; die Münzsorten in beute/muenzen.js.
 */
import { useMemo } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useBeute, useCharaktere } from '../lib/daten.js';
import Fundstueck from './beute/Fundstueck.jsx';
import Muenzen from './beute/Muenzen.jsx';
import NeuerFund from './beute/NeuerFund.jsx';
import Teilen from './beute/Teilen.jsx';

export default function Beute() {
  const { isDm } = useAuth();
  const { kiste, setKiste, laden } = useBeute();
  const { geteilte: charaktere, laden: charaktereLaden } = useCharaktere();

  const gewicht = useMemo(
    () => kiste.items.reduce((summe, g) => summe + (Number(g.weight) || 0) * (Number(g.qty) || 1), 0),
    [kiste.items]
  );

  return (
    <div className="space-y-4">
      <Muenzen kiste={kiste} setKiste={setKiste} />

      <Teilen charaktere={charaktere} isDm={isDm} laden={laden} charaktereLaden={charaktereLaden} />

      {/* --- Gegenstände ---------------------------------------------- */}
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="font-display text-[13px] tracking-[0.12em] text-rubric uppercase">Gefundenes</span>
          <span className="h-px flex-1 bg-rule" />
          {gewicht > 0 && <span className="text-[14px] text-faint">{gewicht} Pfund</span>}
        </div>

        {kiste.items.length === 0 ? (
          <p className="text-sepia italic">Die Kiste ist leer. Noch.</p>
        ) : (
          <ul className="space-y-1.5">
            {kiste.items.map((g) => (
              <Fundstueck key={g.id} fund={g} charaktere={charaktere} isDm={isDm} />
            ))}
          </ul>
        )}

        <NeuerFund onEingetragen={laden} />
      </div>
    </div>
  );
}
