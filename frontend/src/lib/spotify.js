/**
 * Spotify: Anmeldung und Abspielwerk – die reine Mechanik, ohne React.
 *
 * Zwei Dinge sind hier wichtig zu wissen:
 *
 * 1. Der Almanach-Server sieht niemals ein Spotify-Token. Die Anmeldung läuft
 *    mit PKCE direkt zwischen Browser und Spotify; die Schlüssel liegen in
 *    diesem Browser und sonst nirgends. Auf dem Pi steht nur, *welche*
 *    Wiedergabeliste laufen soll.
 * 2. Der Ton entsteht in dem Fenster, das gerade zuhört. Anders geht es nicht:
 *    Spielt die Runde aus fünf Wohnzimmern, muss jedes Wohnzimmer selbst
 *    klingen. Spotify verlangt dafür Premium – das ist deren Regel, nicht
 *    unsere.
 */

const SPEICHER = 'almanach.spotify';
const MERKZETTEL = 'almanach.spotify.pkce';
const AUTORISIEREN = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
const SDK = 'https://sdk.scdn.co/spotify-player.js';
const WEB_API = 'https://api.spotify.com/v1';

const RECHTE = [
  'streaming', // im Browser abspielen
  'user-read-email', // verlangt das Abspielwerk, um Premium zu prüfen
  'user-read-private',
  'user-read-playback-state', // welche Geräte gibt es?
  'user-modify-playback-state', // starten, pausieren, umleiten
].join(' ');

/** Diese Adresse muss im Spotify-Dashboard als Redirect URI eingetragen sein. */
export const rueckkehrAdresse = () => `${window.location.origin}/spotify`;

/**
 * Spotify verlangt für Anmeldung und Wiedergabe einen sicheren Kontext.
 * Über den Cloudflare-Tunnel ist das gegeben, über `http://192.168.…` nicht –
 * dort fehlt `crypto.subtle`, und ohne das gibt es keinen PKCE-Schlüssel.
 */
export const sichererKontext = () =>
  typeof window !== 'undefined' && window.isSecureContext && !!window.crypto?.subtle;

/* --- Schlüsselbund ------------------------------------------------------- */

function lesen() {
  try {
    return JSON.parse(localStorage.getItem(SPEICHER) ?? 'null');
  } catch {
    return null;
  }
}

function schreiben(daten) {
  try {
    if (daten) localStorage.setItem(SPEICHER, JSON.stringify(daten));
    else localStorage.removeItem(SPEICHER);
  } catch {
    // Privates Fenster ohne Speicher – dann hält die Anmeldung eben nur so lange
    // wie die Seite offen ist.
  }
}

export const istVerbunden = () => !!lesen()?.refreshToken;
export const kontoName = () => lesen()?.konto ?? '';
export function abmelden() {
  schreiben(null);
}

/* --- Anmeldung mit PKCE -------------------------------------------------- */

function zufall(bytes = 48) {
  const roh = new Uint8Array(bytes);
  crypto.getRandomValues(roh);
  return [...roh].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function pruefwert(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Schickt den Browser zu Spotify. Kommt er zurück, landet er auf /spotify. */
export async function anmelden(clientId) {
  if (!sichererKontext()) throw new Error('unsicherer_kontext');
  const verifier = zufall();
  const state = zufall(8);
  sessionStorage.setItem(
    MERKZETTEL,
    JSON.stringify({ verifier, state, zurueck: window.location.pathname + window.location.search })
  );

  const ziel = new URL(AUTORISIEREN);
  ziel.search = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: rueckkehrAdresse(),
    code_challenge_method: 'S256',
    code_challenge: await pruefwert(verifier),
    state,
    scope: RECHTE,
  }).toString();
  window.location.assign(ziel.toString());
}

