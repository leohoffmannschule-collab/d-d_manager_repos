/**
 * Das mitgenommene Blatt wieder hereinholen – auch nachdem eine KI es
 * bearbeitet hat.
 *
 * Die Datei, die „Mitnehmen“ erzeugt (blattAusfuhr.js), trägt am Ende den
 * vollständigen Datensatz des Blattes als JSON, oben eine Anleitung für
 * KI-Assistenten und an jedem sichtbaren Wert den Pfad, unter dem er im
 * Datensatz steht. Das Einlesen geht in fünf Schritten:
 *
 *   1. aufbereiten    – aus einer Chat-Antwort den Codeblock holen,
 *                       Zeilenenden vereinheitlichen (einfuhr/datei.js)
 *   2. Datensatz      – finden und lesen, notfalls repariert: Kommentare,
 *                       überzählige Kommas, Zeilenumbrüche in Texten
 *                       (einfuhr/json.js)
 *   3. Sichtbares     – Werte, die nur auf der Seite geändert wurden, in
 *                       den Datensatz übernehmen (einfuhr/sichtbar.js)
 *   4. angleichen     – jeden Wert in die Form bringen, die das Blatt
 *                       erwartet; neue Listeneinträge bekommen Kennungen
 *                       (einfuhr/angleichen.js)
 *   5. prüfen         – Name und Regelwerk
 *
 * Fehlt der Datensatz ganz (eine KI hat ihn weggelassen), wird das Blatt
 * aus den sichtbaren, markierten Werten gebaut – mit einem Hinweis, dass
 * Häkchen und leere Felder dann auf dem Ausgangswert stehen.
 *
 * Angenommen werden auch Dateien aus älteren Fassungen (Datensatz
 * entschärft im `<template>` oder roh im `<script>`) und der nackte
 * JSON-Text. Alles läuft ohne Browser-Schnittstellen – die Blattprobe
 * prüft es in Node (scripts/blattprobe.mjs).
 */
import { aufbereiten, datensatzFinden, entitaeten } from './einfuhr/datei.js';
import { jsonLesen } from './einfuhr/json.js';
import { glatt, markenLesen, sichtbaresUebernehmen } from './einfuhr/sichtbar.js';
import { angleichen } from './einfuhr/angleichen.js';
import { feldZu } from './blatt/glossar.js';
import { defaultCharacterData, defaultFreeformData } from './regeln/leeresBlatt.js';

/** Die beiden Systeme, die der Almanach kennt. */
const SYSTEME = new Set(['dnd5e', 'freeform']);

/** Ein Datensatz muss ein schlichtes Objekt sein – kein Text, keine Liste. */
const istObjekt = (wert) => wert != null && typeof wert === 'object' && !Array.isArray(wert);

/** Eine Kennung, wie der Almanach sie vergibt – sonst keine. */
const kennung = (wert) => (typeof wert === 'string' && /^[\w-]{6,80}$/.test(wert) ? wert : null);

/** Sieht ein Objekt aus wie die Daten eines Blattes (ohne die Hülle mit Name und Regelwerk)? */
const sindBlattdaten = (wert) => istObjekt(wert) && ['abilities', 'combat', 'sections', 'summary', 'level'].some((k) => k in wert);

/** Das Regelwerk, das die markierten Werte einer Datei verraten. */
const systemAusMarken = (marken) =>
  marken.some((m) => /^(abilities|combat|attacks|spellcasting)\b/.test(m.pfad))
    ? 'dnd5e'
    : marken.some((m) => /^(summary|sections)\b/.test(m.pfad))
      ? 'freeform'
      : null;

/** Der Name aus der Überschrift oder dem Titel der Seite – für Dateien ohne Datensatz. */
function nameAusSeite(text) {
  const titel = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(text) ?? /<title>([\s\S]*?)<\/title>/i.exec(text);
  return titel ? glatt(entitaeten(titel[1].replace(/<[^>]*>/g, ''))).replace(/\s+–\s+Abenteuer-Almanach$/, '') : '';
}

