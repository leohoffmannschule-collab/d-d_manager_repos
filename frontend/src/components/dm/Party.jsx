import { useCallback, useEffect, useState } from 'react';
import { authApi, charactersApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useLive } from '../../lib/live.jsx';
import { Rubric } from '../ui.jsx';
import { IconCheck, IconCrown, IconKey, IconLink, IconPlus, IconTrash, IconUsers } from '../icons.jsx';

function Einladungen() {
  const [einladungen, setEinladungen] = useState([]);
  const [notiz, setNotiz] = useState('');
  const [kopiert, setKopiert] = useState(null);

  const laden = useCallback(() => {
    authApi.invites().then(setEinladungen).catch(() => {});
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  async function kopieren(code) {
    // Die Zwischenablage gibt es nur in „sicherem“ Kontext; über den Tunnel
    // ist das gegeben, im Heimnetz per http:// nicht immer.
    try {
      await navigator.clipboard.writeText(code);
      setKopiert(code);
      setTimeout(() => setKopiert(null), 1500);
    } catch {
      setKopiert(null);
    }
  }

  const offen = einladungen.filter((e) => !e.used_at);

  return (
    <section className="panel p-4">
      <Rubric>Einladungen</Rubric>
      <p className="mb-3 text-sepia italic">
        Wer dem Almanach beitreten soll, braucht einen Code. Jeder Code gilt für genau ein Konto.
      </p>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await authApi.createInvite(notiz);
          setNotiz('');
          laden();
        }}
        className="mb-4 flex flex-wrap gap-2.5"
      >
        <input
          value={notiz}
          onChange={(e) => setNotiz(e.target.value)}
          placeholder="Für wen? (nur als Merkhilfe)"
          className="field-box min-w-[10rem] flex-1"
        />
        <button type="submit" className="btn btn-seal">
          <IconPlus size={16} /> Code erzeugen
        </button>
      </form>

      {offen.length === 0 ? (
        <p className="text-sepia italic">Kein offener Code.</p>
      ) : (
        <ul className="space-y-1.5">
          {offen.map((e) => (
            <li key={e.code} className="flex flex-wrap items-center gap-3 border border-rule bg-panel-soft px-3 py-2">
              <button
                onClick={() => kopieren(e.code)}
                className="flex items-center gap-2 font-display text-[17px] tracking-[0.14em] text-ink"
                title="in die Zwischenablage legen"
              >
                {kopiert === e.code ? <IconCheck size={16} className="text-gold" /> : <IconLink size={16} className="text-faint" />}
                {e.code}
              </button>
              {e.note && <span className="text-sepia italic">{e.note}</span>}
              <span className="flex-1" />
              <button
                onClick={async () => {
                  await authApi.removeInvite(e.code);
                  laden();
                }}
                className="flex h-11 w-11 items-center justify-center text-sepia hover:text-rubric"
                aria-label="Code zurückziehen"
              >
                <IconTrash size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {einladungen.some((e) => e.used_at) && (
        <p className="mt-3 text-[15px] text-faint">
          Eingelöst:{' '}
          {einladungen
            .filter((e) => e.used_at)
            .map((e) => e.used_by_name)
            .join(', ')}
        </p>
      )}
    </section>
  );
}

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

function Charakterzuweisung({ users, onChanged }) {
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

/** Verwaltung der Runde: Konten, Einladungen und Zuordnung der Charaktere. */
export default function Party() {
  const [users, setUsers] = useState([]);

  const laden = useCallback(() => {
    authApi.users().then(setUsers).catch(() => {});
  }, []);

  useEffect(() => {
    laden();
  }, [laden]);

  useLive('runde:aktualisiert', laden);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sepia italic">
        <IconUsers size={17} className="text-faint" />
        {users.length === 1
          ? 'Bisher bist nur du im Almanach verzeichnet.'
          : `${users.length} Konten führt der Almanach.`}
      </p>
      <Einladungen />
      <Konten users={users} onChanged={laden} />
      <Charakterzuweisung users={users} onChanged={laden} />
    </div>
  );
}
