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
 */
const ZEICHEN = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (wert) => String(wert ?? '').replace(/[&<>"']/g, (z) => ZEICHEN[z]);

/** Zeilenumbrüche aus Textfeldern erhalten. */
export const escAbsatz = (wert) => esc(wert).replace(/\n/g, '<br>');

export const KURZ = { str: 'STÄ', dex: 'GES', con: 'KON', int: 'INT', wis: 'WEI', cha: 'CHA' };
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

/* --- Die drei Bausteine jedes Abschnitts -------------------------------- */

/** Eine Karte mit Überschrift. Leerer Inhalt heißt: gar keine Karte. */
export const tafel = (titel, inhalt) =>
  inhalt ? `<section class="tafel"><h2>${esc(titel)}</h2>${inhalt}</section>` : '';

export const feld = (label, wert) =>
  `<div class="feld"><span class="label">${esc(label)}</span><span class="wert">${esc(wert || '–')}</span></div>`;

export const zeilen = (kopf, reihen) =>
  reihen.length === 0
    ? ''
    : `<table><thead><tr>${kopf.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead>` +
      `<tbody>${reihen.map((r) => `<tr>${r.map((z) => `<td>${z}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

