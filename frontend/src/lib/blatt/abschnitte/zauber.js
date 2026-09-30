/**
 * Abschnitte des ausgeführten Blattes für Zauberwirkende: Zauberwerte,
 * Plätze und die Zauberliste – auf Wunsch mit dem vollen Text jedes
 * Zaubers aus dem Kompendium (zauberblock), damit die Datei auch ohne Netz
 * vollständig ist.
 */
import { ABILITIES, SPELL_LEVELS, formatModifier, zauberwerte } from '../../dnd5e.js';
import { esc, escAbsatz, feld, zeilen } from '../werkzeug.js';

/**
 * Der volle Text eines Zaubers aus dem Kompendium – Kopfzeile, Werte,
 * Beschreibung, höhere Grade. Leer, wenn es keinen Eintrag gibt.
 *
 * @param {object} spell   der Zauber vom Blatt
 * @param {object|null} detail  der Kompendiumseintrag
 */
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

/** Die Tafel „Zauberwirken“: Attribut, SG, Angriffsbonus, Plätze je Grad und die Zauberliste nach Grad. */
export function zauber(data) {
  const z = data.spellcasting;
  const { sg, bonus } = zauberwerte(data);

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
