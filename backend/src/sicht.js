/**
 * Wer sieht was?
 *
 * Bis hierher war der Nebel eine Decke, die die Spielleitung von Hand
 * wegwischt. Das bleibt so – aber in einer *dunklen* Szene kommt eine zweite
 * Frage dazu: Was kann diese Figur von dort, wo sie steht, überhaupt
 * wahrnehmen? Eine Zwergin mit Dunkelsicht sieht dreißig Fuß weit ins
 * Schwarze; der Mensch neben ihr sieht nur so weit, wie die Fackel trägt.
 *
 * Zwei Dinge, die dieses Modul bewusst *nicht* kann:
 *
 * 1. **Keine Wände.** Licht und Blick gehen hier durch Mauern hindurch. Wer
 *    das nicht will, deckt den Nebel eben nicht auf – der von Hand gemalte
 *    Nebel begrenzt jede Sicht und bleibt das Werkzeug der Spielleitung.
 * 2. **Kein Unterschied zwischen hell und dämmrig.** Wer in dämmrigem Licht
 *    steht, sieht; er würfelt nur mit Nachteil auf Wahrnehmung. Das ist eine
 *    Regel für den Wurf, nicht für den Nebel.
 *
 * Gerechnet wird auf Feldmittelpunkten mit euklidischem Abstand – so, wie die
 * Regeln einen Radius auf dem Raster auslegen ("alle Felder, deren Mitte
 * innerhalb liegt"). Das Lineal am Brett misst dagegen die Entfernung
 * *zwischen zwei Figuren* und zählt Diagonalen einfach; das sind zwei
 * verschiedene Fragen, und beide werden hier so beantwortet, wie es im
 * Regelwerk steht.
 */

const FUSS_JE_METER = 3.280839895;

/**
 * Wie viel Spielweite steckt in einem Feld – in Fuß gerechnet?
 *
 * Die Sinne stehen auf dem Charakterblatt in Fuß, weil das Regelwerk in Fuß
 * geschrieben ist. Der Maßstab der Karte darf trotzdem metrisch sein: Ein
 * Feld von einem Meter fasst 3,28 Fuß, und dreißig Fuß Dunkelsicht reichen
 * dann neun Felder weit statt sechs.
 */
export function fussJeFeld(scene) {
  const weite = Number(scene?.scale) > 0 ? Number(scene.scale) : 5;
  return scene?.unit === 'meter' ? weite * FUSS_JE_METER : weite;
}

/** Fuß in Rasterfelder, im Maßstab dieser Karte. */
export const inFelder = (fuss, scene) =>
  Math.max(0, Math.floor((Number(fuss) || 0) / fussJeFeld(scene)));

/** In welchem Rasterfeld steht der Mittelpunkt dieser Figur? */
export function figurenFeld(token, scene) {
  const g = Math.max(4, scene.gridSize);
  const mitteX = token.x + (Math.max(1, token.size || 1) * g) / 2;
  const mitteY = token.y + (Math.max(1, token.size || 1) * g) / 2;
  return {
    fx: Math.floor((mitteX - scene.gridOffsetX) / g),
    fy: Math.floor((mitteY - scene.gridOffsetY) / g),
  };
}

/** Die Rasterfelder, die eine Karte überhaupt umfasst. */
export function rasterBereich(scene) {
  const g = Math.max(4, scene.gridSize);
  return {
    g,
    minX: Math.floor((0 - scene.gridOffsetX) / g),
    minY: Math.floor((0 - scene.gridOffsetY) / g),
    maxX: Math.floor((Math.max(1, scene.width) - 1 - scene.gridOffsetX) / g),
    maxY: Math.floor((Math.max(1, scene.height) - 1 - scene.gridOffsetY) / g),
  };
}

/** Alle Felder im Umkreis eines Feldes in eine Menge legen. */
function scheibe(mitte, radiusFelder, bereich, ziel) {
  const r = radiusFelder;
  const r2 = r * r;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      const x = mitte.fx + dx;
      const y = mitte.fy + dy;
      if (x < bereich.minX || x > bereich.maxX || y < bereich.minY || y > bereich.maxY) continue;
      ziel.add(`${x},${y}`);
    }
  }
}

