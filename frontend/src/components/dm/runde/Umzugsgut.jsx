import { useEffect, useState } from 'react';
import { campaignsApi } from '../../../lib/api.js';
import { useAuth } from '../../../lib/auth.jsx';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';
import { IconCheck, IconScroll } from '../../icons.jsx';
import { aufzaehlen, inhalt, menge, satzteil } from './umfangText.js';

export default /**
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
