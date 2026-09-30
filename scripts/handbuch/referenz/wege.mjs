/**
 * Verzeichnis: jeder Weg der Schnittstelle – Methode, Pfad, wer darf, wo
 * er steht und was der Kommentar über ihm sagt.
 *
 * Gelesen wird, wie Express es auch tut: Welcher Router hängt in
 * backend/src/server.js unter welchem Pfad (`app.use('/api/…', …)`), welche
 * Wächter stehen davor, welche Teilrouter hängt ein Router ohne eigenen
 * Pfad ein (`router.use(teil)`), und welche Wege legt jeder an
 * (`router.get('/pfad', wächter…, handler)`). Ein Wächter, den ein Router
 * mit `router.use(requireDm)` für sich setzt, gilt für alle Wege danach.
 *
 * docs/API.md beschreibt die Schnittstelle mit Beispielen; dieses
 * Verzeichnis ist die vollständige Liste, die mit jedem Bau stimmt.
 */
import path from 'node:path';
import { kapitelKopf, kommentarVor, lesen, relativ } from './quelle.mjs';

/** Wie die Wächter im Buch heißen. */
const WAECHTER = {
  requireAuth: 'angemeldet',
  requireCampaign: 'Kampagne gewählt',
  requireDm: 'Spielleitung',
  attachUser: '',
};

/** Die Einfuhren einer Datei: Name → Pfad (nur relative, also eigene Dateien). */
function einfuhren(datei, text) {
  const karte = new Map();
  for (const m of text.matchAll(/import\s+(\w+)\s+from\s+'(\.[^']+)'/g)) {
    karte.set(m[1], path.resolve(path.dirname(datei), m[2]));
  }
  return karte;
}

/**
 * Die Wege einer Router-Datei, samt der Teilrouter, die sie einhängt.
 *
 * @param {string} datei
 * @param {string} praefix   der Pfad, unter dem der Router hängt
 * @param {string[]} waechter  was davor schon prüft
 */
function wegeIn(datei, praefix, waechter) {
  const text = lesen(datei);
  const zeilen = text.split('\n');
  const teile = einfuhren(datei, text);
  const eigene = [...waechter];
  const liste = [];

  zeilen.forEach((zeile, i) => {
    const benutzt = /^router\.use\((\w+)\);/.exec(zeile);
    if (benutzt) {
      const name = benutzt[1];
      if (teile.has(name)) liste.push(...wegeIn(teile.get(name), praefix, eigene));
      else if (name in WAECHTER) eigene.push(name);
      return;
    }
    const weg = /^router\.(get|post|put|patch|delete)\(\s*('([^']*)'|\/[^/]*\/)?/.exec(zeile);
    if (!weg) return;
    // Der Pfad steht in derselben oder der nächsten Zeile.
    const pfadZeile = weg[2] ? zeile : zeilen[i + 1] ?? '';
    const pfad = weg[3] ?? (/'([^']*)'/.exec(pfadZeile)?.[1] ?? '*');
    const rest = pfadZeile.slice(pfadZeile.indexOf(pfad) + pfad.length);
    const inline = [...rest.matchAll(/\b(require\w+|\w+Pruefen)\b/g)].map((m) => m[1]);
    // Zwei Wege direkt untereinander teilen sich den Kommentar darüber
    // (`next-turn` und `prev-turn`).
    const vorher = liste[liste.length - 1];
    const geteilt = !kommentarVor(zeilen, i) && vorher?.datei === datei && vorher.zeile === i ? vorher.text : '';
    liste.push({
      methode: weg[1].toUpperCase(),
      pfad: (praefix + (pfad === '/' ? '' : pfad === '*' ? '/…' : pfad)).replace(/\/$/, '') || '/',
      waechter: [...new Set([...eigene, ...inline])],
      datei,
      zeile: i + 1,
      text: kommentarVor(zeilen, i) || geteilt,
    });
  });
  return liste;
}

