/**
 * Einen eingelesenen Datensatz so herrichten, dass das Blatt im Almanach
 * danach ganz normal funktioniert.
 *
 * Eine KI schreibt Werte gern in einer Form, die für sie gleichbedeutend
 * ist, für die Oberfläche aber nicht: „16“ statt 16, „ja“ statt true,
 * „Vergiftet“ als „vergiftet“, einen neuen Angriff ohne Kennung. Ohne
 * Kennung kann die Liste ihre Zeilen nicht auseinanderhalten (siehe
 * components/RepeatingRows.jsx), aus „16“ + 2 würde „162“. Deshalb wird
 * hier jeder Wert in die Form gebracht, die das leere Blatt vorgibt
 * (lib/regeln/leeresBlatt.js) – und alles, was dabei geändert oder
 * weggelassen wurde, als Hinweis gemeldet. Erraten wird nichts: Was sich
 * nicht eindeutig lesen lässt, fällt auf den Ausgangswert zurück, und der
 * Hinweis sagt es.
 */
import { newId } from '../id.js';
import { ABILITIES, CONDITIONS } from '../regeln/listen.js';
import { defaultCharacterData, withDefaults } from '../regeln/leeresBlatt.js';
import { MASSSYSTEME } from '../regeln/masse.js';
import { FELDER_5E, leererEintrag, verzeichnis } from '../blatt/glossar.js';
import { pfadHolen, pfadSetzen } from './pfad.js';

const istObjekt = (w) => w != null && typeof w === 'object' && !Array.isArray(w);

/** Eine Zahl aus einem Wert, wie ihn eine KI schreibt („+3“, „16“, 16) – oder null. */
function alsZahl(wert) {
  if (typeof wert === 'number') return Number.isFinite(wert) ? wert : null;
  if (typeof wert !== 'string') return null;
  const m = /^\s*([-+−]?\d+(?:[.,]\d+)?)/.exec(wert);
  return m ? Number(m[1].replace('−', '-').replace(',', '.')) : null;
}

/** Ein Wahrheitswert, wie ihn eine KI schreibt („ja“, „true“, 1, „x“). */
const alsJa = (wert) => wert === true || wert === 1 || /^(ja|true|wahr|yes|x|1|✓)$/i.test(String(wert ?? '').trim());

/** Ein Bildnis darf nur im Blatt selbst stecken oder vom eigenen Server kommen – nie von außen. */
const BILDNIS = /^(data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+|\/api\/[\w/.-]+)$/;

/**
 * Der Kern: einen Wert in die Form seiner Vorgabe bringen. Objekte werden
 * Feld für Feld durchgegangen; Listen behandelt `listen` eigens.
 */
function formen(wert, vorgabe, pfad, melde) {
  if (Array.isArray(vorgabe)) return Array.isArray(wert) ? wert : vorgabe;
  if (istObjekt(vorgabe)) {
    if (!istObjekt(wert)) {
      if (wert !== undefined) melde(`„${pfad}“ hatte die falsche Form und steht wieder auf dem Ausgangswert.`);
      return structuredCloneEinfach(vorgabe);
    }
    const aus = { ...wert };
    for (const [key, v] of Object.entries(vorgabe)) aus[key] = formen(wert[key], v, pfad ? `${pfad}.${key}` : key, melde);
    return aus;
  }
  if (typeof vorgabe === 'number') {
    const zahl = alsZahl(wert);
    if (zahl === null) {
      if (wert !== undefined && wert !== '' && wert !== null) melde(`„${pfad}“: „${wert}“ ist keine Zahl – bleibt bei ${vorgabe}.`);
      return vorgabe;
    }
    return zahl;
  }
  if (typeof vorgabe === 'boolean') return alsJa(wert);
  if (typeof vorgabe === 'string') {
    if (wert == null) return vorgabe;
    if (typeof wert === 'object') {
      melde(`„${pfad}“ war kein Text und steht wieder auf dem Ausgangswert.`);
      return vorgabe;
    }
    return String(wert);
  }
  // Vorgabe null bei Zauber-SG und Zauberangriffsbonus: eine Zahl von Hand oder
  // nichts (dann rechnet der Almanach). Anderes mit Vorgabe null (etwa `mini`)
  // bleibt, wie es ist.
  if (vorgabe === null && /manual(SaveDC|AttackBonus)$/.test(pfad)) {
    return wert === '' || wert == null ? null : (alsZahl(wert) ?? null);
  }
  return wert;
}

/** Tiefe Kopie einer Vorgabe – sie besteht nur aus JSON-Werten. */
const structuredCloneEinfach = (wert) => JSON.parse(JSON.stringify(wert));

