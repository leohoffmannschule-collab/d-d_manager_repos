/**
 * Vertrag, Kapitel: Sichtweite: das Nebelfenster hängt an der Figur.
 *
 * Eine eingetragene Sichtweite wird zum Nebelfenster, das an der eigenen
 * Figur hängt; die Szene kann sie für alle deckeln (Nebelbank,
 * Schneetreiben).
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function sichtweite(lage) {
  const { sl, spieler } = lage;
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

    // Und die eigene Fackel trägt den Blick über die Sichtweite hinaus –
    // dafür zündet man sie ja an.
    await sl.ruf(`/scenes/figuren/${wesen.id}`, {
      methode: 'PATCH',
      koerper: { x: 700, y: 70, lightBright: 0, lightDim: 0 },
    });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      1,
      'Neun Felder weit reicht der Blick im Dunkeln nicht'
    );
    await sl.ruf(`/scenes/figuren/${ihre.id}`, {
      methode: 'PATCH',
      koerper: { lightBright: 30, lightDim: 30 },
    });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      2,
      'Mit eigener Laterne (60 Fuß) sehr wohl – Licht erweitert das Sichtfeld'
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

    // Auch die Laterne kommt durch eine Nebelbank nicht weiter.
    await sl.ruf(`/scenes/${feld.id}`, { methode: 'PUT', koerper: { dark: true, sight: 20 } });
    gleich(
      (await spieler.ruf('/scenes/aktiv')).daten.tokens.length,
      1,
      'Nebel bleibt Nebel, auch mit Laterne'
    );

    await sl.ruf(`/scenes/figuren/${ihre.id}`, { methode: 'PATCH', koerper: { lightBright: 0, lightDim: 0 } });
    await sl.ruf(`/scenes/${feld.id}`, { methode: 'DELETE' });
    blatt.data.combat.senses = { sight: 0, darkvision: 0, blindsight: 0, tremorsense: 0, truesight: 0 };
    await sl.ruf(`/characters/${held.id}`, { methode: 'PUT', koerper: { data: blatt.data } });
  }

}
