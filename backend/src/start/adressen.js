/**
 * Unter welchen Adressen dieses Gerät im Heimnetz steht.
 *
 * Gebraucht an zwei Stellen: im Startbericht (welche Adresse tippt die
 * Runde ins iPad?) und beim Ausstellen des Zertifikats für HTTPS (für welche
 * Adressen muss es gelten?). Beide sollen dieselbe Antwort geben.
 *
 * Nur IPv4: Im Heimnetz tippt niemand eine IPv6-Adresse ab, und das
 * Stammzertifikat bürgt nur für private IPv4-Netze (https/zertifikat.js).
 */
import os from 'node:os';

/** Die IPv4-Adressen dieses Geräts, ohne die interne (127.0.0.1). */
export function adressenImHeimnetz() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}
