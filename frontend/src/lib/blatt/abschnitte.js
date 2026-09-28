/**
 * Die Abschnitte des ausgeführten Charakterblattes – je eine Funktion, je
 * eine Karte auf dem Bogen.
 *
 * Jede gibt HTML als Zeichenkette zurück und rechnet dabei dasselbe aus wie
 * die Oberfläche: Modifikatoren, Übungsbonus, passive Werte. Gerechnet wird
 * aber nicht hier, sondern in lib/regeln/ – hier steht nur, wie das
 * Ergebnis auf dem Papier aussieht.
 *
 * Alles ist schlichtes Zeichenketten-Basteln statt React, und das mit
 * Absicht: Die erzeugte Datei muss ohne React laufen, allein im Browser
 * dessen, der sie doppelklickt.
 */
import {
  ABILITIES,
  EXHAUSTION_STEPS,
  MERKMAL_ARTEN,
  PASSIVE_FERTIGKEITEN,
  SKILLS,
  SPELL_LEVELS,
  abilityModifier,
  aktionArtLabel,
  formatModifier,
  getragenesGewicht,
  gewichtAnzeigen,
  gewichtEinheit,
  gewichtMitEinheit,
  merkmalArtLabel,
  passiverWert,
  spellAttackBonus,
  spellSaveDC,
  traglastStufen,
  weiteMitEinheit,
} from '../dnd5e.js';
import { AUSSEHEN_FELDER } from '../regeln/blattfelder.js';
import { KURZ, MUENZEN, esc, escAbsatz, feld, zeilen } from './werkzeug.js';

