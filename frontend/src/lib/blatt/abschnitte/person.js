/**
 * Abschnitte des ausgeführten Blattes über die Person hinter den Zahlen:
 * Erscheinung, Merkmale nach Herkunft und die Hintergrundgeschichte.
 */
import { MERKMAL_ARTEN, merkmalArtLabel } from '../../dnd5e.js';
import { AUSSEHEN_FELDER } from '../../regeln/blattfelder.js';
import { esc, escAbsatz, feld, marke, zelle } from '../werkzeug.js';

/** Ein beschrifteter Absatz, dessen Text markiert ist (siehe werkzeug.js, `marke`). */
const absatz = (label, pfad, wert, klasse) =>
  `<div class="${klasse}"><span class="label">${label}</span><p>${marke(pfad, wert, escAbsatz(wert))}</p></div>`;

/** Geschlecht, Alter, Statur … – und was sonst noch das Bild vollmacht. */
export function erscheinung(data) {
  const a = data.appearance ?? {};
  const werte = AUSSEHEN_FELDER.filter((f) => a[f.key])
    .map((f) => feld(f.label, a[f.key], `appearance.${f.key}`))
    .join('');
  const gesinnung = data.alignment ? feld('Gesinnung', data.alignment, 'alignment') : '';
  const fliess = [
    ['Erscheinungsbild', 'look'],
    ['Verbündete & Organisationen', 'allies'],
  ]
    .filter(([, key]) => data.traits?.[key])
    .map(([label, key]) => absatz(label, `traits.${key}`, data.traits[key], 'fliesstext'))
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
          `<div class="merkmal"><b>${zelle('features', m, 'name')}</b>${
            m.source || m.page
              ? ` <i>${[m.source && zelle('features', m, 'source'), m.page && zelle('features', m, 'page')].filter(Boolean).join(' ')}</i>`
              : ''
          }<p>${zelle('features', m, 'description', escAbsatz(m.description))}</p></div>`
      )
      .join('');
    return `<div class="merkmalgruppe"><span class="label">${esc(merkmalArtLabel(art))}</span>${eintraege}</div>`;
  }).join('');
}

/** Die Tafel „Hintergrund“: Persönlichkeit, Ideale, Bindungen, Makel, Übungen und die Geschichte. */
export function hintergrund(data) {
  const t = data.traits;
  const p = data.proficiencies;
  const stuecke = [
    ['Persönlichkeit', 'personality'],
    ['Ideale', 'ideals'],
    ['Bindungen', 'bonds'],
    ['Makel', 'flaws'],
  ]
    .filter(([, key]) => t[key])
    .map(([label, key]) => absatz(label, `traits.${key}`, t[key], 'feld'))
    .join('');

  const uebungen = [
    ['Rüstungen', 'armor'],
    ['Waffen', 'weapons'],
    ['Werkzeuge', 'tools'],
    ['Sprachen', 'languages'],
  ]
    .filter(([, key]) => p[key])
    .map(([label, key]) => feld(label, p[key], `proficiencies.${key}`))
    .join('');

  return `${stuecke ? `<div class="raster">${stuecke}</div>` : ''}
    ${uebungen ? `<div class="raster">${uebungen}</div>` : ''}
    ${t.backstory ? absatz('Chronik', 'traits.backstory', t.backstory, 'fliesstext') : ''}
    ${t.notes ? absatz('Lose Notizen', 'traits.notes', t.notes, 'fliesstext') : ''}`;
}
