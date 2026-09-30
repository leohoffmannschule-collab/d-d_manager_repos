/**
 * Abschnitte des ausgeführten Blattes über die Person hinter den Zahlen:
 * Erscheinung, Merkmale nach Herkunft und die Hintergrundgeschichte.
 */
import { MERKMAL_ARTEN, merkmalArtLabel } from '../../dnd5e.js';
import { AUSSEHEN_FELDER } from '../../regeln/blattfelder.js';
import { esc, escAbsatz, feld } from '../werkzeug.js';

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

/** Die Tafel „Hintergrund“: Persönlichkeit, Ideale, Bindungen, Makel, Übungen und die Geschichte. */
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
