import { useState } from 'react';
import { useAuth } from '../lib/auth.jsx';
import { useCampaign } from '../lib/campaign.jsx';
import { Fleuron, IconCrown, IconPlus, IconScroll } from '../components/icons.jsx';

/**
 * Die Weiche zwischen Anmeldung und Tisch: Wer an mehreren Kampagnen
 * teilnimmt (oder noch an keiner sitzt), landet hier statt direkt im
 * Almanach. Erst wenn eine Kampagne aktiv ist, öffnen sich die Türen dahinter.
 */
export default function Kampagnenwahl() {
  const { isDm, logout } = useAuth();
  const { campaigns, loading, switchTo, create } = useCampaign();
  const [name, setName] = useState('');
  const [laeuft, setLaeuft] = useState(false);
  const [fehler, setFehler] = useState('');

  async function anlegen(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setFehler('');
    setLaeuft(true);
    try {
      await create(name.trim());
    } catch (err) {
      setFehler(err.message);
    } finally {
      setLaeuft(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sepia italic">Die Kampagnen werden gesichtet …</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <IconScroll size={40} className="text-gold" />
          <h1 className="font-initial text-3xl text-ink">Welche Kampagne?</h1>
          <div className="flex items-center gap-2.5">
            <span className="h-px w-10 bg-rule" />
            <Fleuron className="text-gold" />
            <span className="h-px w-10 bg-rule" />
          </div>
        </div>

        <div className="panel p-6">
          {campaigns.length === 0 ? (
            <p className="mb-5 text-sepia italic">
              {isDm
                ? 'Noch gibt es keine Kampagne. Leg die erste an.'
                : 'Du bist noch in keiner Kampagne verzeichnet. Bitte deine Spielleitung, dich einzutragen.'}
            </p>
          ) : (
            <>
              <h2 className="mb-3 font-display text-[15px] font-semibold tracking-[0.14em] text-rubric uppercase">
                Deine Kampagnen
              </h2>
              <ul className="mb-5 space-y-2">
                {campaigns.map((k) => (
                  <li key={k.id}>
                    <button
                      onClick={() => switchTo(k.id)}
                      className="btn-plate flex min-h-11 w-full items-center justify-between gap-3 px-4"
                    >
                      <span className="truncate text-ink">{k.name}</span>
                      <span className="shrink-0 text-[14px] text-faint">
                        {k.mitglieder} {k.mitglieder === 1 ? 'Mitglied' : 'Mitglieder'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {isDm && (
            <form onSubmit={anlegen} className="border-t border-dashed border-rule pt-5">
              <label className="mb-3 block">
                <span className="mb-1 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
                  Neue Kampagne
                </span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="z. B. Der Fluch von Strahd"
                  className="field-box"
                />
              </label>
              {fehler && <p className="mb-3 text-rubric">{fehler}</p>}
              <button type="submit" disabled={laeuft} className="btn btn-seal w-full disabled:opacity-60">
                <IconPlus size={16} /> {laeuft ? 'einen Augenblick …' : 'Kampagne eröffnen'}
              </button>
            </form>
          )}

          <button onClick={logout} className="mt-5 min-h-11 w-full text-sepia italic hover:text-ink">
            Abmelden
          </button>
        </div>

        {isDm && campaigns.length > 0 && (
          <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-[15px] text-faint italic">
            <IconCrown size={14} /> Mitglieder einer Kampagne verwaltest du unter Spielleitung → Runde.
          </p>
        )}
      </div>
    </div>
  );
}
