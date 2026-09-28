/**
 * Trefferpunkte, Trefferwürfel und die Rettungswürfe gegen den Tod.
 *
 * Die Rettungswürfe sind bewusst dicke Knöpfe: Wer bei 0 Trefferpunkten
 * liegt, soll sie im Halbdunkel treffen.
 *
 * Der Wurf trägt sich selbst ein: Eine 20 richtet wieder auf, eine 1 zählt
 * doppelt, alles ab 10 ist ein Erfolg. Weil dabei mehrere Felder auf einmal
 * wechseln, geht das über `replace` statt über `update`.
 */
import { useState } from 'react';
import { blattWurf } from '../../../lib/wuerfeln.js';
import { Card, Stepper } from '../../ui.jsx';
import { IconD20 } from '../../icons.jsx';
import Todeszeichen from './Todeszeichen.jsx';
import Trefferwuerfel from './Trefferwuerfel.jsx';

export default function Trefferpunkte({ data, update, replace }) {
  const [todesmeldung, setTodesmeldung] = useState('');
  const deathSaves = data.combat.deathSaves;

  /**
   * Der Rettungswurf gegen den Tod trägt sich selbst ein: Eine 20 richtet
   * wieder auf, eine 1 zählt doppelt, alles ab 10 ist ein Erfolg.
   */
  async function todesrettung() {
    const wurf = await blattWurf('Rettungswurf gegen den Tod', 0);
    const augen = wurf.details?.[0]?.rolls?.[0] ?? wurf.total;
    const stand = data.combat.deathSaves;

    if (augen === 20) {
      replace({
        ...data,
        combat: {
          ...data.combat,
          hp: { ...data.combat.hp, current: Math.max(1, data.combat.hp.current) },
          deathSaves: { successes: 0, failures: 0 },
        },
      });
      setTodesmeldung('Eine 20 – du kommst mit einem Trefferpunkt wieder zu dir.');
      return;
    }

    const erfolge = augen >= 10 ? Math.min(3, stand.successes + 1) : stand.successes;
    const fehlschlaege = augen >= 10 ? stand.failures : Math.min(3, stand.failures + (augen === 1 ? 2 : 1));

    replace({ ...data, combat: { ...data.combat, deathSaves: { successes: erfolge, failures: fehlschlaege } } });
    setTodesmeldung(
      erfolge >= 3
        ? 'Drei Erfolge – du bist stabil.'
        : fehlschlaege >= 3
          ? 'Drei Fehlschläge. Das war der letzte Atemzug.'
          : augen === 1
            ? 'Eine 1 – das zählt doppelt.'
            : `${augen} gewürfelt: ${augen >= 10 ? 'Erfolg' : 'Fehlschlag'}.`
    );
  }

  return (
  <Card title="Trefferpunkte">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stepper label="Aktuelle TP" value={data.combat.hp.current} onChange={(v) => update('combat.hp.current', v)} min={-99} max={999} />
      <Stepper label="Maximale TP" value={data.combat.hp.max} onChange={(v) => update('combat.hp.max', v)} min={0} max={999} />
      <Stepper label="Temporäre TP" value={data.combat.hp.temp} onChange={(v) => update('combat.hp.temp', v)} min={0} max={999} />
    </div>

    <div className="mt-5 border-t border-dashed border-rule pt-4">
      <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">Trefferwürfel</p>
      <Trefferwuerfel data={data} update={update} />
    </div>

    <div className="mt-5 border-t border-dashed border-rule pt-4">
      <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">
        Rettungswürfe gegen den Tod
      </p>
      <div className="flex flex-wrap items-end gap-8">
        <Todeszeichen
          label="Erfolge"
          count={deathSaves.successes}
          onChange={(v) => update('combat.deathSaves.successes', v)}
          filledClass="border-gold bg-gold"
        />
        <Todeszeichen
          label="Fehlschläge"
          count={deathSaves.failures}
          onChange={(v) => update('combat.deathSaves.failures', v)}
          filledClass="border-rubric bg-rubric"
        />
        <button type="button" onClick={todesrettung} className="btn btn-plate">
          <IconD20 size={16} /> Würfeln
        </button>
      </div>
      {todesmeldung && <p className="mt-2 text-rubric italic">{todesmeldung}</p>}
    </div>
  </Card>
  );
}
