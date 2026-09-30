/**
 * Das mitgenommene Blatt wieder hereinholen.
 *
 * Die Datei, die „Mitnehmen“ erzeugt (blattAusfuhr.js), trägt am Ende den
 * vollständigen Datensatz des Blattes:
 *
 *   <script type="application/json" id="almanach-daten">{ "name": …, "system": …, "data": … }</script>
 *
 * Hier wird er wieder herausgelesen. Angenommen wird die HTML-Datei selbst
 * oder – für alle, die den Datensatz schon herauskopiert haben – der
 * nackte JSON-Text.
 *
 * Gelesen wird mit einem regulären Ausdruck statt mit DOMParser: Ein
 * DOMParser baute die ganze fremde Seite als Dokument auf, samt Bildern.
 * Gebraucht wird nur der eine Block, und der steht in einer Form da, die
 * blattAusfuhr.js selbst schreibt.
 */

/** Die beiden Systeme, die der Almanach kennt. */
const SYSTEME = new Set(['dnd5e', 'freeform']);

/** Ein Datensatz muss ein schlichtes Objekt sein – kein Text, keine Liste. */
const istObjekt = (wert) => wert != null && typeof wert === 'object' && !Array.isArray(wert);

/**
 * Den Datensatz aus einer mitgenommenen Blattdatei holen.
 *
 * @param {string} text  der Inhalt der Datei
 * @returns {{ name: string, system: string, data: object, stand: string|null }}
 * @throws {Error} mit einem Satz für Menschen, wenn die Datei keinen
 *   brauchbaren Datensatz enthält
 */
export function leseBlattdatei(text) {
  const inhalt = String(text ?? '');
  const block = inhalt.match(/<script[^>]*\bid=["']almanach-daten["'][^>]*>([\s\S]*?)<\/script>/i);
  const roh = block ? block[1] : inhalt.trim();

  let datensatz;
  try {
    datensatz = JSON.parse(roh);
  } catch {
    throw new Error(
      block
        ? 'Der Datensatz in dieser Datei ist beschädigt.'
        : 'Diese Datei ist kein mitgenommenes Blatt aus dem Almanach.'
    );
  }

  if (!istObjekt(datensatz) || !istObjekt(datensatz.data)) {
    throw new Error('Diese Datei ist kein mitgenommenes Blatt aus dem Almanach.');
  }
  const name = typeof datensatz.name === 'string' ? datensatz.name.trim() : '';
  if (!name) throw new Error('Dem Blatt in dieser Datei fehlt der Name.');
  const system = SYSTEME.has(datensatz.system) ? datensatz.system : null;
  if (!system) throw new Error('Das Regelwerk dieses Blattes kennt der Almanach nicht.');

  return { name, system, data: datensatz.data, stand: typeof datensatz.stand === 'string' ? datensatz.stand : null };
}
