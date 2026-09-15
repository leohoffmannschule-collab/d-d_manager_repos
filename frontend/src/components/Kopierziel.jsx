import { useEffect, useRef, useState } from 'react';
import { useCampaign } from '../lib/campaign.jsx';
import { IconCheck } from './icons.jsx';

/**
 * „In Kampagne …“ – ein einzelnes Stück in eine andere Kampagne kopieren.
 *
 * Steht überall dort, wo etwas liegt, das zu einer Geschichte gehört: am
 * Charakterblatt, am Handzettel, an der Szene, am Fund in der Beutekiste.
 * Angeboten werden nur Kampagnen, in denen die Spielleitung selbst sitzt –
 * und nur, wenn es überhaupt eine zweite gibt.
 *
 * Kopiert wird, nicht verschoben: Das Stück bleibt, wo es ist. Deshalb steht
 * danach kurz da, wohin es gegangen ist, statt dass etwas verschwindet.
 *
 * @param kopieren     async (zielId) => … – der eigentliche Aufruf
 * @param nachOben     Liste nach oben aufklappen (wenn unten kein Platz ist)
 * @param beschriftung Aufschrift des Knopfes
 * @param klasse       Anstelle der voreingestellten Knopf-Klassen, damit sich
 *                     der Knopf seiner Umgebung anpasst (Szenenlade etwa
 *                     setzt alles in Kapitälchen)
 */
export default function Kopierziel({
  kopieren,
  nachOben = false,
  beschriftung = 'In Kampagne …',
  klasse = 'min-h-9 text-sepia hover:text-ink',
}) {
  const { campaigns, activeId } = useCampaign();
  const [offen, setOffen] = useState(false);
  const [gelandet, setGelandet] = useState('');
  const [fehler, setFehler] = useState('');
  const huelle = useRef(null);

  // Vier solcher Knöpfe auf einer Seite und keiner schließt von selbst –
  // das wäre ein Feld offener Klappen. Ein Klick daneben genügt.
  useEffect(() => {
    if (!offen) return undefined;
    const zu = (e) => {
      if (!huelle.current?.contains(e.target)) setOffen(false);
    };
    document.addEventListener('pointerdown', zu);
    return () => document.removeEventListener('pointerdown', zu);
  }, [offen]);

  const andere = campaigns.filter((k) => k.id !== activeId);
  if (andere.length === 0) return null;

  async function hinein(ziel, e) {
    e.preventDefault();
    e.stopPropagation();
    setFehler('');
    try {
      await kopieren(ziel.id);
      setOffen(false);
      setGelandet(ziel.name);
      setTimeout(() => setGelandet(''), 2500);
    } catch (err) {
      setFehler(err.message);
    }
  }

  if (gelandet) {
    return (
      <span className="flex min-h-9 items-center gap-1.5 text-gold">
        <IconCheck size={14} /> in „{gelandet}“
      </span>
    );
  }

  return (
    <div ref={huelle} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOffen((o) => !o);
        }}
        className={klasse}
      >
        {beschriftung}
      </button>
      {offen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`panel absolute right-0 z-40 w-56 p-2 ${nachOben ? 'bottom-full mb-1' : 'top-full mt-1'}`}
        >
          {andere.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={(e) => hinein(k, e)}
              className="flex min-h-11 w-full items-center px-2 text-left text-sepia hover:text-ink"
            >
              <span className="truncate">{k.name}</span>
            </button>
          ))}
          {fehler && <p className="px-2 py-1 text-[14px] text-rubric">{fehler}</p>}
        </div>
      )}
    </div>
  );
}
