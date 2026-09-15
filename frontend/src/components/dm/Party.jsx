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
 * Alles in eine andere Kampagne.
 *
 * Für den Umzug einer laufenden Runde in eine neue Geschichte: die Helden
 * mitnehmen, die Hausregeln mitnehmen, die Szenen mitnehmen. Die Vorbereitung
 * – Karten, Bilder, Bestiarium, Begegnungen, Klang – steht drüben ohnehin
 * schon, die gehört der ganzen Runde und taucht hier deshalb gar nicht auf.
 *
 * Kopiert wird, nicht verschoben, und es wird nicht abgeglichen: Zweimal
 * ausgeführt steht drüben alles zweimal. Deshalb der Zwischenschritt, der
 * vorher aufzählt, was gleich hinübergeht.
 */
function Umzugsgut() {
  const { isDm } = useAuth();
  const { campaigns, activeId, active } = useCampaign();
  const [umfang, setUmfang] = useState(null);
  const [gewaehlt, setGewaehlt] = useState([]);
  const [ziel, setZiel] = useState('');
  const [nachfrage, setNachfrage] = useState(false);
  const [bericht, setBericht] = useState(null);
  const [fehler, setFehler] = useState('');

  useEffect(() => {
    if (!isDm || !activeId) return;
    campaignsApi
      .umfang()
      .then((u) => {
        setUmfang(u);
        setGewaehlt(Object.keys(u.arten).filter((art) => inhalt(u, art)));
      })
      .catch(() => {});
  }, [isDm, activeId]);

  const andere = campaigns.filter((k) => k.id !== activeId);
  if (!isDm || !active || andere.length === 0 || !umfang) return null;

  const etwasDabei = gewaehlt.some((art) => inhalt(umfang, art));

  async function uebernehmen() {
    setFehler('');
    try {
      const antwort = await campaignsApi.uebernehmen(ziel, gewaehlt);
      setBericht(antwort);
      setNachfrage(false);
    } catch (err) {
      setFehler(err.message);
      setNachfrage(false);
    }
  }

  return (
    <section className="panel p-4">
      <Rubric>
        <span className="inline-flex items-center gap-1.5">
          <IconScroll size={14} /> Alles in eine andere Kampagne
        </span>
      </Rubric>
      <p className="mb-3 text-sepia italic">
        Was aus „{active.name}“ mitkommen soll. Karten, Bilder, Bestiarium, Begegnungen und Klang stehen drüben
        ohnehin – die gehören der ganzen Runde. Würfe, Chat und Chronik bleiben hier: Die gehören zu den Abenden,
        an denen sie geschahen. Kopiert wird, nicht verschoben.
      </p>

      <ul className="mb-3 space-y-1.5">
        {Object.entries(umfang.arten).map(([art, { label }]) => (
          <li key={art}>
            <label
              className={`flex items-center gap-3 border border-rule bg-panel-soft px-3 py-2 ${
                inhalt(umfang, art) ? 'cursor-pointer' : 'opacity-50'
              }`}
            >
              <input
                type="checkbox"
                disabled={!inhalt(umfang, art)}
                checked={gewaehlt.includes(art)}
                onChange={(e) =>
                  setGewaehlt((bisher) => (e.target.checked ? [...bisher, art] : bisher.filter((a) => a !== art)))
                }
                className="h-5 w-5 shrink-0 accent-[var(--color-rubric)]"
              />
              <span className="min-w-0 flex-1 truncate text-ink">{label}</span>
              <span className="shrink-0 text-[14px] text-faint">{menge(umfang, art)}</span>
            </label>
          </li>
        ))}
      </ul>

      {nachfrage ? (
        <div className="border border-gold bg-gold/10 p-3">
          <p className="mb-2 text-ink">
            {aufzaehlen(gewaehlt.map((art) => satzteil(umfang, art)))} – nach „
            {andere.find((k) => k.id === ziel)?.name}“ kopieren?
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={uebernehmen} className="btn btn-seal">
              Ja, kopieren
            </button>
            <button onClick={() => setNachfrage(false)} className="btn btn-plate">
              Zurück
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!ziel || !etwasDabei) return;
            setBericht(null);
            setNachfrage(true);
          }}
          className="flex flex-wrap gap-2"
        >
          <select
            value={ziel}
            onChange={(e) => setZiel(e.target.value)}
            className="field-box min-w-[12rem] flex-1"
          >
            <option value="">In welche Kampagne?</option>
            {andere.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={!ziel || !etwasDabei} className="btn btn-seal disabled:opacity-50">
            Übernehmen
          </button>
        </form>
      )}

      {fehler && <p className="mt-2 text-rubric">{fehler}</p>}
      {bericht && (
        <p className="mt-2 flex items-start gap-1.5 text-gold">
          <IconCheck size={14} className="mt-1 shrink-0" />
          <span>
            In „{bericht.ziel?.name}“ liegt jetzt auch:{' '}
            {aufzaehlen(
              Object.entries(bericht.bericht)
                .filter(([art]) => umfang.arten[art])
                .map(([art, anzahl]) => `${anzahl} ${stueck(umfang.arten[art], anzahl)}`)
            )}
            {bericht.bericht?.muenzen ? ' – die Münzen sind dort dazugelegt worden.' : '.'}
          </span>
        </p>
      )}
    </section>
  );
}

/** Liegt in dieser Art überhaupt etwas? Die Kiste zählt auch ohne Gegenstände, wenn Münzen darin sind. */
function inhalt(umfang, art) {
  if (umfang[art] > 0) return true;
  return art === 'beute' && !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
}

/** „1 Charakter“, „3 Charaktere“ – die Mehrzahl kommt aus dem Umfang selbst. */
function stueck(art, anzahl) {
  return anzahl === 1 ? art.eins : art.viele;
}

/** Ein Teil der Aufzählung, samt Münzen, wo welche in der Kiste liegen. */
function satzteil(umfang, art) {
  const anzahl = umfang[art] ?? 0;
  const stueckzahl = anzahl ? `${anzahl} ${stueck(umfang.arten[art], anzahl)}` : '';
  const klimpert = art === 'beute' && !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
  if (!klimpert) return stueckzahl;
  return stueckzahl ? `${stueckzahl} samt Münzen` : 'die Münzen';
}

/** „a, b und c“ – nicht „a, b, c“: Es soll sich lesen wie ein Satz. */
function aufzaehlen(teile) {
  const gefuellt = teile.filter(Boolean);
  if (gefuellt.length < 2) return gefuellt.join('');
  return `${gefuellt.slice(0, -1).join(', ')} und ${gefuellt.at(-1)}`;
}

/** „3“ – oder „3 + Münzen“, wenn in der Kiste auch etwas klimpert. */
function menge(umfang, art) {
  const zahl = umfang[art] ?? 0;
  if (art !== 'beute') return String(zahl);
  const klimpert = !!umfang.muenzen && Object.values(umfang.muenzen).some(Boolean);
  if (!klimpert) return String(zahl);
  return zahl ? `${zahl} + Münzen` : 'nur Münzen';
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
            „{active.name}“ verschwindet aus allen Listen. Charaktere, Chronik, Szenen und Beute bleiben 30 Tage im
            Papierkorb liegen und lassen sich zurückholen – erst danach ist es endgültig. Die Kartenbibliothek gehört
            der ganzen Runde und bleibt in jedem Fall erhalten.
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
      <Umzugsgut />
      <Konten users={users} onChanged={laden} />
      <Charakterzuweisung users={users} onChanged={laden} />
      <KampagneEntsorgen />
    </div>
  );
}
