/**
 * Der Satzspiegel: Welche Abschnitte stehen in welcher Reihenfolge auf dem
 * Bogen?
 *
 * Zwei Fassungen, je nach System des Blattes:
 *
 *   dnd5eKoerper – der vollständige Charakterbogen
 *   freiKoerper  – das freie Blatt für alles, was nicht D&D ist
 *
 * Die Reihenfolge folgt dem gedruckten Bogen: oben, was man im Kampf
 * braucht, unten, was man zwischen den Abenden liest.
 */
import { esc, escAbsatz, marke, tafel, zeilen, zelle } from './werkzeug.js';
import {
  aktionen,
  attribute,
  erscheinung,
  fertigkeiten,
  hintergrund,
  inventar,
  kampf,
  merkmale,
  ressourcen,
  rettungswuerfe,
  sinne,
  zauber,
  zauberblock,
  zustand,
} from './abschnitte.js';
import { formatModifier, passiverWert, proficiencyBonus } from '../dnd5e.js';

/**
 * Der ganze Bogen eines 5e-Blattes als HTML: Kopf, dann die Tafeln in der
 * Reihenfolge des gedruckten Charakterbogens.
 *
 * @param {object} character  das Blatt (Name, System …)
 * @param {object} data       seine Daten, schon mit Standardwerten aufgefüllt
 * @param {{portrait: string|null}} bilder  eingebettete Bilder als data:-URL
 * @param {Object<string, object>} texte    Kompendiumstexte je Zauber-Kennung
 */
export function dnd5eKoerper(character, data, bilder, texte) {
  const pb = proficiencyBonus(data.level);
  const erfahrung =
    data.experienceMode === 'meilenstein' ? esc('Meilensteine') : data.experience ? marke('experience', data.experience) : '';
  // Kopfzeilen aus einzelnen, markierten Teilen: So findet „Blatt einlesen“
  // eine geänderte Stufe wieder, auch wenn sie mitten im Satz steht.
  const herkunft = [
    data.race && marke('race', data.race),
    data.subrace && `(${marke('subrace', data.subrace)})`,
    data.className && marke('className', data.className),
    data.subclass && `– ${marke('subclass', data.subclass)}`,
    `Stufe ${marke('level', data.level)}`,
  ]
    .filter(Boolean)
    .join(' ');
  const umfeld = [
    data.background && marke('background', data.background),
    data.alignment && marke('alignment', data.alignment),
    data.playerName && `geführt von ${marke('playerName', data.playerName)}`,
  ]
    .filter(Boolean)
    .join(' · ');

  return `
    <header class="kopf">
      ${bilder.portrait ? `<img class="bildnis" src="${bilder.portrait}" alt="">` : ''}
      <div>
        <h1>${marke('name', character.name)}</h1>
        <p class="unterzeile">${herkunft}</p>
        <p class="unterzeile klein">${umfeld}</p>
      </div>
      <div class="kopfwerte">
        <div class="feld"><span class="label">Übungsbonus</span><span class="wert gross">${esc(formatModifier(pb))}</span></div>
        <div class="feld"><span class="label">Passive Wahrnehmung</span><span class="wert gross">${passiverWert(
          data,
          'perception'
        )}</span></div>
        ${erfahrung ? `<div class="feld"><span class="label">Erfahrung</span><span class="wert">${erfahrung}</span></div>` : ''}
      </div>
    </header>

    ${tafel('Attribute', attribute(data))}
    ${tafel('Kampfwerte', kampf(data))}
    ${tafel('Verteidigung & Zustand', zustand(data))}
    ${tafel('Rettungswürfe', rettungswuerfe(data, pb))}
    ${tafel('Sinne', sinne(data))}
    ${tafel('Fertigkeiten', fertigkeiten(data, pb))}
    ${tafel(
      'Angriffe',
      zeilen(
        ['Angriff', 'Bonus', 'Schaden', 'Anmerkungen'],
        data.attacks.map((a) => ['name', 'bonus', 'damage', 'notes'].map((key) => zelle('attacks', a, key)))
      )
    )}
    ${tafel('Aktionen', aktionen(data))}
    ${tafel('Ressourcen', ressourcen(data))}
    ${tafel('Zauber', zauber(data))}
    ${tafel(
      'Zauberbeschreibungen',
      (data.spellcasting?.spells ?? [])
        .slice()
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, 'de'))
        .map((s) => zauberblock(s, texte[s.id]))
        .join('')
    )}
    ${tafel('Beutel & Ausrüstung', inventar(data))}
    ${tafel('Merkmale & Eigenschaften', merkmale(data))}
    ${tafel('Aussehen & Person', erscheinung(data))}
    ${tafel('Hintergrund', hintergrund(data))}
  `;
}

/** Der Bogen eines freien Blattes: Kopf, Zusammenfassung und die selbst angelegten Abschnitte. */
export function freiKoerper(character, data, bilder) {
  return `
    <header class="kopf">
      ${bilder.portrait ? `<img class="bildnis" src="${bilder.portrait}" alt="">` : ''}
      <div>
        <h1>${marke('name', character.name)}</h1>
        <p class="unterzeile">${marke('summary', data.summary ?? '', escAbsatz(data.summary))}</p>
      </div>
    </header>
    ${(data.sections ?? [])
      .filter((a) => a.title || a.content)
      .map(
        (a) =>
          // Ein leerer Titel steht als „Ohne Titel“ da – unmarkiert, sonst
          // läse das Einlesen den Platzhalter als neuen Titel.
          `<section class="tafel"><h2>${a.title ? zelle('sections', a, 'title') : 'Ohne Titel'}</h2>` +
          `<p class="fliesstext">${zelle('sections', a, 'content', escAbsatz(a.content))}</p></section>`
      )
      .join('')}
  `;
}