export function zauberblock(spell, detail) {
  if (!detail) return '';
  const kopfzeile = [
    detail.level === 0 ? 'Zaubertrick' : `Grad ${detail.level}`,
    detail.school?.name,
    detail.concentration ? 'Konzentration' : null,
    detail.ritual ? 'Ritual' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const werte = [
    ['Zeitaufwand', detail.casting_time],
    ['Reichweite', detail.range],
    ['Komponenten', (detail.components ?? []).join(', ') + (detail.material ? ` (${detail.material})` : '')],
    ['Wirkungsdauer', detail.duration],
  ]
    .filter(([, wert]) => wert)
    .map(([label, wert]) => `<span><i>${esc(label)}:</i> ${esc(wert)}</span>`)
    .join(' &nbsp;·&nbsp; ');

  const text = (Array.isArray(detail.desc) ? detail.desc : [detail.desc])
    .filter(Boolean)
    .map((absatz) => `<p>${escAbsatz(absatz)}</p>`)
    .join('');

  const hoeher = (detail.higher_level ?? []).length
    ? `<p class="hoeher"><i>Auf höheren Graden:</i> ${detail.higher_level.map(escAbsatz).join(' ')}</p>`
    : '';

  return `<div class="zauberblock">
      <b>${esc(spell.name)}</b> <span class="kopfzeile">${esc(kopfzeile)}</span>
      <div class="zauberwerte">${werte}</div>
      ${text}${hoeher}
    </div>`;
}

/* --- Die einzelnen Abschnitte ------------------------------------------- */

export function attribute(data) {
  const kaesten = ABILITIES.map((a) => {
    const wert = data.abilities[a.key];
    return `<div class="attribut">
      <span class="label">${esc(a.label)}</span>
      <span class="zahl">${esc(wert)}</span>
      <span class="mod">${esc(formatModifier(abilityModifier(wert)))}</span>
    </div>`;
  }).join('');
  return `<div class="attribute">${kaesten}</div>`;
}

export function rettungswuerfe(data, pb) {
  const reihen = ABILITIES.map((a) => {
    const geuebt = data.savingThrows[a.key];
    const mod = abilityModifier(data.abilities[a.key]) + (geuebt ? pb : 0);
    return `<li${geuebt ? ' class="geuebt"' : ''}><span>${esc(a.label)}</span><b>${esc(formatModifier(mod))}</b></li>`;
  }).join('');
  const vermerk = data.savingThrowNote
    ? `<p class="hinweis"><i>Vermerk:</i> ${escAbsatz(data.savingThrowNote)}</p>`
    : '';
  return `<ul class="werteliste">${reihen}</ul>${vermerk}`;
}

/** Die drei passiven Werte und alles, was auch ohne Licht wahrgenommen wird. */
export function sinne(data) {
  const passive = PASSIVE_FERTIGKEITEN.map((f) => feld(f.label, passiverWert(data, f.key))).join('');
  const weiten = [
    ['Sichtweite', 'sight'],
    ['Dunkelsicht', 'darkvision'],
    ['Blindsicht', 'blindsight'],
    ['Erschütterungssinn', 'tremorsense'],
    ['Wahrer Blick', 'truesight'],
  ]
    .filter(([, key]) => Number(data.combat.senses?.[key]) > 0)
    .map(([label, key]) => feld(label, weiteMitEinheit(data.combat.senses[key], data.units)))
    .join('');
  const weitere = data.combat.senses?.notes ? feld('Weitere Sinne', data.combat.senses.notes) : '';
  return `<div class="raster">${passive}${weiten}${weitere}</div>`;
}

/** Was eine Aktion, Bonusaktion oder Reaktion kostet. */
export function aktionen(data) {
  const liste = (data.actions ?? []).filter((a) => a.name || a.description);
  if (liste.length === 0) return '';
  return zeilen(
    ['Was', 'Kostet', 'Wirkung'],
    liste.map((a) => [esc(a.name), esc(aktionArtLabel(a.art)), escAbsatz(a.description)])
  );
}

export function fertigkeiten(data, pb) {
  const reihen = SKILLS.map((s) => {
    const stand = data.skills[s.key] ?? { proficient: false, expertise: false };
    const bonus = (stand.expertise ? 2 : stand.proficient ? 1 : 0) * pb;
    const mod = abilityModifier(data.abilities[s.ability]) + bonus;
    const marke = stand.expertise ? ' ●●' : stand.proficient ? ' ●' : '';
    return `<li${stand.proficient ? ' class="geuebt"' : ''}><span>${esc(s.label)} <i>(${KURZ[s.ability]})</i>${marke}</span><b>${esc(
      formatModifier(mod)
    )}</b></li>`;
  }).join('');
  return `<ul class="werteliste zweispaltig">${reihen}</ul>`;
}

export function kampf(data) {
  const k = data.combat;
  const pool = k.hitDicePool ?? { size: 8, total: 1, used: 0 };
  const uebrig = Math.max(0, (pool.total || 0) - (pool.used || 0));
  const initiative = abilityModifier(data.abilities.dex) + (k.initiativeBonus || 0);
  const kreise = (anzahl) => '◯◯◯'.slice(0, 3 - anzahl).padStart(3, '●').split('').join(' ');

  return `<div class="raster">
      ${feld('Rüstungsklasse', k.armorClass)}
      ${feld('Initiative', formatModifier(initiative))}
      ${feld('Bewegung', weiteMitEinheit(k.speed, data.units))}
      ${feld('Trefferpunkte', `${k.hp.current} / ${k.hp.max}${k.hp.temp ? ` (+${k.hp.temp} temporär)` : ''}`)}
      ${feld('Trefferwürfel', `${uebrig} × W${pool.size} von ${pool.total}`)}
      <div class="feld breit"><span class="label">Rettungswürfe gegen den Tod</span><span class="wert">Erfolge ${kreise(
        k.deathSaves.successes
      )} &nbsp;·&nbsp; Fehlschläge ${kreise(k.deathSaves.failures)}</span></div>
    </div>`;
}

export function zustand(data) {
  const k = data.combat;
  const teile = [];
  if (k.conditions?.length) teile.push(feld('Zustände', k.conditions.join(', ')));
  if (k.exhaustion) teile.push(feld('Erschöpfung', `Stufe ${k.exhaustion} – ${EXHAUSTION_STEPS[k.exhaustion]}`));
  if (k.concentration?.active) teile.push(feld('Konzentration', k.concentration.spell || 'ja'));
  if (data.inspiration) teile.push(feld('Inspiration', 'vorhanden'));
  if (k.defenses?.resistances) teile.push(feld('Resistenzen', k.defenses.resistances));
  if (k.defenses?.immunities) teile.push(feld('Immunitäten', k.defenses.immunities));
  if (k.defenses?.vulnerabilities) teile.push(feld('Verwundbarkeiten', k.defenses.vulnerabilities));
  return teile.length ? `<div class="raster">${teile.join('')}</div>` : '';
}

export function ressourcen(data) {
  const liste = (data.resources ?? []).filter((r) => r.name);
  const teile = [];
  if (liste.length) {
    teile.push(
      zeilen(
        ['Ressource', 'Übrig', 'Erneuert sich'],
        liste.map((r) => [
          esc(r.name),
          `${esc(r.current)} / ${esc(r.max)}`,
          esc(r.recharge === 'kurz' ? 'kurze Rast' : r.recharge === 'lang' ? 'lange Rast' : 'von Hand'),
        ])
      )
    );
  }
  return teile.join('');
}

export function zauber(data) {
  const z = data.spellcasting;
  const attribut = data.abilities[z.ability];
  const sg = z.manualSaveDC ?? spellSaveDC(attribut, data.level);
  const bonus = z.manualAttackBonus ?? spellAttackBonus(attribut, data.level);

  const plaetze = SPELL_LEVELS.filter((lvl) => (z.slots?.[lvl]?.max ?? 0) > 0)
    .map((lvl) => {
      const s = z.slots[lvl];
      return `<div class="feld"><span class="label">Grad ${lvl}</span><span class="wert">${
        Math.max(0, s.max - s.used)
      } von ${s.max} frei</span></div>`;
    })
    .join('');

  const nachGrad = new Map();
  for (const s of z.spells ?? []) {
    const grad = s.level ?? 0;
    if (!nachGrad.has(grad)) nachGrad.set(grad, []);
    nachGrad.get(grad).push(s);
  }

  // Die Tabelle des gedruckten Blattes: je Grad ein Abschnitt, und in jeder
  // Zeile steht alles, was man im Spiel braucht, ohne nachzuschlagen.
  const liste = [...nachGrad.keys()]
    .sort((a, b) => a - b)
    .map((grad) => {
      const reihen = nachGrad
        .get(grad)
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'de'))
        .map((s) => [
          s.prepared ? '●' : '○',
          `<b>${esc(s.name)}</b>${s.notes ? `<br><i class="klein">${escAbsatz(s.notes)}</i>` : ''}`,
          esc(s.source),
          esc(s.save),
          esc(s.time),
          esc(s.range),
          esc(s.components),
          esc(s.duration),
          esc(s.page),
        ]);
      return `<div class="zaubergrad"><span class="label">${
        grad === 0 ? 'Zaubertricks (nach Belieben)' : `Zauber vom ${grad}. Grad`
      }</span>${zeilen(
        ['Vorb.', 'Zaubername', 'Quelle', 'RW/Angr.', 'Zeit', 'Reichweite', 'Komp.', 'Dauer', 'Seite'],
        reihen
      )}</div>`;
    })
    .join('');

  if (!plaetze && !liste) return '';
  return `<div class="raster">
      ${feld('Zauberattribut', ABILITIES.find((a) => a.key === z.ability)?.label)}
      ${feld('Zauber-SG', sg)}
      ${feld('Angriffsbonus', formatModifier(bonus))}
    </div>
    ${plaetze ? `<div class="raster schmal">${plaetze}</div>` : ''}
    ${liste ? `<div class="zauberliste">${liste}<p class="hinweis">● vorbereitet &nbsp;·&nbsp; ○ nicht vorbereitet</p></div>` : ''}`;
}

