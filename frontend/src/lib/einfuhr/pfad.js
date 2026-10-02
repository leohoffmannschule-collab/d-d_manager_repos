/**
 * Pfade in einen Datensatz – mit Listeneinträgen über ihre Kennung.
 *
 *   combat.hp.max              ein Feld in verschachtelten Objekten
 *   attacks.#<id>.damage       ein Feld im Listeneintrag mit dieser Kennung
 *   attunement.1               die zweite Stelle einer einfachen Liste
 *
 * Anders als lib/setPath.js ändern `pfadSetzen` und `pfadHolen` hier in einem
 * Datensatz, der dem Einlesen allein gehört (eine Abschrift), und legen
 * fehlende Ebenen an: Eine Datei, deren Datensatz eine KI verloren hat,
 * wird aus den sichtbaren Feldern neu aufgebaut – samt Listeneinträgen,
 * die es vorher nur als Pfad gab.
 */

/** Die Teile eines Pfades. `#…` heißt: Eintrag mit dieser Kennung. */
const teile = (pfad) => String(pfad).split('.');

/** Der Eintrag einer Liste mit dieser Kennung – oder undefined. */
const eintragMit = (liste, id) => (Array.isArray(liste) ? liste.find((e) => e && e.id === id) : undefined);

/** Ein Wert unter einem Pfad, oder undefined, wenn unterwegs etwas fehlt. */
export function pfadHolen(obj, pfad) {
  let ort = obj;
  for (const teil of teile(pfad)) {
    if (ort == null || typeof ort !== 'object') return undefined;
    ort = teil.startsWith('#') ? eintragMit(ort, teil.slice(1)) : ort[teil];
  }
  return ort;
}

/**
 * Einen Wert unter einem Pfad setzen; fehlende Objekte, Listen und
 * Listeneinträge werden angelegt. Ändert `obj` selbst.
 */
export function pfadSetzen(obj, pfad, wert) {
  const stuecke = teile(pfad);
  let ort = obj;
  for (let i = 0; i < stuecke.length - 1; i++) {
    const teil = stuecke[i];
    // Vor einem `#…` muss eine Liste stehen; sonst ein Objekt (oder was schon da ist –
    // `attunement.1` greift in eine vorhandene Liste, `spellcasting.slots.1` in ein Objekt).
    const listeNoetig = stuecke[i + 1].startsWith('#');
    if (teil.startsWith('#')) {
      const id = teil.slice(1);
      let eintrag = eintragMit(ort, id);
      if (!eintrag) {
        eintrag = { id };
        ort.push(eintrag);
      }
      ort = eintrag;
    } else {
      const da = ort[teil];
      if (listeNoetig ? !Array.isArray(da) : da == null || typeof da !== 'object') ort[teil] = listeNoetig ? [] : {};
      ort = ort[teil];
    }
  }
  const letztes = stuecke[stuecke.length - 1];
  if (letztes.startsWith('#')) return;
  ort[letztes] = wert;
}
