/**
 * Reiter 2 des Charakterblattes: alles, was im Kampf gebraucht wird.
 *
 * Der am meisten benutzte Reiter des Almanachs – und der einzige, der auch
 * *schreibend* mit dem Rest des Tisches zu tun hat: Trefferpunkte, die hier
 * fallen, stehen sofort in der Kampfliste der Spielleitung, und Schaden von
 * dort steht sofort hier (siehe pages/CharacterSheet.jsx, useLive).
 *
 * Diese Datei setzt die Karten zusammen und hält die beiden Rechnungen, die
 * nirgends sonst hingehören: den Rettungswurf gegen den Tod und die
 * Konzentrationsprobe. Alles Übrige liegt in `kampf/`:
 *
 *   kampf/felder.js             die Spalten der wiederkehrenden Zeilen
 *   kampf/Todeszeichen.jsx      die drei Kreise für Erfolg und Fehlschlag
 *   kampf/Wurfknopf.jsx         ein Wert, der sich würfeln lässt
 *   kampf/Trefferwuerfel.jsx    der Vorrat für die kurze Rast
 *   kampf/Standardaktionen.jsx  was jede Figur ohne Eintrag kann
 *   kampf/Ressourcen.jsx        selbstverwaltete Zähler
 *
 * Die Rettungswürfe gegen den Tod sind bewusst dicke Knöpfe: Wer bei 0
 * Trefferpunkten liegt, soll sie im Halbdunkel treffen.
 *
 * Kurze und lange Rast ändern ein Dutzend Felder auf einmal. Die Regeln
 * dafür stehen nicht hier, sondern in lib/rasten.js – hier steht nur der
 * Knopf, der sie anwendet.
 */
