/**
 * Aus dem, was eine Anfrage mitbringt, saubere Werte machen.
 *
 * Der Server glaubt dem Rumpf einer Anfrage nichts: Eine Zahl kann als
 * Zeichenkette kommen, eine Liste als Objekt, ein Name als `null`. Jeder Weg
 * braucht deshalb dieselben kleinen Handgriffe – und die standen bisher in
 * fünf Dateien je einmal, jeweils leicht anders. Hier stehen sie einmal.
 *
 * Nichts davon wirft. Was nicht passt, wird zum Ersatzwert; ob ein fehlender
 * Wert ein Fehler ist (400) oder einfach „bleibt, wie er war“, entscheidet
 * der Weg selbst.
 */

/**
 * Eine endliche Zahl – oder der Ersatzwert.
 *
 * Achtung, eine Eigenheit von `Number()`, die hier bewusst durchgereicht
 * wird: `null`, `''` und `false` werden zu 0, nicht zum Ersatzwert. Wer
 * „leer heißt: kein Wert“ braucht, nimmt `zahlOderLeer`.
 */
export const toNumber = (wert, ersatz) => (Number.isFinite(Number(wert)) ? Number(wert) : ersatz);

/** Wie `toNumber`, aber ein leeres Feld bleibt leer (für „RK unbekannt“). */
export const zahlOderLeer = (wert, ersatz) => (wert === '' || wert == null ? ersatz : toNumber(wert, ersatz));

/** Zwischen zwei Grenzen halten. */
export const clamp = (wert, min, max) => Math.min(max, Math.max(min, wert));

/** Eine Farbe, wie das Farbwahlfeld des Browsers sie liefert: `#rrggbb`. */
export const istFarbe = (wert) => typeof wert === 'string' && /^#[0-9a-f]{6}$/i.test(wert);

/** Ein nicht leerer Text – der häufigste Pflichtfeld-Check. */
export const hatText = (wert) => typeof wert === 'string' && wert.trim().length > 0;

/**
 * Eine Liste von Texten, alles andere darin fällt heraus. Für Zustände und
 * die Schlagworte der Notizen und des Bestiariums, wo die Texte so bleiben,
 * wie sie eingegeben wurden.
 */
export const texte = (liste, anzahl = 20) =>
  Array.isArray(liste) ? liste.filter((t) => typeof t === 'string').slice(0, anzahl) : [];

/**
 * Schlagworte für Karten und Klänge: getrimmt, kurz, leere fallen weg. Enger
 * als `texte`, weil sie als Filterknöpfe in einer Zeile stehen.
 */
export const schlagworte = (liste) =>
  Array.isArray(liste)
    ? liste
        .filter(hatText)
        .map((t) => t.trim().slice(0, 40))
        .slice(0, 12)
    : [];

/** Der Zeitstempel, den jede Zeile trägt – als ISO-Text, so sortiert er richtig. */
export const jetzt = () => new Date().toISOString();
