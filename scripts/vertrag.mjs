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
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 3400 + Math.floor(Math.random() * 400);
const BASIS = `http://localhost:${PORT}/api`;
const datenordner = mkdtempSync(path.join(tmpdir(), 'almanach-vertrag-'));

let bestanden = 0;
const maengel = [];

function pruefe(bedingung, was, hinweis = '') {
  if (bedingung) {
    bestanden += 1;
    return true;
  }
  maengel.push(`${was}${hinweis ? ` – ${hinweis}` : ''}`);
  return false;
}

const gleich = (ist, soll, was) => pruefe(ist === soll, was, `erwartet ${JSON.stringify(soll)}, war ${JSON.stringify(ist)}`);

/* --- Ein kleiner Klient mit Keksdose ------------------------------------- */

function klient() {
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

/* --- Server hochfahren --------------------------------------------------- */

const server = spawn('node', [path.join(wurzel, 'backend', 'src', 'server.js')], {
  env: { ...process.env, DATA_DIR: datenordner, PORT: String(PORT) },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let serverFehler = '';
server.stderr.on('data', (d) => (serverFehler += d.toString()));

async function warteAufServer() {
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

function beenden(code) {
  server.kill('SIGTERM');
  rmSync(datenordner, { recursive: true, force: true });
  process.exit(code);
}

/* --- Der Durchgang ------------------------------------------------------- */

try {
  if (!(await warteAufServer())) {
    console.error('Der Server kam nicht hoch.\n' + serverFehler);
    beenden(1);
  }

  const sl = klient();
  const spieler = klient();
  const fremd = klient();

  // --- Konten und Rollen -------------------------------------------------
  {
    const { daten } = await fremd.ruf('/auth/status');
    pruefe(daten?.needsSetup === true, 'Leerer Almanach meldet Einrichtungsbedarf');
  }
  {
    const { status, daten } = await sl.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vertrag-SL', password: 'ausreichend-lang' },
    });
    gleich(status, 201, 'Erstes Konto lässt sich anlegen');
    gleich(daten?.user?.role, 'sl', 'Erstes Konto führt die Spielleitung');
  }
  {
    const { status, daten } = await fremd.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Ungebeten', password: 'ausreichend-lang' },
    });
    gleich(status, 403, 'Ohne Einladung kein zweites Konto');
    gleich(daten?.code, 'einladung_ungueltig', 'Fehler trägt einen Schlüssel');
  }
  const einladung = (await sl.ruf('/auth/invites', { methode: 'POST', koerper: {} })).daten;
  {
    const { status, daten } = await spieler.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vertrag-Spielerin', password: 'ausreichend-lang', invite: einladung.code },
    });
    gleich(status, 201, 'Mit Einladung geht es');
    gleich(daten?.user?.role, 'spieler', 'Weitere Konten gehören zur Runde');
  }
  {
    const { status, daten } = await fremd.ruf('/characters');
    gleich(status, 401, 'Ohne Anmeldung kein Zugriff');
    gleich(daten?.code, 'nicht_angemeldet', 'Auch 401 trägt einen Schlüssel');
  }
  {
    const { status, daten } = await spieler.ruf('/library');
    gleich(status, 403, 'Die Runde kommt nicht ins Bestiarium');
    gleich(daten?.code, 'nur_spielleitung', 'Auch 403 trägt einen Schlüssel');
  }

  // --- Charaktere --------------------------------------------------------
  const held = (
    await spieler.ruf('/characters', {
      methode: 'POST',
      koerper: {
        name: 'Vertrag-Held',
        data: { abilities: { dex: 16 }, combat: { armorClass: 15, initiativeBonus: 1, hp: { current: 9, max: 12 } } },
      },
    })
  ).daten;
  {
    const { daten } = await spieler.ruf('/characters');
    const eintrag = daten.find((c) => c.id === held.id);
    pruefe(!!eintrag, 'Angelegter Charakter steht in der Übersicht');
    gleich(eintrag?.ac, 15, 'Rüstungsklasse steht in der Übersicht');
    gleich(eintrag?.initiative, 4, 'Initiative wird vorgerechnet (GE +3, Bonus +1)');
    pruefe(typeof eintrag?.ownerId === 'string', 'Übersicht nennt den Besitzer');
  }

  // --- Kampf: zwei Sichten ----------------------------------------------
  await sl.ruf('/encounter/party', { methode: 'POST', koerper: {} });
  await sl.ruf('/encounter/combatants', {
    methode: 'POST',
    koerper: { name: 'Lauerer', type: 'monster', hp: 30, maxHp: 30, ac: 16, hidden: true, initiative: 18 },
  });
  await sl.ruf('/encounter/combatants', {
    methode: 'POST',
    koerper: { name: 'Wolf', type: 'monster', hp: 11, maxHp: 11, ac: 13, initiative: 12 },
  });
  {
    const slSicht = (await sl.ruf('/encounter')).daten;
    const rundenSicht = (await spieler.ruf('/encounter')).daten;
    pruefe(slSicht.combatants.some((c) => c.name === 'Lauerer'), 'Die Spielleitung sieht verborgene Kämpfer');
    pruefe(
      !rundenSicht.combatants.some((c) => c.name === 'Lauerer'),
      'Verborgene Kämpfer fehlen in der Fassung für die Runde'
    );
    const wolf = rundenSicht.combatants.find((c) => c.name === 'Wolf');
    gleich(wolf?.hp, null, 'Monster-Trefferpunkte bleiben der Runde verborgen');
    pruefe(
      ['unversehrt', 'leicht_verletzt', 'verwundet', 'schwer_verwundet', 'kampfunfaehig'].includes(wolf?.status),
      'Zustand ist ein bekannter Schlüssel',
      `war ${JSON.stringify(wolf?.status)}`
    );
    const eigener = rundenSicht.combatants.find((c) => c.characterId === held.id);
    pruefe(typeof eigener?.hp === 'number', 'Die eigenen Trefferpunkte sieht die Runde');
  }

  // --- Initiative durch die Spielerin ------------------------------------
  {
    const eigener = (await spieler.ruf('/encounter')).daten.combatants.find((c) => c.characterId === held.id);
    const { status } = await spieler.ruf(`/encounter/combatants/${eigener.id}/initiative`, {
      methode: 'POST',
      koerper: { value: 17 },
    });
    gleich(status, 200, 'Die Runde darf ihre eigene Initiative eintragen');
    const fremderKaempfer = (await sl.ruf('/encounter')).daten.combatants.find((c) => c.name === 'Wolf');
    const abgewiesen = await spieler.ruf(`/encounter/combatants/${fremderKaempfer.id}/initiative`, {
      methode: 'POST',
      koerper: { value: 20 },
    });
    gleich(abgewiesen.status, 403, 'Fremde Initiative bleibt tabu');
  }

  // --- Schaden wandert aufs Blatt ---------------------------------------
  {
    const eigener = (await sl.ruf('/encounter')).daten.combatants.find((c) => c.characterId === held.id);
    await sl.ruf(`/encounter/combatants/${eigener.id}/damage`, { methode: 'POST', koerper: { amount: 4 } });
    const blatt = (await spieler.ruf(`/characters/${held.id}`)).daten;
    gleich(blatt.data.combat.hp.current, 5, 'Schaden aus dem Kampf steht auf dem Charakterblatt');
  }

  // --- Beute teilen ------------------------------------------------------
  {
    await sl.ruf('/stash/coins', { methode: 'PUT', koerper: { pp: 0, gp: 43, ep: 0, sp: 7, cp: 0 } });
    const { daten } = await sl.ruf('/stash/teilung?anteile=3');
    gleich(daten.proKopf.gp, 14, 'Beute teilen: Gold je Kopf');
    gleich(daten.proKopf.sp, 5, 'Beute teilen: Silber je Kopf');
    gleich(daten.proKopf.cp, 6, 'Beute teilen: Kupfer je Kopf');
    gleich(daten.proKopf.pp, 0, 'Beute teilen erfindet kein Platin');
    gleich(daten.rest.cp, 2, 'Beute teilen: der Rest bleibt liegen');
  }

  // --- Chronik: Struktur statt Prosa ------------------------------------
  {
    const sitzungen = (await sl.ruf('/chronicle/sessions')).daten;
    pruefe(sitzungen.length > 0, 'Die Chronik hat von selbst begonnen');
    const sitzung = (await sl.ruf(`/chronicle/sessions/${sitzungen[0].id}`)).daten;
    const schaden = sitzung.entries.find((e) => e.kind === 'schaden');
    pruefe(!!schaden, 'Schaden steht in der Chronik');
    pruefe(typeof schaden?.meta?.amount === 'number', 'Chronikeintrag trägt Strukturdaten, nicht nur Prosa');
    pruefe(typeof schaden?.meta?.target === 'string', 'Chronikeintrag nennt das Ziel als Feld');
    pruefe(typeof schaden?.text === 'string', 'Zum Eintrag gibt es einen fertigen Satz als Rückfallebene');

    const rundenSicht = (await spieler.ruf(`/chronicle/sessions/${sitzungen[0].id}`)).daten;
    pruefe(
      rundenSicht.entries.every((e) => e.secret === false),
      'Verdeckte Einträge fehlen in der Fassung für die Runde'
    );
  }

  // --- Verdeckte Würfe ---------------------------------------------------
  {
    await sl.ruf('/dice/roll', { methode: 'POST', koerper: { expression: '1W20', secret: true, label: 'Geheim' } });
    const rundenChronik = (await spieler.ruf('/dice/history')).daten;
    pruefe(!rundenChronik.some((w) => w.label === 'Geheim'), 'Verdeckte Würfe bleiben verdeckt');
    const slChronik = (await sl.ruf('/dice/history')).daten;
    pruefe(slChronik.some((w) => w.label === 'Geheim'), 'Die Spielleitung sieht ihren verdeckten Wurf');
  }

  // --- Spieltisch --------------------------------------------------------
  {
    const szene = (
      await sl.ruf('/scenes', { methode: 'POST', koerper: { name: 'Vertragsprobe', width: 700, height: 700, gridSize: 70 } })
    ).daten;
    await sl.ruf(`/scenes/${szene.id}/aktivieren`, { methode: 'POST' });
    await sl.ruf(`/scenes/${szene.id}/figuren/aus-kampf`, { methode: 'POST', koerper: {} });

    const slTisch = (await sl.ruf('/scenes/aktiv')).daten;
    const rundenTisch = (await spieler.ruf('/scenes/aktiv')).daten;
    pruefe(
      rundenTisch.tokens.length < slTisch.tokens.length,
      'Verborgene Figuren fehlen in der Fassung für die Runde',
      `SL ${slTisch.tokens.length}, Runde ${rundenTisch.tokens.length}`
    );

    const eigeneFigur = rundenTisch.tokens.find((t) => t.characterId === held.id);
    const bewegt = await spieler.ruf(`/scenes/figuren/${eigeneFigur.id}`, {
      methode: 'PATCH',
      koerper: { x: 140, y: 210 },
    });
    gleich(bewegt.status, 200, 'Die eigene Figur darf bewegt werden');

    const fremdeFigur = rundenTisch.tokens.find((t) => !t.characterId);
    if (fremdeFigur) {
      const abgewiesen = await spieler.ruf(`/scenes/figuren/${fremdeFigur.id}`, {
        methode: 'PATCH',
        koerper: { x: 0, y: 0 },
      });
      gleich(abgewiesen.status, 403, 'Fremde Figuren bleiben tabu');
    }

    const nebel = await spieler.ruf(`/scenes/${szene.id}/nebel`, {
      methode: 'POST',
      koerper: { cells: ['0,0'], revealed: true },
    });
    gleich(nebel.status, 403, 'Nebel lichtet nur die Spielleitung');
  }

  // --- Kartenbibliothek --------------------------------------------------
  {
    const karte = (
      await sl.ruf('/maps', {
        methode: 'POST',
        koerper: { name: 'Kreuzung im Nebel', width: 1400, height: 900, gridSize: 70, tags: ['Wald', 'Nacht'] },
      })
    ).daten;
    pruefe(Array.isArray(karte?.tags), 'Eine Karte trägt ihre Schlagworte als Liste');
    gleich(karte.gridOffsetX, 0, 'Eine frische Karte hat keinen Rasterversatz');

    gleich((await spieler.ruf('/maps')).status, 403, 'Die Bibliothek bleibt hinter dem Schirm');

    await sl.ruf(`/maps/${karte.id}`, { methode: 'PUT', koerper: { gridSize: 96, gridOffsetX: 12 } });
    const ausgerichtet = (await sl.ruf('/maps')).daten.find((k) => k.id === karte.id);
    gleich(ausgerichtet.gridSize, 96, 'Die Rasterausrichtung bleibt an der Karte');

    const gelegt = await sl.ruf(`/maps/${karte.id}/auflegen`, { methode: 'POST', koerper: {} });
    gleich(gelegt.status, 201, 'Eine Karte ohne Szene wird frisch aufgelegt');
    const ausKarte = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(ausKarte.id, gelegt.daten.sceneId, 'Die aufgelegte Karte liegt auf dem Tisch');
    gleich(ausKarte.gridSize, 96, 'Die Szene erbt das Raster ihrer Karte');
    gleich(ausKarte.mapId, karte.id, 'Die Szene weiß, aus welcher Karte sie stammt');

    const nochmal = await sl.ruf(`/maps/${karte.id}/auflegen`, { methode: 'POST', koerper: {} });
    gleich(nochmal.daten.sceneId, gelegt.daten.sceneId, 'Erneutes Auflegen holt dieselbe Szene zurück');
    const frisch = await sl.ruf(`/maps/${karte.id}/auflegen`, { methode: 'POST', koerper: { frisch: true } });
    pruefe(frisch.daten.sceneId !== gelegt.daten.sceneId, 'Auf Wunsch entsteht eine zweite, frische Szene');

    const mitZahl = (await sl.ruf('/maps')).daten.find((k) => k.id === karte.id);
    gleich(mitZahl.szenen, 2, 'Die Bibliothek zählt die Szenen einer Karte');

    gleich(
      (await sl.ruf(`/maps/${karte.id}`, { methode: 'DELETE' })).status,
      204,
      'Eine Karte lässt sich aus der Bibliothek nehmen'
    );
    const verwaist = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(verwaist?.id, frisch.daten.sceneId, 'Die aufgelegte Szene überlebt das Löschen ihrer Karte');
    gleich(verwaist?.mapId, null, 'Sie zeigt danach auf kein Blatt mehr');
  }

  // --- Klangteppich ------------------------------------------------------
  {
    gleich((await spieler.ruf('/ambience')).status, 403, 'Die Klangbibliothek bleibt hinter dem Schirm');

    const murks = await sl.ruf('/ambience', {
      methode: 'POST',
      koerper: { name: 'Untergeschoben', uri: 'https://beispiel.invalid/boese' },
    });
    gleich(murks.status, 400, 'Was kein Spotify-Link ist, kommt nicht hinein');
    gleich(murks.daten?.code, 'keine_spotify_adresse', 'Und sagt auch, warum');

    // Der Teilen-Link aus der App – mit Sprachkürzel und Anhängsel.
    const klang = (
      await sl.ruf('/ambience', {
        methode: 'POST',
        koerper: {
          name: 'Schankraum am Abend',
          uri: 'https://open.spotify.com/intl-de/playlist/37i9dQZF1DX4sWSpwq3LiO?si=abc123',
          tags: ['Taverne', 'ruhig'],
          notes: 'leise, viel Gemurmel',
        },
      })
    ).daten;
    gleich(klang.uri, 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO', 'Aus dem Teilen-Link wird eine saubere Adresse');
    gleich(klang.kind, 'playlist', 'Die Art steht mit dabei');
    gleich(
      klang.webUrl,
      'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO',
      'Und ein Verweis zum Anklicken, der nur zu Spotify führt'
    );

    gleich((await spieler.ruf('/ambience/aktiv')).daten?.uri, null, 'Vor dem Auflegen liegt nichts auf');

    gleich(
      (await spieler.ruf(`/ambience/${klang.id}/auflegen`, { methode: 'POST' })).status,
      403,
      'Auflegen darf nur die Spielleitung'
    );

    await sl.ruf(`/ambience/${klang.id}/auflegen`, { methode: 'POST' });
    const gehoert = (await spieler.ruf('/ambience/aktiv')).daten;
    gleich(gehoert.uri, klang.uri, 'Die Runde erfährt, was aufliegt');
    gleich(gehoert.name, 'Schankraum am Abend', 'Mit Namen');
    gleich(gehoert.webUrl, klang.webUrl, 'Und mit dem Verweis zum Öffnen');

    await sl.ruf('/ambience/stille', { methode: 'POST' });
    gleich((await spieler.ruf('/ambience/aktiv')).daten.uri, null, 'Stille kommt bei allen an');

    // Eine Karte bringt ihre Ambiente mit auf den Tisch.
    const ort = (
      await sl.ruf('/maps', { methode: 'POST', koerper: { name: 'Zum Grinsenden Troll', width: 800, height: 600 } })
    ).daten;
    await sl.ruf(`/maps/${ort.id}`, { methode: 'PUT', koerper: { ambienceId: klang.id } });
    await sl.ruf(`/maps/${ort.id}/auflegen`, { methode: 'POST' });
    gleich(
      (await spieler.ruf('/ambience/aktiv')).daten.ambienceId,
      klang.id,
      'Wer die Karte auflegt, legt ihre Musik mit auf'
    );

    await sl.ruf(`/ambience/${klang.id}`, { methode: 'DELETE' });
    gleich((await spieler.ruf('/ambience/aktiv')).daten.uri, null, 'Was gelöscht ist, liegt nicht weiter auf');
    gleich(
      (await sl.ruf('/maps')).daten.find((k) => k.id === ort.id)?.ambienceId,
      null,
      'Und hängt auch nicht mehr an der Karte'
    );
  }

  // --- Sicht: Nebel, Licht und Sinne --------------------------------------
  {
    // Eine eigene Szene, damit die Probe nichts von oben erbt.
    const dunkel = (
      await sl.ruf('/scenes', {
        methode: 'POST',
        koerper: { name: 'Verlies', width: 700, height: 700, gridSize: 70 },
      })
    ).daten;
    gleich(dunkel.dark, false, 'Eine frische Szene ist hell');
    await sl.ruf(`/scenes/${dunkel.id}/aktivieren`, { methode: 'POST' });
    await sl.ruf(`/scenes/${dunkel.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: true } });

    // Die Heldin steht links oben, ein Ungetüm zehn Felder weiter rechts.
    const held = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    const ihre = (
      await sl.ruf(`/scenes/${dunkel.id}/figuren`, {
        methode: 'POST',
        koerper: { name: 'Elara', x: 70, y: 70, size: 1, characterId: held.id },
      })
    ).daten;
    await sl.ruf(`/scenes/${dunkel.id}/figuren`, {
      methode: 'POST',
      // Neun Felder weiter rechts, aber noch auf der Karte: 700 Pixel breit
      // heißt, das letzte Feld beginnt bei 630.
      koerper: { name: 'Ungetüm', x: 630, y: 70, size: 1 },
    });

    // Solange es hell ist, sieht sie beide.
    let tisch = (await spieler.ruf('/scenes/aktiv')).daten;
    gleich(tisch.sichtBits, null, 'In heller Szene gibt es keine Sichtgrenze');
    gleich(tisch.tokens.length, 2, 'Und die Runde sieht, was auf dem Tisch steht');

    // Licht aus.
    await sl.ruf(`/scenes/${dunkel.id}`, { methode: 'PUT', koerper: { dark: true } });
    tisch = (await spieler.ruf('/scenes/aktiv')).daten;
    pruefe(typeof tisch.sichtBits === 'string' && tisch.sichtBits.length > 0,
      'In dunkler Szene rechnet der Server eine Sicht aus');
    gleich(tisch.tokens.length, 1, 'Das Ungetüm im Dunkeln fehlt in der Nutzlast – nicht nur im Bild');
    gleich(tisch.tokens[0].id, ihre.id, 'Die eigene Figur bleibt');

    // Dunkelsicht auf 60 Fuß: zwölf Felder, das Ungetüm steht neun weit weg.
    const blatt = (await sl.ruf(`/characters/${held.id}`)).daten;
    blatt.data.combat.senses = { ...blatt.data.combat.senses, darkvision: 60 };
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
    tisch = (await spieler.ruf('/scenes/aktiv')).daten;
    gleich(tisch.tokens.length, 2, 'Mit Dunkelsicht sieht sie das Ungetüm');

    // Dunkelsicht wieder weg, dafür trägt das Ungetüm eine Fackel.
    blatt.data.combat.senses.darkvision = 0;
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      1,
      'Ohne Dunkelsicht ist es wieder dunkel'
    );

    const ungetuem = (await sl.ruf('/scenes/aktiv')).daten.tokens.find((t) => t.name === 'Ungetüm');
    await sl.ruf(`/scenes/figuren/${ungetuem.id}`, { methode: 'PATCH', koerper: { lightBright: 20, lightDim: 20 } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      2,
      'Wer eine Fackel trägt, verrät sich selbst'
    );

    // Der Nebel bleibt die stärkere Schranke: Was nie aufgedeckt wurde,
    // steht auch nicht im Datenstrom.
    await sl.ruf(`/scenes/${dunkel.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: false } });
    const verhuellt = (await spieler.ruf('/scenes/aktiv')).daten;
    gleich(verhuellt.tokens.length, 1, 'Unter geschlossenem Nebel bleibt nur die eigene Figur');

    // Die Spielleitung sieht alles – bis sie durch fremde Augen schaut.
    await sl.ruf(`/scenes/${dunkel.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: true } });
    let slTisch = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(slTisch.tokens.length, 2, 'Die Spielleitung sieht das ganze Brett');
    gleich(slTisch.sichtBits, null, 'Und hat keine Sichtgrenze');
    gleich(slTisch.nscSicht, null, 'Solange sie nicht durch fremde Augen schaut');

    gleich(
      (await spieler.ruf('/scenes/nsc-sicht', { methode: 'POST', koerper: { tokenId: ihre.id } })).status,
      403,
      'Die NSC-Sicht ist der Spielleitung vorbehalten'
    );

    await sl.ruf(`/scenes/figuren/${ungetuem.id}`, { methode: 'PATCH', koerper: { lightBright: 0, lightDim: 0 } });
    await sl.ruf('/scenes/nsc-sicht', { methode: 'POST', koerper: { tokenId: ungetuem.id } });
    slTisch = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(slTisch.nscSicht, ungetuem.id, 'In der NSC-Steuerung steht, durch wen sie schaut');
    gleich(slTisch.tokens.length, 1, 'Und sie sieht nur noch, was das Ungetüm sieht');

    await sl.ruf('/scenes/nsc-sicht', { methode: 'POST', koerper: { tokenId: null } });
    gleich((await sl.ruf('/scenes/aktiv')).daten.tokens.length, 2, 'Zurück in der Vogelperspektive');

    await sl.ruf(`/scenes/${dunkel.id}`, { methode: 'DELETE' });
  }

  // --- Sichtweite: das Nebelfenster hängt an der Figur ---------------------
  {
    const feld = (
      await sl.ruf('/scenes', {
        methode: 'POST',
        koerper: { name: 'Freies Feld', width: 1400, height: 700, gridSize: 70 },
      })
    ).daten;
    await sl.ruf(`/scenes/${feld.id}/aktivieren`, { methode: 'POST' });
    await sl.ruf(`/scenes/${feld.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: true } });

    const held = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    const blatt = (await sl.ruf(`/characters/${held.id}`)).daten;
    blatt.data.combat.senses = { sight: 0, darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0 };
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });

    // Elara auf Feld 1, das Ungetüm neun Felder weiter – helle Szene.
    const ihre = (
      await sl.ruf(`/scenes/${feld.id}/figuren`, {
        methode: 'POST',
        koerper: { name: 'Elara', x: 70, y: 70, size: 1, characterId: held.id },
      })
    ).daten;
    const wesen = (
      await sl.ruf(`/scenes/${feld.id}/figuren`, {
        methode: 'POST',
        koerper: { name: 'Ungetüm', x: 700, y: 70, size: 1 },
      })
    ).daten;

    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      2,
      'Ohne eingetragene Sichtweite bleibt eine helle Szene, wie sie war'
    );

    // Jetzt 30 Fuß Sichtweite: sechs Felder, das Ungetüm steht neun weit weg.
    blatt.data.combat.senses.sight = 30;
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
    let tisch = (await spieler.ruf('/scenes/aktiv')).daten;
    pruefe(typeof tisch.sichtBits === 'string', 'Die Sichtweite begrenzt auch bei Tageslicht');
    gleich(tisch.tokens.length, 1, 'Was weiter weg steht als der Blick reicht, fehlt in der Nutzlast');

    // Das Fenster hängt an der Figur: Sie geht hin, es geht mit.
    await sl.ruf(`/scenes/figuren/${ihre.id}`, { methode: 'PATCH', koerper: { x: 490, y: 70 } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      2,
      'Geht die Figur hin, wandert das Fenster mit ihr'
    );
    await sl.ruf(`/scenes/figuren/${ihre.id}`, { methode: 'PATCH', koerper: { x: 70, y: 70 } });
    gleich((await spieler.ruf('/scenes/aktiv')).daten.tokens.length, 1, 'Und wieder zurück');

    // Der Kern der Sache: Fremdes Licht zieht das Fenster nicht auf.
    await sl.ruf(`/scenes/${feld.id}`, { methode: 'PUT', koerper: { dark: true } });
    blatt.data.combat.senses.darkvision = 30;
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
    await sl.ruf(`/scenes/figuren/${wesen.id}`, {
      methode: 'PATCH',
      koerper: { lightBright: 100, lightDim: 100 },
    });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      1,
      'Eine Fackel außerhalb der eigenen Reichweite bleibt unsichtbar'
    );

    // Innerhalb der Reichweite macht dieselbe Fackel sehr wohl etwas sichtbar.
    await sl.ruf(`/scenes/figuren/${wesen.id}`, { methode: 'PATCH', koerper: { x: 350, y: 70 } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      2,
      'Innerhalb der Reichweite schon'
    );

    // Die Szene darf für alle deckeln – Nebelbank, Schneetreiben, dichter Wald.
    await sl.ruf(`/scenes/${feld.id}`, { methode: 'PUT', koerper: { dark: false, sight: 10 } });
    const eng = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(eng.sight, 10, 'Die Szene trägt ihre eigene Sichtgrenze');
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      1,
      'Und deckelt, was das Blatt hergibt'
    );

    await sl.ruf(`/scenes/${feld.id}`, { methode: 'DELETE' });
    blatt.data.combat.senses = { sight: 0, darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0 };
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
  }

  // --- Maßstab und große Karten -------------------------------------------
  {
    const gross = (
      await sl.ruf('/scenes', {
        methode: 'POST',
        // 200 x 200 Felder bei 60 Bildpunkten je Feld.
        koerper: { name: 'Das weite Land', width: 12000, height: 12000, gridSize: 60, unit: 'meter', scale: 1 },
      })
    ).daten;
    gleich(gross.unit, 'meter', 'Eine Szene darf metrisch sein');
    gleich(gross.scale, 1, 'Mit einem Meter je Feld');
    await sl.ruf(`/scenes/${gross.id}/aktivieren`, { methode: 'POST' });

    // Zweihundert mal zweihundert Meter, ganz aufgedeckt.
    const alles = await sl.ruf(`/scenes/${gross.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: true } });
    gleich(alles.daten.offen, 40000, '200 x 200 Felder passen vollständig in den Nebel');

    const tisch = (await sl.ruf('/scenes/aktiv')).daten;
    pruefe(typeof tisch.fogBits === 'string', 'Der Nebel wandert als Bitkarte');
    pruefe(
      tisch.fogBits.length < 12000,
      'Und bleibt dabei klein',
      `${(tisch.fogBits.length / 1024).toFixed(1)} KB statt der 348 KB einer Feldliste`
    );
    pruefe(tisch.fog === undefined, 'Die alte Feldliste ist aus der Nutzlast verschwunden');

    // Die ganze Antwort darf einen Zug lang nicht schmerzen.
    const groesse = JSON.stringify(tisch).length;
    pruefe(groesse < 20000, 'Die ganze Szene bleibt unter 20 KB', `${(groesse / 1024).toFixed(1)} KB`);

    // Sichtweiten rechnen im Maßstab der Karte: 30 Fuß sind neun Meterfelder.
    const held = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    const blatt = (await sl.ruf(`/characters/${held.id}`)).daten;
    blatt.data.combat.senses = { ...blatt.data.combat.senses, darkvision: 30 };
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
    await sl.ruf(`/scenes/${gross.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Elara', x: 3000, y: 3000, size: 1, characterId: held.id },
    });
    // Eine Figur genau neun Felder weiter – gerade noch in Reichweite.
    await sl.ruf(`/scenes/${gross.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Nah', x: 3000 + 9 * 60, y: 3000, size: 1 },
    });
    // Und eine zehn Felder weiter – gerade nicht mehr.
    await sl.ruf(`/scenes/${gross.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Fern', x: 3000 + 11 * 60, y: 3000, size: 1 },
    });
    await sl.ruf(`/scenes/${gross.id}`, { methode: 'PUT', koerper: { dark: true } });

    const namen = (await spieler.ruf('/scenes/aktiv')).daten.tokens.map((t) => t.name);
    pruefe(namen.includes('Nah'), '30 Fuß Dunkelsicht reichen auf einer Meterkarte neun Felder weit');
    pruefe(!namen.includes('Fern'), 'Aber keine elf – der Maßstab rechnet mit');

    await sl.ruf(`/scenes/${gross.id}`, { methode: 'DELETE' });
  }

  // --- NSC-Blätter --------------------------------------------------------
  {
    const nsc = (
      await sl.ruf('/characters', {
        methode: 'POST',
        koerper: { name: 'Wirt zum Grinsenden Troll', system: 'dnd5e', data: {}, npc: true },
      })
    ).daten;
    gleich(nsc.npc, true, 'Ein NSC-Blatt weiß, dass es eins ist');
    gleich(nsc.shared, false, 'Und ist nie geteilt');

    gleich((await spieler.ruf(`/characters/${nsc.id}`)).status, 403, 'Die Runde kommt nicht an das Blatt');
    pruefe(
      !(await spieler.ruf('/characters')).daten.some((c) => c.id === nsc.id),
      'Und findet es auch nicht in der Übersicht'
    );
    pruefe(
      (await sl.ruf('/characters')).daten.some((c) => c.id === nsc.id),
      'Die Spielleitung sieht es sehr wohl'
    );

    // Auch ein versehentlich geteiltes NSC-Blatt bleibt hinter dem Schirm.
    await sl.ruf(`/characters/${nsc.id}`, { methode: 'PATCH', koerper: { shared: true } });
    gleich(
      (await spieler.ruf(`/characters/${nsc.id}`)).status,
      403,
      'Auch als „geteilt“ markiert bleibt es hinter dem Schirm'
    );

    // Und die Runde holen zieht es nicht in den Kampf.
    await sl.ruf('/encounter/party', { methode: 'POST' });
    pruefe(
      !(await sl.ruf('/encounter')).daten.combatants.some((c) => c.name.startsWith('Wirt')),
      'Beim Holen der Runde bleibt der Wirt in seiner Schänke'
    );

    // Ein Spieler darf sich kein Blatt hinter den Schirm holen.
    const eigenes = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    gleich(
      (await spieler.ruf(`/characters/${eigenes.id}`, { methode: 'PATCH', koerper: { npc: true } })).status,
      403,
      'Ein NSC-Blatt macht nur die Spielleitung'
    );
  }

  // --- Der Live-Kanal ----------------------------------------------------
  {
    const kekse = [...spieler.kekse].map(([k, v]) => `${k}=${v}`).join('; ');
    const antwort = await fetch(`${BASIS}/stream`, { headers: { cookie: kekse } });
    gleich(antwort.status, 200, 'Der Live-Kanal öffnet sich');
    gleich(
      antwort.headers.get('content-type')?.split(';')[0],
      'text/event-stream',
      'Der Live-Kanal spricht Server-Sent Events'
    );

    const leser = antwort.body.getReader();
    const gelesen = [];
    const frist = setTimeout(() => leser.cancel().catch(() => {}), 4000);

    // Etwas auslösen, das ankommen muss.
    setTimeout(() => sl.ruf('/encounter/next-turn', { methode: 'POST' }), 300);

    // Beim Verbinden treffen sofort „willkommen“ und „anwesenheit“ ein.
    // Gewartet wird deshalb gezielt auf das ausgelöste Kampfereignis.
    try {
      while (!gelesen.join('').includes('event: kampf')) {
        const { value, done } = await leser.read();
        if (done) break;
        gelesen.push(new TextDecoder().decode(value));
      }
    } catch {
      /* Frist abgelaufen */
    }
    clearTimeout(frist);
    await leser.cancel().catch(() => {});

    const strom = gelesen.join('');
    pruefe(strom.includes('event: willkommen'), 'Der Kanal begrüßt mit der Fensterkennung');
    pruefe(strom.includes('event: kampf'), 'Änderungen am Kampf laufen über den Kanal ein');
  }

  // --- Jeder Fehler trägt einen Schlüssel --------------------------------
  {
    const faelle = [
      ['/characters/gibtesnicht', 404],
      ['/scenes/aktiv/gibtesnicht', 404],
      ['/maps/gibtesnicht', 404],
      ['/ambience/gibtesnicht', 404],
      ['/gibtesnicht', 404],
    ];
    for (const [pfad, status] of faelle) {
      const { status: ist, daten } = await sl.ruf(pfad);
      gleich(ist, status, `${pfad} antwortet mit ${status}`);
      pruefe(typeof daten?.code === 'string', `${pfad} nennt einen Fehlerschlüssel`);
    }
  }
} catch (err) {
  maengel.push(`Der Durchgang brach ab: ${err.stack ?? err.message}`);
}

/* --- Urteil -------------------------------------------------------------- */

console.log('');
if (maengel.length === 0) {
  console.log(`  Der Vertrag hält: ${bestanden} Prüfungen bestanden.`);
  beenden(0);
}
console.log(`  ${bestanden} Prüfungen bestanden, ${maengel.length} nicht:`);
for (const mangel of maengel) console.log(`   – ${mangel}`);
beenden(1);
