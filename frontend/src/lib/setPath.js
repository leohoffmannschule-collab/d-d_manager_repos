/**
 * Kleinkram für das Charakterblatt: verschachtelte Werte setzen und lesen,
 * und ein Bild aus einer Datei in handliche Größe bringen.
 *
 * Warum „unveränderlich“ (immutable)? React erkennt Änderungen daran, dass
 * ein Objekt ein *anderes* ist als vorher – nicht daran, was darin steht.
 * Wer `data.combat.hp.current = 5` schreibt, ändert zwar den Wert, aber das
 * Objekt bleibt dasselbe, und die Oberfläche zeichnet nichts neu. Deshalb
 * gibt `setPath` immer eine frische Kopie zurück.
 */

/** Tiefe Kopie. structuredClone fehlt auf iPads vor iPadOS 15.4. */
function deepClone(obj) {
  if (typeof structuredClone === 'function') return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Einen verschachtelten Wert setzen, ohne das Original anzufassen:
 *
 *   const neu = setPath(blatt, 'combat.hp.current', 5);
 *
 * Achtung, bewusste Einfachheit: Der Weg muss vorhanden sein. Fehlt
 * unterwegs eine Ebene, läuft es in einen Fehler statt sie anzulegen – im
 * Blatt liegt die Struktur fest, ein Tippfehler im Pfad soll auffallen.
 */
export function setPath(obj, path, value) {
  const keys = path.split('.');
  const clone = deepClone(obj);
  let cursor = clone;
  for (let i = 0; i < keys.length - 1; i++) {
    cursor = cursor[keys[i]];
  }
  cursor[keys[keys.length - 1]] = value;
  return clone;
}

/**
 * Das Gegenstück zum Lesen. `?.` bricht sauber ab, wenn unterwegs etwas
 * fehlt – hier ist das erwünscht: Ein leeres Feld ist kein Fehler.
 */
export function getPath(obj, path) {
  return path.split('.').reduce((cursor, key) => cursor?.[key], obj);
}

/**
 * Eine ausgewählte Bilddatei zu einer kleinen `data:`-URL machen.
 *
 * Gebraucht für Bildnisse auf dem Charakterblatt: Die liegen *im Blatt
 * selbst* (also in der Datenbankzeile), nicht als Datei daneben. Ein Foto
 * aus einer Handykamera hat gern 4 MB – deshalb wird es vorher über ein
 * Canvas auf `maxSize` Kantenlänge heruntergerechnet und als JPEG mit 85 %
 * Güte ausgegeben. Aus 4 MB werden so rund 30 KB.
 *
 * Die beiden `new Promise(...)` drumherum sind nötig, weil FileReader und
 * Image noch mit Rückrufen arbeiten statt mit Promises.
 */
export async function fileToResizedDataUrl(file, maxSize = 320) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  // Nur verkleinern, nie vergrößern: Math.min(1, …) deckelt den Faktor.
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
}