import { useState } from 'react';
import {
  CONDITIONS,
  EXHAUSTION_STEPS,
  abilityModifier,
  aktionArtLabel,
  formatModifier,
  proficiencyBonus,
} from '../../lib/dnd5e.js';
import { kurzeRast, langeRast } from '../../lib/rasten.js';
import { ausdruckWurf, blattWurf } from '../../lib/wuerfeln.js';
import { Card, NumberField, Stepper, TextField, TextAreaField, Toggle, WeiteField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';
import { IconCandle, IconD20, IconHeart, IconSun } from '../icons.jsx';
import { AKTION_FIELDS, ATTACK_FIELDS } from './kampf/felder.js';
import Todeszeichen from './kampf/Todeszeichen.jsx';
import Wurfknopf from './kampf/Wurfknopf.jsx';
import Trefferwuerfel from './kampf/Trefferwuerfel.jsx';
import Standardaktionen from './kampf/Standardaktionen.jsx';
import Ressourcen from './kampf/Ressourcen.jsx';

export default function CombatTab({ data, update, replace }) {
  const [rastOffen, setRastOffen] = useState(false);
  const [todesmeldung, setTodesmeldung] = useState('');
  const [schaden, setSchaden] = useState('');
  const [konzentrationsmeldung, setKonzentrationsmeldung] = useState('');

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

  const initiative = abilityModifier(data.abilities.dex) + (data.combat.initiativeBonus || 0);
  const deathSaves = data.combat.deathSaves;
  const zustaende = data.combat.conditions ?? [];
  const erschoepfung = data.combat.exhaustion ?? 0;
  const konzentration = data.combat.concentration ?? { active: false, spell: '' };

  return (
    <div className="flex flex-col gap-4">
      <Card title="Kampfwerte">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-4">
          <NumberField
            label="Rüstungsklasse"
            value={data.combat.armorClass}
            onChange={(v) => update('combat.armorClass', v)}
          />
          <NumberField
            label="Initiative-Bonus"
            value={data.combat.initiativeBonus}
            onChange={(v) => update('combat.initiativeBonus', v)}
          />
          <WeiteField
            label="Bewegung"
            fuss={data.combat.speed}
            units={data.units}
            onChange={(v) => update('combat.speed', v)}
          />
          <TextField label="Trefferwürfel" value={data.combat.hitDice} onChange={(v) => update('combat.hitDice', v)} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-dashed border-rule pt-3">
          <span className="text-sepia italic">Initiative gesamt</span>
          <Wurfknopf name="Initiative" label={formatModifier(initiative)} modifier={initiative} />
          <Toggle
            checked={!!data.inspiration}
            onChange={(v) => update('inspiration', v)}
            label={<span className="text-ink">Inspiration</span>}
          />
        </div>
      </Card>

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

      <Card title="Rasten">
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              replace(kurzeRast(data));
              setRastOffen(true);
            }}
            className="btn btn-plate"
          >
            <IconCandle size={16} /> Kurze Rast
          </button>
          <button
            type="button"
            onClick={() => {
              if (!confirm('Lange Rast: Trefferpunkte voll, Zauberplätze frei, eine Stufe Erschöpfung weniger?')) return;
              replace(langeRast(data));
              setRastOffen(true);
            }}
            className="btn btn-seal"
          >
            <IconSun size={16} /> Lange Rast
          </button>
        </div>
        <p className="mt-3 text-sepia italic">
          {rastOffen
            ? 'Die Rast ist verzeichnet. Trefferwürfel gibst du oben einzeln aus.'
            : 'Kurze Rast erneuert, was sich kurz erneuert. Die lange Rast füllt Trefferpunkte, Zauberplätze und die Hälfte der Trefferwürfel.'}
        </p>
      </Card>

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

      <Card title="Widerstand und Sinne">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextAreaField
            label="Resistenzen"
            rows={2}
            value={data.combat.defenses.resistances}
            onChange={(v) => update('combat.defenses.resistances', v)}
          />
          <TextAreaField
            label="Immunitäten"
            rows={2}
            value={data.combat.defenses.immunities}
            onChange={(v) => update('combat.defenses.immunities', v)}
          />
          <TextAreaField
            label="Verwundbarkeiten"
            rows={2}
            value={data.combat.defenses.vulnerabilities}
            onChange={(v) => update('combat.defenses.vulnerabilities', v)}
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <WeiteField
            label="Sichtweite"
            fuss={data.combat.senses.sight ?? 0}
            units={data.units}
            step={data.units === 'imperial' ? 5 : 1}
            onChange={(v) => update('combat.senses.sight', v)}
          />
          <p className="text-[15px] text-sepia italic sm:col-span-2 sm:self-end sm:pb-2">
            Wie weit dein Blick bei Licht reicht. <span className="font-display">0 heißt unbegrenzt</span> –
            bei Tageslicht sieht man bis zum Horizont. Trägst du etwas ein, bekommst du am Spieltisch ein
            Nebelfenster, das an deiner Figur hängt und sich nur bewegt, wenn sie sich bewegt.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ['Dunkelsicht', 'darkvision'],
            ['Blindsicht', 'blindsight'],
            ['Erschütterung', 'tremorsense'],
            ['Wahrer Blick', 'truesight'],
          ].map(([label, feld]) => (
            <WeiteField
              key={feld}
              label={label}
              fuss={data.combat.senses[feld] ?? 0}
              units={data.units}
              step={data.units === 'imperial' ? 5 : 1}
              onChange={(v) => update(`combat.senses.${feld}`, v)}
            />
          ))}
        </div>
        <p className="mt-2 text-[15px] text-sepia italic">
          Diese vier zählen erst, wenn die Szene <span className="font-display">dunkel</span> ist: Dann nimmst
          du so weit wahr, wie hier steht, auch ohne jedes Licht. Im Dunkeln reicht dein Blick so weit, wie
          deine Sichtweite <span className="font-display">oder deine eigene Fackel</span> trägt – was von
          beidem weiter ist. Dafür zündet man sie schließlich an.
        </p>
        <div className="mt-4">
          <TextField
            label="Weitere Sinne"
            value={data.combat.senses.notes}
            onChange={(v) => update('combat.senses.notes', v)}
            placeholder="Sinnesschärfe, besondere Wahrnehmung …"
          />
        </div>
      </Card>

      <Card title="Klassenressourcen">
        <Ressourcen data={data} update={update} />
      </Card>

      <Card title="Aktionen">
        <Standardaktionen />
        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">Was du außerdem kannst</p>
          <RepeatingRows
            items={data.actions}
            onChange={(rows) => update('actions', rows)}
            fields={AKTION_FIELDS}
            addLabel="Aktion hinzufügen"
            emptyText="Handauflegen, Zweiter Wind, Wildgestalt – was eine Aktion kostet, steht hier."
          />
        </div>
      </Card>

      <Card title="Angriffe & Zaubertricks">
        <RepeatingRows
          items={data.attacks}
          onChange={(rows) => update('attacks', rows)}
          fields={ATTACK_FIELDS}
          addLabel="Angriff hinzufügen"
          emptyText="Noch nichts eingetragen – die Waffen ruhen."
        />
        {data.attacks?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-dashed border-rule pt-3">
            {data.attacks
              .filter((a) => a.name)
              .map((a) => (
                <span key={a.id ?? a.name} className="flex">
                  <button
                    type="button"
                    onClick={() => blattWurf(`${a.name} (Angriff)`, Number(String(a.bonus).replace('+', '')) || 0)}
                    className="btn-plate min-h-11 px-3 text-[13px]"
                  >
                    {a.name}
                  </button>
                  {a.damage && (
                    <button
                      type="button"
                      onClick={() => ausdruckWurf(`${a.name} (Schaden)`, String(a.damage).replace(/[^0-9dwW+-]/g, ''))}
                      className="btn-plate min-h-11 border-l-0 px-3 text-[13px] text-rubric"
                      title={`Schaden ${a.damage}`}
                    >
                      Schaden
                    </button>
                  )}
                </span>
              ))}
          </div>
        )}
      </Card>
    </div>
  );
}
