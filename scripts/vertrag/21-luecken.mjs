/**
 * Vertrag, Kapitel: Die geschlossenen Lücken.
 *
 * Das Handbuch führte unter „Bekannte Grenzen“ auf, was der Almanach noch
 * nicht konnte, und unter „Was nicht geschützt ist“, wovor er sich nicht
 * schützte. Jede dieser Lücken ist geschlossen, und hier steht, woran man
 * das sieht:
 *
 *   – eine Figur lässt sich von Hand an ein Blatt binden;
 *   – Kämpfer und Figur verbergen und zeigen sich gemeinsam;
 *   – Gegner würfeln ihre Initiative mit Geschicklichkeitsbonus;
 *   – ein mitgenommenes Blatt lässt sich wieder anlegen, und ein kaputtes
 *     wird abgewiesen;
 *   – jede Antwort trägt eine Content-Security-Policy;
 *   – im Heimnetz gibt es HTTPS mit einem selbst ausgestellten, beschränkten
 *     Zertifikat.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { PORT, datenordner, gleich, pruefe, wurzel } from './werkzeug.mjs';

/** Ein Skript aus backend/scripts/ gegen den Datenordner des Prüfservers. */
function skript(name, ...argumente) {
  return spawnSync('node', [path.join(wurzel, 'backend', 'scripts', name), ...argumente], {
    env: { ...process.env, DATA_DIR: datenordner },
    encoding: 'utf8',
  });
}

/** Eine Anfrage über HTTPS, die nur dem eigenen Stammzertifikat glaubt. */
function ueberHttps(port, pfad, { stamm, methode = 'GET', koerper, servername = 'localhost' } = {}) {
  return new Promise((fertig) => {
    const anfrage = https.request(
      {
        host: '127.0.0.1',
        port,
        path: pfad,
        method: methode,
        ca: stamm,
        servername,
        headers: koerper ? { 'Content-Type': 'application/json' } : {},
      },
      (antwort) => {
        let text = '';
        antwort.on('data', (stueck) => (text += stueck));
        antwort.on('end', () => fertig({ status: antwort.statusCode, kopf: antwort.headers, text }));
      }
    );
    anfrage.on('error', (err) => fertig({ status: 0, fehler: err.code || err.message }));
    if (koerper) anfrage.write(JSON.stringify(koerper));
    anfrage.end();
  });
}

/** Wartet, bis ein Server auf `adresse` antwortet – höchstens zehn Sekunden. */
async function warteAuf(adresse) {
  for (let versuch = 0; versuch < 40; versuch++) {
    try {
      if ((await fetch(adresse)).ok) return true;
    } catch {
      /* noch nicht da */
    }
    await new Promise((weiter) => setTimeout(weiter, 250));
  }
  return false;
}