/**
 * Was leuchtet auf dieser Karte?
 *
 * Jede Figur mit Fackel, Laterne oder Lichtzauber erhellt ihre Umgebung – für
 * alle, nicht nur für sich selbst. Hell und dämmrig fallen dabei zusammen: In
 * beidem sieht man.
 */
export function beleuchteteFelder(scene, tokens) {
  const bereich = rasterBereich(scene);
  const felder = new Set();
  for (const token of tokens) {
    const reichweite = inFelder((token.lightBright ?? 0) + (token.lightDim ?? 0), scene);
    if (reichweite <= 0) continue;
    scheibe(figurenFeld(token, scene), reichweite, bereich, felder);
  }
  return felder;
}

/**
 * Die Sinne einer Figur für die *Dunkelheit*, in Fuß. Was davon zählt, ist
 * das Weiteste: Wer dreißig Fuß Dunkelsicht und zehn Fuß Blindsicht hat,
 * nimmt dreißig Fuß weit wahr, auch ohne jedes Licht.
 */
export function sinnesReichweite(sinne) {
  if (!sinne) return 0;
  return Math.max(
    Number(sinne.darkvision) || 0,
    Number(sinne.blindsight) || 0,
    Number(sinne.tremorsense) || 0,
    Number(sinne.truesight) || 0
  );
}

/**
 * Wie weit sieht diese Figur überhaupt, in Fuß – bei genug Licht.
 *
 * Das ist etwas anderes als die Dunkelsicht. Bei Tageslicht sieht man bis zum
 * Horizont; auf einer Karte heißt das „unbegrenzt“, und genau dafür steht die
 * Null. Wer stattdessen einen Wert einträgt, bekommt ein Nebelfenster, das
 * an seiner Figur hängt: So weit reicht der Blick, nicht weiter.
 */
export const eigeneSichtweite = (sinne) => (Number(sinne?.sight) > 0 ? Number(sinne.sight) : Infinity);

/**
 * Was die Szene allen aufzwingt, in Fuß – Nebelbank, Schneetreiben, dichter
 * Wald. Das ist die harte Grenze: Auch eine Fackel leuchtet nicht durch
 * Nebel hindurch.
 */
export const szenenSichtweite = (scene) => (Number(scene?.sight) > 0 ? Number(scene.sight) : Infinity);

/** Fuß in Felder, aber „unbegrenzt“ bleibt unbegrenzt. */
const grenzeInFelder = (fuss, scene) => (fuss === Infinity ? Infinity : inFelder(fuss, scene));

