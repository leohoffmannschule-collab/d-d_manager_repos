/**
 * Welches Blatt gehört wem – und wer darf es lesen.
 *
 * Gebraucht, wenn jemand neu dazukommt und ein vorbereitetes Blatt
 * übernimmt, oder wenn ein Blatt aus der Zeit vor den Konten noch niemandem
 * gehört.
 */
import { useCallback, useEffect, useState } from 'react';
import { charactersApi } from '../../../lib/api.js';
import { useLive } from '../../../lib/live.jsx';
import { Rubric } from '../../ui.jsx';

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
              <button
                onClick={async () => {
                  await charactersApi.patch(c.id, { shared: !c.shared });
                  laden();
                }}
                className={`min-h-11 border px-3 font-display text-[12px] tracking-[0.10em] uppercase ${
                  c.shared ? 'border-gold bg-gold/20 text-ink' : 'border-rule text-sepia'
                }`}
                title="Sehen die anderen am Tisch dieses Blatt?"
              >
                {c.shared ? 'in der Runde' : 'privat'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
