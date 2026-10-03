/**
 * Das Handwerkszeug für die Blattausfuhr: entschärfen, einrahmen, Bilder
 * einbetten.
 *
 * Die eine Regel, die in dieser ganzen Ecke des Almanachs gilt: **Jeder
 * Wert aus dem Blatt geht durch `esc`.** Ohne das würde aus einem
 * Charakternamen wie `<b>Grim` eine Formatierung, und aus etwas
 * Bösartigerem ausführbarer Code.
 *
 * `tafel`, `feld` und `zeilen` sind die drei Bausteine, aus denen jeder
 * Abschnitt des Blattes gebaut ist – eine Karte mit Überschrift, ein
 * beschriftetes Feld, eine Tabelle.
 *
 * Dazu `marke`: Sie umgibt einen sichtbaren Wert mit dem Pfad, unter dem er
 * im Datensatz steht. Ändert jemand – oder eine KI – nur die sichtbare
 * Seite, findet „Blätter einlesen“ die Änderung daran wieder
 * (lib/einfuhr/sichtbar.js).
 */
const ZEICHEN = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Text für HTML entschärfen – alles, was vom Blatt kommt, läuft hier hindurch. */
export const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, (z) => ZEICHEN[z]);

/** Zeilenumbrüche aus Textfeldern erhalten. */
export const escAbsatz = (wert) => esc(wert).replace(/\n/g, '<br>');

/** Die dreibuchstabigen Kürzel der Attribute, wie sie auf dem gedruckten Bogen stehen. */
export const KURZ = { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' };
/** Die Münzsorten als [Schlüssel, Name], von der wertvollsten zur kleinsten. */
export const MUENZEN = [
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
export async function alsDatenUrl(quelle) {
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
export async function zaubertexte(spells) {
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

/* --- Wiedererkennbare Werte ---------------------------------------------- */

/**
 * Ein sichtbarer Wert, den „Blätter einlesen“ wiedererkennt.
 *
 *   <span data-feld="combat.hp.max" data-war="24">24</span>
 *
 * `data-feld` ist der Pfad im Datensatz (Listeneinträge über ihre Kennung:
 * `attacks.#<id>.name`), `data-war` der Wert so, wie er bei der Ausfuhr
 * dastand. Steht beim Einlesen etwas anderes sichtbar da als in `data-war`,
 * wurde die Seite geändert – und der Datensatz noch nicht.
 *
 * @param {string} pfad  wo der Wert im Datensatz steht
 * @param {unknown} war  der Wert in seiner Anzeigeform (siehe glossar.js, `anzeige`)
 * @param {string} [html] was sichtbar dasteht; ohne Angabe der entschärfte Wert, leer als „–“
 */
export function marke(pfad, war, html) {
  const text = String(war ?? '');
  return `<span data-feld="${esc(pfad)}" data-war="${esc(text)}">${html ?? esc(text || '–')}</span>`;
}

/** Eine Tabellenzelle aus einem Listeneintrag – markiert, wenn der Eintrag eine Kennung hat. */
export const zelle = (listenPfad, eintrag, key, html = esc(eintrag[key])) =>
  eintrag.id ? marke(`${listenPfad}.#${eintrag.id}.${key}`, eintrag[key], html) : html;

/* --- Die drei Bausteine jedes Abschnitts -------------------------------- */

/** Eine Karte mit Überschrift. Leerer Inhalt heißt: gar keine Karte. */
export const tafel = (titel, inhalt) =>
  inhalt ? `<section class="tafel"><h2>${esc(titel)}</h2>${inhalt}</section>` : '';

/**
 * Ein beschriftetes Feld: kleine Beschriftung, Wert darunter; ein leerer
 * Wert wird zu „–“. Mit `pfad` ist der Wert markiert (siehe `marke`).
 */
export const feld = (label, wert, pfad) =>
  `<div class="feld"><span class="label">${esc(label)}</span><span class="wert">${
    pfad ? marke(pfad, wert) : esc(wert || '–')
  }</span></div>`;

/** Ein beschriftetes Feld, dessen Wert schon fertiges HTML ist (mit Marken darin). */
export const feldHtml = (label, html) =>
  `<div class="feld"><span class="label">${esc(label)}</span><span class="wert">${html}</span></div>`;

/**
 * Eine Tabelle aus Kopf und Reihen – oder nichts, wenn es keine Reihen gibt.
 * Die Zellen der Reihen sind schon HTML (bereits entschärft).
 */
export const zeilen = (kopf, reihen) =>
  reihen.length === 0
    ? ''
    : `<table><thead><tr>${kopf.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead>` +
      `<tbody>${reihen.map((r) => `<tr>${r.map((z) => `<td>${z}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