/** Alle Wege des Servers, in der Reihenfolge, in der Express sie prüft. */
export function alleWege(wurzel) {
  const server = path.join(wurzel, 'backend', 'src', 'server.js');
  const text = lesen(server);
  const zeilen = text.split('\n');
  const teile = einfuhren(server, text);
  const liste = [];
  zeilen.forEach((zeile, i) => {
    const eingehängt = /^app\.use\('([^']+)',\s*(.*?)(\w+)\);/.exec(zeile);
    if (eingehängt && teile.has(eingehängt[3])) {
      const waechter = [...eingehängt[2].matchAll(/(\w+),/g)].map((m) => m[1]);
      liste.push(...wegeIn(teile.get(eingehängt[3]), eingehängt[1], waechter));
      return;
    }
    const direkt = /^app\.(get|post)\('([^']+)',\s*(?:(\w+),\s*)?/.exec(zeile);
    if (direkt) {
      liste.push({
        methode: direkt[1].toUpperCase(),
        pfad: direkt[2],
        waechter: direkt[3] && direkt[3] in WAECHTER ? [direkt[3]] : [],
        datei: server,
        zeile: i + 1,
        text: kommentarVor(zeilen, i),
      });
    }
  });
  return liste;
}

/**
 * Der Kommentar über einem Weg beginnt oft mit dessen Kopfzeile
 * („POST /api/scenes/vorhang  { zu }“). In der Tabelle steht die schon
 * davor – dort zählt, was danach kommt. Bleibt nichts, ist die erwartete
 * Nutzlast die beste Beschreibung.
 */
function wasTut(weg) {
  let text = weg.text.replace(/\s+/g, ' ').trim();
  text = text.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+\S+\s*/, '');
  const nutzlast = /^\{[^}]*\}/.exec(text)?.[0] ?? '';
  text = text.slice(nutzlast.length).replace(/^[\s–-]+/, '');
  const satz = /^(.+?[.!?])(\s|$)/.exec(text)?.[1] ?? text;
  return (satz || (nutzlast ? `Nutzlast: \`${nutzlast}\`` : '–')).replace(/\|/g, '\\|');
}

/** Wer darf – aus den Wächtern ein kurzer Satz. */
function werDarf(waechter) {
  const namen = waechter.map((w) => WAECHTER[w] ?? w).filter(Boolean);
  if (namen.includes('Spielleitung')) return 'Spielleitung' + (namen.includes('Kampagne gewählt') ? ', Kampagne gewählt' : '');
  if (namen.includes('Kampagne gewählt')) return 'angemeldet, Kampagne gewählt';
  if (namen.includes('angemeldet')) return 'angemeldet';
  return namen.join(', ') || 'jeder';
}

/** Das Kapitel. */
export const WEGE = {
  datei: '83-wege.md',
  erzeugen(wurzel) {
    const liste = alleWege(wurzel);
    const nachBereich = new Map();
    for (const w of liste) {
      const bereich = w.pfad.split('/').slice(0, 3).join('/');
      if (!nachBereich.has(bereich)) nachBereich.set(bereich, []);
      nachBereich.get(bereich).push(w);
    }
    const abschnitte = [...nachBereich.entries()].map(([bereich, wege]) => {
      const tabelle = [
        '| Methode | Pfad | Wer darf | Was |',
        '|---|---|---|---|',
        ...wege.map((w) => `| ${w.methode} | \`${w.pfad}\` | ${werDarf(w.waechter)} | ${w.text ? wasTut(w) : '–'} |`),
      ].join('\n');
      const einzeln = wege
        .map((w) => {
          const kopf = `### ${w.methode} ${w.pfad}\n\n*${relativ(wurzel, w.datei)}, Zeile ${w.zeile} · ${werDarf(w.waechter)}*`;
          return w.text ? `${kopf}\n\n${w.text.replace(/^(\s*)–\s/gm, '$1- ')}` : kopf;
        })
        .join('\n\n');
      return `## ${bereich}\n\n${tabelle}\n\n${einzeln}`;
    });
    return (
      kapitelKopf(
        'Verzeichnis der Wege',
        `Alle ${liste.length} Wege der Schnittstelle, nach Bereichen, in der Reihenfolge, in der Express sie prüft. „Wer darf“ setzt sich aus den Wächtern zusammen, die davor stehen: *angemeldet* (requireAuth), *Kampagne gewählt* (requireCampaign – schließt die Anmeldung ein) und *Spielleitung* (requireDm).

Die Beschreibung jedes Weges ist der Kommentar, der im Code über ihm steht. Beispiele für Anfragen und Antworten stehen im Kapitel über die Schnittstelle.`
      ) +
      '\n' +
      abschnitte.join('\n\n') +
      '\n'
    );
  },
};
