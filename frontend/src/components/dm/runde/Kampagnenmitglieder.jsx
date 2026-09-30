/** Wer aus der Runde ist in *dieser* Kampagne dabei? Andere Kampagnen sehen sie nicht. */
import { useCallback, useEffect, useState } from 'react';
import { campaignsApi } from '../../../lib/api.js';
import { useCampaign } from '../../../lib/campaign.jsx';
import { Rubric } from '../../ui.jsx';
import { IconCrown, IconPlus, IconScroll, IconTrash } from '../../icons.jsx';
import Laufwert from '../../Laufwert.jsx';

export default function Kampagnenmitglieder({ users }) {
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
            <Laufwert
              className="farbpunkt flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-semibold text-[var(--marke-schrift)]"
              werte={{ '--farbe': m.color }}
            >
              {m.name.charAt(0).toUpperCase()}
            </Laufwert>
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
