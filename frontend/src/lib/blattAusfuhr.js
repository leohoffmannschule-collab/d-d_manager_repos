import {
  ABILITIES,
  AUSSEHEN_FELDER,
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
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
  traglastStufen,
  weiteMitEinheit,
  withDefaults,
} from './dnd5e.js';
// Das Stilblatt liegt als echte .css-Datei daneben und wird beim Bauen als
// Text hereingeholt (`?raw` ist Vites Weg dafür). So hat es im Editor alles,
// was CSS haben soll – Hervorhebung, Prüfung, Formatierung –, landet aber
// trotzdem eingebettet in der fertigen Datei, die ja ohne Netz und ohne
// Almanach funktionieren muss.
import ROHSTIL from './blattAusfuhr.css?raw';

// Der Erklärkopf des Stilblattes richtet sich an Mitarbeitende am Code und
// hat im Blatt der Spielerin nichts verloren – also weg damit.
const STIL = ROHSTIL.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, '');

/**
 * Das Blatt zum Mitnehmen.
 *
 * Erzeugt eine einzelne HTML-Datei, die alles enthält, was auf dem Blatt
 * steht – samt Bildnis als eingebettetem Bild. Sie braucht keinen
 * Server, kein Netz und keine App: doppelklicken genügt, auf jedem Rechner,
 * Tablet oder Telefon. Gedruckt sieht sie aus wie ein Charakterbogen.
 *
 * Am Ende der Datei steckt außerdem der vollständige Datensatz. Die Datei ist
 * damit zugleich eine Sicherung, aus der sich ein verlorenes Blatt
 * wiederherstellen lässt.
 *
 * Wie es gebaut ist: Ein Haufen kleiner Funktionen gibt je einen Abschnitt
 * als HTML-Zeichenkette zurück (`attribute`, `fertigkeiten`, `zauber`, …),
 * und `dnd5eKoerper` fügt sie zusammen. Das ist bewusst schlichtes
 * Zeichenketten-Basteln statt React: Die Datei muss ja *ohne* React laufen,
 * allein im Browser dessen, der sie doppelklickt.
 *
 * Die eine Regel, die man dabei nie vergessen darf, steht gleich darunter:
 * alles, was aus dem Blatt kommt, muss durch `esc`.
 */

/**
 * Sonderzeichen entschärfen, bevor sie in das HTML wandern.
 *
 * Ohne das würde aus einem Charakternamen wie `<b>Grim` eine Formatierung,
 * und aus etwas Bösartigerem ausführbarer Code. Faustregel für diese Datei:
 * **jeder** Wert aus dem Blatt geht durch `esc`, ausnahmslos.
 */
const ZEICHEN = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, (z) => ZEICHEN[z]);

/** Zeilenumbrüche aus Textfeldern erhalten. */
const escAbsatz = (wert) => esc(wert).replace(/\n/g, '<br>');

