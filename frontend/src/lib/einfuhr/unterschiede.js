/**
 * Was sich zwischen zwei Ständen eines Blattes unterscheidet – in Worten.
 *
 * Bevor eine eingelesene Datei ein vorhandenes Blatt ersetzt, zeigt die
 * Vorschau (components/einlesen/Vorschau.jsx), was sich dadurch ändert:
 * „Stufe: 3 → 4“, „Neu: Angriff „Kurzbogen““, „Entfernt: Zauber
 * „Magisches Geschoss““. Wer einer KI eine Aufgabe gegeben hat, sieht so,
 * ob sie getan hat, was sie sollte – und nichts darüber hinaus.
 */
import { ABILITIES, SKILLS } from '../regeln/listen.js';
import { anzeige, feldZu, verzeichnis } from '../blatt/glossar.js';

const istObjekt = (w) => w != null && typeof w === 'object' && !Array.isArray(w);

/** Für die Anzeige gekürzt, Zeilenumbrüche als Leerzeichen. */
const kurz = (wert) => {
  if (typeof wert === 'boolean') return wert ? 'ja' : 'nein';
  const t = Array.isArray(wert) ? wert.filter(Boolean).join(', ') : String(wert ?? '');
  const einzeilig = t.replace(/\s+/g, ' ').trim();
  return einzeilig.length > 60 ? `${einzeilig.slice(0, 59)}…` : einzeilig || '–';
};

/**
 * Ein Blatt als flache Liste „Pfad → Wert“. Listeneinträge mit Kennung
 * erscheinen unter `liste.#id.feld`, einfache Listen (Zustände) als ein
 * Wert. Das Bildnis zählt nur als „anders oder nicht“.
 */
function flach(wert, pfad, aus, listenPfade) {
  if (pfad === 'portrait') {
    aus.set(pfad, wert ? `Bild (${String(wert).length} Zeichen)` : '');
    return aus;
  }
  if (Array.isArray(wert)) {
    if (listenPfade.has(pfad)) {
      for (const e of wert) if (istObjekt(e) && e.id) flach({ ...e, id: undefined }, `${pfad}.#${e.id}`, aus, listenPfade);
    } else aus.set(pfad, wert);
    return aus;
  }
  if (istObjekt(wert)) {
    for (const [key, w] of Object.entries(wert)) if (w !== undefined) flach(w, pfad ? `${pfad}.${key}` : key, aus, listenPfade);
    return aus;
  }
  aus.set(pfad, wert);
  return aus;
}

/** Namen für Felder, die nicht einzeln im Verzeichnis stehen: Häkchen, Zustände, Einstellungen. */
function nebenLabel(pfad) {
  const name = (liste, key) => liste.find((x) => x.key === key)?.label ?? key;
  let m;
  if ((m = /^skills\.(\w+)\.(proficient|expertise)$/.exec(pfad))) {
    return `${name(SKILLS, m[1])}: ${m[2] === 'proficient' ? 'geübt' : 'Expertise'}`;
  }
  if ((m = /^savingThrows\.(\w+)$/.exec(pfad))) return `Rettungswurf ${name(ABILITIES, m[1])}: geübt`;
  if ((m = /^spellcasting\.slots\.(\d)\.used$/.exec(pfad))) return `Verbrauchte Zauberplätze ${m[1]}. Grad`;
  return {
    'combat.conditions': 'Zustände',
    'combat.deathSaves.successes': 'Erfolge gegen den Tod',
    'combat.deathSaves.failures': 'Fehlschläge gegen den Tod',
    'combat.concentration.active': 'Konzentration',
    inspiration: 'Inspiration',
    units: 'Maßsystem',
    experienceMode: 'Erfahrung zählt nach',
    'spellcasting.ability': 'Zauberattribut',
    'spellcasting.manualSaveDC': 'Zauber-SG von Hand',
    'spellcasting.manualAttackBonus': 'Zauberangriffsbonus von Hand',
  }[pfad];
}