/**
 * Eine Blattdatei lesen.
 *
 * @param {string} text  der Inhalt der Datei (HTML, Chat-Antwort oder JSON)
 * @param {object} [wie]
 * @param {string} [wie.ersatzName]  der Name, falls die Datei keinen nennt
 *   (beim Einlesen in ein vorhandenes Blatt: dessen Name)
 * @param {object} [wie.bekannt]  die Daten des Blattes, das aktualisiert
 *   werden soll – neue Listeneinträge ohne Kennung, die es dort unter
 *   demselben Namen schon gibt, behalten dessen Kennung
 * @returns {{
 *   name: string, system: 'dnd5e'|'freeform', data: object,
 *   id: string|null, stand: string|null,
 *   hinweise: string[], sichtbar: string[]
 * }}  `hinweise`: was repariert oder angeglichen wurde; `sichtbar`: welche
 *   Werte nur auf der sichtbaren Seite geändert waren und übernommen wurden
 * @throws {Error} mit einem Satz für Menschen, wenn sich kein Blatt herauslesen lässt
 */
export function leseBlattdatei(text, { ersatzName = '', bekannt } = {}) {
  const inhalt = aufbereiten(text);
  const hinweise = [];
  const { roh, ab, abgeschnitten } = datensatzFinden(inhalt);
  const marken = markenLesen(inhalt);

  let datensatz = null;
  if (roh !== null) {
    let gelesen;
    try {
      gelesen = jsonLesen(roh, { datei: inhalt, ab });
    } catch (fehler) {
      if (!abgeschnitten) throw fehler;
      throw new Error(
        'Der Datensatz am Ende der Datei bricht mittendrin ab – die Datei wurde gekürzt. Bitte die KI um die vollständige Datei.'
      );
    }
    const { wert, repariert } = gelesen;
    if (repariert) hinweise.push('Der Datensatz war nicht ganz sauberes JSON (Kommentare, Kommas oder Zeilenumbrüche) und wurde repariert.');
    datensatz = wert;
    // Eine KI gibt manchmal nur die Daten zurück, ohne Hülle.
    if (sindBlattdaten(datensatz) && !istObjekt(datensatz.data)) {
      datensatz = { name: '', system: 'summary' in datensatz || 'sections' in datensatz ? 'freeform' : 'dnd5e', data: datensatz };
    }
    if (!istObjekt(datensatz) || !istObjekt(datensatz.data)) {
      throw new Error('Diese Datei ist kein mitgenommenes Blatt aus dem Almanach.');
    }
  }

  let alle = false;
  if (!datensatz) {
    const system = systemAusMarken(marken);
    if (!system) throw new Error('Diese Datei ist kein mitgenommenes Blatt aus dem Almanach.');
    datensatz = { name: '', system, data: system === 'freeform' ? defaultFreeformData() : defaultCharacterData() };
    if (system === 'freeform') datensatz.data.sections = [];
    alle = true;
    hinweise.push(
      'Der Datensatz fehlte in der Datei. Das Blatt wurde aus den sichtbaren Werten gebaut – Häkchen, Zustände und alles, was nicht auf der Seite stand, stehen auf dem Ausgangswert.'
    );
  }

  const system = SYSTEME.has(datensatz.system) ? datensatz.system : null;
  if (!system) throw new Error('Das Regelwerk dieses Blattes kennt der Almanach nicht.');
  datensatz.system = system;
  datensatz.name = typeof datensatz.name === 'string' ? datensatz.name : '';

  // Erst angleichen (damit Zahlen Zahlen sind), dann das Sichtbare übernehmen,
  // dann noch einmal angleichen, was dabei hereinkam.
  const erst = angleichen(system, datensatz.data, bekannt);
  datensatz.data = erst.data;
  const { uebernommen, unlesbar } = sichtbaresUebernehmen(datensatz, marken, { alle });
  const zweit = angleichen(system, datensatz.data, bekannt);
  hinweise.push(...new Set([...erst.hinweise, ...zweit.hinweise]));
  if (unlesbar.length) hinweise.push(`Diese sichtbaren Änderungen ließen sich nicht lesen und fehlen: ${unlesbar.join('; ')}.`);

  const name = (datensatz.name.trim() || (alle ? nameAusSeite(inhalt) : '') || ersatzName).trim();
  if (!name) throw new Error('Dem Blatt in dieser Datei fehlt der Name.');

  const sichtbar = alle
    ? []
    : uebernommen.map(({ pfad, vorher, nachher }) => {
        const zu = feldZu(system, pfad);
        const was = zu?.liste ? `${zu.liste.einzahl} (${zu.feld.label})` : (zu?.feld.label ?? pfad);
        return `${was}: ${vorher || '–'} → ${nachher || '–'}`;
      });

  return {
    name,
    system,
    data: zweit.data,
    id: kennung(datensatz.id),
    stand: typeof datensatz.stand === 'string' ? datensatz.stand : null,
    hinweise,
    sichtbar,
  };
}
