import { ausdruckWurf } from '../../../lib/wuerfeln.js';
import { abilityModifier, formatModifier } from '../../../lib/dnd5e.js';
import { NumberField, Stepper, TextField } from '../../ui.jsx';
import { IconHeart } from '../../icons.jsx';


/**
 * Der Vorrat an Trefferwürfeln: die Währung der kurzen Rast. Gezählt wird
 * `used` gegen `total`; eine lange Rast gibt die Hälfte zurück.
 */
export default function Trefferwuerfel({ data, update }) {
  const pool = data.combat.hitDicePool;
  const uebrig = Math.max(0, (pool.total || 0) - (pool.used || 0));
  const konMod = abilityModifier(data.abilities.con);

  async function ausgeben() {
    if (uebrig <= 0) return;
    const wurf = await ausdruckWurf('Trefferwürfel', `1W${pool.size}${konMod ? formatModifier(konMod) : ''}`);
    const geheilt = Math.max(0, wurf.total);
    update('combat.hitDicePool.used', (pool.used || 0) + 1);
    update('combat.hp.current', Math.min(data.combat.hp.max, (data.combat.hp.current ?? 0) + geheilt));
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <NumberField
        label="Würfelart (W)"
        value={pool.size}
        min={4}
        onChange={(v) => update('combat.hitDicePool.size', v)}
        className="w-24"
      />
      <NumberField
        label="Vorrat"
        value={pool.total}
        min={0}
        onChange={(v) => update('combat.hitDicePool.total', v)}
        className="w-24"
      />
      <NumberField
        label="Verbraucht"
        value={pool.used}
        min={0}
        onChange={(v) => update('combat.hitDicePool.used', v)}
        className="w-24"
      />
      <button
        type="button"
        onClick={ausgeben}
        disabled={uebrig <= 0}
        className="btn btn-plate disabled:opacity-40"
        title={`1W${pool.size} ${formatModifier(konMod)} würfeln und gutschreiben`}
      >
        <IconHeart size={16} />
        Würfel ausgeben ({uebrig})
      </button>
    </div>
  );
}