/** Eine Zahl in ihre Grenzen aus dem Feldverzeichnis bringen (ganzzahlig, wo ganze Zahlen gemeint sind). */
function begrenzen(data) {
  for (const feld of FELDER_5E) {
    if (feld.art !== 'zahl') continue;
    const wert = pfadHolen(data, feld.pfad);
    if (typeof wert !== 'number') continue;
    let neu = Math.round(wert);
    if (feld.von !== undefined) neu = Math.max(feld.von, neu);
    if (feld.bis !== undefined) neu = Math.min(feld.bis, neu);
    if (neu !== wert) pfadSetzen(data, feld.pfad, neu);
  }
}

/** Ein Schlüssel aus einer Wahl – auch über seinen Namen („Bonusaktion“ → „bonus“). */
function wahl(wert, optionen, vorgabe) {
  const t = String(wert ?? '').trim().toLowerCase();
  const treffer = optionen.find(([k, label]) => k.toLowerCase() === t || label.toLowerCase() === t);
  return treffer ? treffer[0] : vorgabe;
}

/**
 * Jede Liste des Blattes: Einträge als Objekte, mit Kennung, jedes Feld in
 * seiner Form.
 *
 * Ein Eintrag ohne Kennung bekommt eine neue – es sei denn, das Blatt im
 * Almanach (`bekannt`) hat schon einen gleichnamigen, den die Datei sonst
 * nicht nennt. Dann ist es derselbe: Wer eine von einer KI bearbeitete Datei
 * zweimal einliest, bekommt den neuen Angriff nicht zweimal.
 */
function listen(data, system, melde, bekannt) {
  const gesehen = new Set();
  let neueKennungen = 0;
  for (const [pfad, liste] of Object.entries(verzeichnis(system).listen)) {
    const roh = pfadHolen(data, pfad);
    const eintraege = Array.isArray(roh) ? roh : [];
    const vorhanden = bekannt ? (pfadHolen(bekannt, pfad) ?? []).filter(istObjekt) : [];
    const genannt = new Set(eintraege.map((e) => e?.id));
    const name = (e) => String(e?.name ?? e?.title ?? '').trim().toLowerCase();
    const leer = leererEintrag(liste);
    const geformt = eintraege
      // Ein Eintrag, der nur ein Text ist („Seil, 15 m“), wird zu einem Eintrag mit diesem Namen.
      .map((e) => (typeof e === 'string' ? { [Object.keys(liste.felder)[0]]: e } : e))
      .filter(istObjekt)
      .map((e) => {
        const aus = { ...leer, ...e };
        for (const [key, feld] of Object.entries(liste.felder)) {
          if (feld.art === 'zahl' || feld.art === 'gewicht') aus[key] = alsZahl(e[key]) ?? leer[key];
          else if (feld.art === 'ja') aus[key] = e[key] === undefined ? leer[key] : alsJa(e[key]);
          else if (feld.art === 'wahl') aus[key] = wahl(e[key], feld.optionen, leer[key]);
          else aus[key] = e[key] == null ? '' : typeof e[key] === 'object' ? leer[key] : String(e[key]);
          if (feld.von !== undefined && typeof aus[key] === 'number') aus[key] = Math.max(feld.von, aus[key]);
          if (feld.bis !== undefined && typeof aus[key] === 'number') aus[key] = Math.min(feld.bis, aus[key]);
        }
        if (typeof aus.id !== 'string' || !aus.id.trim() || gesehen.has(aus.id)) {
          const derselbe = vorhanden.find((v) => v.id && !genannt.has(v.id) && !gesehen.has(v.id) && name(v) && name(v) === name(aus));
          aus.id = derselbe ? derselbe.id : newId();
          if (!derselbe) neueKennungen += 1;
        }
        gesehen.add(aus.id);
        return aus;
      });
    if (pfadHolen(data, pfad) !== undefined || geformt.length) pfadSetzen(data, pfad, geformt);
  }
  if (neueKennungen === 1) melde('Ein neuer Listeneintrag hat eine Kennung bekommen.');
  else if (neueKennungen) melde(`${neueKennungen} neue Listeneinträge haben Kennungen bekommen.`);
}

/** Das Bildnis prüfen: eingebettet oder vom eigenen Server, sonst weg. */
function bildnis(data, melde) {
  if (!data.portrait) return;
  if (typeof data.portrait === 'string' && BILDNIS.test(data.portrait)) return;
  data.portrait = '';
  melde('Das Bildnis verwies nach außen (oder war kein Bild) und wurde weggelassen.');
}