export default async function luecken(lage) {
  const { sl, spieler, held } = lage;
  const kampfListe = async (wer) => (await wer.ruf('/encounter')).daten.combatants;

  // Ein eigener Tisch für dieses Kapitel, offen für die Runde.
  const szene = (
    await sl.ruf('/scenes', { methode: 'POST', koerper: { name: 'Lückenprobe', width: 700, height: 700, gridSize: 70 } })
  ).daten;
  await sl.ruf(`/scenes/${szene.id}/aktivieren`, { methode: 'POST' });
  await sl.ruf('/scenes/vorhang', { methode: 'POST', koerper: { zu: false } });
  await sl.ruf('/encounter/reset', { methode: 'POST' });

  // --- Eine Figur von Hand an ein Blatt binden ---------------------------
  {
    const figur = (
      await sl.ruf(`/scenes/${szene.id}/figuren`, { methode: 'POST', koerper: { name: 'Lose Figur', x: 0, y: 0 } })
    ).daten;
    const schieben = (x) => spieler.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { x } });

    gleich((await schieben(70)).status, 403, 'Eine Figur ohne Blatt zieht die Runde nicht');

    const gebunden = await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: held.id } });
    gleich(gebunden.daten?.characterId, held.id, 'Die Spielleitung bindet die Figur an ein Blatt');
    gleich((await schieben(140)).status, 200, 'Danach zieht die Besitzerin des Blattes sie');

    const umgebogen = await spieler.ruf(`/scenes/figuren/${figur.id}`, {
      methode: 'PATCH',
      koerper: { x: 210, characterId: null },
    });
    gleich(umgebogen.daten?.characterId, held.id, 'Die Bindung ändert nur die Spielleitung – die Runde wird still übergangen');
    gleich(umgebogen.daten?.x, 210, 'Das Ziehen selbst gilt trotzdem');

    const erfunden = await sl.ruf(`/scenes/figuren/${figur.id}`, {
      methode: 'PATCH',
      koerper: { characterId: 'gibt-es-nicht', name: 'Umbenannt' },
    });
    gleich(erfunden.status, 400, 'Ein erfundenes Blatt wird abgewiesen');
    gleich(erfunden.daten?.code, 'verweis_unbekannt', 'Mit dem Schlüssel verweis_unbekannt');
    const danach = (await sl.ruf('/scenes/aktiv')).daten.tokens.find((t) => t.id === figur.id);
    gleich(danach?.name, 'Lose Figur', 'Und nichts anderes aus demselben Rumpf wurde geschrieben');

    const geloest = await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'PATCH', koerper: { characterId: null } });
    gleich(geloest.daten?.characterId ?? null, null, 'Mit null löst die Spielleitung die Bindung wieder');
    await sl.ruf(`/scenes/figuren/${figur.id}`, { methode: 'DELETE' });
  }

  // --- Kämpfer und Figur zeigen sich gemeinsam ----------------------------
  {
    await sl.ruf('/encounter/combatants', { methode: 'POST', koerper: { name: 'Lauernder Ork', hp: 15, hidden: true } });
    const ork = (await kampfListe(sl)).find((c) => c.name === 'Lauernder Ork');
    await sl.ruf(`/scenes/${szene.id}/figuren/aus-kampf`, { methode: 'POST', koerper: {} });
    const figurVon = async () => (await sl.ruf('/scenes/aktiv')).daten.tokens.find((t) => t.combatantId === ork.id);

    gleich((await figurVon())?.hidden, true, 'Ein verborgener Kämpfer kommt als verborgene Figur auf den Tisch');

    await sl.ruf(`/encounter/combatants/${ork.id}`, { methode: 'PUT', koerper: { hidden: false } });
    gleich((await figurVon())?.hidden, false, 'Wird der Kämpfer aufgedeckt, ist es auch seine Figur');
    pruefe(
      (await kampfListe(spieler)).some((c) => c.id === ork.id),
      'Und die Runde sieht ihn in der Kampfliste'
    );

    await sl.ruf(`/scenes/figuren/${(await figurVon()).id}`, { methode: 'PATCH', koerper: { hidden: true } });
    gleich((await kampfListe(sl)).find((c) => c.id === ork.id)?.hidden, true, 'Wird die Figur verborgen, ist es auch der Kämpfer');
    pruefe(
      !(await kampfListe(spieler)).some((c) => c.id === ork.id),
      'Und die Runde sieht ihn auch in der Kampfliste nicht mehr'
    );
  }

  // --- Initiative mit Geschicklichkeit ------------------------------------
  {
    const assassine = (
      await sl.ruf('/library', {
        methode: 'POST',
        koerper: { name: 'Flinker Assassine', hp: 30, ac: 15, stats: { dex: 18 } },
      })
    ).daten;
    await sl.ruf(`/library/${assassine.id}/add-to-encounter`, { methode: 'POST', koerper: { count: 3, rollInitiative: true } });
    const drei = (await kampfListe(sl)).filter((c) => c.name.startsWith('Flinker Assassine'));
    gleich(drei.length, 3, 'Drei Assassinen stehen im Kampf');
    pruefe(drei.every((c) => c.initiativeBonus === 4), 'Jeder trägt den Bonus aus GE 18 (+4)', JSON.stringify(drei.map((c) => c.initiativeBonus)));
    pruefe(
      drei.every((c) => c.initiative >= 5 && c.initiative <= 24),
      'Gewürfelt wird W20 + 4 (5 bis 24)',
      JSON.stringify(drei.map((c) => c.initiative))
    );

    const beiDerRunde = (await kampfListe(spieler)).filter((c) => c.name.startsWith('Flinker Assassine'));
    pruefe(
      beiDerRunde.length === 3 && beiDerRunde.every((c) => c.initiativeBonus === null),
      'Den Bonus der Gegner bekommt die Runde nicht geschickt – er verrät den Statblock'
    );

    for (const c of drei) await sl.ruf(`/encounter/combatants/${c.id}`, { methode: 'PUT', koerper: { initiative: 0 } });
    await sl.ruf('/encounter/roll-initiative', { methode: 'POST', koerper: {} });
    const nachgewuerfelt = (await kampfListe(sl)).filter((c) => c.name.startsWith('Flinker Assassine'));
    pruefe(
      nachgewuerfelt.every((c) => c.initiative >= 5 && c.initiative <= 24),
      '„Initiative würfeln“ zählt den Bonus ebenfalls hinzu',
      JSON.stringify(nachgewuerfelt.map((c) => c.initiative))
    );

    // Eine Begegnung mit eigenem Bonus, und eine alte ohne: die holt ihn
    // aus dem Bestiarium.
    const begegnung = (
      await sl.ruf('/encounters', {
        methode: 'POST',
        koerper: {
          name: 'Oger und Assassine',
          entries: [
            { name: 'Oger', hp: 59, ac: 11, count: 2, initiativeBonus: -1 },
            { libraryId: assassine.id, name: 'Assassine aus alter Zeit', hp: 30, ac: 15 },
          ],
        },
      })
    ).daten;
    gleich(begegnung.entries[0].initiativeBonus, -1, 'Ein Posten merkt sich seinen Bonus');
    gleich(begegnung.entries[1].initiativeBonus, null, 'Ein Posten ohne Bonus bleibt leer statt 0');
    await sl.ruf(`/encounters/${begegnung.id}/stellen`, { methode: 'POST', koerper: {} });
    const liste = await kampfListe(sl);
    const oger = liste.filter((c) => c.name.startsWith('Oger'));
    pruefe(
      oger.length === 2 && oger.every((c) => c.initiativeBonus === -1 && c.initiative >= 0 && c.initiative <= 19),
      'Die Oger würfeln W20 − 1',
      JSON.stringify(oger.map((c) => [c.initiative, c.initiativeBonus]))
    );
    gleich(
      liste.find((c) => c.name === 'Assassine aus alter Zeit')?.initiativeBonus,
      4,
      'Ein alter Posten holt seinen Bonus aus dem Bestiarium'
    );

    const gesichert = (await sl.ruf('/encounters/aus-kampf', { methode: 'POST', koerper: { name: 'Gesichert' } })).daten;
    gleich(
      gesichert.entries.find((e) => e.name === 'Oger')?.initiativeBonus,
      -1,
      'Wer den Kampf als Begegnung sichert, sichert den Bonus mit'
    );

    await sl.ruf('/encounter/reset', { methode: 'POST' });
    for (const id of [begegnung.id, gesichert.id]) await sl.ruf(`/encounters/${id}`, { methode: 'DELETE' });
    await sl.ruf(`/library/${assassine.id}`, { methode: 'DELETE' });
  }

  // --- Ein mitgenommenes Blatt wieder anlegen ------------------------------
  {
    const unbekannt = await spieler.ruf('/characters', {
      methode: 'POST',
      koerper: { name: 'Fremdes Regelwerk', system: 'pathfinder', data: {} },
    });
    gleich(unbekannt.status, 400, 'Ein Blatt mit unbekanntem Regelwerk wird abgewiesen');
    gleich(unbekannt.daten?.code, 'blatt_ungueltig', 'Mit dem Schlüssel blatt_ungueltig');
    gleich(
      (await spieler.ruf('/characters', { methode: 'POST', koerper: { name: 'Liste', system: 'dnd5e', data: [] } })).status,
      400,
      'Ein Datensatz, der kein Objekt ist, ebenso'
    );

    const eingelesen = await spieler.ruf('/characters', {
      methode: 'POST',
      koerper: { name: 'Elara (eingelesen)', system: 'dnd5e', data: { level: 3, backstory: 'Kam zurück aus einer Datei.' } },
    });
    gleich(eingelesen.status, 201, 'Ein eingelesenes Blatt wird angelegt');
    const blatt = (await spieler.ruf(`/characters/${eingelesen.daten.id}`)).daten;
    gleich(blatt?.data?.backstory, 'Kam zurück aus einer Datei.', 'Mit dem Inhalt aus der Datei');
    await spieler.ruf(`/characters/${eingelesen.daten.id}`, { methode: 'DELETE' });
  }

  // --- Die zweite Mauer: Content-Security-Policy ---------------------------
  {
    const antwort = await fetch(`http://localhost:${PORT}/api/health`);
    const richtlinie = antwort.headers.get('content-security-policy') ?? '';
    pruefe(richtlinie.includes("default-src 'self'"), 'Jede Antwort trägt eine Content-Security-Policy', richtlinie);
    pruefe(!richtlinie.includes('unsafe-inline') && !richtlinie.includes('unsafe-eval'), 'Ohne unsafe-inline und unsafe-eval');
    pruefe(/script-src[^;]*open\.spotify\.com/.test(richtlinie), 'Spotifys Spieler darf laden');
    pruefe(richtlinie.includes("frame-ancestors 'self'"), 'Einrahmen darf den Almanach niemand');
    pruefe(richtlinie.includes("object-src 'none'"), 'Plugins gar nicht');
  }

  // --- HTTPS im Heimnetz -----------------------------------------------------
  {
    const vorher = await fetch(`http://localhost:${PORT}/almanach-stamm.crt`);
    gleich(vorher.status, 404, 'Ohne Zertifikat gibt es kein Stammzertifikat zum Laden');

    gleich(skript('zertifikat.mjs', '8.8.8.8').status, 1, 'Eine öffentliche Adresse nimmt `npm run zertifikat` nicht an');
    gleich(skript('zertifikat.mjs', 'kein name!').status, 1, 'Unsinn auch nicht');
    pruefe(!fs.existsSync(path.join(datenordner, 'tls', 'stamm.key')), 'Und legt dabei nichts an');

    const lauf = skript('zertifikat.mjs', '192.168.77.5');
    gleich(lauf.status, 0, '`npm run zertifikat` legt Stamm- und Serverzertifikat an', lauf.stdout + lauf.stderr);
    const tls = (datei) => path.join(datenordner, 'tls', datei);
    const stamm = fs.readFileSync(tls('stamm.crt'), 'utf8');
    const zertifikat = new crypto.X509Certificate(fs.readFileSync(tls('almanach.crt'), 'utf8'));
    pruefe(zertifikat.verify(new crypto.X509Certificate(stamm).publicKey), 'Das Serverzertifikat ist vom Stammzertifikat unterschrieben');
    pruefe(zertifikat.checkIP('192.168.77.5') && zertifikat.checkHost('localhost'), 'Es gilt für localhost und die genannte Adresse');
    pruefe(!zertifikat.ca && new crypto.X509Certificate(stamm).ca, 'Nur das Stammzertifikat ist eine Ausstellungsstelle');
    if (process.platform !== 'win32') {
      gleich(fs.statSync(tls('stamm.key')).mode & 0o077, 0, 'Die Schlüssel liest nur ihr Besitzer');
    }

    const zweiterLauf = skript('zertifikat.mjs');
    gleich(zweiterLauf.status, 0, 'Ein zweiter Lauf erneuert nur das Serverzertifikat');
    gleich(fs.readFileSync(tls('stamm.crt'), 'utf8'), stamm, 'Das Stammzertifikat bleibt dasselbe – an den Geräten ist nichts zu tun');
    pruefe(
      new crypto.X509Certificate(fs.readFileSync(tls('almanach.crt'), 'utf8')).checkIP('192.168.77.5'),
      'Und merkt sich die eigens genannte Adresse'
    );
    gleich(
      skript('zertifikat.mjs', 'almanach.example').status,
      1,
      'Für einen Namen außerhalb seines Bereichs bürgt das Stammzertifikat nicht'
    );

    const geladen = await fetch(`http://localhost:${PORT}/almanach-stamm.crt`);
    gleich(geladen.status, 200, 'Das Stammzertifikat liegt zum Laden bereit');
    gleich(await geladen.text(), stamm, 'Und zwar genau das angelegte');

    // Ein zweiter Server auf denselben Daten, diesmal mit Zertifikat.
    const httpPort = PORT + 500;
    const httpsPort = PORT + 900;
    const zweiter = spawn('node', [path.join(wurzel, 'backend', 'src', 'server.js')], {
      env: { ...process.env, DATA_DIR: datenordner, PORT: String(httpPort), HTTPS_PORT: String(httpsPort) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let bericht = '';
    zweiter.stdout.on('data', (d) => (bericht += d.toString()));
    try {
      pruefe(await warteAuf(`http://localhost:${httpPort}/api/health`), 'Der Server startet mit Zertifikat');
      await new Promise((weiter) => setTimeout(weiter, 300));
      const gesund = await ueberHttps(httpsPort, '/api/health', { stamm });
      gleich(gesund.status, 200, 'Er antwortet über HTTPS, und das Zertifikat wird angenommen', gesund.fehler);
      gleich(JSON.parse(gesund.text || '{}').https, httpsPort, 'Das Lebenszeichen nennt den HTTPS-Port');
      pruefe(bericht.includes(`https://localhost:${httpsPort}`), 'Der Startbericht nennt die verschlüsselte Adresse', bericht);

      const fremd = await ueberHttps(httpsPort, '/api/health', { stamm, servername: 'bank.example' });
      pruefe(fremd.status === 0, 'Für einen fremden Namen hält das Zertifikat nicht', fremd.fehler);

      const anmeldung = await ueberHttps(httpsPort, '/api/auth/login', {
        stamm,
        methode: 'POST',
        koerper: { name: 'Vertrag-SL', password: 'ausreichend-lang' },
      });
      gleich(anmeldung.status, 200, 'Anmelden über HTTPS geht');
      pruefe(
        (anmeldung.kopf['set-cookie'] ?? []).some((k) => /;\s*Secure/i.test(k)),
        'Und das Cookie ist dann `Secure` – es geht nie unverschlüsselt zurück'
      );
    } finally {
      zweiter.kill('SIGTERM');
    }
  }
}
