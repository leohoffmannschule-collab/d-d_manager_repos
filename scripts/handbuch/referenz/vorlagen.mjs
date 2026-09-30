/**
 * Verzeichnis: die zwölf Vorlagen-Charaktere, die jede neue Kampagne hinter
 * dem Schirm vorfindet – mit Werten, Merkmalen, Zaubern und Geschichte.
 *
 * Gelesen werden die Steckbriefe selbst (backend/src/vorlagen/helden/), so
 * wie der Server sie beim Säen in Blätter verwandelt. Wer eine Vorlage
 * ändert, ändert sie dort; dieses Kapitel folgt beim nächsten Bau.
 */
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { kapitelKopf } from './quelle.mjs';

const ATTRIBUTE = [
  ['str', 'STÄ'],
  ['dex', 'GES'],
  ['con', 'KON'],
  ['int', 'INT'],
  ['wis', 'WEI'],
  ['cha', 'CHA'],
];

/** Wie die Fertigkeiten im Blatt heißen. */
const FERTIGKEIT = {
  acrobatics: 'Akrobatik', animalHandling: 'Tierhandhabung', arcana: 'Arkane Kunde', athletics: 'Athletik',
  deception: 'Täuschen', history: 'Geschichte', insight: 'Motiv erkennen', intimidation: 'Einschüchtern',
  investigation: 'Nachforschung', medicine: 'Heilkunde', nature: 'Naturkunde', perception: 'Wahrnehmung',
  performance: 'Auftreten', persuasion: 'Überzeugen', religion: 'Religion', sleightOfHand: 'Fingerfertigkeit',
  stealth: 'Heimlichkeit', survival: 'Überlebenskunst',
};

const MERKMAL = { klasse: 'Klasse', spezies: 'Spezies', talent: 'Talent', hintergrund: 'Hintergrund' };
const ART = { aktion: 'Aktion', bonus: 'Bonusaktion', reaktion: 'Reaktion', frei: 'frei' };

const mod = (wert) => {
  const m = Math.floor((wert - 10) / 2);
  return m >= 0 ? `+${m}` : `${m}`;
};
const zelle = (text) => String(text ?? '').replace(/\|/g, '/').replace(/\n+/g, ' ');