/** Abstand zweier Felder in Feldern, euklidisch – wie die Scheiben oben. */
function abstandFelder(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Was sehen diese Figuren zusammen?
 *
 * `null` heißt „alles, was aufgedeckt ist“: kein Nebel, keine eigene Figur
 * auf der Karte, oder schlicht nichts, das den Blick begrenzt. Letzteres ist
 * Absicht – wer nicht mitspielt, soll nicht vor einem schwarzen Blatt sitzen,
 * und eine helle Szene ohne eingetragene Sichtweite bleibt, wie sie war.
 *
 * Der Aufbau in einem Satz: **Sichtbar ist, was innerhalb der eigenen
 * Reichweite liegt und dort auch wahrzunehmen ist.**
 *
 * Wie weit die Reichweite geht, hängt vom Licht ab:
 *
 *   hell   – so weit der Blick trägt (`senses.sight`).
 *   dunkel – so weit der Blick trägt **oder die eigene Fackel leuchtet**,
 *            was von beidem weiter ist. Wer sich im Finstern ein Licht
 *            anzündet, sieht damit auch weiter; das ist der ganze Zweck
 *            einer Fackel.
 *
 * Die Szene deckelt beides. Nebel bleibt Nebel, auch mit Laterne.
 *
 * Innerhalb der Reichweite ist sichtbar, was beleuchtet ist – auch von
 * fremdem Licht. Aber fremdes Licht kann die Reichweite nicht *aufziehen*:
 * Die Fackel am anderen Kartenrand geht dich nichts an, sonst wanderte dein
 * Nebelfenster, ohne dass du einen Schritt getan hättest.
 */
export function sichtFelder(scene, alleTokens, eigeneTokens, sinneJeToken) {
  if (!scene.fogEnabled) return null;
  if (!eigeneTokens || eigeneTokens.length === 0) return null;

  const bereich = rasterBereich(scene);
  const beleuchtet = scene.dark ? beleuchteteFelder(scene, alleTokens) : null;
  const wetter = grenzeInFelder(szenenSichtweite(scene), scene);
  const sichtbar = new Set();
  let begrenzt = false;

  for (const token of eigeneTokens) {
    const sinne = sinneJeToken.get(token.id);
    const mitte = figurenFeld(token, scene);
    const ausAugen = grenzeInFelder(eigeneSichtweite(sinne), scene);

    // Das eigene Feld sieht man immer, und sei es durch Tasten.
    sichtbar.add(`${mitte.fx},${mitte.fy}`);

    if (!scene.dark) {
      // Helle Szene: Es zählt allein, wie weit der Blick reicht.
      const reichweite = Math.min(ausAugen, wetter);
      if (reichweite === Infinity) return null;
      begrenzt = true;
      scheibe(mitte, reichweite, bereich, sichtbar);
      continue;
    }

    begrenzt = true;
    // Dunkel: Die eigene Fackel trägt den Blick über die Sichtweite hinaus.
    const ausLicht = inFelder((token.lightBright ?? 0) + (token.lightDim ?? 0), scene);
    const reichweite = Math.min(Math.max(ausAugen, ausLicht), wetter);

    // Was ohne jedes Licht wahrgenommen wird, aber nie über die Reichweite.
    const dunkelSinne = Math.min(inFelder(sinnesReichweite(sinne), scene), reichweite);
    if (dunkelSinne > 0) scheibe(mitte, dunkelSinne, bereich, sichtbar);

    // Dazu, was beleuchtet ist – soweit der Blick hinreicht.
    for (const feld of beleuchtet) {
      if (sichtbar.has(feld)) continue;
      if (reichweite !== Infinity) {
        const trenner = feld.indexOf(',');
        const x = Number(feld.slice(0, trenner));
        const y = Number(feld.slice(trenner + 1));
        if (abstandFelder(x, y, mitte.fx, mitte.fy) > reichweite) continue;
      }
      sichtbar.add(feld);
    }
  }

  return begrenzt ? sichtbar : null;
}

/* --- Übertragung --------------------------------------------------------- */

/**
 * Eine Feldmenge als Bitkarte, ein Bit je Rasterfeld, base64 verpackt.
 *
 * Der Grund ist schlichte Arithmetik. Eine Karte über zweihundert Meter hat
 * bei einem Meter je Feld 40 000 Felder. Als Liste von `"x,y"` sind das
 * 348 KB – und die Szene geht bei jedem Zug an jede Person neu hinaus, macht
 * bei fünf Spielern 1,7 MB für einen Schritt zur Seite. Als Bitkarte sind es
 * 6,5 KB, also das Fünfzigfache weniger, und der Browser liest sie beim Malen
 * des Nebels sogar schneller als eine Menge.
 *
 * Die einzelnen Pinselstriche wandern weiterhin als `"x,y"` – ein Strich ist
 * klein, und dafür lohnt kein Umpacken.
 */
export function alsBitkarte(felder, bereich) {
  const spalten = bereich.maxX - bereich.minX + 1;
  const zeilen = bereich.maxY - bereich.minY + 1;
  if (spalten <= 0 || zeilen <= 0) return '';

  const bytes = new Uint8Array(Math.ceil((spalten * zeilen) / 8));
  for (const feld of felder) {
    const trenner = feld.indexOf(',');
    if (trenner < 0) continue;
    const x = Number(feld.slice(0, trenner));
    const y = Number(feld.slice(trenner + 1));
    if (x < bereich.minX || x > bereich.maxX || y < bereich.minY || y > bereich.maxY) continue;
    const stelle = (y - bereich.minY) * spalten + (x - bereich.minX);
    bytes[stelle >> 3] |= 1 << (stelle & 7);
  }
  return Buffer.from(bytes).toString('base64');
}
