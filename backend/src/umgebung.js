import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Die eigene Umgebung aus der Datei `.env` neben dem Almanach.
 *
 * Im Container stellt Docker die Werte selbst zusammen; auf einem Laptop gibt
 * es nichts dergleichen. Damit dort nicht vor jedem Spielabend
 * `DOMAENE=… TUNNEL_ZIEL=… npm start` getippt werden muss, liest der Almanach
 * beim Start die Datei `.env` ein – dieselbe, aus der auch `docker compose`
 * schöpft.
 *
 * Was schon in der Umgebung steht, bleibt stehen: `PORT=3002 npm start`
 * schlägt also die Datei und nicht umgekehrt.
 *
 * Dieses Modul gehört als **erstes** importiert – die Werte müssen dastehen,
 * bevor ein anderes sie liest (der Datenordner etwa wird beim Laden der
 * Datenbank gebraucht, nicht erst beim ersten Zugriff).
 */

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function laden() {
  const datei = path.join(wurzel, '.env');
  if (!fs.existsSync(datei)) return { datei, gelesen: false, grund: 'keine' };
  // Node bringt den Leser seit 20.12 selbst mit. Darunter bleibt die Datei
  // liegen – schweigend wäre das eine böse Falle, deshalb sagt der Server es
  // beim Start, wenn eine Datei da ist, die er nicht lesen kann.
  if (typeof process.loadEnvFile !== 'function') return { datei, gelesen: false, grund: 'node_zu_alt' };
  try {
    process.loadEnvFile(datei);
    return { datei, gelesen: true, grund: null };
  } catch (err) {
    return { datei, gelesen: false, grund: 'fehler', fehler: err.message };
  }
}

export const umgebung = laden();
