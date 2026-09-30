/**
 * Vertrag, Kapitel: Maßstab und große Karten.
 *
 * Ein Feld muss nicht fünf Fuß sein: Metrische Karten, große Außenkarten und
 * die Umrechnung der Sinne in Felder.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function massstab(lage) {
  const { sl, spieler } = lage;
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

}
