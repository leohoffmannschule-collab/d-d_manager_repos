#!/usr/bin/env node
/**
 * Der Vertrag zwischen Server und Oberfläche.
 *
 * Dieses Skript startet einen eigenen Almanach auf einem freien Port mit einer
 * frischen, leeren Datenbank, spielt eine Runde durch und prüft, dass die
 * Schnittstelle sich so verhält, wie es die Oberfläche erwartet.
 *
 * Der Sinn: Wer die Oberfläche umbaut, neu gestaltet oder gegen eine ganz
 * andere austauscht, kann hiermit nachweisen, dass der Unterbau unangetastet
 * geblieben ist. Und wer am Server schraubt, merkt sofort, wenn er etwas
 * bricht, worauf sich die Oberfläche verlässt.
 *
 *   npm run vertrag
 *
 * Die Prüfungen stehen in Kapiteln in `vertrag/`, eines je Sachgebiet, in
 * der Reihenfolge eines Spielabends. Die Reihenfolge ist nicht beliebig:
 * Spätere Kapitel bauen auf dem auf, was frühere angelegt haben (Konten,
 * die Kampagne, den Helden) – das reichen sie über `lage` weiter.
 */
import { mangel, serverFehler, urteil, warteAufServer, beenden } from './vertrag/werkzeug.mjs';
import konten from './vertrag/01-konten.mjs';
import kampagne from './vertrag/02-kampagne.mjs';
import charaktere from './vertrag/03-charaktere.mjs';
import vollesBlatt from './vertrag/04-volles-blatt.mjs';
import vorlagen from './vertrag/05-vorlagen.mjs';
import kampf from './vertrag/06-kampf.mjs';
import gespraech from './vertrag/07-gespraech.mjs';
import spieltisch from './vertrag/08-spieltisch.mjs';
import klang from './vertrag/09-klang.mjs';
import sicht from './vertrag/10-sicht.mjs';
import vorhang from './vertrag/11-vorhang.mjs';
import sichtweite from './vertrag/12-sichtweite.mjs';
import massstab from './vertrag/13-massstab.mjs';
import nsc from './vertrag/14-nsc.mjs';
import liveKanal from './vertrag/15-live-kanal.mjs';
import umbenennen from './vertrag/16-umbenennen.mjs';
import uebernehmen from './vertrag/17-uebernehmen.mjs';
import review from './vertrag/18-review.mjs';
import fehlerschluessel from './vertrag/19-fehlerschluessel.mjs';
import werkzeuge from './vertrag/20-werkzeuge.mjs';
import luecken from './vertrag/21-luecken.mjs';

const KAPITEL = [
  konten,
  kampagne,
  charaktere,
  vollesBlatt,
  vorlagen,
  kampf,
  gespraech,
  spieltisch,
  klang,
  sicht,
  vorhang,
  sichtweite,
  massstab,
  nsc,
  liveKanal,
  umbenennen,
  uebernehmen,
  review,
  fehlerschluessel,
  werkzeuge,
  luecken,
];

try {
  if (!(await warteAufServer())) {
    console.error('Der Server kam nicht hoch.\n' + serverFehler);
    beenden(1);
  }
  // Der gemeinsame Stand, den die Kapitel einander weiterreichen.
  const lage = {};
  for (const kapitel of KAPITEL) await kapitel(lage);
} catch (err) {
  mangel(`Der Durchgang brach ab: ${err.stack ?? err.message}`);
}

urteil();
