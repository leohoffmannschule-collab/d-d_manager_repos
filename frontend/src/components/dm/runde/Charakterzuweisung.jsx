/**
 * Welches Blatt gehört wem – und wer darf es lesen.
 *
 * Gebraucht, wenn jemand neu dazukommt und ein vorbereitetes Blatt
 * übernimmt, oder wenn ein Blatt aus der Zeit vor den Konten noch niemandem
 * gehört.
 *
 * Je Blatt zwei Wahlen: wem es gehört, und wer es sieht. Die zweite fasst
 * `shared` und `npc` zusammen, weil sie zusammen *eine* Frage beantworten:
 *
 *   in der Runde          geteilt – alle am Tisch lesen mit
 *   privat                nur die Besitzerin (und die Spielleitung)
 *   NSC hinter dem Schirm nur die Spielleitung; der Besitz ruht, bis das
 *                         Blatt zurückkommt (siehe `fuehrtSelbst` in
 *                         backend/src/routes/charaktere/blatt.js)
 */
import { useCallback, useEffect, useState } from 'react';
import { charactersApi } from '../../../lib/api.js';
import { useLive } from '../../../lib/live.jsx';
import { Rubric } from '../../ui.jsx';

/** Die drei Stufen der Sichtbarkeit und was der Server dafür bekommt. */
const SICHTBARKEIT = {
  runde: { label: 'in der Runde', rumpf: { npc: false, shared: true } },
  privat: { label: 'privat', rumpf: { npc: false, shared: false } },
  nsc: { label: 'NSC – hinter dem Schirm', rumpf: { npc: true } },
};

/** In welcher Stufe ein Blatt gerade steht. */
const stufe = (c) => (c.npc ? 'nsc' : c.shared ? 'runde' : 'privat');

export default function Charakterzuweisung({ users, onChanged }) {
  const [charaktere, setCharaktere] = useState([]);

  const laden = useCallback(() => {
    charactersApi.all().then(setCharaktere).catch(() => {});
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  useLive('charakter:aktualisiert', laden);

  return (
    <section className="panel p-4">
      <Rubric>Wem gehört welches Blatt?</Rubric>
      {charaktere.length === 0 ? (
        <p className="text-sepia italic">Noch ist kein Charakter angelegt.</p>
      ) : (
        <ul className="space-y-1.5">
          {charaktere.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 border border-rule bg-panel-soft px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-ink">
                {c.name}
                <span className="text-sepia italic"> {[c.race, c.classLevel].filter(Boolean).join(' · ')}</span>
              </span>
              <select
                value={c.ownerId ?? ''}
                onChange={async (e) => {
                  await charactersApi.patch(c.id, { ownerId: e.target.value || null });
                  laden();
                  onChanged?.();
                }}
                className="field-box w-40"
              >
                <option value="">ohne Besitzer</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={stufe(c)}
                onChange={async (e) => {
                  await charactersApi.patch(c.id, SICHTBARKEIT[e.target.value].rumpf);
                  laden();
                  onChanged?.();
                }}
                className={`field-box w-60 ${c.npc ? 'text-gold' : ''}`}
                title="Wer sieht dieses Blatt? Hinter dem Schirm sieht und führt es nur die Spielleitung."
                aria-label={`Wer sieht „${c.name}“?`}
              >
                {Object.entries(SICHTBARKEIT).map(([wert, { label }]) => (
                  <option key={wert} value={wert}>
                    {label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
