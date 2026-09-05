import { useEffect, useMemo, useState } from 'react';
import { stashApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useBeute, useCharaktere } from '../lib/daten.jsx';
import { IconCheck, IconPlus, IconTrash, IconUsers } from './icons.jsx';

const MUENZEN = [
  ['pp', 'Platin'],
  ['gp', 'Gold'],
  ['ep', 'Elektrum'],
  ['sp', 'Silber'],
  ['cp', 'Kupfer'],
];

const inWorten = (muenzen) =>
  MUENZEN.filter(([k]) => muenzen?.[k]).map(([k, label]) => `${muenzen[k]} ${label}`).join(', ') || 'nichts';

/**
 * Die Beutekiste: Was die Runde gemeinsam findet, liegt hier, bis es geteilt
 * wird. Eintragen darf jede und jeder – auszahlen nur die Spielleitung, weil
 * dabei in fremde Charakterblätter geschrieben wird.
 */
export default function Beute() {
  const { isDm } = useAuth();
  const { kiste, setKiste, laden } = useBeute();
  const { geteilte: charaktere, laden: charaktereLaden } = useCharaktere();
  const [neu, setNeu] = useState({ name: '', qty: 1 });
  const [teilung, setTeilung] = useState(null);
  const [empfaenger, setEmpfaenger] = useState([]);
  const [meldung, setMeldung] = useState('');

  // Vorgewählt sind alle, die in der Runde stehen.
  useEffect(() => {
    setEmpfaenger((bisher) => (bisher.length ? bisher : charaktere.map((c) => c.id)));
  }, [charaktere]);

  const gewicht = useMemo(
    () => kiste.items.reduce((summe, g) => summe + (Number(g.weight) || 0) * (Number(g.qty) || 1), 0),
    [kiste.items]
  );

  async function rechnen(anteile) {
    setTeilung(await stashApi.teilung(anteile));
  }

  return (
    <div className="space-y-4">
      {/* --- Münzen --------------------------------------------------- */}
      <div>
        <div className="mb-2 flex items-center gap-2.5">
          <span className="font-display text-[13px] tracking-[0.12em] text-rubric uppercase">Münzen</span>
          <span className="h-px flex-1 bg-rule" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {MUENZEN.map(([schluessel, label]) => (
            <label key={schluessel} className="block">
              <span className="mb-1 block font-display text-[10px] tracking-[0.14em] text-faint uppercase">
                {label}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={kiste.coins[schluessel] ?? 0}
                onChange={(e) => {
                  const naechste = { ...kiste.coins, [schluessel]: Math.max(0, Number(e.target.value) || 0) };
                  setKiste((k) => ({ ...k, coins: naechste }));
                  stashApi.setCoins(naechste).catch(() => {});
                }}
                className="field-box text-center font-display"
              />
            </label>
          ))}
        </div>
      </div>

      {/* --- Teilen --------------------------------------------------- */}
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
              <li key={g.id} className="border border-rule bg-panel-soft px-3 py-2">
                {/* Der Name steht auf eigener Zeile – in einer schmalen
                    Seitenleiste bliebe daneben nur „Silberner S…“ übrig. */}
                <p className="text-ink">
                  {g.qty > 1 && <span className="font-display text-rubric">{g.qty}× </span>}
                  {g.name}
                </p>
                {g.notes && <p className="text-[15px] text-sepia italic">{g.notes}</p>}
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    value={g.holderId ?? ''}
                    onChange={(e) => stashApi.updateItem(g.id, { holderId: e.target.value || null })}
                    className="field-box min-w-0 flex-1 py-1 text-[15px]"
                    title="Wer trägt es?"
                  >
                    <option value="">niemand trägt es</option>
                    {charaktere.map((c) => (
                      <option key={c.id} value={c.id}>
                        trägt: {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => stashApi.removeItem(g.id)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                    aria-label="Aus der Kiste nehmen"
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!neu.name.trim()) return;
            await stashApi.addItem(neu);
            setNeu({ name: '', qty: 1 });
            laden();
          }}
          className="mt-2.5 flex gap-2"
        >
          <input
            value={neu.name}
            onChange={(e) => setNeu((n) => ({ ...n, name: e.target.value }))}
            placeholder="Was wurde gefunden?"
            className="field-box flex-1"
          />
          <input
            type="number"
            min={1}
            value={neu.qty}
            onChange={(e) => setNeu((n) => ({ ...n, qty: Math.max(1, Number(e.target.value) || 1) }))}
            className="field-box w-20 text-center font-display"
            aria-label="Anzahl"
          />
          <button type="submit" className="btn btn-seal px-4">
            <IconPlus size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
