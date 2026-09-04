/**
 * Ein Bild aus dem Dateiwähler in eine data:-URL verwandeln – so wandert es
 * durch die gewöhnliche JSON-API und es braucht kein Datei-Upload-Paket.
 *
 * Sehr große Karten werden vorher verkleinert: Ein Handyfoto mit 8000 Pixeln
 * Kantenlänge bringt am Spieltisch nichts, kostet aber Speicher auf dem Pi
 * und Ladezeit auf dem iPad.
 */
export async function bildLesen(file, maxSeite = 4096) {
  const rohDatenUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Die Datei ließ sich nicht lesen.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const bild = new Image();
    bild.onload = () => resolve(bild);
    bild.onerror = () => reject(new Error('Das ist kein Bild, das der Browser kennt.'));
    bild.src = rohDatenUrl;
  });

  const faktor = Math.min(1, maxSeite / Math.max(img.width, img.height));
  if (faktor === 1 && file.size < 6 * 1024 * 1024) {
    return { dataUrl: rohDatenUrl, width: img.width, height: img.height, name: file.name };
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * faktor);
  canvas.height = Math.round(img.height * faktor);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Karten sind Fotos oder Zeichnungen mit vielen Farben – JPEG ist hier
  // deutlich sparsamer als PNG, und Ränder gibt es auf einer Karte nicht.
  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.86),
    width: canvas.width,
    height: canvas.height,
    name: file.name,
  };
}

/**
 * Wie `bildLesen`, liefert zusätzlich aber ein kleines Vorschaubild.
 *
 * Die Bibliothek zeigt womöglich dreißig Karten nebeneinander. Würde jede
 * Kachel das volle Bild laden, wäre der Pi mit ein paar hundert Megabyte
 * beschäftigt und das iPad mit dem Scrollen. Beides entsteht hier aus einem
 * einzigen Lesevorgang – die Datei wandert nur einmal durch den Speicher.
 */
export async function bildUndVorschau(file, maxSeite = 4096, vorschauSeite = 480) {
  const voll = await bildLesen(file, maxSeite);

  const img = await new Promise((resolve, reject) => {
    const bild = new Image();
    bild.onload = () => resolve(bild);
    bild.onerror = () => reject(new Error('Das ist kein Bild, das der Browser kennt.'));
    bild.src = voll.dataUrl;
  });

  const faktor = Math.min(1, vorschauSeite / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * faktor));
  canvas.height = Math.max(1, Math.round(img.height * faktor));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return { ...voll, vorschauUrl: canvas.toDataURL('image/jpeg', 0.72) };
}
