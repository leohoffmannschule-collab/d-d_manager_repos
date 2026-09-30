/**
 * Das Werkzeug des Vertrags: ein eigener Server, ein Klient mit Keksdose,
 * und die Buchführung über bestandene und verfehlte Prüfungen.
 *
 * Jedes Kapitel in diesem Ordner holt sich von hier `pruefe`, `gleich` und
 * `klient`; der Durchgang selbst (../vertrag.mjs) startet den Server,
 * lässt die Kapitel der Reihe nach laufen und fällt am Ende das Urteil.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Ein zufälliger freier Port, damit ein laufender Almanach nicht stört. */
export const PORT = 3400 + Math.floor(Math.random() * 400);
/** Die Adresse der API dieses Prüfservers. */
export const BASIS = `http://localhost:${PORT}/api`;
const datenordner = mkdtempSync(path.join(tmpdir(), 'almanach-vertrag-'));

let bestanden = 0;
const maengel = [];

/**
 * Eine Zusage prüfen. Gibt zurück, ob sie hielt – so lassen sich Folgeprüfungen
 * überspringen, die ohne sie keinen Sinn ergäben.
 */
export function pruefe(bedingung, was, hinweis = '') {
  if (bedingung) {
    bestanden += 1;
    return true;
  }
  maengel.push(`${was}${hinweis ? ` – ${hinweis}` : ''}`);
  return false;
}

/** Zwei Werte müssen gleich sein; im Mangel stehen beide. */
export const gleich = (ist, soll, was) => pruefe(ist === soll, was, `erwartet ${JSON.stringify(soll)}, war ${JSON.stringify(ist)}`);

/* --- Ein kleiner Klient mit Keksdose ------------------------------------- */

/**
 * Ein Klient, der sich Cookies merkt wie ein Browser – eine Person am Tisch.
 * `ruf(pfad, { methode, koerper })` gibt `{ status, daten }` zurück.
 */
export function klient() {
  const kekse = new Map();
  return {
    kekse,
    async ruf(pfad, { methode = 'GET', koerper, roh = false } = {}) {
      const kopf = { 'Content-Type': 'application/json' };
      if (kekse.size) kopf.cookie = [...kekse].map(([k, v]) => `${k}=${v}`).join('; ');
      const anfrage = { method: methode, headers: kopf };
      if (koerper !== undefined) anfrage.body = JSON.stringify(koerper);
      const antwort = await fetch(`${BASIS}${pfad}`, anfrage);
      for (const rohkeks of antwort.headers.getSetCookie?.() ?? []) {
        const [paar] = rohkeks.split(';');
        const index = paar.indexOf('=');
        kekse.set(paar.slice(0, index), paar.slice(index + 1));
      }
      if (roh) return { status: antwort.status, text: await antwort.text() };
      const text = await antwort.text();
      let daten = null;
      try {
        daten = text ? JSON.parse(text) : null;
      } catch {
        daten = text;
      }
      return { status: antwort.status, daten };
    },
  };
}

/* --- Am Live-Kanal mithören --------------------------------------------- */

/**
 * Den Live-Kanal eines Klienten mitschreiben – so, wie ihn sein Browser
 * bekäme.
 *
 * Gebraucht für Zusagen der Art „davon erfährt die Runde nichts“: Was hier
 * nicht ankommt, stünde auch im Netzwerkfenster des Browsers nicht.
 *
 *   warteAuf(teil, frist)  wartet, bis der mitgeschriebene Text `teil`
 *                          enthält (höchstens `frist` ms); gibt zurück, ob
 *                          er kam
 *   text()                 alles bisher Gelesene
 *   zu()                   den Kanal schließen
 */
export async function mitschreiben(wer) {
  const kekse = [...wer.kekse].map(([k, v]) => `${k}=${v}`).join('; ');
  const antwort = await fetch(`${BASIS}/stream`, { headers: { cookie: kekse } });
  const leser = antwort.body.getReader();
  const dekoder = new TextDecoder();
  let text = '';
  const lauf = (async () => {
    try {
      for (;;) {
        const { value, done } = await leser.read();
        if (done) break;
        text += dekoder.decode(value, { stream: true });
      }
    } catch {
      /* geschlossen */
    }
  })();
  return {
    text: () => text,
    async warteAuf(teil, frist = 3000) {
      const ende = Date.now() + frist;
      while (!text.includes(teil) && Date.now() < ende) await new Promise((weiter) => setTimeout(weiter, 25));
      return text.includes(teil);
    },
    async zu() {
      await leser.cancel().catch(() => {});
      await lauf;
    },
  };
}

/* --- Server hochfahren --------------------------------------------------- */

const server = spawn('node', [path.join(wurzel, 'backend', 'src', 'server.js')], {
  env: { ...process.env, DATA_DIR: datenordner, PORT: String(PORT) },
  stdio: ['ignore', 'ignore', 'pipe'],
});
/** Was der Server auf stderr sagte – falls er nicht hochkommt. */
export let serverFehler = '';
server.stderr.on('data', (d) => (serverFehler += d.toString()));

/** Warten, bis der Server antwortet – höchstens fünfzehn Sekunden. */
export async function warteAufServer() {
  for (let versuch = 0; versuch < 60; versuch++) {
    try {
      const antwort = await fetch(`${BASIS}/health`);
      if (antwort.ok) return true;
    } catch {
      /* noch nicht da */
    }
    await new Promise((weiter) => setTimeout(weiter, 250));
  }
  return false;
}

/** Server anhalten, Datenordner wegräumen, mit diesem Code enden. */
export function beenden(code) {
  server.kill('SIGTERM');
  rmSync(datenordner, { recursive: true, force: true });
  process.exit(code);
}

/** Einen Mangel eintragen, der keine einzelne Prüfung ist – etwa einen Abbruch. */
export function mangel(text) {
  maengel.push(text);
}

/** Das Urteil: alles bestanden, oder die Liste dessen, was nicht hielt. */
export function urteil() {
  console.log('');
  if (maengel.length === 0) {
    console.log(`  Der Vertrag hält: ${bestanden} Prüfungen bestanden.`);
    beenden(0);
  }
  console.log(`  ${bestanden} Prüfungen bestanden, ${maengel.length} nicht:`);
  for (const eintrag of maengel) console.log(`   – ${eintrag}`);
  beenden(1);
}