/** Gibt es in dieser Liste einen Eintrag mit dieser Kennung? */
const hatEintrag = (data, listenPfad, id) =>
  (listenPfad.split('.').reduce((o, k) => o?.[k], data) ?? []).some((e) => e?.id === id);

/** Der Name eines Listeneintrags für die Anzeige. */
function eintragsName(data, listenPfad, id) {
  const liste = listenPfad.split('.').reduce((o, k) => o?.[k], data);
  const e = Array.isArray(liste) ? liste.find((x) => x?.id === id) : null;
  return e?.name || e?.title || 'ohne Namen';
}

/**
 * Die Unterschiede zwischen dem Blatt im Almanach und dem eingelesenen.
 *
 * @param {'dnd5e'|'freeform'} system
 * @param {{ name: string, data: object }} vorher  das Blatt im Almanach
 * @param {{ name: string, data: object }} nachher das eingelesene
 * @returns {string[]} je Unterschied ein Satz, in der Reihenfolge des Blattes
 */
export function unterschiede(system, vorher, nachher) {
  const { listen } = verzeichnis(system);
  const listenPfade = new Set(Object.keys(listen));
  const alt = flach(vorher.data, '', new Map(), listenPfade);
  const neu = flach(nachher.data, '', new Map(), listenPfade);
  const saetze = [];
  if (vorher.name !== nachher.name) saetze.push(`Name: ${kurz(vorher.name)} → ${kurz(nachher.name)}`);

  // Ganze Listeneinträge, die dazukamen oder wegfielen.
  for (const [listenPfad, liste] of Object.entries(listen)) {
    const ids = (data) => new Set((listenPfad.split('.').reduce((o, k) => o?.[k], data) ?? []).map((e) => e?.id));
    const vorherIds = ids(vorher.data);
    const nachherIds = ids(nachher.data);
    for (const id of nachherIds) if (!vorherIds.has(id)) saetze.push(`Neu: ${liste.einzahl} „${eintragsName(nachher.data, listenPfad, id)}“`);
    for (const id of vorherIds) if (!nachherIds.has(id)) saetze.push(`Entfernt: ${liste.einzahl} „${eintragsName(vorher.data, listenPfad, id)}“`);
  }

  // Einzelne Werte – in Einträgen, die es vorher und nachher gibt, und im Blatt selbst.
  for (const pfad of new Set([...alt.keys(), ...neu.keys()])) {
    const a = alt.get(pfad);
    const n = neu.get(pfad);
    if (JSON.stringify(a ?? '') === JSON.stringify(n ?? '')) continue;
    const zu = feldZu(system, pfad);
    // Weiten und Gewichte so, wie das Blatt sie zeigt – in Metern, wenn es metrisch ist.
    const umrechnen = zu && (zu.feld.art === 'weite' || zu.feld.art === 'gewicht');
    const wie = (wert, data) => kurz(umrechnen ? anzeige(zu.feld.art, wert, data.units) : wert);
    if (zu?.liste) {
      // Ein ganzer Eintrag, der dazukam oder wegfiel, ist oben schon gemeldet.
      if (!hatEintrag(vorher.data, zu.listenPfad, zu.id) || !hatEintrag(nachher.data, zu.listenPfad, zu.id)) continue;
      saetze.push(
        `${zu.liste.einzahl} „${eintragsName(nachher.data, zu.listenPfad, zu.id)}“, ${zu.feld.label}: ${wie(a, vorher.data)} → ${wie(n, nachher.data)}`
      );
    } else if (/\.#[^.]+\./.test(pfad)) {
      continue; // ein Feld eines neuen oder entfernten Eintrags ohne Platz im Verzeichnis
    } else if (pfad === 'portrait') saetze.push('Das Bildnis ist ein anderes.');
    else saetze.push(`${zu?.feld.label ?? nebenLabel(pfad) ?? pfad}: ${wie(a, vorher.data)} → ${wie(n, nachher.data)}`);
  }
  return saetze;
}