export function inventar(data) {
  const getragen = getragenesGewicht(data.inventory);
  const { ueberladen, schieben } = traglastStufen(data.abilities.str);
  const einheit = gewichtEinheit(data.units);
  const muenzen = MUENZEN.filter(([k]) => data.currency[k])
    .map(([k, label]) => `${data.currency[k]} ${label}`)
    .join(' · ');
  const eingestimmt = (data.attunement ?? []).filter(Boolean);

  return `${muenzen ? feld('Münzen', muenzen) : ''}
    ${zeilen(
      ['Gegenstand', 'Anzahl', `Gewicht (${einheit})`, 'Anmerkungen'],
      data.inventory.map((g) => [
        esc(g.name),
        esc(g.qty),
        esc(g.weight ? gewichtAnzeigen(g.weight, data.units) : ''),
        esc(g.notes),
      ])
    )}
    ${
      data.inventory.length
        ? `<div class="raster schmal">
            ${feld('Getragenes Gewicht', gewichtMitEinheit(getragen, data.units))}
            ${feld('Überladen ab', gewichtMitEinheit(ueberladen, data.units))}
            ${feld('Schieben / Ziehen / Heben', gewichtMitEinheit(schieben, data.units))}
          </div>`
        : ''
    }
    ${eingestimmt.length ? feld('Angelegte magische Gegenstände', eingestimmt.join(', ')) : ''}`;
}