const KURZ = { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' };
const MUENZEN = [
  ['pp', 'Platin'],
  ['gp', 'Gold'],
  ['ep', 'Elektrum'],
  ['sp', 'Silber'],
  ['cp', 'Kupfer'],
];

/**
 * Bilder müssen mit in die Datei – ein Verweis auf den Server nützt nichts,
 * wenn der Server gerade aus ist.
 */
async function alsDatenUrl(quelle) {
  if (!quelle) return null;
  if (String(quelle).startsWith('data:')) return quelle;
  try {
    const antwort = await fetch(quelle, { credentials: 'same-origin' });
    if (!antwort.ok) return null;
    const blob = await antwort.blob();
    return await new Promise((fertig) => {
      const leser = new FileReader();
      leser.onload = () => fertig(leser.result);
      leser.onerror = () => fertig(null);
      leser.readAsDataURL(blob);
    });
  } catch {
    // Ohne Netz gibt es eben kein Bild; der Rest des Blattes steht trotzdem.
    return null;
  }
}

/**
 * Die Zaubertexte aus dem Kompendium holen. Genau dafür nimmt man das Blatt
 * ja mit: Wer den ganzen Abend nachschlagen muss, hat vom Ausdruck nichts.
 * Schlägt der Abruf fehl, bleibt es beim Namen.
 */
async function zaubertexte(spells) {
  const mitEintrag = (spells ?? []).filter((s) => s.index);
  const paare = await Promise.all(
    mitEintrag.map(async (s) => {
      try {
        const antwort = await fetch(`/api/compendium/spells/${s.index}`, { credentials: 'same-origin' });
        return [s.id, antwort.ok ? await antwort.json() : null];
      } catch {
        return [s.id, null];
      }
    })
  );
  return Object.fromEntries(paare);
}

function zauberblock(spell, detail) {
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

const tafel = (titel, inhalt) =>
  inhalt ? `<section class="tafel"><h2>${esc(titel)}</h2>${inhalt}</section>` : '';

const feld = (label, wert) =>
  `<div class="feld"><span class="label">${esc(label)}</span><span class="wert">${esc(wert || '–')}</span></div>`;

const zeilen = (kopf, reihen) =>
  reihen.length === 0
    ? ''
    : `<table><thead><tr>${kopf.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead>` +
      `<tbody>${reihen.map((r) => `<tr>${r.map((z) => `<td>${z}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

/* --- Die einzelnen Abschnitte ------------------------------------------- */

function attribute(data) {
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

function rettungswuerfe(data, pb) {
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
function sinne(data) {
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
function aktionen(data) {
  const liste = (data.actions ?? []).filter((a) => a.name || a.description);
  if (liste.length === 0) return '';
  return zeilen(
    ['Was', 'Kostet', 'Wirkung'],
    liste.map((a) => [esc(a.name), esc(aktionArtLabel(a.art)), escAbsatz(a.description)])
  );
}

function fertigkeiten(data, pb) {
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

function kampf(data) {
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

function zustand(data) {
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

function ressourcen(data) {
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

function zauber(data) {
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

function inventar(data) {
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
function erscheinung(data) {
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
function merkmale(data) {
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

function hintergrund(data) {
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

function dnd5eKoerper(character, data, bilder, texte) {
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

function freiKoerper(character, data, bilder) {
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
export async function blattAlsHtml(character) {
  const istDnd = character.system === 'dnd5e';
  const data = istDnd ? withDefaults(character.data) : character.data;

  const portrait = await alsDatenUrl(data.portrait);

  const stand = new Date().toLocaleString('de-DE');
  const texte = istDnd ? await zaubertexte(data.spellcasting?.spells) : {};
  const koerper = istDnd
    ? dnd5eKoerper(character, data, { portrait }, texte)
    : freiKoerper(character, data, { portrait });

  // Der Datensatz reist mit, damit die Datei zugleich eine Sicherung ist.
  // `<` wird maskiert, sonst könnte ein Text im Blatt das Skript beenden.
  const daten = JSON.stringify(
    { name: character.name, system: character.system, data, stand: new Date().toISOString() },
    null,
    2
  ).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(character.name)} – Abenteuer-Almanach</title>
<style>${STIL}</style>
</head>
<body>
<div class="leiste">
  <button onclick="window.print()">Drucken</button>
  <span>Stand: ${esc(stand)} · Diese Datei braucht weder Netz noch Server.</span>
</div>
<div class="blatt">
${koerper}
<p class="hinweis" style="text-align:center;margin-top:24px">
  Abgeschrieben aus dem Abenteuer-Almanach. Änderungen in dieser Datei wandern nicht zurück –
  am Spieltisch gilt das Blatt im Almanach.
</p>
</div>
<script type="application/json" id="almanach-daten">${daten}</script>
</body>
</html>`;
}

/** Datei erzeugen und dem Browser zum Sichern geben. */
/**
 * Dasselbe, aber als Download.
 *
 * Der Umweg über einen unsichtbaren `<a download>` und eine Blob-URL ist der
 * übliche Weg, im Browser eine Datei zu erzeugen, die es nie auf einem
 * Server gab. Das `revokeObjectURL` danach gibt den Speicher wieder frei.
 */
export async function ladeBlattHerunter(character) {
  const html = await blattAlsHtml(character);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const datum = new Date().toISOString().slice(0, 10);
  // Umlaute werden umschrieben: Ein Dateiname mit „ä“ überlebt weder jeden
  // Browser noch jeden USB-Stick, und „Kapitaen Sturmhand“ liest sich immer
  // noch wie der Gemeinte.
  const UMSCHRIFT = { ä: 'ae', ö: 'oe', ü: 'ue', Ä: 'Ae', Ö: 'Oe', Ü: 'Ue', ß: 'ss' };
  const name =
    character.name
      .replace(/[äöüÄÖÜß]/g, (z) => UMSCHRIFT[z])
      .replace(/[^\w -]/g, '')
      .trim() || 'Charakterblatt';

  const anker = document.createElement('a');
  anker.href = url;
  anker.download = `${name}-${datum}.html`;
  anker.rel = 'noopener';
  document.body.appendChild(anker);
  anker.click();
  anker.remove();

  // Nicht sofort freigeben: Der Browser liest den Inhalt erst nach dem Klick,
  // und auf einem iPad kann das einen Moment dauern. Wird die Adresse zu früh
  // eingezogen, bricht die Sicherung mittendrin ab.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
