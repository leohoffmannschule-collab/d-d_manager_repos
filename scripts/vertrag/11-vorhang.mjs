/**
 * Vertrag, Kapitel: Der Vorhang.
 *
 * Hinter geschlossenem Vorhang bekommt die Runde gar nichts vom Tisch –
 * nicht ausgeblendet, sondern nicht geschickt, auch nicht als einzelner
 * Pinselstrich im Nebel. Und die Chronik vermerkt den Ort erst, wenn er sich
 * hebt.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, mitschreiben, pruefe } from './werkzeug.mjs';

export default async function vorhang(lage) {
  const { sl, spieler } = lage;
  {
    const buehne = (
      await sl.ruf('/scenes', {
        methode: 'POST',
        koerper: { name: 'Drachenhort', width: 700, height: 700, gridSize: 70 },
      })
    ).daten;
    await sl.ruf(`/scenes/${buehne.id}/aktivieren`, { methode: 'POST' });
    await sl.ruf(`/scenes/${buehne.id}/nebel/alles`, { methode: 'POST', koerper: { revealed: true } });
    await sl.ruf(`/scenes/${buehne.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Der Drache', x: 210, y: 210, size: 2 },
    });

    gleich((await spieler.ruf('/scenes/aktiv')).daten.name, 'Drachenhort', 'Offen sieht die Runde die Szene');

    gleich(
      (await spieler.ruf('/scenes/vorhang', { methode: 'POST', koerper: { zu: true } })).status,
      403,
      'Den Vorhang zieht nur die Spielleitung'
    );

    await sl.ruf('/scenes/vorhang', { methode: 'POST', koerper: { zu: true } });
    const verdeckt = (await spieler.ruf('/scenes/aktiv')).daten;
    gleich(verdeckt.vorhang, true, 'Zugezogen erfährt die Runde nur, dass der Vorhang zu ist');
    gleich(verdeckt.name, undefined, 'Aber nicht, wie die Szene heißt');
    gleich(verdeckt.tokens, undefined, 'Und keine einzige Figur');
    gleich(verdeckt.mediaId, undefined, 'Auch das Kartenbild bleibt draußen');
    gleich(verdeckt.fogBits, undefined, 'Und der Nebel');
    gleich(
      Object.keys(verdeckt).join(','),
      'vorhang',
      'Es ist wirklich nichts sonst in der Nutzlast'
    );

    // Die Spielleitung arbeitet dahinter weiter.
    const slSicht = (await sl.ruf('/scenes/aktiv')).daten;
    gleich(slSicht.name, 'Drachenhort', 'Die Spielleitung sieht ihren Tisch weiter');
    gleich(slSicht.vorhang, true, 'Und dass der Vorhang zu ist');

    // Karte wechseln, während es zu ist – genau der Sinn der Sache.
    const zweite = (
      await sl.ruf('/scenes', {
        methode: 'POST',
        koerper: { name: 'Die Schatzkammer', width: 700, height: 700, gridSize: 70 },
      })
    ).daten;
    await sl.ruf(`/scenes/${zweite.id}/aktivieren`, { methode: 'POST' });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.name,
      undefined,
      'Ein Kartenwechsel hinter dem Vorhang bleibt verborgen'
    );
    gleich((await sl.ruf('/scenes/aktiv')).daten.name, 'Die Schatzkammer', 'Die Spielleitung steht schon dort');

    // Auch ein Pinselstrich hinter dem Vorhang bleibt dort: Schon die Felder
    // verrieten, wo die Spielleitung gerade aufbaut.
    const ohr = await mitschreiben(spieler);
    await ohr.warteAuf('event: willkommen');
    await sl.ruf(`/scenes/${zweite.id}/nebel`, { methode: 'POST', koerper: { cells: ['2,3', '2,4'], revealed: true } });
    // Ein Zeigefinger hinter dem Vorhang ebenso – auch der eigene einer
    // Spielerin geht dann nur an die Spielleitung (die Runde hat ja keine Karte).
    const ohrSl = await mitschreiben(sl);
    await ohrSl.warteAuf('event: willkommen');
    gleich(
      (await spieler.ruf('/scenes/ping', { methode: 'POST', koerper: { x: 717, y: 818 } })).status,
      204,
      'Zeigen geht auch hinter dem Vorhang'
    );
    pruefe(await ohrSl.warteAuf('"x":717,"y":818'), 'Die Spielleitung sieht es');
    await ohrSl.zu();

    // Und jetzt Bühne frei.
    await sl.ruf('/scenes/vorhang', { methode: 'POST', koerper: { zu: false } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.name,
      'Die Schatzkammer',
      'Geöffnet sieht die Runde die neue Karte'
    );

    // Offen kommt jeder Strich sofort an – und der von vorhin nie als Strich.
    await sl.ruf(`/scenes/${zweite.id}/nebel`, { methode: 'POST', koerper: { cells: ['5,6'], revealed: true } });
    pruefe(await ohr.warteAuf('"cells":["5,6"]'), 'Bei offenem Vorhang erreicht ein Pinselstrich die Runde sofort');
    pruefe(!ohr.text().includes('"2,3"'), 'Ein Pinselstrich hinter dem Vorhang erreicht die Runde nicht');
    pruefe(!ohr.text().includes('"x":717'), 'Ein Zeigefinger hinter dem Vorhang erreicht die Runde nicht');
    await ohr.zu();

    // Die Chronik führt den Ort erst, wenn die Runde ihn erreicht hat.
    const eintraege = (await sl.ruf('/chronicle/sessions')).daten;
    const sitzung = (await sl.ruf(`/chronicle/sessions/${eintraege[0].id}`)).daten;
    const szenen = sitzung.entries.filter((e) => e.kind === 'szene').map((e) => e.text);
    pruefe(
      szenen.some((t) => t.includes('Der Vorhang hebt sich: Die Schatzkammer')),
      'Der Ort steht erst im Protokoll, wenn der Vorhang aufgeht'
    );
    pruefe(
      !szenen.some((t) => t === 'Die Runde erreicht: Die Schatzkammer.'),
      'Und nicht schon beim verdeckten Auflegen'
    );

    // Verdeckt auflegen in einem Zug.
    await sl.ruf(`/scenes/${buehne.id}/aktivieren`, { methode: 'POST', koerper: { verdeckt: true } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.vorhang,
      true,
      'Verdeckt auflegen zieht den Vorhang gleich mit zu'
    );

    await sl.ruf('/scenes/vorhang', { methode: 'POST', koerper: { zu: false } });
    await sl.ruf(`/scenes/${zweite.id}`, { methode: 'DELETE' });
    await sl.ruf(`/scenes/${buehne.id}`, { methode: 'DELETE' });
  }

}