function ablegen(antwort, konto) {
  schreiben({
    accessToken: antwort.access_token,
    // Bei PKCE schickt Spotify bei jeder Erneuerung einen frischen
    // Auffrischungsschlüssel mit; der alte verfällt.
    refreshToken: antwort.refresh_token ?? lesen()?.refreshToken ?? null,
    gueltigBis: Date.now() + (antwort.expires_in ?? 3600) * 1000,
    konto: konto ?? lesen()?.konto ?? '',
  });
  return antwort.access_token;
}

/** Den Code aus der Rückkehr gegen Schlüssel tauschen. Gibt den Weg zurück. */
export async function rueckkehrEinloesen(clientId, code, state) {
  const roh = sessionStorage.getItem(MERKZETTEL);
  sessionStorage.removeItem(MERKZETTEL);
  const merk = roh ? JSON.parse(roh) : null;
  if (!merk) throw new Error('Die Anmeldung ist abgelaufen. Bitte noch einmal beginnen.');
  if (merk.state !== state) throw new Error('Die Antwort von Spotify passt nicht zur Anfrage.');

  const antwort = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: rueckkehrAdresse(),
      client_id: clientId,
      code_verifier: merk.verifier,
    }),
  });
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) {
    throw new Error(daten.error_description || 'Spotify hat die Anmeldung abgelehnt.');
  }

  ablegen(daten);
  // Namen und Zugangsart gleich mitnehmen – ohne Premium spielt der Browser nicht.
  try {
    const ich = await api(clientId, '/me');
    schreiben({ ...lesen(), konto: ich?.display_name || ich?.id || '', premium: ich?.product === 'premium' });
  } catch {
    // Nicht schlimm; das Abspielwerk sagt es später selbst.
  }
  return merk.zurueck || '/';
}

let laufendeErneuerung = null;

async function erneuern(clientId, refreshToken) {
  const antwort = await fetch(TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId }),
  });
  const daten = await antwort.json().catch(() => ({}));
  if (!antwort.ok) {
    // Zurückgezogen oder abgelaufen: Der Schlüsselbund ist wertlos, weg damit.
    if (antwort.status === 400) schreiben(null);
    return null;
  }
  return ablegen(daten);
}

/** Ein gültiges Zugangstoken – erneuert sich selbst, wenn es fast abgelaufen ist. */
export async function token(clientId) {
  const daten = lesen();
  if (!daten?.refreshToken) return null;
  if (daten.accessToken && daten.gueltigBis - Date.now() > 60_000) return daten.accessToken;

  // Mehrere Aufrufer sollen nicht gleichzeitig erneuern – sonst überholt der
  // eine den anderen und macht dessen frischen Schlüssel ungültig.
  if (!laufendeErneuerung) {
    laufendeErneuerung = erneuern(clientId, daten.refreshToken).finally(() => {
      laufendeErneuerung = null;
    });
  }
  return laufendeErneuerung;
}

/* --- Web-API ------------------------------------------------------------- */

