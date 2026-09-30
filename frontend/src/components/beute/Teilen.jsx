/**
 * Teilen und Auszahlen: Wie viel bekommt jeder, was bleibt übrig – und für
 * die Spielleitung: ab damit in die Beutel.
 *
 * Gerechnet wird auf dem Server (`stashApi.teilung`), nicht hier: Dieselbe
 * Rechnung braucht das Auszahlen, und zwei Fassungen davon gingen früher
 * oder später auseinander.
 *
 * Vorgewählt als Empfänger sind alle, die in der Runde stehen; abwählen
 * lässt sich, wer bei diesem Fund nicht dabei war.
 */
import { useEffect, useState } from 'react';
import { stashApi } from '../../lib/api.js';
import { IconCheck, IconUsers } from '../icons.jsx';
import { inWorten } from './muenzen.js';

export default function Teilen({ charaktere, isDm, laden, charaktereLaden }) {
  const [teilung, setTeilung] = useState(null);
  const [empfaenger, setEmpfaenger] = useState([]);
  const [meldung, setMeldung] = useState('');

  // Vorgewählt sind alle, die in der Runde stehen.
  useEffect(() => {
    setEmpfaenger((bisher) => (bisher.length ? bisher : charaktere.map((c) => c.id)));
  }, [charaktere]);

  async function rechnen(anteile) {
    setTeilung(await stashApi.teilung(anteile));
  }


  return (
    <div className="border border-dashed border-rule-strong p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <button onClick={() => rechnen(charaktere.length || 1)} className="btn btn-plate">
          <IconUsers size={16} /> Auf {charaktere.length || 1} teilen
        </button>
        {[2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            onClick={() => rechnen(n)}
            className="min-h-11 border border-rule px-3 font-display text-[13px] text-sepia hover:text-ink"
          >
            {n}
          </button>
        ))}
      </div>

      {teilung && (
        <div className="mt-3 border-l-[3px] border-gold bg-gold/10 px-3.5 py-2.5">
          <p className="text-ink">
            Je Anteil: <span className="font-display font-semibold">{inWorten(teilung.proKopf)}</span>
          </p>
          <p className="text-sepia italic">
            {inWorten(teilung.rest) === 'nichts'
              ? 'Es geht glatt auf.'
              : `Übrig bleibt ${inWorten(teilung.rest)} – wer das bekommt, macht die Runde unter sich aus.`}
          </p>

          {isDm && (
            <div className="mt-3 border-t border-dashed border-rule pt-3">
              <span className="mb-1.5 block font-display text-[10px] tracking-[0.14em] text-faint uppercase">
                Auszahlen an
              </span>
              <div className="mb-2.5 flex flex-wrap gap-1.5">
                {charaktere.map((c) => {
                  const an = empfaenger.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() =>
                        setEmpfaenger((liste) =>
                          an ? liste.filter((id) => id !== c.id) : [...liste, c.id]
                        )
                      }
                      className={`min-h-11 border px-3 text-[14px] ${
                        an ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
                      }`}
                    >
                      {an && <IconCheck size={12} className="mr-1 inline" />}
                      {c.name}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={async () => {
                  setMeldung('');
                  try {
                    const ergebnis = await stashApi.auszahlen(empfaenger);
                    setMeldung(
                      `${inWorten(ergebnis.anteil)} an ${ergebnis.empfaenger} Beutel verteilt. In der Kiste bleibt ${inWorten(ergebnis.rest)}.`
                    );
                    setTeilung(null);
                    laden();
                    charaktereLaden();
                  } catch (err) {
                    setMeldung(err.message);
                  }
                }}
                disabled={empfaenger.length === 0}
                className="btn btn-seal disabled:opacity-50"
              >
                In die Beutel zahlen
              </button>
            </div>
          )}
        </div>
      )}

      {meldung && <p className="mt-2.5 text-sepia italic">{meldung}</p>}
    </div>
  );
}
