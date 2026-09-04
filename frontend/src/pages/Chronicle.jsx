import { useEffect, useMemo, useState } from 'react';
import { chronicleApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useSitzung, useSitzungen } from '../lib/daten.jsx';
import { Card } from '../components/ui.jsx';
import { CHRONIK_ART, benenne } from '../lib/beschriftung.js';
import {
  IconBook,
  IconD20,
  IconEyeOff,
  IconHeart,
  IconMap,
  IconPlus,
  IconQuill,
  IconScroll,
  IconSwords,
  IconTrash,
  IconUpload,
} from '../components/icons.jsx';

const SYMBOL = {
  wurf: IconD20,
  schaden: IconSwords,
  heilung: IconHeart,
  tod: IconSwords,
  zustand: IconEyeOff,
  runde: IconSwords,
  kampf: IconSwords,
  auftritt: IconSwords,
  szene: IconMap,
  handzettel: IconScroll,
  rast: IconHeart,
  notiz: IconQuill,
};

const uhrzeit = (iso) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

/** Aus der Folge von Einträgen Kapitel machen – wie im Protokoll. */
function inKapitel(entries) {
  const kapitel = [];
  let aktuell = null;
  for (const e of entries) {
    if (e.kind === 'szene' || e.meta?.kapitel) {
      aktuell = { titel: e.text.replace(/\.$/, ''), zeit: e.createdAt, eintraege: [] };
      kapitel.push(aktuell);
      continue;
    }
    if (!aktuell) {
      aktuell = { titel: 'Zu Beginn', zeit: e.createdAt, eintraege: [] };
      kapitel.push(aktuell);
    }
    aktuell.eintraege.push(e);
  }
  return kapitel;
}

function Eintrag({ eintrag, isDm, onLoeschen }) {
  const Symbol = SYMBOL[eintrag.kind] ?? IconQuill;
  return (
    <li className="group flex items-start gap-3 border-b border-dotted border-rule py-1.5">
      <span className="mt-0.5 w-11 shrink-0 font-display text-[12px] text-faint">{uhrzeit(eintrag.createdAt)}</span>
      <Symbol size={15} className={`mt-0.5 shrink-0 ${eintrag.secret ? 'text-rubric' : 'text-faint'}`} />
      <span className="min-w-0 flex-1 text-ink" title={benenne(CHRONIK_ART, eintrag.kind)}>
        {eintrag.text}
        {eintrag.secret && <span className="ml-2 text-[14px] text-rubric italic">verdeckt</span>}
      </span>
      {isDm && (
        <button
          onClick={() => onLoeschen(eintrag.id)}
          className="shrink-0 text-faint opacity-0 group-hover:opacity-100 hover:text-rubric"
          aria-label="Eintrag streichen"
        >
          <IconTrash size={14} />
        </button>
      )}
    </li>
  );
}