export async function api(clientId, pfad, options = {}) {
  const zugang = await token(clientId);
  if (!zugang) throw new Error('nicht_verbunden');

  const antwort = await fetch(`${WEB_API}${pfad}`, {
    ...options,
    headers: { Authorization: `Bearer ${zugang}`, 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });

  if (antwort.status === 204 || antwort.status === 202) return null;
  const daten = await antwort.json().catch(() => null);
  if (!antwort.ok) {
    const fehler = new Error(daten?.error?.message || `Spotify antwortete mit ${antwort.status}`);
    fehler.status = antwort.status;
    throw fehler;
  }
  return daten;
}

/** Was steckt hinter einer Adresse? Für Name und Bild beim Anlegen. */
export async function nachschlagen(clientId, uri) {
  const [, art, id] = uri.split(':');
  const zweig = { playlist: 'playlists', album: 'albums', track: 'tracks', artist: 'artists' }[art];
  if (!zweig) return null;
  const daten = await api(clientId, `/${zweig}/${id}`);
  const bilder = daten?.images ?? daten?.album?.images ?? [];
  return { name: daten?.name ?? '', imageUrl: bilder.at(-1)?.url ?? bilder[0]?.url ?? '' };
}

/** Wie viele Stücke stehen darin? Für einen zufälligen Einstieg. */
async function laenge(clientId, uri) {
  const [, art, id] = uri.split(':');
  try {
    if (art === 'playlist') return (await api(clientId, `/playlists/${id}?fields=tracks(total)`))?.tracks?.total ?? 0;
    if (art === 'album') return (await api(clientId, `/albums/${id}`))?.total_tracks ?? 0;
  } catch {
    return 0;
  }
  return 0;
}

/* --- Abspielwerk im Browser ---------------------------------------------- */

let sdk = null;

export function ladeSdk() {
  if (sdk) return sdk;
  sdk = new Promise((resolve, reject) => {
    if (window.Spotify) return resolve(window.Spotify);
    // Das Abspielwerk ruft diese Funktion, sobald es bereitsteht.
    window.onSpotifyWebPlaybackSDKReady = () => resolve(window.Spotify);
    const script = document.createElement('script');
    script.src = SDK;
    script.async = true;
    script.onerror = () => {
      sdk = null;
      reject(new Error('Das Spotify-Abspielwerk ließ sich nicht laden – ist der Almanach online?'));
    };
    document.head.appendChild(script);
  });
  return sdk;
}

/**
 * Was soll abgespielt werden? Ein einzelnes Stück wandert als Liste hinein,
 * alles andere als Zusammenhang – nur der kann weiterlaufen.
 */
export async function abspielbefehl(clientId, uri, shuffle) {
  if (uri.startsWith('spotify:track:')) return { uris: [uri] };
  const befehl = { context_uri: uri };

  // Ohne das begänne eine Schankraum-Liste jeden Abend mit demselben Stück.
  // Der Zufallsmodus allein hilft nicht: Spotify mischt erst ab dem zweiten.
  if (shuffle && !uri.startsWith('spotify:artist:')) {
    const anzahl = await laenge(clientId, uri);
    if (anzahl > 1) befehl.offset = { position: Math.floor(Math.random() * anzahl) };
  }
  return befehl;
}

const geraeteAnhang = (deviceId) => (deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '');

/** Auflegen: starten, in Dauerschleife, und danach den Zufall einschalten. */
export async function auflegen(clientId, { uri, shuffle, deviceId }) {
  await api(clientId, `/me/player/play${geraeteAnhang(deviceId)}`, {
    method: 'PUT',
    body: JSON.stringify(await abspielbefehl(clientId, uri, shuffle)),
  });

  // Erst nach dem Start – vorher kennt Spotify für dieses Gerät noch keinen
  // Zusammenhang und weist die Befehle ab. Fehler hier sind Kosmetik.
  const nachher = uri.startsWith('spotify:track:') ? 'track' : 'context';
  await Promise.allSettled([
    api(clientId, `/me/player/repeat?state=${nachher}${deviceId ? `&device_id=${deviceId}` : ''}`, { method: 'PUT' }),
    api(clientId, `/me/player/shuffle?state=${shuffle ? 'true' : 'false'}${deviceId ? `&device_id=${deviceId}` : ''}`, {
      method: 'PUT',
    }),
  ]);
}

export const pausieren = (clientId, deviceId) =>
  api(clientId, `/me/player/pause${geraeteAnhang(deviceId)}`, { method: 'PUT' });

export const weiter = (clientId, deviceId) =>
  api(clientId, `/me/player/play${geraeteAnhang(deviceId)}`, { method: 'PUT' });

export const naechstes = (clientId, deviceId) =>
  api(clientId, `/me/player/next${geraeteAnhang(deviceId)}`, { method: 'POST' });

export const geraete = (clientId) => api(clientId, '/me/player/devices').then((d) => d?.devices ?? []);

export const ferneLautstaerke = (clientId, prozent, deviceId) =>
  api(clientId, `/me/player/volume?volume_percent=${Math.round(prozent)}${deviceId ? `&device_id=${deviceId}` : ''}`, {
    method: 'PUT',
  });
