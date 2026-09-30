/**
 * Was jeder Weg nach außen braucht: Port, Datenordner, Protokolldatei, und
 * die Frage, welche Programme auf diesem Gerät überhaupt laufen.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Der Ordner des Almanachs – dort sucht der Tunnel auch nach einem danebengelegten cloudflared. */
export const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
/** Der Port, auf dem der Almanach lauscht und zu dem der Tunnel die Runde bringt. */
export const PORT = Number(process.env.PORT) || 3001;
/** Derselbe Datenordner wie der des Servers. */
export const datenordner = process.env.DATA_DIR || path.join(wurzel, 'backend', 'data');
/** Hier schreibt der Tunnel mit – `npm run adresse` liest die Adresse von dort. */
export const protokoll = path.join(datenordner, 'tunnel.log');
/** Unter Windows heißt npx `npx.cmd`. */
export const NPX = process.platform === 'win32' ? 'npx.cmd' : 'npx';

/** Eine Zeile für die Person vor dem Fenster. */
export const sagen = (text = '') => console.log(text);

/** Läuft dieser Befehl hier – und endet er sauber? */
export function laeuft(befehl, args) {
  const lauf = spawnSync(befehl, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return !lauf.error && lauf.status === 0;
}

/**
 * Drei Stellen, in dieser Reihenfolge: eine ausdrücklich genannte, der
 * Suchpfad des Systems, und – für den Fall, dass man das Programm nur
 * heruntergeladen und nicht installiert hat – neben dem Almanach selbst.
 */
export function findeCloudflared() {
  if (process.env.CLOUDFLARED) {
    return laeuft(process.env.CLOUDFLARED, ['--version']) ? process.env.CLOUDFLARED : null;
  }
  if (laeuft('cloudflared', ['--version'])) return 'cloudflared';
  const daneben = process.platform === 'win32' ? 'cloudflared.exe' : 'cloudflared';
  for (const ordner of [wurzel, datenordner]) {
    const pfad = path.join(ordner, daneben);
    if (fs.existsSync(pfad) && laeuft(pfad, ['--version'])) return pfad;
  }
  return null;
}

/** Ist Docker da? Dann gäbe es noch den Weg über den Container. */
export const hatDocker = () => laeuft('docker', ['version']);
