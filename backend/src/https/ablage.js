/**
 * Wo die Zertifikate liegen, und was der Server beim Start damit macht.
 *
 * Alles liegt im Datenordner im Unterordner `tls` – neben der Datenbank,
 * damit es im Docker-Volume den Neubau des Abbilds übersteht:
 *
 *   stamm.crt      das Stammzertifikat (öffentlich; die Geräte laden es
 *                  unter /almanach-stamm.crt)
 *   stamm.key      sein Schlüssel – verlässt dieses Gerät nie
 *   almanach.crt   das Serverzertifikat
 *   almanach.key   sein Schlüssel
 *   namen.json     was beim Anlegen eigens genannt wurde (Adressen, Namen)
 *                  und wofür das Stammzertifikat bürgen darf, damit ein
 *                  erneuter Lauf es nicht vergisst
 *
 * Angelegt wird das von `npm run zertifikat` (backend/scripts/zertifikat.mjs).
 * Liegen Serverzertifikat und -schlüssel da, lauscht der Almanach beim
 * Start zusätzlich per HTTPS (Vorgabe: Port 3443). Fehlen sie, bleibt alles,
 * wie es war.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { dataDir } from '../db.js';

/** Der Ordner der Zertifikate im Datenordner. */
export const TLS_ORDNER = path.join(dataDir, 'tls');

/** Die Dateien darin (siehe oben). */
export const TLS_DATEIEN = {
  stammZertifikat: path.join(TLS_ORDNER, 'stamm.crt'),
  stammSchluessel: path.join(TLS_ORDNER, 'stamm.key'),
  zertifikat: path.join(TLS_ORDNER, 'almanach.crt'),
  schluessel: path.join(TLS_ORDNER, 'almanach.key'),
  namen: path.join(TLS_ORDNER, 'namen.json'),
};

/** Der Port für HTTPS: `HTTPS_PORT`, sonst 3443. */
export const httpsPort = () => Number(process.env.HTTPS_PORT) || 3443;

// Der Port, auf dem gerade HTTPS lauscht – oder null. Die Anmeldeseite
// fragt danach (über /api/health).
let aktiverPort = null;

/** Der Port des HTTPS-Eingangs, sobald er lauscht – sonst null. */
export const httpsAktiv = () => aktiverPort;

const lies = (datei) => (fs.existsSync(datei) ? fs.readFileSync(datei, 'utf8') : null);

/**
 * Was an Zertifikaten da ist – oder null, wenn es keine gibt.
 *
 * @returns {null | {
 *   schluessel: string, zertifikat: string, stamm: string|null,
 *   fingerabdruck: string|null, bis: Date, namen: string[], adressen: string[],
 *   fehler?: string
 * }}
 */
export function ladeZertifikate() {
  const zertifikat = lies(TLS_DATEIEN.zertifikat);
  const schluessel = lies(TLS_DATEIEN.schluessel);
  if (!zertifikat || !schluessel) return null;
  const stamm = lies(TLS_DATEIEN.stammZertifikat);
  try {
    const x509 = new crypto.X509Certificate(zertifikat);
    // „DNS:localhost, IP Address:192.168.1.20“ – so gibt Node die Namen aus.
    const alternative = (x509.subjectAltName ?? '').split(', ').filter(Boolean);
    return {
      schluessel,
      zertifikat,
      stamm,
      fingerabdruck: stamm ? new crypto.X509Certificate(stamm).fingerprint256 : null,
      bis: new Date(x509.validTo),
      namen: alternative.filter((n) => n.startsWith('DNS:')).map((n) => n.slice(4)),
      adressen: alternative.filter((n) => n.startsWith('IP Address:')).map((n) => n.slice(11)),
    };
  } catch (err) {
    return { fehler: err.message };
  }
}

/**
 * Was vom letzten Lauf gemerkt ist: die eigens genannten Adressen und Namen
 * (`zusatz`) und die Namensräume, für die das Stammzertifikat bürgen darf
 * (`stamm`, null wenn unbekannt).
 */
export function gemerkteNamen() {
  const texte = (liste) => (Array.isArray(liste) ? liste.filter((n) => typeof n === 'string') : null);
  try {
    const gelesen = JSON.parse(lies(TLS_DATEIEN.namen) ?? '{}');
    return { zusatz: texte(gelesen.zusatz) ?? [], stamm: texte(gelesen.stamm) };
  } catch {
    return { zusatz: [], stamm: null };
  }
}

/**
 * Eine Datei schreiben – Schlüssel nur für den Besitzer lesbar.
 *
 * Erst in eine Nebendatei, dann umbenennen: Bricht es mittendrin ab, liegt
 * kein halbes Zertifikat da, an dem der nächste Start scheitert.
 */
export function schreibe(datei, inhalt, geheim = false) {
  fs.mkdirSync(TLS_ORDNER, { recursive: true });
  const zwischen = `${datei}.neu`;
  fs.writeFileSync(zwischen, inhalt, { mode: geheim ? 0o600 : 0o644 });
  fs.renameSync(zwischen, datei);
}

/**
 * Den HTTPS-Zugang aufmachen, wenn Zertifikate da sind.
 *
 * Es ist *derselbe* Almanach (dieselbe Express-Anwendung, dieselben offenen
 * Live-Kanäle), nur über einen zweiten Eingang. Der alte über http bleibt:
 * Der Tunnel spricht ihn an, und wer noch nichts eingerichtet hat, soll
 * nicht vor verschlossener Tür stehen.
 *
 * @param {import('express').Express} app
 * @returns {Promise<null | { fehler: string } | (ReturnType<typeof ladeZertifikate> & { port: number })>}
 *   null ohne Zertifikate; `fehler`, wenn sie unlesbar sind oder der Port
 *   belegt ist – der Almanach läuft dann über http weiter
 */
export async function starteHttps(app) {
  const tls = ladeZertifikate();
  if (!tls || tls.fehler) return tls;
  const { createServer } = await import('node:https');
  const port = httpsPort();
  try {
    const server = createServer({ key: tls.schluessel, cert: tls.zertifikat }, app);
    await new Promise((fertig, scheitern) => {
      server.once('error', scheitern);
      server.listen(port, () => {
        server.off('error', scheitern);
        fertig();
      });
    });
    // Was nach dem Start schiefgeht (ein Gerät, das mitten im Handschlag
    // abbricht), gehört ins Protokoll, nicht zum Absturz.
    server.on('error', (err) => console.error('HTTPS:', err.message));
    aktiverPort = port;
    return { ...tls, port };
  } catch (err) {
    return { fehler: err.code === 'EADDRINUSE' ? `Port ${port} ist belegt (HTTPS_PORT in der .env ändern).` : err.message };
  }
}
