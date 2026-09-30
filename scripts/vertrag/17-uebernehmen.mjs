/**
 * Vertrag, Kapitel: Daten in eine andere Kampagne kopieren.
 *
 * Charaktere, Handzettel, Szenen und Beute ziehen in eine andere Kampagne –
 * kopiert, nicht verschoben, ganz oder gar nicht, und mit Verweisen, die
 * drüben ihre Gegenstücke wiederfinden.
 *
 * Vorbereitung – Karten, Bestiarium, Begegnungen, Klang – gehört der ganzen
 * Runde und steht überall bereit. Alles, was zu *einer* Geschichte gehört,
 * lässt sich hinüberkopieren: Stück für Stück oder auf einmal.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function uebernehmen(lage) {
  const { sl, spieler, kampagne, held } = lage;
  {
    const heimat = kampagne.id;

    // Vorher etwas anlegen, das mitkommen soll.
    const zettel = (
      await sl.ruf('/notes', {
        methode: 'POST',
        koerper: { title: 'Hausregeln der Runde', content: 'Nat. 20 heilt einen Erschöpfungsgrad.', visibility: 'runde' },
      })
    ).daten;
    await sl.ruf('/stash/items', { methode: 'POST', koerper: { name: 'Zwergenbrot', qty: 3 } });
    await sl.ruf('/stash/coins', { methode: 'PUT', koerper: { pp: 0, gp: 20, ep: 0, sp: 0, cp: 0 } });
    const bühne = (
      await sl.ruf('/scenes', { methode: 'POST', koerper: { name: 'Marktplatz', width: 700, height: 700 } })
    ).daten;
    // Vorbereitung, die gar nicht erst kopiert werden muss – sie gehört der
    // ganzen Runde und muss drüben von selbst dastehen.
    await sl.ruf('/ambience', {
      methode: 'POST',
      koerper: { name: 'Marktgeschrei', uri: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
    });
    await sl.ruf('/library', { methode: 'POST', koerper: { name: 'Marktdieb', category: 'npc', hp: 7, ac: 12 } });
    await sl.ruf(`/scenes/${bühne.id}/figuren`, {
      methode: 'POST',
      koerper: { name: 'Vertrag-Held', x: 70, y: 70, characterId: held.id },
    });

    const umfang = (await sl.ruf('/campaigns/umfang')).daten;
    pruefe(typeof umfang?.arten?.charaktere?.label === 'string', 'Der Umfang nennt die Arten beim Namen');
    gleich(umfang?.arten?.charaktere?.eins, 'Charakter', 'Und kennt ihre Einzahl – „1 Charaktere“ liest sich nicht');
    pruefe(umfang.notizen >= 1, 'Der Umfang zählt die Notizen');
    pruefe(umfang.szenen >= 1, 'Der Umfang zählt die Szenen');
    gleich(umfang.beute, 1, 'Der Umfang zählt die Beute');
    gleich(umfang.muenzen?.gp, 20, 'Der Umfang nennt die Münzen in der Kiste');
    pruefe(
      umfang.charaktere < (await sl.ruf('/characters')).daten.length,
      'Unberührte Vorlagen zählen nicht zum Umzugsgut',
      `Umfang ${umfang.charaktere}, Blätter insgesamt ${(await sl.ruf('/characters')).daten.length}`
    );

    // --- Ein einzelnes Stück ---------------------------------------------
    {
      const abgewiesen = await sl.ruf(`/characters/${held.id}/kopieren`, {
        methode: 'POST',
        koerper: { campaignId: heimat },
      });
      gleich(abgewiesen.status, 400, 'In dieselbe Kampagne kopiert niemand');
      gleich(abgewiesen.daten?.code, 'gleiche_kampagne', 'Mit Schlüssel');

      const insLeere = await sl.ruf(`/characters/${held.id}/kopieren`, {
        methode: 'POST',
        koerper: { campaignId: 'gibt-es-nicht' },
      });
      gleich(insLeere.status, 403, 'In eine fremde Kampagne kommt nichts hinein');
      gleich(insLeere.daten?.code, 'ziel_unbekannt', 'Mit Schlüssel');
    }

    // Eine zweite Kampagne – sie wird beim Anlegen gleich die aktive, also
    // danach zurückwechseln.
    const zweit = (await sl.ruf('/campaigns', { methode: 'POST', koerper: { name: 'Vertrag-Zweitspiel' } })).daten;
    await sl.ruf(`/campaigns/${heimat}/aktiv`, { methode: 'POST' });

    {
      const kopiert = await sl.ruf(`/characters/${held.id}/kopieren`, {
        methode: 'POST',
        koerper: { campaignId: zweit.id },
      });
      gleich(kopiert.status, 201, 'Ein Blatt lässt sich in eine andere Kampagne legen');

      const verwehrt = await spieler.ruf(`/characters/${held.id}/kopieren`, {
        methode: 'POST',
        koerper: { campaignId: zweit.id },
      });
      gleich(verwehrt.status, 403, 'Kopieren ist Sache der Spielleitung');

      const einZettel = await sl.ruf(`/notes/${zettel.id}/kopieren`, {
        methode: 'POST',
        koerper: { campaignId: zweit.id },
      });
      gleich(einZettel.status, 201, 'Auch ein Handzettel lässt sich hinüberlegen');
    }

    // --- Und alles auf einmal --------------------------------------------
    const bericht = await sl.ruf('/campaigns/uebernehmen', {
      methode: 'POST',
      koerper: { campaignId: zweit.id, arten: ['charaktere', 'notizen', 'szenen', 'beute'] },
    });
    gleich(bericht.status, 200, 'Die ganze Kampagne lässt sich übernehmen');
    gleich(bericht.daten?.bericht?.charaktere, umfang.charaktere, 'Es kommt so viel an, wie angekündigt war');
    gleich(bericht.daten?.ziel?.name, 'Vertrag-Zweitspiel', 'Der Bericht nennt das Ziel beim Namen');
    {
      const ohneWahl = await sl.ruf('/campaigns/uebernehmen', {
        methode: 'POST',
        koerper: { campaignId: zweit.id, arten: [] },
      });
      gleich(ohneWahl.status, 400, 'Ohne Wahl wird nichts kopiert');
      gleich(ohneWahl.daten?.code, 'nichts_gewaehlt', 'Mit Schlüssel');
    }

    // --- Drüben nachsehen -------------------------------------------------
    await sl.ruf(`/campaigns/${zweit.id}/aktiv`, { methode: 'POST' });
    {
      const blaetter = (await sl.ruf('/characters')).daten;
      gleich(blaetter.filter((c) => c.name === 'Vertrag-Held').length, 2, 'Einzeln und im Ganzen kopiert ergibt zwei');

      const notizen = (await sl.ruf('/notes')).daten;
      gleich(notizen.filter((n) => n.title === 'Hausregeln der Runde').length, 2, 'Der Handzettel liegt zweimal drüben');

      const szenen = (await sl.ruf('/scenes')).daten;
      const marktplatz = szenen.find((sz) => sz.name === 'Marktplatz');
      pruefe(!!marktplatz, 'Die Szene ist mitgekommen');
      gleich(marktplatz?.tokenCount, 1, 'Und ihre Figuren mit ihr');

      const tisch = (await sl.ruf('/scenes/aktiv')).daten;
      pruefe(!!tisch?.id, 'In der neuen Kampagne liegt gleich eine Szene auf dem Tisch');
      const figur = tisch.tokens.find((t) => t.name === 'Vertrag-Held');
      pruefe(
        !!figur && blaetter.some((c) => c.id === figur.characterId),
        'Die Figur hat drüben ihren gleichnamigen Charakter wiedergefunden'
      );

      const kiste = (await sl.ruf('/stash')).daten;
      pruefe(kiste.items.some((g) => g.name === 'Zwergenbrot'), 'Die Beute ist mitgekommen');
      gleich(kiste.coins.gp, 20, 'Und die Münzen dazu');

      // Vorbereitung gehört der Runde: Sie stand nie in der Liste dessen, was
      // kopiert wird, und ist trotzdem da.
      pruefe((await sl.ruf('/maps')).daten.length > 0, 'Die Kartenbibliothek steht auch hier bereit');
      pruefe(
        (await sl.ruf('/ambience')).daten.some((k) => k.name === 'Marktgeschrei'),
        'Der Klangteppich ebenso'
      );
      pruefe(
        (await sl.ruf('/library')).daten.some((e) => e.name === 'Marktdieb'),
        'Und das Bestiarium – ein Goblin bleibt ein Goblin'
      );
    }

    // Noch einmal übernehmen: Münzen werden dazugelegt, nicht ersetzt.
    await sl.ruf(`/campaigns/${heimat}/aktiv`, { methode: 'POST' });
    await sl.ruf('/campaigns/uebernehmen', { methode: 'POST', koerper: { campaignId: zweit.id, arten: ['beute'] } });
    await sl.ruf(`/campaigns/${zweit.id}/aktiv`, { methode: 'POST' });
    gleich((await sl.ruf('/stash')).daten.coins.gp, 40, 'Münzen werden dazugelegt, nicht überschrieben');

    // Und zurück auf die Bühne, auf der der Rest der Prüfung steht.
    await sl.ruf(`/campaigns/${heimat}/aktiv`, { methode: 'POST' });
    gleich((await sl.ruf('/campaigns')).daten.aktive, heimat, 'Zurück in der Heimatkampagne');
  }

}
