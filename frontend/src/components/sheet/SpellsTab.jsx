/**
 * Reiter 4: Zauberplätze, Zaubertricks und die Zauberliste.
 *
 * Die Besonderheit gegenüber den anderen Reitern: Hier hängt das Kompendium
 * mit dran. Wer einen Zauber sucht, bekommt ihn aus der 5e-API und
 * übernimmt Reichweite, Wirkzeit und Komponenten mit einem Klick ins Blatt.
 * Übernommen wird dabei eine *Abschrift*, kein Verweis – das Blatt soll
 * auch dann vollständig sein, wenn das Kompendium gerade nicht erreichbar
 * ist oder der Zauber dort verschwindet.
 *
 * Zauberplätze sind Verbrauch, kein Vorrat: Gezählt wird `used` gegen `max`.
 * Eine lange Rast setzt `used` auf null (lib/rasten.js).
 *
 * Der Reiter hält den Zustand (was aufgeschlagen ist, was nachgeschlagen
 * wurde) und ordnet die Liste; gezeichnet wird in zauber/:
 *   Zauberwirken.jsx   – Attribut, SG, Angriffsbonus
 *   Zauberplaetze.jsx  – verbraucht / höchstens je Grad
 *   Zaubersuche.jsx    – Suche im Kompendium
 *   Zaubereintrag.jsx  – ein Zauber, zugeklappt oder aufgeschlagen
 *   Zauberspalten.jsx, Kurzzeile.jsx, spalten.js – die Spalten eines Zaubers
 */
import { useMemo, useState } from 'react';
import { abilityModifier, proficiencyBonus } from '../../lib/dnd5e.js';
import { compendiumApi } from '../../lib/api.js';
import { newId } from '../../lib/id.js';
import { Card } from '../ui.jsx';
import { IconPlus } from '../icons.jsx';
import Zaubereintrag from './zauber/Zaubereintrag.jsx';
import Zauberplaetze from './zauber/Zauberplaetze.jsx';
import Zaubersuche from './zauber/Zaubersuche.jsx';
import Zauberwirken from './zauber/Zauberwirken.jsx';

export default function SpellsTab({ data, update }) {
  const spellcasting = data.spellcasting;
  // Nachgeschlagene Zauber bleiben im Gedächtnis, solange das Blatt offen ist.
  const [aufgeschlagen, setAufgeschlagen] = useState(null);
  const [texte, setTexte] = useState({});
  const [laedt, setLaedt] = useState(null);

  const pb = proficiencyBonus(data.level);
  const abilityMod = abilityModifier(data.abilities[spellcasting.ability]);
  const saveDC = spellcasting.manualSaveDC ?? 8 + pb + abilityMod;
  const attackBonus = spellcasting.manualAttackBonus ?? pb + abilityMod;

  function updateSpellcasting(key, value) {
    update('spellcasting', { ...spellcasting, [key]: value });
  }

  function aendereZauber(id, feld, wert) {
    updateSpellcasting(
      'spells',
      spellcasting.spells.map((s) => (s.id === id ? { ...s, [feld]: wert } : s))
    );
  }

  async function aufschlagen(spell) {
    if (aufgeschlagen === spell.id) return setAufgeschlagen(null);
    setAufgeschlagen(spell.id);
    if (texte[spell.id] !== undefined || !spell.index) return;
    setLaedt(spell.id);
    try {
      const detail = await compendiumApi.detail('spells', spell.index);
      setTexte((alle) => ({ ...alle, [spell.id]: detail }));
    } catch {
      setTexte((alle) => ({ ...alle, [spell.id]: null }));
    } finally {
      setLaedt(null);
    }
  }

  function addSpell(spell) {
    if (spellcasting.spells.some((s) => s.name === spell.name)) return;
    updateSpellcasting('spells', [...spellcasting.spells, spell]);
  }

  /** Von Hand eintragen – das Kompendium kennt nicht jeden Zauber. */
  function eigenerZauber() {
    updateSpellcasting('spells', [
      ...spellcasting.spells,
      { id: newId(), name: '', level: 0, prepared: false, source: '', notes: '' },
    ]);
  }

  // Nach Grad geordnet, so wie auf dem gedruckten Blatt: erst die
  // Zaubertricks, dann Grad für Grad.
  const nachGrad = useMemo(() => {
    const gruppen = new Map();
    for (const s of [...spellcasting.spells].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'de'))) {
      const grad = s.level ?? 0;
      if (!gruppen.has(grad)) gruppen.set(grad, []);
      gruppen.get(grad).push(s);
    }
    return [...gruppen.entries()].sort(([a], [b]) => a - b);
  }, [spellcasting.spells]);

  return (
    <div className="flex flex-col gap-4">
      <Zauberwirken
        ability={spellcasting.ability}
        saveDC={saveDC}
        attackBonus={attackBonus}
        onAbility={(wert) => updateSpellcasting('ability', wert)}
      />

      <Zauberplaetze slots={spellcasting.slots} onChange={(slots) => updateSpellcasting('slots', slots)} />

      <Card title="Zauber aus dem Kompendium übernehmen">
        <Zaubersuche onAdd={addSpell} />
        <button type="button" onClick={eigenerZauber} className="btn btn-plate mt-3">
          <IconPlus size={16} /> Eigenen Zauber eintragen
        </button>
      </Card>

      <Card title="Zauberliste">
        {nachGrad.length === 0 ? (
          <p className="text-sepia italic">Noch keine Zauber verzeichnet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {nachGrad.map(([grad, zauber]) => (
              <div key={grad}>
                <p className="mb-1.5 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">
                  {grad === 0 ? 'Zaubertricks (nach Belieben)' : `Zauber vom ${grad}. Grad`}
                </p>
                <ul className="divide-y divide-dotted divide-rule border border-rule">
                  {zauber.map((spell) => (
                    <Zaubereintrag
                      key={spell.id}
                      spell={spell}
                      grad={grad}
                      offen={aufgeschlagen === spell.id}
                      laedt={laedt === spell.id}
                      detail={texte[spell.id]}
                      onAufschlagen={() => aufschlagen(spell)}
                      onAendern={(feld, wert) => aendereZauber(spell.id, feld, wert)}
                      onEntfernen={() =>
                        updateSpellcasting(
                          'spells',
                          spellcasting.spells.filter((s) => s.id !== spell.id)
                        )
                      }
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
