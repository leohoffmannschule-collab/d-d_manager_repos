/**
 * Auf welcher Seite des PDFs steht welcher Anker?
 *
 * Das Inhaltsverzeichnis des Buches soll Seitenzahlen tragen. Der Browser
 * kann sie beim Drucken nicht selbst einsetzen (`target-counter()` kennt
 * Chromium nicht), also wird zweimal gedruckt: Der erste Durchgang legt die
 * Seiten fest, dieses Modul liest daraus ab, wo jede Überschrift gelandet
 * ist, und der zweite Durchgang druckt dieselben Seiten mit den Zahlen im
 * Verzeichnis. Weil die Zahlen im ersten Durchgang schon als Platzhalter
 * gleicher Breite dastehen, verschiebt sich dabei nichts.
 *
 * Gelesen wird ohne PDF-Bibliothek. Das geht, weil Chromium für jedes
 * Element mit `id`, auf das ein Verweis zeigt, ein *benanntes Sprungziel*
 * anlegt – im Wörterbuch `/Dests` des Katalogs, unkomprimiert:
 *
 *   /Dests 20 0 R            im Katalog
 *   20 0 obj << /k3 [7 0 R /XYZ 0 842 0] … >> endobj
 *
 * Die Seite `7 0 R` wird dann im Seitenbaum (`/Pages` → `/Kids`) gesucht;
 * ihre Stelle dort ist die Seitenzahl. Komprimierte Objektströme benutzt
 * Chromium dafür nicht. Sollte sich das eines Tages ändern, bleibt das
 * Verzeichnis ohne Zahlen – das Buch entsteht trotzdem.
 */

/**
 * Alle Objekte des PDFs als Text, nach Nummer. Ströme (Bilder, Seiteninhalt)
 * werden dabei mitgelesen, aber nie ausgewertet – gesucht wird nur in den
 * Wörterbüchern davor.
 */
function objekte(pdf) {
  const text = pdf.toString('latin1');
  const liste = new Map();
  for (const treffer of text.matchAll(/(?:^|[\r\n])(\d+) 0 obj\b([\s\S]*?)endobj/g)) {
    const rumpf = treffer[2];
    const stromAb = rumpf.indexOf('stream');
    liste.set(Number(treffer[1]), stromAb === -1 ? rumpf : rumpf.slice(0, stromAb));
  }
  return liste;
}

/** Den Wert eines Schlüssels als Verweis lesen: `/Pages 3 0 R` → 3. */
const verweisAuf = (woerterbuch, schluessel) => {
  const treffer = new RegExp(`/${schluessel}\\s+(\\d+)\\s+0\\s+R`).exec(woerterbuch);
  return treffer ? Number(treffer[1]) : null;
};

/** Die Seiten in Lesereihenfolge, als Objektnummern – der Baum wird durchlaufen. */
function seitenFolge(alle, knoten, folge = []) {
  const woerterbuch = alle.get(knoten) ?? '';
  if (/\/Type\s*\/Page\b/.test(woerterbuch)) {
    folge.push(knoten);
    return folge;
  }
  const kinder = /\/Kids\s*\[([^\]]*)\]/.exec(woerterbuch);
  if (!kinder) return folge;
  for (const kind of kinder[1].matchAll(/(\d+)\s+0\s+R/g)) seitenFolge(alle, Number(kind[1]), folge);
  return folge;
}

/**
 * Einen PDF-Namen lesen: `#xx` steht für ein Byte in Hexadezimal. Die Anker
 * des Buches sind reines ASCII, aber sicher ist sicher.
 */
const nameLesen = (roh) => roh.replace(/#([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

/**
 * @param {Buffer} pdf  das gedruckte PDF
 * @returns {{ seiten: number, anker: Map<string, number> }}
 *   die Zahl der Seiten und für jeden Anker seine Seite (ab 1)
 */
export function seitenzahlen(pdf) {
  const alle = objekte(pdf);
  const katalog = [...alle.values()].find((w) => /\/Type\s*\/Catalog\b/.test(w)) ?? '';
  const folge = seitenFolge(alle, verweisAuf(katalog, 'Pages'));
  const stelle = new Map(folge.map((objekt, i) => [objekt, i + 1]));
  const anker = new Map();

  const ziele = alle.get(verweisAuf(katalog, 'Dests')) ?? '';
  for (const treffer of ziele.matchAll(/\/([^\s/[\]<>()]+)\s*\[\s*(\d+)\s+0\s+R/g)) {
    const seite = stelle.get(Number(treffer[2]));
    if (seite) anker.set(nameLesen(treffer[1]), seite);
  }
  return { seiten: folge.length, anker };
}