/** Ein 5e-Blatt herrichten. */
function dnd5e(roh, melde, bekannt) {
  const vorgabe = defaultCharacterData();
  // Erst die Form der großen Teile, damit withDefaults nicht über einem Text
  // statt eines Objekts stolpert – dann fehlende Felder auffüllen, dann jedes
  // Feld in seine Form.
  const vorab = {};
  for (const [key, wert] of Object.entries(roh)) {
    const v = vorgabe[key];
    const falsch = (istObjekt(v) && !istObjekt(wert)) || (Array.isArray(v) && !Array.isArray(wert));
    if (falsch && wert != null) melde(`„${key}“ hatte die falsche Form und steht wieder auf dem Ausgangswert.`);
    if (!falsch) vorab[key] = wert;
  }
  // Fertigkeiten als bloßes Häkchen („acrobatics“: true) heißen: geübt.
  if (istObjekt(vorab.skills)) {
    vorab.skills = Object.fromEntries(
      Object.entries(vorab.skills).map(([k, w]) => [k, istObjekt(w) ? w : { proficient: alsJa(w), expertise: false }])
    );
  }
  const data = formen(withDefaults(vorab), withDefaults(vorgabe), '', melde);
  begrenzen(data);
  listen(data, 'dnd5e', melde, bekannt);

  data.units = wahl(data.units, [...MASSSYSTEME, ['metrisch', 'metric'], ['imperial', 'imperial']], 'metrisch');
  data.experienceMode = wahl(data.experienceMode, [['punkte', 'Punkte'], ['meilenstein', 'Meilensteine']], 'punkte');
  data.spellcasting.ability = wahl(data.spellcasting.ability, ABILITIES.map((a) => [a.key, a.label]), 'int');
  for (const grad of Object.keys(data.spellcasting.slots)) {
    const platz = data.spellcasting.slots[grad];
    platz.max = Math.max(0, Math.round(platz.max));
    platz.used = Math.min(platz.max, Math.max(0, Math.round(platz.used)));
  }
  for (const art of ['successes', 'failures']) {
    data.combat.deathSaves[art] = Math.min(3, Math.max(0, Math.round(data.combat.deathSaves[art])));
  }

  // Zustände: nur die Namen aus dem Regelwerk – sonst ließe sich ein
  // unbekannter auf dem Blatt weder sehen noch abwählen.
  const unbekannt = [];
  const zustaende = (Array.isArray(data.combat.conditions) ? data.combat.conditions : [])
    .map((z) => {
      const name = CONDITIONS.find((c) => c.toLowerCase() === String(z).trim().toLowerCase());
      if (!name) unbekannt.push(String(z));
      return name;
    })
    .filter(Boolean);
  data.combat.conditions = [...new Set(zustaende)];
  if (unbekannt.length) melde(`Unbekannte Zustände weggelassen: ${unbekannt.join(', ')}.`);

  const angelegt = (Array.isArray(data.attunement) ? data.attunement : []).map((x) => (x == null ? '' : String(x)));
  if (angelegt.filter(Boolean).length > 3) melde('Mehr als drei angelegte magische Gegenstände – die ersten drei bleiben.');
  data.attunement = [...angelegt.filter(Boolean).slice(0, 3), '', '', ''].slice(0, 3);
  bildnis(data, melde);
  return data;
}

/** Ein freies Blatt herrichten. */
function frei(roh, melde, bekannt) {
  const data = { ...roh, portrait: roh.portrait ?? '', summary: roh.summary == null ? '' : String(roh.summary) };
  if (!Array.isArray(roh.sections)) data.sections = [];
  listen(data, 'freeform', melde, bekannt);
  bildnis(data, melde);
  return data;
}

/**
 * Einen eingelesenen Datensatz herrichten.
 *
 * @param {'dnd5e'|'freeform'} system
 * @param {object} roh  der Datensatz, wie er in der Datei stand (wird nicht verändert)
 * @param {object} [bekannt]  die Daten des Blattes im Almanach, das die Datei
 *   aktualisieren soll – für Listeneinträge ohne Kennung (siehe `listen`)
 * @returns {{ data: object, hinweise: string[] }}
 */
export function angleichen(system, roh, bekannt) {
  const hinweise = [];
  const melde = (text) => hinweise.push(text);
  const kopie = structuredCloneEinfach(istObjekt(roh) ? roh : {});
  const data = system === 'freeform' ? frei(kopie, melde, bekannt) : dnd5e(kopie, melde, bekannt);
  return { data, hinweise };
}
