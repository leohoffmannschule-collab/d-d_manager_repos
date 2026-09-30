/**
 * Der einzige Ort, an dem diese Oberfläche den Server anspricht.
 *
 * Jede Funktion hier ist ein Weg des Servers, eins zu eins. Kein Bauteil
 * ruft `fetch` selbst auf – das hat zwei handfeste Gründe: Ändert sich ein
 * Weg, ist diese Datei die einzige Baustelle; und die Fehlerbehandlung
 * unten gilt damit für alle Aufrufe gleichermaßen.
 *
 * Wer wissen will, was der Server zu einem Weg sagt, findet die Beschreibung
 * in docs/API.md und den Code in backend/src/routes/.
 *
 * Die Wege liegen nach Sachgebieten in api/:
 *
 *   api/anfrage.js  – der Unterbau: request, post, put, patch, del
 *   api/konten.js   – Anmeldung, Konten, Einladungen, Kampagnen
 *   api/blatt.js    – Charakterblätter, Kompendium, Würfel
 *   api/kampf.js    – laufender Kampf, Bestiarium, Begegnungen, Beute
 *   api/chronik.js  – Chronik, Notizen und Handzettel, Chat
 *   api/tisch.js    – Szenen, Bilder, Karten, Klang
 *
 * Eingeführt wird trotzdem immer von hier (`from '../lib/api.js'`): Ein
 * Bauteil soll nicht wissen müssen, in welcher Datei ein Weg steht.
 */
export { setClientId } from './api/anfrage.js';
export { authApi, campaignsApi } from './api/konten.js';
export { charactersApi, compendiumApi, diceApi } from './api/blatt.js';
export { encounterApi, encountersApi, libraryApi, stashApi } from './api/kampf.js';
export { chatApi, chronicleApi, notesApi } from './api/chronik.js';
export { ambienceApi, mapsApi, mediaApi, scenesApi } from './api/tisch.js';
