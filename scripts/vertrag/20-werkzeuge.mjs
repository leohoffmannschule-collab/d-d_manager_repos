/**
 * Vertrag, Kapitel: Die Werkzeuge auf dem Rechner des Almanachs.
 *
 * Neben der Schnittstelle gibt es drei Skripte, die man nur in der Not
 * braucht – und genau dann müssen sie gehen: ein Kennwort neu setzen, eine
 * Kampagne umbenennen, die Datenbank sichern. Sie laufen hier gegen den
 * Datenordner des Prüfservers, während der Server weiterläuft, so wie am
 * Spielabend auch.
 *
 * Anlass war `npm run vorlagen`: Es brach seit den Kampagnen stumm ab,
 * und niemand merkte es, weil kein Durchgang es je aufrief (siehe
 * 05-vorlagen.mjs, wo es inzwischen mitläuft).
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { datenordner, gleich, klient, pruefe, wurzel } from './werkzeug.mjs';

/** Ein Skript aus backend/scripts/ gegen den Datenordner des Prüfservers. */
function skript(name, ...argumente) {
  return spawnSync('node', [path.join(wurzel, 'backend', 'scripts', name), ...argumente], {
    env: { ...process.env, DATA_DIR: datenordner },
    encoding: 'utf8',
  });
}

export default async function werkzeuge(lage) {
  const { sl, kampagne } = lage;

  // --- Kennwort vergessen ------------------------------------------------
  {
    const vergesslich = klient();
    const code = (await sl.ruf('/auth/invites', { methode: 'POST', koerper: {} })).daten.code;
    await vergesslich.ruf('/auth/register', {
      methode: 'POST',
      koerper: { name: 'Vergesslich', password: 'weiss-ich-nicht-mehr', invite: code },
    });
    gleich((await vergesslich.ruf('/auth/status')).daten?.user?.name, 'Vergesslich', 'Das Konto ist angemeldet');

    const lauf = skript('kennwort.mjs', 'vergesslich');
    gleich(lauf.status, 0, '`npm run kennwort` läuft durch – auch mit anderer Schreibweise des Namens');
    const neu = lauf.stdout.match(/^\s+([a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})\s*$/m)?.[1];
    pruefe(!!neu, 'Und nennt ein neues Kennwort', lauf.stdout + lauf.stderr);

    gleich((await vergesslich.ruf('/auth/status')).daten?.user ?? null, null, 'Die alte Anmeldung gilt danach nicht mehr');
    const alt = await vergesslich.ruf('/auth/login', {
      methode: 'POST',
      koerper: { name: 'Vergesslich', password: 'weiss-ich-nicht-mehr' },
    });
    gleich(alt.status, 401, 'Das alte Kennwort auch nicht');
    const frisch = await vergesslich.ruf('/auth/login', { methode: 'POST', koerper: { name: 'Vergesslich', password: neu } });
    gleich(frisch.status, 200, 'Mit dem neuen kommt man hinein');

    gleich(skript('kennwort.mjs', 'Niemand').status, 1, 'Einen unbekannten Namen weist das Skript ab');
  }

  // --- Umbenennen ohne Browser -------------------------------------------
  {
    const vorher = (await sl.ruf('/campaigns')).daten.kampagnen.find((k) => k.id === kampagne.id).name;
    const lauf = skript('umbenennen.mjs', vorher, 'Umbenannt auf der Kommandozeile');
    gleich(lauf.status, 0, '`umbenennen.mjs` läuft durch');
    gleich(
      (await sl.ruf('/campaigns')).daten.kampagnen.find((k) => k.id === kampagne.id).name,
      'Umbenannt auf der Kommandozeile',
      'Und der neue Name steht im Almanach'
    );
    skript('umbenennen.mjs', 'Umbenannt auf der Kommandozeile', vorher);
  }

  // --- Sicherung während des Betriebs ------------------------------------
  {
    const ziel = path.join(datenordner, 'sicherungen-vertrag');
    const lauf = skript('sicherung.mjs', ziel, '--medien');
    gleich(lauf.status, 0, '`npm run sicherung` läuft durch, während der Server läuft');
    const ordner = fs.existsSync(ziel) ? fs.readdirSync(ziel).filter((n) => n.startsWith('almanach-')) : [];
    gleich(ordner.length, 1, 'Und legt genau einen Sicherungsordner an');
    const datei = ordner[0] ? path.join(ziel, ordner[0], 'manager.sqlite3') : '';
    pruefe(!!datei && fs.statSync(datei).size > 0, 'Darin liegt die Datenbank');
    pruefe(!!ordner[0] && fs.existsSync(path.join(ziel, ordner[0], 'medien')), 'Und mit --medien auch die Bilder');
  }
}
