/**
 * Die Chronik: was an den Spielabenden geschah.
 *
 * Der Almanach schreibt sie im Vorbeigehen mit – jeder Wurf, jeder Schaden,
 * jede aufgelegte Szene hinterlässt einen Eintrag (siehe
 * backend/src/chronicle.js). Diese Seite macht daraus etwas Lesbares.
 *
 * Drei Dinge, die man wissen sollte:
 *
 *   – Einträge tragen `kind` und `meta`, also *Struktur*, nicht nur einen
 *     fertigen Satz. Das Symbol links kommt aus `SYMBOL`, der Text bei
 *     Bedarf aus lib/beschriftung.js. Eine andere Oberfläche könnte daraus
 *     ganz andere Sätze bauen.
 *   – Verdeckte Einträge (`secret`) bekommt ein Spielerfenster gar nicht
 *     erst geschickt – das entscheidet der Server.
 *   – Der Rückblick ist die einzige Stelle im Almanach, an der ein
 *     Sprachmodell mitarbeitet, und er ist freiwillig: ohne Schlüssel in
 *     der .env bleibt der Knopf fort.
 *
 * Die Seite hält den Zustand und die Handgriffe; gezeichnet wird in
 * chronik/ (Seitenkopf, Sitzungsliste, Sitzungskopf, Kapitel, Eintrag,
 * Nachtrag), geordnet in chronik/kapitel.js.
 */
import { useEffect, useMemo, useState } from 'react';
import { chronicleApi } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { useSitzung, useSitzungen } from '../lib/daten.js';
import { Card } from '../components/ui.jsx';
import Kapitel from './chronik/Kapitel.jsx';
import Nachtrag from './chronik/Nachtrag.jsx';
import Seitenkopf from './chronik/Seitenkopf.jsx';
import Sitzungskopf from './chronik/Sitzungskopf.jsx';
import Sitzungsliste from './chronik/Sitzungsliste.jsx';
import { inKapitel } from './chronik/kapitel.js';

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
      <Seitenkopf
        isDm={isDm}
        offene={offene}
        onSchliessen={() => ausfuehren(() => chronicleApi.end(offene.id).then(ladeListe))}
        onBeginnen={() =>
          ausfuehren(async () => {
            const neu = await chronicleApi.start();
            await ladeListe();
            setGewaehlt(neu.id);
          })
        }
      />

      {meldung && <p className="mb-4 panel border-rubric p-3.5 text-rubric">{meldung}</p>}

      {sitzungen.length === 0 ? (
        <p className="border border-dashed border-rule-strong p-12 text-center text-sepia italic">
          Noch ist keine Sitzung verzeichnet. Sobald am Tisch gewürfelt oder gekämpft wird, beginnt die Chronik von
          selbst.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[16rem_1fr]">
          <Sitzungsliste sitzungen={sitzungen} gewaehlt={gewaehlt} onWaehlen={setGewaehlt} />

          <div>
            {!sitzung ? (
              <p className="text-sepia italic">Die Sitzung wird aufgeschlagen …</p>
            ) : (
              <Card>
                <Sitzungskopf
                  sitzung={sitzung}
                  isDm={isDm}
                  ki={ki}
                  laeuft={laeuft}
                  onTitel={(title) => setSitzung((s) => ({ ...s, title }))}
                  onTitelFertig={(title) => chronicleApi.rename(sitzung.id, title).then(ladeListe)}
                  onSichern={herunterladen}
                  onRueckblick={() =>
                    ausfuehren(async () => {
                      const { summary } = await chronicleApi.rueckblick(sitzung.id);
                      setSitzung((s) => ({ ...s, summary }));
                    })
                  }
                  onLoeschen={() =>
                    ausfuehren(async () => {
                      if (!confirm(`Die Sitzung „${sitzung.title}“ samt Chronik löschen?`)) return;
                      await chronicleApi.removeSession(sitzung.id);
                      setGewaehlt(null);
                      const liste = (await ladeListe()) ?? [];
                      setGewaehlt(liste[0]?.id ?? null);
                    })
                  }
                />

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
                    <Kapitel
                      key={`${k.titel}-${i}`}
                      kapitel={k}
                      isDm={isDm}
                      onLoeschen={(id) =>
                        ausfuehren(() => chronicleApi.removeEntry(id).then(() => ladeSitzung(sitzung.id)))
                      }
                    />
                  ))
                )}

                {isDm && (
                  <Nachtrag
                    notiz={notiz}
                    onNotiz={setNotiz}
                    onEintragen={(text) =>
                      ausfuehren(async () => {
                        await chronicleApi.addEntry(text);
                        setNotiz('');
                        await ladeSitzung(sitzung.id);
                      })
                    }
                  />
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