/** Geschlecht, Alter, Statur … – und was sonst noch das Bild vollmacht. */
export function erscheinung(data) {
  const a = data.appearance ?? {};
  const werte = AUSSEHEN_FELDER.filter((f) => a[f.key])
    .map((f) => feld(f.label, a[f.key]))
    .join('');
  const gesinnung = data.alignment ? feld('Gesinnung', data.alignment) : '';
  const fliess = [
    ['Erscheinungsbild', data.traits?.look],
    ['Verbündete & Organisationen', data.traits?.allies],
  ]
    .filter(([, wert]) => wert)
    .map(([label, wert]) => `<div class="fliesstext"><span class="label">${label}</span><p>${escAbsatz(wert)}</p></div>`)
    .join('');

  if (!werte && !gesinnung && !fliess) return '';
  return `${werte || gesinnung ? `<div class="raster">${gesinnung}${werte}</div>` : ''}${fliess}`;
}

/** Die Merkmale nach Herkunft geordnet, so wie sie gedruckt gehören. */
export function merkmale(data) {
  const gefuellt = (data.features ?? []).filter((m) => m.name || m.description);
  if (gefuellt.length === 0) return '';

  return MERKMAL_ARTEN.map(([art]) => {
    const dieser = gefuellt.filter((m) => (m.category ?? 'sonstiges') === art);
    if (dieser.length === 0) return '';
    const eintraege = dieser
      .map(
        (m) =>
          `<div class="merkmal"><b>${esc(m.name)}</b>${
            m.source || m.page ? ` <i>${esc([m.source, m.page].filter(Boolean).join(' '))}</i>` : ''
          }<p>${escAbsatz(m.description)}</p></div>`
      )
      .join('');
    return `<div class="merkmalgruppe"><span class="label">${esc(merkmalArtLabel(art))}</span>${eintraege}</div>`;
  }).join('');
}

export function hintergrund(data) {
  const t = data.traits;
  const p = data.proficiencies;
  const stuecke = [
    ['Persönlichkeit', t.personality],
    ['Ideale', t.ideals],
    ['Bindungen', t.bonds],
    ['Makel', t.flaws],
  ]
    .filter(([, wert]) => wert)
    .map(([label, wert]) => `<div class="feld"><span class="label">${label}</span><p>${escAbsatz(wert)}</p></div>`)
    .join('');

  const uebungen = [
    ['Rüstungen', p.armor],
    ['Waffen', p.weapons],
    ['Werkzeuge', p.tools],
    ['Sprachen', p.languages],
  ]
    .filter(([, wert]) => wert)
    .map(([label, wert]) => feld(label, wert))
    .join('');

  return `${stuecke ? `<div class="raster">${stuecke}</div>` : ''}
    ${uebungen ? `<div class="raster">${uebungen}</div>` : ''}
    ${t.backstory ? `<div class="fliesstext"><span class="label">Chronik</span><p>${escAbsatz(t.backstory)}</p></div>` : ''}
    ${t.notes ? `<div class="fliesstext"><span class="label">Lose Notizen</span><p>${escAbsatz(t.notes)}</p></div>` : ''}`;
}

/* --- Das ganze Blatt ----------------------------------------------------- */
