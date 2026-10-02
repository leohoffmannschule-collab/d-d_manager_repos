/**
 * Was auf der sichtbaren Seite geändert wurde, in den Datensatz übernehmen.
 *
 * Eine KI – oder jemand mit einem Texteditor – ändert manchmal nur, was man
 * sieht: Aus „Stufe 3“ wird „Stufe 4“, der Datensatz am Ende der Datei
 * bleibt, wie er war. Damit das nicht verloren geht, trägt jeder sichtbare
 * Wert zwei Angaben (siehe lib/blatt/werkzeug.js, `marke`):
 *
 *   data-feld  wo er im Datensatz steht
 *   data-war   wie er bei der Ausfuhr dastand
 *
 * Daraus folgt für jeden Wert eine einfache Regel:
 *
 *   – Steht im Datensatz etwas anderes als `data-war`, wurde der Datensatz
 *     bearbeitet. Er gilt – auch wenn die Seite etwas anderes zeigt.
 *   – Sonst: Steht sichtbar etwas anderes als `data-war`, wurde nur die
 *     Seite bearbeitet. Dann gilt das Sichtbare.
 *   – Sonst hat sich nichts geändert.
 *
 * Gelesen wird ohne DOMParser, mit regulären Ausdrücken über die Form, die
 * die Ausfuhr selbst schreibt – so läuft es auch in der Blattprobe (Node).
 */
import { weiteNachFuss, gewichtNachPfund } from '../regeln/masse.js';
import { anzeige, feldZu } from '../blatt/glossar.js';
import { entitaeten } from './datei.js';
import { pfadHolen, pfadSetzen } from './pfad.js';

/** Ein Wert auf seine Form zum Vergleichen gebracht: Leerraum je Zeile gefaltet, „–“ als leer. */
export function glatt(text) {
  const t = String(text ?? '')
    .split('\n')
    .map((zeile) => zeile.replace(/[ \t ]+/g, ' ').trim())
    .join('\n')
    .trim();
  return /^[–—-]$/.test(t) ? '' : t;
}

/** Der Text innerhalb einer Marke: Zeilenumbrüche aus `<br>`, ohne Tags, ohne Entitäten. */
const textAus = (html) =>
  entitaeten(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]*>/g, '')
  );

/**
 * Alle markierten Werte einer Datei.
 *
 * @returns {Array<{ pfad: string, war: string, text: string }>}
 */
export function markenLesen(html) {
  const ohneKommentare = html.replace(/<!--[\s\S]*?-->/g, '');
  const marken = [];
  for (const m of ohneKommentare.matchAll(/<([a-z][a-z0-9]*)\b([^>]*\bdata-feld\s*=\s*"[^"]*"[^>]*)>([\s\S]*?)<\/\1\s*>/gi)) {
    const pfad = /\bdata-feld\s*=\s*"([^"]*)"/i.exec(m[2])[1];
    const war = /\bdata-war\s*=\s*"([^"]*)"/i.exec(m[2]);
    marken.push({ pfad: entitaeten(pfad), war: war ? entitaeten(war[1]) : null, text: textAus(m[3]) });
  }
  return marken;
}

/** Die erste Zahl in einem Text („+3“, „12,5 m“, „−2“) – oder null. */
function zahlIn(text) {
  const m = /[-+−]?\d+(?:[.,]\d+)?/.exec(text);
  return m ? Number(m[0].replace('−', '-').replace(',', '.')) : null;
}

/**
 * Sichtbaren Text in einen Wert zurückverwandeln, nach der Art des Feldes.
 * Eine Einheit im Text („12 m“, „40 Fuß“, „3 kg“) gilt vor dem Maßsystem
 * des Blattes. Gibt `undefined` zurück, wenn sich nichts herauslesen lässt.
 */
export function zurueck(art, text, units) {
  const t = glatt(text);
  if (art === 'text') return t;
  if (t === '') return art === 'ja' ? false : 0;
  if (art === 'ja') return /^(ja|true|wahr|x|✓|●|1)$/i.test(t);
  const zahl = zahlIn(t);
  if (zahl === null) return undefined;
  if (art === 'weite') {
    if (/fuß|fuss|\bft\b|feet/i.test(t)) return Math.round(zahl);
    if (/\bm\b|meter/i.test(t)) return weiteNachFuss(zahl, 'metrisch');
    return weiteNachFuss(zahl, units);
  }
  if (art === 'gewicht') {
    if (/\bkg\b|kilo/i.test(t)) return gewichtNachPfund(zahl, 'metrisch');
    if (/pfund|\blb/i.test(t)) return zahl;
    return gewichtNachPfund(zahl, units);
  }
  return zahl;
}

/**
 * Die sichtbaren Änderungen in den Datensatz übernehmen.
 *
 * @param {object} datensatz   { name, system, data } – wird geändert
 * @param {Array} marken       aus `markenLesen`
 * @param {object} [wie]
 * @param {boolean} [wie.alle] jeden markierten Wert übernehmen, nicht nur
 *   geänderte – für eine Datei, deren Datensatz fehlt
 * @returns {{ uebernommen: Array<{ pfad: string, vorher: string, nachher: string }>, unlesbar: string[] }}
 */
export function sichtbaresUebernehmen(datensatz, marken, { alle = false } = {}) {
  const uebernommen = [];
  const unlesbar = [];
  const units = datensatz.data?.units;
  for (const { pfad, war, text } of marken) {
    const zu = feldZu(datensatz.system, pfad);
    if (!zu) continue;
    const { art } = zu.feld;
    const imDatensatz = pfad === 'name' ? datensatz.name : pfadHolen(datensatz.data, pfad);
    const sichtbar = glatt(text);
    if (!alle) {
      if (war === null) continue;
      // Der Datensatz wurde selbst bearbeitet: Er gilt.
      if (glatt(anzeige(art, imDatensatz, units)) !== glatt(war)) continue;
      if (sichtbar === glatt(war)) continue;
    } else if (sichtbar === '' && imDatensatz === undefined) continue;
    const wert = zurueck(art, text, units);
    if (wert === undefined) {
      unlesbar.push(`${zu.feld.label}: „${sichtbar}“`);
      continue;
    }
    if (pfad === 'name') datensatz.name = wert;
    else pfadSetzen(datensatz.data, pfad, wert);
    uebernommen.push({ pfad, vorher: glatt(war ?? ''), nachher: sichtbar });
  }
  return { uebernommen, unlesbar };
}