/** Ein Held als Abschnitt. */
function held(h) {
  const teile = [`## ${h.name}`, ''];
  teile.push(`*${[h.spezies + (h.unterart ? ` (${h.unterart})` : ''), h.klasse, h.hintergrund, h.gesinnung].filter(Boolean).join(' · ')}*`, '');
  if (h.wesen?.look) teile.push(h.wesen.look, '');

  teile.push(
    `| ${ATTRIBUTE.map(([, k]) => k).join(' | ')} |`,
    `|${ATTRIBUTE.map(() => '---').join('|')}|`,
    `| ${ATTRIBUTE.map(([k]) => `${h.werte[k]} (${mod(h.werte[k])})`).join(' | ')} |`,
    ''
  );
  const kampf = [
    ['Rüstungsklasse', h.ruestungsklasse],
    ['Trefferpunkte', `${h.trefferpunkte} (${h.trefferwuerfel})`],
    ['Bewegung', `${h.bewegung} Fuß`],
    ['Initiative', h.initiativeBonus ? `+${h.initiativeBonus} zusätzlich` : ''],
    ['Rettungswürfe', h.rettungswuerfe.map((r) => ATTRIBUTE.find(([k]) => k === r)?.[1]).join(', ')],
    ['Fertigkeiten', h.fertigkeiten.map((f) => FERTIGKEIT[f] ?? f).join(', ')],
    ['Sinne', [h.sinne?.darkvision ? `Dunkelsicht ${h.sinne.darkvision} Fuß` : '', h.sinne?.notes].filter(Boolean).join('; ')],
    ['Widerstände', h.verteidigung?.resistances],
    ['Sprachen', h.uebungen?.languages],
    ['Rüstung, Waffen', [h.uebungen?.armor, h.uebungen?.weapons].filter(Boolean).join('; ')],
    ['Werkzeuge', h.uebungen?.tools],
  ].filter(([, w]) => w);
  teile.push('| Wert | |', '|---|---|', ...kampf.map(([k, w]) => `| ${k} | ${zelle(w)} |`), '');
  if (h.rettungswurfVermerk) teile.push(`*${h.rettungswurfVermerk}*`, '');

  if (h.angriffe?.length) {
    teile.push('**Angriffe**', '', '| Angriff | Bonus | Schaden | Anmerkung |', '|---|---|---|---|');
    for (const a of h.angriffe) teile.push(`| ${zelle(a.name)} | ${zelle(a.bonus)} | ${zelle(a.damage)} | ${zelle(a.notes)} |`);
    teile.push('');
  }
  if (h.aktionen?.length) {
    teile.push('**Eigene Aktionen**', '');
    for (const a of h.aktionen) teile.push(`- *${a.name}* (${ART[a.art] ?? a.art}): ${a.description}`);
    teile.push('');
  }
  if (h.ressourcen?.length) {
    teile.push(`**Ressourcen:** ${h.ressourcen.map((r) => `${r.name} ${r.max}× (${r.recharge === 'kurz' ? 'kurze Rast' : r.recharge === 'lang' ? 'lange Rast' : 'von Hand'})`).join(', ')}`, '');
  }
  if (h.merkmale?.length) {
    teile.push('**Merkmale**', '');
    for (const m of h.merkmale) {
      const quelle = [MERKMAL[m.category] ?? m.category, m.source, m.page ? `S. ${m.page}` : ''].filter(Boolean).join(', ');
      teile.push(`- *${m.name}* (${quelle}): ${m.description}`);
    }
    teile.push('');
  }
  if (h.zauber) {
    const z = h.zauber;
    const plaetze = Object.entries(z.plaetze ?? {}).map(([g, p]) => `${p.max}× Grad ${g}`).join(', ');
    teile.push(`**Zauber** – Zauberattribut ${ATTRIBUTE.find(([k]) => k === z.attribut)?.[1] ?? z.attribut}${plaetze ? `, Plätze: ${plaetze}` : ''}`, '');
    teile.push('| Zauber | Grad | Zeit | Reichweite | Dauer | Wozu |', '|---|---|---|---|---|---|');
    for (const s of z.liste ?? []) {
      teile.push(`| ${zelle(s.name)} | ${s.level === 0 ? 'Trick' : s.level} | ${zelle(s.time)} | ${zelle(s.range)} | ${zelle(s.duration)} | ${zelle(s.notes)} |`);
    }
    teile.push('');
  }
  if (h.ausruestung?.length) {
    const muenzen = Object.entries(h.muenzen ?? {}).map(([k, v]) => `${v} ${{ pp: 'PM', gp: 'GM', ep: 'EM', sp: 'SM', cp: 'KM' }[k] ?? k}`).join(', ');
    teile.push(`**Ausrüstung:** ${h.ausruestung.map((a) => (a.qty > 1 ? `${a.qty}× ${a.name}` : a.name)).join(', ')}${muenzen ? `; ${muenzen}` : ''}.`, '');
  }
  const w = h.wesen ?? {};
  const wesen = [
    ['Persönlichkeit', w.personality],
    ['Ideale', w.ideals],
    ['Bindungen', w.bonds],
    ['Makel', w.flaws],
  ].filter(([, t]) => t);
  if (wesen.length) {
    teile.push('**Wesen**', '');
    for (const [k, t] of wesen) teile.push(`- *${k}:* ${t}`);
    teile.push('');
  }
  if (w.backstory) teile.push('**Geschichte**', '', w.backstory, '');
  if (w.allies) teile.push(`*Verbündete:* ${w.allies}`, '');
  return teile.join('\n');
}

/** Das Kapitel. */
export const VORLAGEN = {
  datei: '88-vorlagen.md',
  async erzeugen(wurzel) {
    const { HELDEN } = await import(pathToFileURL(path.join(wurzel, 'backend', 'src', 'vorlagen', 'helden.js')).href);
    const uebersicht = [
      '| Name | Spezies | Klasse | Hintergrund | RK | TP |',
      '|---|---|---|---|---|---|',
      ...HELDEN.map((h) => `| ${h.name} | ${h.spezies} | ${h.klasse} | ${h.hintergrund} | ${h.ruestungsklasse} | ${h.trefferpunkte} |`),
    ].join('\n');
    return (
      kapitelKopf(
        'Die zwölf Vorlagen',
        `Jede neue Kampagne bringt zwölf fertige Charaktere der ersten Stufe mit – je einen für jede Klasse des Grundregelwerks, jeder mit einer anderen Spezies. Sie liegen hinter dem Schirm der Spielleitung und gehören zunächst niemandem; die Spielleitung weist sie unter „Spielleitung → Runde“ einem Konto zu, oder jemand kopiert sich eine als Ausgangspunkt für einen eigenen Charakter.

Alle Werte folgen den Regeln von 2024 (Spielerhandbuch, abgekürzt PHB-2024) und sind schon eingerechnet: Rüstungsklasse mit Kampfstil, Trefferpunkte mit Konstitution und Zwergenzähigkeit, Initiative mit dem Talent „Wachsam“. Weiten stehen in Fuß, wie im Blatt gespeichert; das Blatt zeigt sie auf Wunsch in Metern.

Fehlt eine Vorlage in einer Kampagne (etwa, weil sie gelöscht wurde), legt \`npm run vorlagen\` sie nach.`
      ) +
      `\n## Überblick\n\n${uebersicht}\n\n` +
      HELDEN.map(held).join('\n')
    );
  },
};
