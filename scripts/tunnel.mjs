#!/usr/bin/env node
/**
 * Der Weg nach außen – ohne Docker, ohne Portfreigabe, ohne Konto.
 *
 *   npm run tunnel
 *
 * Ein Programm ruft von innen nach außen an und hält die Leitung offen; die
 * Runde erreicht den Almanach über die Adresse, die es sich dafür leiht. Drei
 * Anbieter kommen dafür infrage, und dieses Skript probiert sie in dieser
 * Reihenfolge durch, bis einer da ist:
 *
 *   1. cloudflared        – am robustesten, aber ein eigenes Programm, das
 *                            erst geholt werden muss (unter Windows eine .exe)
 *   2. ssh → localhost.run – kein Herunterladen nötig: SSH bringt praktisch
 *                            jedes Windows, macOS und Linux schon mit. Braucht
 *                            aber ausgehendes Port 22, das mancher
 *                            Firmenrechner sperrt.
 *   3. npx localtunnel     – kommt über npm, lädt also nichts Kompiliertes
 *                            nach. Zeigt Mitspielern beim ersten Aufruf eine
 *                            Zwischenseite, und der freie Dienst ist bekannt
 *                            launisch.
 *
 * Wer einen bestimmten Weg erzwingen will: TUNNEL_ANBIETER=cloudflared,
 * TUNNEL_ANBIETER=ssh oder TUNNEL_ANBIETER=localtunnel vor den Befehl stellen.
 *
 * **Mit einem TUNNEL_TOKEN läuft es andersherum.** Dann wird nichts geliehen:
 * Cloudflare weiß aus dem Kennwort, welcher *benannte* Tunnel das ist und
 * welche Domain daran hängt, und der Almanach meldet sich dort an statt sich
 * eine Adresse zu leihen. Die Adresse wechselt nie wieder, gleichgültig in
 * welchem Netz der Rechner steht, und die Runde tippt vor jedem Spielabend
 * dieselbe. Gebraucht wird dafür `cloudflared` – dasselbe Programm wie oben
 * unter 1., nur mit eigenem Kennwort statt geliehener Adresse. Einrichtung
 * einmalig, kostenlos und ganz ohne Kreditkarte: docs/EINRICHTUNG.md,
 * Schritt 6.5.
 *
 * Auf dem Pi macht den Schnelltunnel der Container aus docker-compose.yml.
 * Auf einem Laptop gibt es keinen Container – dieses Skript startet das
 * gewählte Programm direkt und schreibt sein Protokoll nach `data/tunnel.log`,
 * damit `npm run adresse` die Adresse dort wiederfindet.
 *
 * Die Teile stehen in `tunnel/`: grundlagen.mjs (Port, Ordner, welche
 * Programme laufen), anbieter.mjs (die drei Anbieter), anleitung.mjs (was
 * tun, wenn keiner da ist), benannt.mjs und schnell.mjs (die beiden Wege).
 *
 * Beenden mit Strg+C. Der Almanach selbst läuft davon unbeirrt weiter; nur
 * der Weg von außen ist dann wieder zu.
 */
// Zuerst die .env lesen: TUNNEL_TOKEN, DOMAENE und PORT können dort stehen.
import '../backend/src/umgebung.js';
import { benannterTunnel } from './tunnel/benannt.mjs';
import { schnellTunnel } from './tunnel/schnell.mjs';

// Mit eigener Domain gibt es nichts zu wählen: Dann führt genau ein Weg hinaus.
if (process.env.TUNNEL_TOKEN) benannterTunnel();
else schnellTunnel();
