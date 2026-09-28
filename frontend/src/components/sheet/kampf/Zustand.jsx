/**
 * Zustände, Erschöpfung und die Konzentration.
 *
 * Die Konzentrationsprobe ist der Grund, warum diese Karte mehr tut als
 * Kästchen umschalten: Der Schwierigkeitsgrad ist 10 oder die Hälfte des
 * erlittenen Schadens – was höher liegt. Das rechnet niemand gern im Kopf,
 * während der Rest des Tisches wartet. Also trägt man den Schaden ein und
 * drückt einen Knopf; bricht die Konzentration, räumt der Almanach den
 * Zauber gleich selbst ab.
 */
import { useState } from 'react';
import { CONDITIONS, EXHAUSTION_STEPS, abilityModifier, proficiencyBonus } from '../../../lib/dnd5e.js';
import { blattWurf } from '../../../lib/wuerfeln.js';
import { Card, TextField, Toggle } from '../../ui.jsx';
import { IconD20 } from '../../icons.jsx';

export default function Zustand({ data, update }) {
  const [schaden, setSchaden] = useState('');
  const [konzentrationsmeldung, setKonzentrationsmeldung] = useState('');

  const zustaende = data.combat.conditions ?? [];
  const erschoepfung = data.combat.exhaustion ?? 0;
  const konzentration = data.combat.concentration ?? { active: false, spell: '' };

  /**
   * Konzentrationsprobe: Der Schwierigkeitsgrad ist 10 oder die Hälfte des
   * erlittenen Schadens – was höher liegt. Das rechnet niemand gern im Kopf,
   * während der Rest des Tisches wartet.
   */
  async function konzentrationsprobe() {
    const treffer = Number(schaden) || 0;
    const sg = Math.max(10, Math.floor(treffer / 2));
    const mod =
      abilityModifier(data.abilities.con) + (data.savingThrows.con ? proficiencyBonus(data.level) : 0);
    const wurf = await blattWurf(`Konzentration halten (SG ${sg})`, mod);

    if (wurf.total >= sg) {
      setKonzentrationsmeldung(`${wurf.total} gegen SG ${sg} – der Zauber hält.`);
    } else {
      setKonzentrationsmeldung(`${wurf.total} gegen SG ${sg} – die Konzentration bricht.`);
      update('combat.concentration', { active: false, spell: '' });
    }
    setSchaden('');
  }

  return (
  <Card title="Zustand">
    <div className="mb-4">
      <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">Zustände</span>
      <div className="flex flex-wrap gap-1.5">
        {CONDITIONS.map((zustand) => {
          const an = zustaende.includes(zustand);
          return (
            <button
              key={zustand}
              type="button"
              onClick={() =>
                update(
                  'combat.conditions',
                  an ? zustaende.filter((z) => z !== zustand) : [...zustaende, zustand]
                )
              }
              className={`min-h-9 border px-2 py-1 ${
                an ? 'border-rubric bg-rubric/15 text-rubric' : 'border-rule text-sepia'
              }`}
            >
              {zustand}
            </button>
          );
        })}
      </div>
    </div>

    <div className="mb-4 border-t border-dashed border-rule pt-4">
      <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
        Erschöpfung – {EXHAUSTION_STEPS[erschoepfung]}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6].map((stufe) => (
          <button
            key={stufe}
            type="button"
            onClick={() => update('combat.exhaustion', stufe)}
            className={`h-11 w-11 border font-display ${
              stufe === erschoepfung
                ? 'border-rubric bg-rubric text-rubric-ink'
                : stufe < erschoepfung
                  ? 'border-rubric bg-rubric/20 text-rubric'
                  : 'border-rule text-sepia'
            }`}
          >
            {stufe}
          </button>
        ))}
      </div>
    </div>

    <div className="border-t border-dashed border-rule pt-4">
      <div className="flex flex-wrap items-end gap-3">
        <Toggle
          checked={konzentration.active}
          onChange={(v) => update('combat.concentration', { ...konzentration, active: v })}
          label={<span className="text-ink">Konzentration</span>}
        />
        <TextField
          label="worauf"
          value={konzentration.spell}
          onChange={(v) => update('combat.concentration', { ...konzentration, spell: v })}
          className="min-w-[10rem] flex-1"
          placeholder="z. B. Segnen"
        />
      </div>
      {konzentration.active && (
        <div className="mt-3 border-t border-dotted border-rule pt-3">
          <span className="mb-1.5 block font-display text-[10px] tracking-[0.16em] text-faint uppercase">
            Getroffen? Schaden eintragen – der Schwierigkeitsgrad ergibt sich daraus
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={schaden}
              onChange={(e) => setSchaden(e.target.value)}
              placeholder="Schaden"
              className="h-11 w-24 border border-rule bg-panel-soft px-2 text-center font-display text-ink"
            />
            <button type="button" onClick={konzentrationsprobe} className="btn btn-plate">
              <IconD20 size={16} /> Konzentration prüfen
            </button>
            <span className="text-sepia italic">
              SG {Math.max(10, Math.floor((Number(schaden) || 0) / 2))}
            </span>
          </div>
        </div>
      )}
      {konzentrationsmeldung && <p className="mt-2 text-rubric italic">{konzentrationsmeldung}</p>}
    </div>
  </Card>
  );
}
