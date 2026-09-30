#!/usr/bin/env node
/**
 * HTTPS im Heimnetz einrichten – ohne Download, nur mit Node.
 *
 *   npm run zertifikat                          für die Adressen dieses Geräts
 *   npm run zertifikat -- 192.168.1.20          eine Adresse dazu (etwa im
 *                                               Docker-Container die des Pi)
 *   npm run zertifikat -- almanach.fritz.box    einen Namen im Heimnetz dazu
 *   npm run zertifikat -- --neu                 auch ein neues Stammzertifikat
 *
 * Beim ersten Lauf entsteht ein Stammzertifikat (die eigene kleine
 * Ausstellungsstelle) und ein Serverzertifikat für localhost, den Namen
 * dieses Rechners und seine Adressen im Heimnetz. Jeder weitere Lauf stellt
 * nur das Serverzertifikat neu aus – etwa wenn der Router dem Gerät eine
 * neue Adresse gegeben hat. Die Geräte der Runde merken davon nichts, wenn
 * sie das Stammzertifikat installiert haben.
 *
 * Eigens genannte Adressen und Namen werden gemerkt (namen.json im Ordner
 * `tls` des Datenordners), damit ein späterer Lauf ohne Angaben sie nicht
 * wieder verliert.
 *
 * Danach den Almanach neu starten; der Startbericht nennt die https-Adressen
 * und den Fingerabdruck des Stammzertifikats. Wie man es auf iPad, Telefon
 * und Rechner installiert, steht in docs/EINRICHTUNG.md.
 */
import fs from 'node:fs';
import { adressenImHeimnetz } from '../src/start/adressen.js';
import { TLS_DATEIEN, gemerkteNamen, httpsPort, ladeZertifikate, schreibe } from '../src/https/ablage.js';
import {
  HEIMNAMEN,
  erzeugeServer,
  erzeugeStamm,
  fingerabdruck,
  ipBytes,
  istName,
  istPrivat,
  namensraumDeckt,
  rechnername,
} from '../src/https/zertifikat.js';

const argumente = process.argv.slice(2);
const neuerStamm = argumente.includes('--neu');
const angaben = argumente.filter((a) => !a.startsWith('--')).map((a) => a.trim().toLowerCase());

const sagen = (text = '') => console.log(text ? `  ${text}` : '');
const abbruch = (...zeilen) => {
  sagen();
  for (const z of zeilen) sagen(z);
  sagen();
  process.exit(1);
};

// Erst prüfen, dann schreiben: Eine falsche Angabe soll nichts anlegen.
for (const angabe of angaben) {
  if (ipBytes(angabe)) {
    if (!istPrivat(angabe)) {
      abbruch(
        `${angabe} ist keine Adresse im Heimnetz.`,
        'Von außen kommt die Runde über den Tunnel – der bringt sein eigenes Zertifikat mit.'
      );
    }
  } else if (!istName(angabe)) {
    abbruch(`„${angabe}“ ist weder eine Adresse noch ein Name.`);
  }
}

const gemerkt = gemerkteNamen();
const zusatz = [...new Set([...gemerkt.zusatz, ...angaben])];
const zusatzAdressen = zusatz.filter((a) => ipBytes(a));
const zusatzNamen = zusatz.filter((a) => !ipBytes(a));

// Das Stammzertifikat: vorhanden lassen, außer es fehlt oder --neu.
let stamm;
const stammDa = fs.existsSync(TLS_DATEIEN.stammZertifikat) && fs.existsSync(TLS_DATEIEN.stammSchluessel);
if (stammDa && !neuerStamm) {
  stamm = {
    zertifikat: fs.readFileSync(TLS_DATEIEN.stammZertifikat, 'utf8'),
    schluessel: fs.readFileSync(TLS_DATEIEN.stammSchluessel, 'utf8'),
    // Für welche Namensräume es bürgen darf, steht beim Anlegen in namen.json.
    namen: gemerkt.stamm ?? [...HEIMNAMEN, rechnername()].filter(Boolean),
  };
} else {
  stamm = erzeugeStamm(zusatzNamen);
  schreibe(TLS_DATEIEN.stammSchluessel, stamm.schluessel, true);
  schreibe(TLS_DATEIEN.stammZertifikat, stamm.zertifikat);
}

// Das Serverzertifikat: localhost, der Rechnername (auch mit .local), die
// Adressen im Heimnetz und was eigens genannt wurde.
const eigenerName = rechnername();
const namen = [...new Set(['localhost', eigenerName, eigenerName && `${eigenerName}.local`, ...zusatzNamen].filter(Boolean))];
const adressen = [...new Set(['127.0.0.1', ...adressenImHeimnetz().filter(istPrivat), ...zusatzAdressen])];

// Ein neuer Name, für den ein altes Stammzertifikat nicht bürgen darf,
// braucht ein neues – sonst lehnt jeder Browser das Serverzertifikat ab.
const ausserhalb = namen.filter((n) => !namensraumDeckt(stamm.namen, n));
if (ausserhalb.length > 0) {
  abbruch(
    `Das vorhandene Stammzertifikat darf nicht für ${ausserhalb.join(', ')} bürgen.`,
    `Ein neues anlegen: npm run zertifikat -- --neu ${ausserhalb.join(' ')}`,
    'Danach muss es auf den Geräten der Runde neu installiert werden.'
  );
}

const server = erzeugeServer({ stammSchluessel: stamm.schluessel, stammZertifikat: stamm.zertifikat, namen, adressen });
schreibe(TLS_DATEIEN.schluessel, server.schluessel, true);
schreibe(TLS_DATEIEN.zertifikat, server.zertifikat);
schreibe(TLS_DATEIEN.namen, `${JSON.stringify({ zusatz, stamm: stamm.namen }, null, 2)}\n`);

const geladen = ladeZertifikate();
sagen();
sagen(stammDa && !neuerStamm ? 'Serverzertifikat erneuert.' : 'Stammzertifikat und Serverzertifikat angelegt.');
sagen();
sagen(`Gilt für        : ${[...geladen.namen, ...geladen.adressen].join(', ')}`);
sagen(`Gültig bis      : ${geladen.bis.toLocaleDateString('de-DE')}`);
sagen(`Liegt in        : ${TLS_DATEIEN.zertifikat}`);
sagen(`Fingerabdruck   : ${fingerabdruck(stamm.zertifikat)}`);
sagen('                  (des Stammzertifikats – beim Installieren auf den Geräten vergleichen)');
sagen();
sagen('Den Almanach jetzt neu starten. Danach ist er zusätzlich erreichbar unter');
for (const adresse of adressen.filter((a) => a !== '127.0.0.1')) sagen(`  https://${adresse}:${httpsPort()}`);
sagen();
sagen('Damit die Geräte keine Warnung zeigen, dort einmal das Stammzertifikat installieren:');
sagen('  http://<Adresse>:<Port>/almanach-stamm.crt   (Anleitung: docs/EINRICHTUNG.md)');
sagen();
