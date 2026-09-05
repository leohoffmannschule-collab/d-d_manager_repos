import {
  ABILITIES,
  EXHAUSTION_STEPS,
  SKILLS,
  SPELL_LEVELS,
  abilityModifier,
  carryingCapacity,
  formatModifier,
  proficiencyBonus,
  spellAttackBonus,
  spellSaveDC,
  withDefaults,
} from './dnd5e.js';

/**
 * Das Blatt zum Mitnehmen.
 *
 * Erzeugt eine einzelne HTML-Datei, die alles enthält, was auf dem Blatt
 * steht – samt Bildnis und Figur als eingebettete Bilder. Sie braucht keinen
 * Server, kein Netz und keine App: doppelklicken genügt, auf jedem Rechner,
 * Tablet oder Telefon. Gedruckt sieht sie aus wie ein Charakterbogen.
 *
 * Am Ende der Datei steckt außerdem der vollständige Datensatz. Die Datei ist
 * damit zugleich eine Sicherung, aus der sich ein verlorenes Blatt
 * wiederherstellen lässt.
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
  return `<ul class="werteliste">${reihen}</ul>`;
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
      ${feld('Bewegung', `${k.speed} Fuß`)}
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
  if (k.senses?.darkvision) teile.push(feld('Dunkelsicht', `${k.senses.darkvision} Fuß`));
  if (k.senses?.notes) teile.push(feld('Weitere Sinne', k.senses.notes));
  return teile.length ? `<div class="raster">${teile.join('')}</div>` : '';
}

function ressourcen(data) {
  const liste = (data.resources ?? []).filter((r) => r.name);
  const eingestimmt = (data.attunement ?? []).filter(Boolean);
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
  if (eingestimmt.length) teile.push(feld('Eingestimmt auf', eingestimmt.join(', ')));
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
  const liste = [...nachGrad.keys()]
    .sort((a, b) => a - b)
    .map((grad) => {
      const namen = nachGrad
        .get(grad)
        .sort((a, b) => a.name.localeCompare(b.name, 'de'))
        .map((s) => `<span class="zauber${s.prepared ? ' vorbereitet' : ''}">${esc(s.name)}</span>`)
        .join('');
      return `<div class="zaubergrad"><span class="label">${
        grad === 0 ? 'Zaubertricks' : `Zauber vom ${grad}. Grad`
      }</span><div>${namen}</div></div>`;
    })
    .join('');

  if (!plaetze && !liste) return '';
  return `<div class="raster">
      ${feld('Zauberattribut', ABILITIES.find((a) => a.key === z.ability)?.label)}
      ${feld('Zauber-SG', sg)}
      ${feld('Angriffsbonus', formatModifier(bonus))}
    </div>
    ${plaetze ? `<div class="raster schmal">${plaetze}</div>` : ''}
    ${liste ? `<div class="zauberliste">${liste}<p class="hinweis">Hervorgehoben: vorbereitet</p></div>` : ''}`;
}

function inventar(data) {
  const gewicht = data.inventory.reduce(
    (summe, g) => summe + (Number(g.weight) || 0) * (Number(g.qty) || 1),
    0
  );
  const muenzen = MUENZEN.filter(([k]) => data.currency[k])
    .map(([k, label]) => `${data.currency[k]} ${label}`)
    .join(' · ');

  return `${muenzen ? feld('Münzen', muenzen) : ''}
    ${zeilen(
      ['Gegenstand', 'Anzahl', 'Gewicht', 'Anmerkungen'],
      data.inventory.map((g) => [esc(g.name), esc(g.qty), esc(g.weight), esc(g.notes)])
    )}
    ${
      data.inventory.length
        ? `<p class="hinweis">Getragen: ${gewicht} Pfund · Tragkraft ${carryingCapacity(data.abilities.str)} Pfund</p>`
        : ''
    }`;
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
  const wahrnehmung = data.skills.perception ?? { proficient: false, expertise: false };
  const passiv =
    10 +
    abilityModifier(data.abilities.wis) +
    (wahrnehmung.expertise ? 2 * pb : wahrnehmung.proficient ? pb : 0);

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
        <div class="feld"><span class="label">Passive Wahrnehmung</span><span class="wert gross">${passiv}</span></div>
        ${data.experience ? `<div class="feld"><span class="label">Erfahrung</span><span class="wert">${esc(data.experience)}</span></div>` : ''}
      </div>
    </header>

    ${tafel('Attribute', attribute(data))}
    ${tafel('Kampfwerte', kampf(data))}
    ${tafel('Zustand', zustand(data))}
    ${tafel('Rettungswürfe', rettungswuerfe(data, pb))}
    ${tafel('Fertigkeiten', fertigkeiten(data, pb))}
    ${tafel(
      'Angriffe',
      zeilen(
        ['Angriff', 'Bonus', 'Schaden', 'Anmerkungen'],
        data.attacks.map((a) => [esc(a.name), esc(a.bonus), esc(a.damage), esc(a.notes)])
      )
    )}
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
    ${tafel(
      'Merkmale & Züge',
      data.features
        .filter((m) => m.name || m.description)
        .map(
          (m) =>
            `<div class="merkmal"><b>${esc(m.name)}</b>${m.source ? ` <i>${esc(m.source)}</i>` : ''}<p>${escAbsatz(
              m.description
            )}</p></div>`
        )
        .join('')
    )}
    ${tafel('Hintergrund', hintergrund(data))}
    ${bilder.mini ? tafel('Figur', `<img class="figur" src="${bilder.mini}" alt="">`) : ''}
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

const STIL = `
  :root{--grund:#e6d7b0;--tafel:#f4ead2;--sanft:#f8f0dc;--tinte:#2b2114;--sepia:#6d5c45;--blass:#a3927a;
    --linie:#c2a878;--stark:#a3865c;--rubrik:#9a2b22;--gold:#b8912f;
    --schrift:"EB Garamond",Georgia,"Times New Roman",serif;--kapital:Cinzel,Georgia,serif;}
  *{box-sizing:border-box}
  body{margin:0;padding:24px 16px 60px;background:var(--grund);color:var(--tinte);font-family:var(--schrift);font-size:17px;line-height:1.5}
  .blatt{max-width:960px;margin:0 auto}
  h1{margin:0;font-family:var(--kapital);font-size:31px;font-weight:600;letter-spacing:.04em}
  h2{margin:0 0 10px;font-family:var(--kapital);font-size:14px;font-weight:600;letter-spacing:.14em;
    text-transform:uppercase;color:var(--rubrik);border-bottom:1px solid var(--linie);padding-bottom:5px}
  .kopf{display:flex;align-items:center;gap:18px;flex-wrap:wrap;background:var(--tafel);border:1px solid var(--linie);
    padding:18px;margin-bottom:16px}
  .kopf>div:first-of-type,.kopf>div:nth-of-type(1){flex:1 1 240px}
  .bildnis{width:88px;height:88px;border-radius:50%;object-fit:cover;border:2px solid var(--gold);background:var(--sanft)}
  .unterzeile{margin:4px 0 0;color:var(--sepia);font-style:italic}
  .unterzeile.klein{font-size:15px}
  .kopfwerte{display:flex;gap:14px;flex-wrap:wrap}
  .tafel{background:var(--tafel);border:1px solid var(--linie);padding:16px;margin-bottom:14px;break-inside:avoid}
  .label{display:block;font-family:var(--kapital);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--blass)}
  .wert{display:block;font-family:var(--kapital);font-size:17px}
  .wert.gross{font-size:23px;font-weight:700;color:var(--rubrik)}
  .raster{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px}
  .raster.schmal{grid-template-columns:repeat(auto-fit,minmax(120px,1fr))}
  .feld p{margin:2px 0 0}
  .feld.breit{grid-column:1/-1}
  .attribute{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
  .attribut{border:1px solid var(--stark);background:var(--sanft);padding:8px 4px;text-align:center}
  .attribut .zahl{display:block;font-family:var(--kapital);font-size:25px;font-weight:700}
  .attribut .mod{display:block;font-family:var(--kapital);color:var(--rubrik)}
  .werteliste{list-style:none;margin:0;padding:0}
  .werteliste.zweispaltig{columns:2;column-gap:26px}
  .werteliste li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dotted var(--linie);
    padding:2px 0;break-inside:avoid}
  .werteliste li.geuebt b{color:var(--rubrik)}
  .werteliste i{color:var(--blass);font-size:14px}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{font-family:var(--kapital);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--blass);
    text-align:left;padding:3px 6px 3px 0;border-bottom:1px solid var(--linie)}
  td{padding:4px 6px 4px 0;border-bottom:1px dotted var(--linie);vertical-align:top}
  .zauberliste{margin-top:10px}
  .zaubergrad{margin-bottom:8px}
  .zauber{display:inline-block;border:1px solid var(--linie);padding:1px 7px;margin:2px 4px 2px 0;font-size:15px}
  .zauber.vorbereitet{border-color:var(--gold);background:rgba(184,145,47,.18);font-weight:600}
  .merkmal{margin-bottom:10px;break-inside:avoid}
  .merkmal p{margin:2px 0 0;color:var(--sepia)}
  .fliesstext{margin-top:10px}
  .fliesstext p{margin:2px 0 0;white-space:normal}
  .figur{max-width:220px;display:block;margin:0 auto}
  .hinweis{margin:8px 0 0;color:var(--blass);font-size:15px;font-style:italic}
  .zauberblock{margin-bottom:14px;padding-bottom:10px;border-bottom:1px dotted var(--linie);break-inside:avoid}
  .zauberblock:last-child{border-bottom:0}
  .zauberblock b{font-family:var(--kapital);font-size:17px}
  .zauberblock .kopfzeile{color:var(--rubrik);font-size:15px}
  .zauberwerte{margin:2px 0 6px;color:var(--sepia);font-size:15px}
  .zauberwerte i{color:var(--blass);font-style:normal;font-family:var(--kapital);font-size:10px;
    letter-spacing:.12em;text-transform:uppercase}
  .zauberblock p{margin:4px 0 0}
  .zauberblock .hoeher{color:var(--sepia)}
  .leiste{max-width:960px;margin:0 auto 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;
    color:var(--sepia);font-size:15px;font-style:italic}
  .leiste button{font-family:var(--kapital);font-size:12px;letter-spacing:.12em;text-transform:uppercase;
    padding:9px 16px;color:#f0dca8;background:var(--rubrik);border:1px solid #7d2018;cursor:pointer}
  @media print{
    body{background:#fff;padding:0;font-size:11pt}
    .leiste{display:none}
    .tafel,.kopf{border-color:#999;background:#fff}
    .attribut{background:#fff}
  }
`;

/** Baut die vollständige, alleinstehende Datei. */
export async function blattAlsHtml(character) {
  const istDnd = character.system === 'dnd5e';
  const data = istDnd ? withDefaults(character.data) : character.data;

  const [portrait, mini] = await Promise.all([
    alsDatenUrl(data.portrait),
    alsDatenUrl(data.miniMediaId ? `/api/media/${data.miniMediaId}` : null),
  ]);

  const stand = new Date().toLocaleString('de-DE');
  const texte = istDnd ? await zaubertexte(data.spellcasting?.spells) : {};
  const koerper = istDnd
    ? dnd5eKoerper(character, data, { portrait, mini }, texte)
    : freiKoerper(character, data, { portrait, mini });

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
