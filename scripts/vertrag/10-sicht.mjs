/**
 * Vertrag, Kapitel: Sicht: Nebel, Licht und Sinne.
 *
 * In einer dunklen Szene sieht jede Figur nur, was Licht und eigene Sinne
 * hergeben. Geprüft wird die Sicht, die der Server je Person rechnet und
 * verschickt.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function sicht(lage) {
  const { sl, spieler } = lage;
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

}