export default function Chronicle() {
  const { isDm } = useAuth();
  const [gewaehlt, setGewaehlt] = useState(null);
  const { sitzungen, offene, laden: ladeListe } = useSitzungen();
  const { sitzung, setSitzung, laden: ladeSitzung } = useSitzung(gewaehlt);
  const [notiz, setNotiz] = useState('');
  const [ki, setKi] = useState({ verfuegbar: false });
  const [meldung, setMeldung] = useState('');
  const [laeuft, setLaeuft] = useState(false);

  // Beim ersten Laden die jüngste Sitzung aufschlagen.
  useEffect(() => {
    setGewaehlt((aktuell) => aktuell ?? sitzungen[0]?.id ?? null);
  }, [sitzungen]);

  useEffect(() => {
    chronicleApi.kiStatus().then(setKi).catch(() => {});
  }, []);

  const kapitel = useMemo(() => inKapitel(sitzung?.entries ?? []), [sitzung]);

  async function ausfuehren(aufgabe) {
    setMeldung('');
    setLaeuft(true);
    try {
      await aufgabe();
    } catch (err) {
      setMeldung(err.message);
    } finally {
      setLaeuft(false);
    }
  }

  async function herunterladen() {
    const text = await chronicleApi.protokoll(sitzung.id);
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sitzung.title.replace(/[^\wäöüÄÖÜß -]/g, '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
            <IconBook size={26} className="text-gold" />
            Chronik
          </h1>
          <p className="mt-1 text-sepia italic">
            Was am Tisch geschieht, schreibt der Almanach von selbst mit – Würfe, Wunden, Auftritte und Wege.
          </p>
        </div>

        {isDm && (
          <div className="flex flex-wrap gap-2">
            {offene ? (
              <button
                onClick={() => ausfuehren(() => chronicleApi.end(offene.id).then(ladeListe))}
                className="btn btn-plate"
              >
                Sitzung schließen
              </button>
            ) : (
              <button
                onClick={() =>
                  ausfuehren(async () => {
                    const neu = await chronicleApi.start();
                    await ladeListe();
                    setGewaehlt(neu.id);
                  })
                }
                className="btn btn-seal"
              >
                <IconPlus size={16} /> Sitzung beginnen
              </button>
            )}
          </div>
        )}
      </div>

      {meldung && <p className="mb-4 panel border-rubric p-3.5 text-rubric">{meldung}</p>}

      {sitzungen.length === 0 ? (
        <p className="border border-dashed border-rule-strong p-12 text-center text-sepia italic">
          Noch ist keine Sitzung verzeichnet. Sobald am Tisch gewürfelt oder gekämpft wird, beginnt die Chronik von
          selbst.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[16rem_1fr]">
          <ul className="space-y-1.5">
            {sitzungen.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => setGewaehlt(s.id)}
                  className={`w-full border px-3 py-2.5 text-left ${
                    gewaehlt === s.id ? 'border-gold bg-gold/12' : 'border-rule bg-panel hover:border-gold'
                  }`}
                >
                  <span className="block truncate font-display text-[15px] text-ink">{s.title}</span>
                  <span className="text-[14px] text-faint">
                    {new Date(s.startedAt).toLocaleDateString('de-DE')} · {s.anzahl} Einträge
                    {s.laufend && <span className="text-rubric"> · läuft</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div>
            {!sitzung ? (
              <p className="text-sepia italic">Die Sitzung wird aufgeschlagen …</p>
            ) : (
              <Card>
                <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-dashed border-rule pb-3">
                  {isDm ? (
                    <input
                      value={sitzung.title}
                      onChange={(e) => setSitzung((s) => ({ ...s, title: e.target.value }))}
                      onBlur={(e) => chronicleApi.rename(sitzung.id, e.target.value).then(ladeListe)}
                      className="min-w-0 flex-1 border-0 bg-transparent p-0 font-display text-xl font-semibold text-ink focus:outline-none"
                      aria-label="Titel der Sitzung"
                    />
                  ) : (
                    <h2 className="min-w-0 flex-1 font-display text-xl font-semibold text-ink">{sitzung.title}</h2>
                  )}
                  <button onClick={herunterladen} className="btn-plate flex min-h-11 items-center gap-1.5 px-3 text-[13px]">
                    <IconUpload size={14} /> Protokoll sichern
                  </button>
                  {isDm && ki.verfuegbar && (
                    <button
                      onClick={() =>
                        ausfuehren(async () => {
                          const { summary } = await chronicleApi.rueckblick(sitzung.id);
                          setSitzung((s) => ({ ...s, summary }));
                        })
                      }
                      disabled={laeuft}
                      className="btn btn-plate disabled:opacity-60"
                    >
                      {laeuft ? 'wird geschrieben …' : 'Rückblick schreiben lassen'}
                    </button>
                  )}
                  {isDm && (
                    <button
                      onClick={() =>
                        ausfuehren(async () => {
                          if (!confirm(`Die Sitzung „${sitzung.title}“ samt Chronik löschen?`)) return;
                          await chronicleApi.removeSession(sitzung.id);
                          setGewaehlt(null);
                          const liste = (await ladeListe()) ?? [];
                          setGewaehlt(liste[0]?.id ?? null);
                        })
                      }
                      className="flex h-11 w-11 items-center justify-center border border-rule text-sepia hover:border-rubric hover:text-rubric"
                      aria-label="Sitzung löschen"
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </div>

                {sitzung.summary && (
                  <div className="mb-5 border-l-[3px] border-gold bg-gold/10 px-4 py-3">
                    <p className="mb-1.5 font-display text-[11px] tracking-[0.16em] text-faint uppercase">Rückblick</p>
                    <p className="whitespace-pre-wrap leading-relaxed text-ink">{sitzung.summary}</p>
                  </div>
                )}

                {kapitel.length === 0 ? (
                  <p className="text-sepia italic">In dieser Sitzung steht noch nichts.</p>
                ) : (
                  kapitel.map((k, i) => (
                    <section key={`${k.titel}-${i}`} className="mb-5">
                      <div className="mb-2 flex items-center gap-2.5">
                        <h3 className="font-display text-[14px] tracking-[0.12em] text-rubric uppercase">{k.titel}</h3>
                        <span className="h-px flex-1 bg-rule" />
                        <span className="font-display text-[12px] text-faint">{uhrzeit(k.zeit)}</span>
                      </div>
                      <ul>
                        {k.eintraege.map((e) => (
                          <Eintrag
                            key={e.id}
                            eintrag={e}
                            isDm={isDm}
                            onLoeschen={(id) =>
                              ausfuehren(() => chronicleApi.removeEntry(id).then(() => ladeSitzung(sitzung.id)))
                            }
                          />
                        ))}
                      </ul>
                    </section>
                  ))
                )}

                {isDm && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!notiz.trim()) return;
                      ausfuehren(async () => {
                        await chronicleApi.addEntry(notiz.trim());
                        setNotiz('');
                        await ladeSitzung(sitzung.id);
                      });
                    }}
                    className="mt-4 flex gap-2.5 border-t border-dashed border-rule pt-4"
                  >
                    <input
                      value={notiz}
                      onChange={(e) => setNotiz(e.target.value)}
                      placeholder="Nachtragen, was der Almanach nicht sehen konnte …"
                      className="field-box flex-1"
                    />
                    <button type="submit" className="btn btn-seal px-5">
                      <IconQuill size={16} /> Eintragen
                    </button>
                  </form>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
