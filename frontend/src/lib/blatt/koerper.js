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
import { esc, escAbsatz, tafel, zeilen } from './werkzeug.js';
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

export function dnd5eKoerper(character, data, bilder, texte) {
  const pb = proficiencyBonus(data.level);
  const erfahrung =
    data.experienceMode === 'meilenstein' ? 'Meilensteine' : data.experience ? String(data.experience) : '';

  return `
    <header class="kopf">
      ${bilder.portrait ? `<img class="bildnis" src="${bilder.portrait}" alt="">` : ''}
      <div>
        <h1>${esc(character.name)}</h1>
        <p class="unterzeile">${esc(
          [data.race, data.subrace && `(${data.subrace})`, data.className, data.subclass && `– ${data.subclass}`,
            `Stufe ${data.level}`]
            .filter(Boolean)
            .join(' ')
        )}</p>
        <p class="unterzeile klein">${esc(
          [data.background, data.alignment, data.playerName && `geführt von ${data.playerName}`]
            .filter(Boolean)
            .join(' · ')
        )}</p>
      </div>
      <div class="kopfwerte">
        <div class="feld"><span class="label">Übungsbonus</span><span class="wert gross">${esc(formatModifier(pb))}</span></div>
        <div class="feld"><span class="label">Passive Wahrnehmung</span><span class="wert gross">${passiverWert(
          data,
          'perception'
        )}</span></div>
        ${erfahrung ? `<div class="feld"><span class="label">Erfahrung</span><span class="wert">${esc(erfahrung)}</span></div>` : ''}
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
        data.attacks.map((a) => [esc(a.name), esc(a.bonus), esc(a.damage), esc(a.notes)])
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

export function freiKoerper(character, data, bilder) {
  return `
    <header class="kopf">
      ${bilder.portrait ? `<img class="bildnis" src="${bilder.portrait}" alt="">` : ''}
      <div>
        <h1>${esc(character.name)}</h1>
        <p class="unterzeile">${escAbsatz(data.summary)}</p>
      </div>
    </header>
    ${(data.sections ?? [])
      .filter((a) => a.title || a.content)
      .map((a) => tafel(a.title || 'Ohne Titel', `<p class="fliesstext">${escAbsatz(a.content)}</p>`))
      .join('')}
  `;
}

/** Baut die vollständige, alleinstehende Datei. */
/**
 * Das fertige HTML-Dokument als Zeichenkette.
 *
 * `async`, weil Bildnisse als `data:`-URL geladen und eingebettet werden –
 * ein Verweis auf den Server würde außerhalb des Almanachs ins Leere zeigen.
 */
