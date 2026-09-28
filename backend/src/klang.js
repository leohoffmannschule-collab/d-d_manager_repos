/**
 * Der Klangteppich einer Kampagne: was aufliegt, und wo es gerade steht.
 *
 * Hier liegt alles, was mehr als ein Weg braucht – die Kartenbibliothek legt
 * beim Auflegen einer Karte deren Ambiente mit auf, und die Wege in
 * routes/ambience.js bedienen den Rest. Warum das Gleichschalten ohne
 * tickenden Server auskommt, steht dort im Kopf.
 */
import { db, getState, setState } from './db.js';
import { broadcast } from './events.js';
import * as chronik from './chronicle.js';
import { jetzt } from './werte.js';

// Was sich einbetten lässt – und wie eine Spotify-Kennung aussieht
// (immer 22 Zeichen Base62).
const TYPEN = new Set(['playlist', 'album', 'track', 'artist']);
const KENNUNG = /^[A-Za-z0-9]{22}$/;

/**
 * Aus dem, was der DM einfügt, eine saubere Spotify-Adresse machen.
 *
 * Erlaubt sind der Teilen-Link aus der App (auch mit Sprachkürzel wie
 * `/intl-de/` und angehängtem `?si=…`) und die rohe URI. Alles andere fällt
 * durch: Was hier hereinkommt, wird der Runde später als Verweis vorgelegt,
 * und der soll nirgendwo anders hinführen als zu Spotify.
 */
export function spotifyAdresse(eingabe) {
  const text = String(eingabe ?? '').trim();
  if (!text) return null;

  const alsUri = text.match(/^spotify:([a-z]+):([A-Za-z0-9]+)$/);
  if (alsUri) {
    const [, art, id] = alsUri;
    return TYPEN.has(art) && KENNUNG.test(id) ? { uri: `spotify:${art}:${id}`, kind: art } : null;
  }

  let adresse;
  try {
    adresse = new URL(text);
  } catch {
    return null;
  }
  if (adresse.protocol !== 'https:') return null;
  if (!['open.spotify.com', 'play.spotify.com'].includes(adresse.hostname)) return null;

  const teile = adresse.pathname
    .split('/')
    .filter(Boolean)
    .filter((t) => !/^intl-[a-z]{2,3}$/i.test(t));
  if (teile.length < 2) return null;

  const [art, id] = teile;
  return TYPEN.has(art) && KENNUNG.test(id) ? { uri: `spotify:${art}:${id}`, kind: art } : null;
}

/** Die Adresse zum Anklicken. Sie öffnet die App, wo es eine gibt, sonst den Web-Spieler. */
export function webAdresse(uri) {
  const [, art, id] = String(uri ?? '').split(':');
  return art && id ? `https://open.spotify.com/${art}/${id}` : null;
}

export function rowToKlang(row) {
  return {
    id: row.id,
    name: row.name,
    uri: row.uri,
    webUrl: webAdresse(row.uri),
    kind: row.kind,
    tags: JSON.parse(row.tags),
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export const holen = (id) => db.prepare('SELECT * FROM ambience WHERE id = ?').get(id);

/* --- Was gerade aufliegt ------------------------------------------------- */

const STILLE = {
  ambienceId: null,
  uri: null,
  webUrl: null,
  kind: null,
  name: '',
  notes: '',
  seit: null,
  // Der Takt für alle Fenster – siehe den Kopf von routes/ambience.js.
  spielt: false,
  position: 0,
  stand: null,
};

/** Eine Stelle im Stück, in Sekunden. Vier Stunden sind mehr als genug. */
export const stelle = (wert) => Math.min(4 * 60 * 60, Math.max(0, Number(wert) || 0));

export const aktuellerKlang = (campaignId) => ({ ...STILLE, ...getState('klang', campaignId) });

export function setzeKlang(campaignId, werte) {
  const klang = setState('klang', campaignId, { ...STILLE, ...werte });
  broadcast('klang', klang, { campaignId });
  return klang;
}

/**
 * Etwas auflegen – aus der Klangbibliothek, oder weil eine Karte aufgelegt
 * wird, die ihre Ambiente mitbringt. Gibt den neuen Stand zurück, oder `null`,
 * wenn es die Ambiente nicht gibt.
 */
export function klangAuflegen(ambienceId, campaignId) {
  const row = holen(ambienceId);
  if (!row) return null;
  const eintrag = rowToKlang(row);
  const stand = jetzt();
  chronik.log(
    {
      kind: 'klang',
      target: eintrag.name,
      text: `Über dem Tisch liegt „${eintrag.name}“.`,
      meta: { ambienceId: eintrag.id, uri: eintrag.uri },
    },
    campaignId
  );
  return setzeKlang(campaignId, {
    ambienceId: eintrag.id,
    uri: eintrag.uri,
    webUrl: eintrag.webUrl,
    kind: eintrag.kind,
    name: eintrag.name,
    notes: eintrag.notes,
    seit: stand,
    // Aufgelegt heißt aufgelegt: Wer etwas auswählt, will es hören, nicht
    // danach noch einen zweiten Knopf suchen.
    spielt: true,
    position: 0,
    stand,
  });
}
