/**
 * Vertrag, Kapitel: Der Klangteppich.
 *
 * Spotify-Adressen werden gesäubert oder abgewiesen, die Sammlung bleibt bei
 * der Spielleitung, was aufliegt, hört die ganze Runde – und der Taktstock
 * hält alle auf derselben Stelle.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function klang(lage) {
  const { sl, spieler } = lage;
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
    gleich(gehoert.spielt, true, 'Aufgelegt heißt: es läuft');
    gleich(gehoert.position, 0, 'Und zwar von vorn');
    pruefe(typeof gehoert.stand === 'string', 'Mit einem Zeitstempel, an dem die Fenster rechnen können');

    // Der Taktstock: anhalten, weiterlaufen, gleichziehen.
    gleich(
      (await spieler.ruf('/ambience/steuerung', { methode: 'POST', koerper: { spielt: false } })).status,
      403,
      'Den Takt gibt nur die Spielleitung'
    );

    const angehalten = (
      await sl.ruf('/ambience/steuerung', { methode: 'POST', koerper: { spielt: false, position: 42.5 } })
    ).daten;
    gleich(angehalten.spielt, false, 'Die Spielleitung hält für alle an');
    gleich(angehalten.position, 42.5, 'Und sagt dazu, wo sie steht');
    gleich((await spieler.ruf('/ambience/aktiv')).daten.spielt, false, 'Das Anhalten kommt bei der Runde an');
    gleich((await spieler.ruf('/ambience/aktiv')).daten.position, 42.5, 'Samt Stelle');

    const weiter = (await sl.ruf('/ambience/steuerung', { methode: 'POST', koerper: { spielt: true, position: 43 } }))
      .daten;
    gleich(weiter.spielt, true, 'Und lässt wieder laufen');
    pruefe(
      new Date(weiter.stand).getTime() >= new Date(angehalten.stand).getTime(),
      'Jeder Taktschlag trägt einen neuen Zeitstempel'
    );

    const unfug = (
      await sl.ruf('/ambience/steuerung', { methode: 'POST', koerper: { spielt: true, position: -99 } })
    ).daten;
    gleich(unfug.position, 0, 'Eine Stelle vor dem Anfang gibt es nicht');

    await sl.ruf('/ambience/stille', { methode: 'POST' });
    gleich((await spieler.ruf('/ambience/aktiv')).daten.uri, null, 'Stille kommt bei allen an');
    gleich(
      (await sl.ruf('/ambience/steuerung', { methode: 'POST', koerper: { spielt: true } })).status,
      409,
      'Was still ist, lässt sich nicht steuern'
    );

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

}
