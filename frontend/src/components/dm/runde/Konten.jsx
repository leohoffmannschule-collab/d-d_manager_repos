import { useState } from 'react';
import { authApi } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { Rubric } from '../../ui.jsx';
import { IconCrown, IconKey, IconTrash } from '../../icons.jsx';

export default /**
 * Die Konten der Runde: Rolle, Farbe, Kennwort zurücksetzen, entfernen.
 *
 * Die Farbe ist mehr als Zierde – an ihr erkennt man am Tisch, wessen Wurf
 * und wessen Zeigefinger gerade aufleuchtet.
 */
function Konten({ users, onChanged }) {
  const { user } = useAuth();
  const [passwort, setPasswort] = useState({});

  return (
    <section className="panel p-4">
      <Rubric>Konten</Rubric>
      <ul className="space-y-2">
        {users.map((u) => (
          <li key={u.id} className="border border-rule bg-panel-soft p-3">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display font-semibold text-[#f0dca8]"
                style={{ backgroundColor: u.color }}
              >
                {u.name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-ink">
                  {u.name}
                  {u.role === 'sl' && <IconCrown size={14} className="text-gold" />}
                  {u.id === user.id && <span className="text-[14px] text-faint italic">(du)</span>}
                </p>
                <p className="text-[15px] text-sepia">
                  {u.role === 'sl' ? 'Spielleitung' : 'Runde'} · {u.characters} Charaktere
                </p>
              </div>

              <button
                onClick={async () => {
                  await authApi.updateUser(u.id, { role: u.role === 'sl' ? 'spieler' : 'sl' });
                  onChanged();
                }}
                className="btn-plate min-h-11 px-3 text-[13px]"
              >
                {u.role === 'sl' ? 'zur Runde' : 'zur Spielleitung'}
              </button>
              {u.id !== user.id && (
                <button
                  onClick={async () => {
                    if (!confirm(`Konto „${u.name}“ löschen? Die Charaktere fallen an dich zurück.`)) return;
                    await authApi.removeUser(u.id);
                    onChanged();
                  }}
                  className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                  aria-label="Konto löschen"
                >
                  <IconTrash size={16} />
                </button>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const neu = passwort[u.id];
                if (!neu) return;
                await authApi.updateUser(u.id, { password: neu });
                setPasswort((p) => ({ ...p, [u.id]: '' }));
              }}
              className="mt-2 flex gap-2"
            >
              <input
                type="text"
                value={passwort[u.id] ?? ''}
                onChange={(e) => setPasswort((p) => ({ ...p, [u.id]: e.target.value }))}
                placeholder="neues Passwort vergeben (bei Vergesslichkeit)"
                className="field-box flex-1"
              />
              <button type="submit" className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]">
                <IconKey size={14} /> setzen
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
