import { SPELL_LEVELS } from './dnd5e.js';

/**
 * Kurze Rast: Eine Stunde Verschnaufen. Trefferwürfel werden einzeln
 * ausgegeben (das erledigt das Blatt), und alles, was sich bei kurzer Rast
 * erneuert, füllt sich wieder auf.
 */
export function kurzeRast(data) {
  return {
    ...data,
    resources: (data.resources ?? []).map((r) => (r.recharge === 'kurz' ? { ...r, current: r.max } : r)),
  };
}

/**
 * Lange Rast: acht Stunden. Trefferpunkte voll, die Hälfte der verbrauchten
 * Trefferwürfel zurück, alle Zauberplätze frei, eine Stufe Erschöpfung
 * weniger, und die Rettungswürfe gegen den Tod sind vergessen.
 */
export function langeRast(data) {
  const pool = data.combat?.hitDicePool ?? { total: 1, used: 0 };
  const zurueck = Math.max(1, Math.floor((pool.total || 1) / 2));

  const slots = { ...(data.spellcasting?.slots ?? {}) };
  for (const stufe of SPELL_LEVELS) {
    if (slots[stufe]) slots[stufe] = { ...slots[stufe], used: 0 };
  }

  return {
    ...data,
    combat: {
      ...data.combat,
      hp: { ...data.combat.hp, current: data.combat.hp.max, temp: 0 },
      hitDicePool: { ...pool, used: Math.max(0, (pool.used || 0) - zurueck) },
      deathSaves: { successes: 0, failures: 0 },
      exhaustion: Math.max(0, (data.combat?.exhaustion ?? 0) - 1),
      concentration: { active: false, spell: '' },
    },
    spellcasting: { ...data.spellcasting, slots },
    resources: (data.resources ?? []).map((r) =>
      r.recharge === 'kurz' || r.recharge === 'lang' ? { ...r, current: r.max } : r
    ),
  };
}
