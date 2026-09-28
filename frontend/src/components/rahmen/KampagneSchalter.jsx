/**
 * Der Wechsler zwischen den eigenen Kampagnen, dazu die Neuanlage für die
 * Spielleitung.
 *
 * Die aktive Kampagne hängt an der *Sitzung*, nicht am Konto: Dieselbe
 * Person kann in zwei Fenstern in zwei Kampagnen sitzen. Deshalb lädt der
 * Wechsel die Seite neu – alles, was im Fenster steht, gehört zur alten
 * Geschichte und muss frisch geholt werden.
 */
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../lib/auth.jsx';
import { useCampaign } from '../../lib/campaign.jsx';
import { IconCheck, IconPlus, IconScroll } from '../icons.jsx';

export default function KampagneSchalter() {
  const { isDm } = useAuth();
  const { campaigns, active, switchTo, create } = useCampaign();
  const [offen, setOffen] = useState(false);
  const [neu, setNeu] = useState(false);
  const [name, setName] = useState('');
  const [fehler, setFehler] = useState('');
  const box = useRef(null);

  useEffect(() => {
    if (!offen) return undefined;
    const schliessen = (e) => {
      if (!box.current?.contains(e.target)) {
        setOffen(false);
        setNeu(false);
      }
    };
    document.addEventListener('pointerdown', schliessen);
    return () => document.removeEventListener('pointerdown', schliessen);
  }, [offen]);

  // Mit nur einer Kampagne gibt es für Spieler nichts zu wechseln – der
  // Schalter bliebe leerer Zierrat. Die Spielleitung sieht ihn trotzdem,
  // sie kann jederzeit eine neue eröffnen.
  if (!isDm && campaigns.length <= 1) return null;

  async function anlegen(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setFehler('');
    try {
      await create(name.trim());
      setName('');
      setNeu(false);
      setOffen(false);
    } catch (err) {
      setFehler(err.message);
    }
  }

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOffen((o) => !o)}
        className="flex min-h-11 items-center gap-2 border border-transparent px-2.5 text-leather-ink hover:border-gold"
        aria-label="Kampagne wechseln"
        title="Kampagne wechseln"
      >
        <IconScroll size={17} className="text-gold-soft" />
        <span className="hidden max-w-[8rem] truncate font-display text-[13px] tracking-[0.06em] sm:inline">
          {active?.name ?? 'Kampagne'}
        </span>
      </button>

      {offen && (
        <div className="panel absolute right-0 z-50 mt-2 w-64 p-4">
          <span className="mb-2 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            Kampagnen
          </span>
          <ul className="mb-1 space-y-1">
            {campaigns.map((k) => (
              <li key={k.id}>
                <button
                  onClick={async () => {
                    await switchTo(k.id);
                    setOffen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-2 px-2 text-left ${
                    k.id === active?.id ? 'text-ink' : 'text-sepia hover:text-ink'
                  }`}
                >
                  {k.id === active?.id ? <IconCheck size={14} className="shrink-0 text-gold" /> : <span className="w-[14px] shrink-0" />}
                  <span className="min-w-0 flex-1 truncate">{k.name}</span>
                </button>
              </li>
            ))}
          </ul>

          {isDm &&
            (neu ? (
              <form onSubmit={anlegen} className="mt-2 border-t border-dashed border-rule pt-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name der neuen Kampagne"
                  autoFocus
                  className="field-box mb-2"
                />
                {fehler && <p className="mb-2 text-[14px] text-rubric">{fehler}</p>}
                <button type="submit" className="btn btn-seal min-h-11 w-full text-[13px]">
                  <IconPlus size={14} /> Eröffnen
                </button>
              </form>
            ) : (
              <button
                onClick={() => setNeu(true)}
                className="mt-2 flex min-h-11 w-full items-center gap-2 border-t border-dashed border-rule pt-3 text-sepia hover:text-ink"
              >
                <IconPlus size={16} /> Neue Kampagne
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
