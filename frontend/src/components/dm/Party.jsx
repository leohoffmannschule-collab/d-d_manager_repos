import { useCallback, useEffect, useState } from 'react';
import { authApi, campaignsApi, charactersApi } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { useCampaign } from '../../lib/campaign.jsx';
import { useEinladungen, useKonten } from '../../lib/daten.jsx';
import { useLive } from '../../lib/live.jsx';
import { Rubric } from '../ui.jsx';
import { IconCheck, IconCrown, IconKey, IconLink, IconPlus, IconScroll, IconTrash, IconUsers } from '../icons.jsx';

function Einladungen() {
  const { einladungen, offene, laden } = useEinladungen();
  const [notiz, setNotiz] = useState('');
  const [kopiert, setKopiert] = useState(null);

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

      {offene.length === 0 ? (
        <p className="text-sepia italic">Kein offener Code.</p>
      ) : (
        <ul className="space-y-1.5">
          {offene.map((e) => (
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

/** Wer aus der Runde ist in *dieser* Kampagne dabei? Andere Kampagnen sehen sie nicht. */
function Kampagnenmitglieder({ users }) {
  const { active } = useCampaign();
  const [mitglieder, setMitglieder] = useState([]);
  const [auswahl, setAuswahl] = useState('');

  const laden = useCallback(() => {
    if (!active) return;
    campaignsApi.members(active.id).then(setMitglieder).catch(() => {});
  }, [active]);

  useEffect(() => {
    laden();
  }, [laden]);

  if (!active) return null;

  const dabei = new Set(mitglieder.map((m) => m.id));
  const uebrige = users.filter((u) => !dabei.has(u.id));

  return (
    <section className="panel p-4">
      <Rubric>
        <span className="inline-flex items-center gap-1.5">
          <IconScroll size={14} /> Mitglieder von „{active.name}“
        </span>
      </Rubric>
      <p className="mb-3 text-sepia italic">
        Nur wer hier steht, sieht Charaktere, Chronik und Spieltisch dieser Kampagne.
      </p>

      <ul className="mb-3 space-y-1.5">
        {mitglieder.map((m) => (
          <li key={m.id} className="flex items-center gap-3 border border-rule bg-panel-soft px-3 py-2">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-semibold text-[#f0dca8]"
              style={{ backgroundColor: m.color }}
            >
              {m.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1 truncate text-ink">
              {m.name}
              {m.role === 'sl' && <IconCrown size={13} className="ml-1.5 inline text-gold" />}
            </span>
            <button
              onClick={async () => {
                await campaignsApi.removeMember(active.id, m.id);
                laden();
              }}
              className="flex h-9 w-9 items-center justify-center text-sepia hover:text-rubric"
              aria-label={`${m.name} aus der Kampagne nehmen`}
            >
              <IconTrash size={15} />
            </button>
          </li>
        ))}
      </ul>

      {uebrige.length > 0 && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!auswahl) return;
            await campaignsApi.addMember(active.id, auswahl);
            setAuswahl('');
            laden();
          }}
          className="flex gap-2"
        >
          <select value={auswahl} onChange={(e) => setAuswahl(e.target.value)} className="field-box flex-1">
            <option value="">Konto hinzufügen …</option>
            {uebrige.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-seal px-3">
            <IconPlus size={16} />
          </button>
        </form>
      )}
    </section>
  );
}

/**
 * Die Kampagne wegräumen – und wiederholen, was weggeräumt wurde.
 *
 * Nichts davon geht mit einem Klick: Der Name muss abgetippt werden, und
 * selbst dann liegt die Kampagne erst einmal nur im Papierkorb. Wer sich
 * vergreift, klickt einmal auf „Zurückholen“ und hat nichts verloren.
 */
function KampagneEntsorgen() {
  const { isDm } = useAuth();
  const { active, remove, restore, purge, papierkorb } = useCampaign();
  const [name, setName] = useState('');
  const [fehler, setFehler] = useState('');
  const [korb, setKorb] = useState([]);
  const [endgueltig, setEndgueltig] = useState({});

  const korbLaden = useCallback(() => {
    papierkorb().then(setKorb).catch(() => {});
  }, [papierkorb]);

  useEffect(() => {
    korbLaden();
  }, [korbLaden]);

  return (
    <>
      {isDm && active && !active.darfLoeschen && (
        <section className="panel p-4">
          <Rubric>Diese Kampagne löschen</Rubric>
          <p className="text-sepia italic">
            „{active.name}“ kann nur {active.angelegtVon ? `${active.angelegtVon} löschen` : 'die Spielleitung löschen'} –
            wer eine Kampagne anlegt, entscheidet auch über ihr Ende.
          </p>
        </section>
      )}

      {active?.darfLoeschen && (
        <section className="panel border-rubric/40 p-4">
          <Rubric>Diese Kampagne löschen</Rubric>
          <p className="mb-3 text-sepia italic">
            „{active.name}“ verschwindet aus allen Listen. Charaktere, Chronik, Karten und Beute bleiben 30 Tage im
            Papierkorb liegen und lassen sich zurückholen – erst danach ist es endgültig.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setFehler('');
              try {
                // Danach ist diese Ansicht fort: Ohne aktive Kampagne
                // landet man in der Auswahl. Hier also nichts mehr setzen.
                await remove(active.id, name);
              } catch (err) {
                setFehler(err.message);
              }
            }}
            className="flex flex-wrap gap-2"
          >
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Zum Bestätigen „${active.name}“ abtippen`}
              className="field-box min-w-[12rem] flex-1"
            />
            <button
              type="submit"
              disabled={name.trim() !== active.name}
              className="btn btn-seal disabled:opacity-40"
              title={name.trim() !== active.name ? 'Der Name stimmt noch nicht' : 'In den Papierkorb legen'}
            >
              <IconTrash size={16} /> In den Papierkorb
            </button>
          </form>
          {fehler && <p className="mt-3 text-rubric">{fehler}</p>}
        </section>
      )}

      {korb.length > 0 && (
        <section className="panel p-4">
          <Rubric>Papierkorb</Rubric>
          <ul className="space-y-2">
            {korb.map((k) => (
              <li key={k.id} className="border border-rule bg-panel-soft p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1 truncate text-ink">{k.name}</span>
                  <span className="shrink-0 text-[15px] text-sepia italic">
                    noch {k.tageUebrig} {k.tageUebrig === 1 ? 'Tag' : 'Tage'}
                  </span>
                  <button
                    onClick={async () => {
                      await restore(k.id);
                      korbLaden();
                    }}
                    className="btn-plate min-h-11 px-3 text-[13px]"
                  >
                    Zurückholen
                  </button>
                  <button
                    onClick={() => setEndgueltig((e) => ({ ...e, [k.id]: e[k.id] === undefined ? '' : undefined }))}
                    className="min-h-11 px-2 text-[13px] text-sepia hover:text-rubric"
                  >
                    endgültig …
                  </button>
                </div>

                {endgueltig[k.id] !== undefined && (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await purge(k.id, endgueltig[k.id]);
                        setEndgueltig((s) => ({ ...s, [k.id]: undefined }));
                        korbLaden();
                      } catch (err) {
                        setFehler(err.message);
                      }
                    }}
                    className="mt-2 flex flex-wrap gap-2 border-t border-dashed border-rule pt-2"
                  >
                    <input
                      value={endgueltig[k.id]}
                      onChange={(e) => setEndgueltig((s) => ({ ...s, [k.id]: e.target.value }))}
                      placeholder={`„${k.name}“ abtippen – danach ist alles fort`}
                      className="field-box min-w-[12rem] flex-1"
                    />
                    <button
                      type="submit"
                      disabled={endgueltig[k.id]?.trim() !== k.name}
                      className="btn btn-seal disabled:opacity-40"
                    >
                      <IconTrash size={16} /> Endgültig löschen
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
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
  const { konten: users, laden } = useKonten();

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sepia italic">
        <IconUsers size={17} className="text-faint" />
        {users.length === 1
          ? 'Bisher bist nur du im Almanach verzeichnet.'
          : `${users.length} Konten führt der Almanach.`}
      </p>
      <Einladungen />
      <Kampagnenmitglieder users={users} />
      <Konten users={users} onChanged={laden} />
      <Charakterzuweisung users={users} onChanged={laden} />
      <KampagneEntsorgen />
    </div>
  );
}
