/**
 * Vertrag, Kapitel: Aus dem Code-Review: Grenzen, die leicht wieder verrutschen.
 *
 * Jede Prüfung hier steht für einen Fehler, den ein Code-Review gefunden
 * hat: CORS, offene Kanäle nach dem Abmelden, erfundene Verweise, doppelte
 * Auszahlung, Ausbrüche aus dem Kompendium. Sie halten fest, dass er nicht
 * zurückkommt.
 *
 * Jede dieser Prüfungen steht für einen Fehler, den es gab. Sie sind hier
 * festgehalten, damit er nicht beim nächsten Umbau zurückkommt.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import http from 'node:http';
import { BASIS, PORT, gleich, klient, pruefe } from './werkzeug.mjs';

export default async function review(lage) {
  const { sl, spieler, fremd } = lage;
  {
    const tischId = (await sl.ruf('/campaigns')).daten.aktive;

    // Kein CORS: Eine fremde Seite bekommt keine Freigabe, mit dem
    // Anmelde-Cookie der Spielleitung zu lesen.
    const fremdeHerkunft = await fetch(`${BASIS}/auth/status`, { headers: { Origin: 'http://fremd.example' } });
    gleich(fremdeHerkunft.headers.get('access-control-allow-origin'), null, 'Keine CORS-Freigabe für fremde Herkünfte');
    gleich(fremdeHerkunft.headers.get('x-frame-options'), 'SAMEORIGIN', 'Der Almanach lässt sich nicht fremd einrahmen');

    // Die Anmeldebremse hält auch einem Schwall gleichzeitiger Versuche
    // stand – nicht nur Versuchen, die brav nacheinander kommen.
    const schwall = await Promise.all(
      Array.from({ length: 14 }, () =>
        fremd.ruf('/auth/login', { methode: 'POST', koerper: { name: 'Vertrag-Raterin', password: 'falsch-geraten' } })
      )
    );
    pruefe(
      schwall.filter((a) => a.status === 401).length <= 8,
      'Gleichzeitige Rateversuche kommen nicht an der Bremse vorbei',
      `durchgelassen: ${schwall.filter((a) => a.status === 401).length}`
    );

    // Ein kaputt kodiertes Cookie ist „nicht angemeldet“, kein Serverfehler.
    const kaputt = await fetch(`${BASIS}/auth/status`, { headers: { cookie: 'almanach_sitzung=%E0' } });
    gleich(kaputt.status, 200, 'Ein kaputtes Cookie reißt den Server nicht um');

    // Abmelden schließt auch den Live-Kanal dieser Anmeldung.
    const zweitesGeraet = klient();
    await zweitesGeraet.ruf('/auth/login', {
      methode: 'POST',
      koerper: { name: 'Vertrag-Spielerin', password: 'ausreichend-lang' },
    });
    const ihre = (await zweitesGeraet.ruf('/campaigns')).daten.kampagnen;
    await zweitesGeraet.ruf(`/campaigns/${ihre.find((k) => k.id === tischId)?.id ?? ihre[0].id}/aktiv`, { methode: 'POST' });
    const kekse = [...zweitesGeraet.kekse].map(([k, v]) => `${k}=${v}`).join('; ');
    const strom = await fetch(`${BASIS}/stream`, { headers: { cookie: kekse } });
    const leser = strom.body.getReader();
    await leser.read(); // „willkommen“
    await zweitesGeraet.ruf('/auth/logout', { methode: 'POST' });
    const ende = await Promise.race([
      (async () => {
        for (;;) {
          const { done } = await leser.read();
          if (done) return 'zu';
        }
      })(),
      new Promise((weiter) => setTimeout(() => weiter('offen'), 3000)),
    ]);
    await leser.cancel().catch(() => {});
    gleich(ende, 'zu', 'Nach dem Abmelden hört das Fenster nicht mehr mit');

    // Geflüstert wird nur an Mitglieder dieser Kampagne.
    const gastCode = (await sl.ruf('/auth/invites', { methode: 'POST', koerper: {} })).daten.code;
    const gast = klient();
    const gastKonto = (
      await gast.ruf('/auth/register', {
        methode: 'POST',
        koerper: { name: 'Vertrag-Gast', password: 'ausreichend-lang', invite: gastCode },
      })
    ).daten.user;
    const gefluestert = await sl.ruf('/chat', { methode: 'POST', koerper: { text: 'Psst', an: gastKonto.id } });
    gleich(gefluestert.status, 404, 'An ein Konto außerhalb der Kampagne wird nicht geflüstert');

    // Würfelausdrücke müssen als Ganzes stimmen.
    for (const [ausdruck, status] of [['2W6 + 3', 201], ['d6d8', 400], ['1W20 5', 400]]) {
      gleich(
        (await sl.ruf('/dice/roll', { methode: 'POST', koerper: { expression: ausdruck } })).status,
        status,
        `„${ausdruck}“ ergibt ${status}`
      );
    }

    // Verweise werden gegen die eigene Kampagne geprüft: 400, kein 500.
    const eineSzene = (await sl.ruf('/scenes')).daten[0];
    if (pruefe(!!eineSzene, 'Für die Verweisprüfung liegt eine Szene bereit')) {
      const antwort = await sl.ruf(`/scenes/${eineSzene.id}/figuren`, {
        methode: 'POST',
        koerper: { name: 'Geist', characterId: 'gibt-es-nicht' },
      });
      gleich(antwort.status, 400, 'Eine Figur an einem erfundenen Blatt wird abgewiesen');
      gleich(antwort.daten?.code, 'verweis_unbekannt', 'Mit Schlüssel');
    }
    gleich(
      (await sl.ruf('/stash/items', { methode: 'POST', koerper: { name: 'Stein', holderId: 'gibt-es-nicht' } })).status,
      400,
      'Ein Fund bei einem erfundenen Träger wird abgewiesen'
    );

    // Ein kaputter Eintrag in einer Begegnung ist kein Serverfehler.
    const begegnung = await sl.ruf('/encounters', {
      methode: 'POST',
      koerper: { name: 'Mit Löchern', entries: [null, 7, { name: 'Ratte', hp: 2 }] },
    });
    gleich(begegnung.status, 201, 'Begegnung mit kaputten Einträgen wird angelegt');
    gleich(begegnung.daten?.entries?.length, 1, 'Nur der brauchbare Eintrag bleibt');
    await sl.ruf(`/encounters/${begegnung.daten?.id}`, { methode: 'DELETE' });

    // Doppelt genannt heißt nicht doppelt bezahlt.
    const empfaenger = (await sl.ruf('/characters')).daten.find((c) => !c.npc);
    const vorherKiste = (await sl.ruf('/stash')).daten.coins;
    await sl.ruf('/stash/coins', { methode: 'PUT', koerper: { pp: 0, gp: 10, ep: 0, sp: 0, cp: 0 } });
    const auszahlung = await sl.ruf('/stash/auszahlen', {
      methode: 'POST',
      koerper: { characterIds: [empfaenger.id, empfaenger.id] },
    });
    gleich(auszahlung.daten?.empfaenger, 1, 'Ein doppelt genannter Charakter zählt einmal');
    gleich(auszahlung.daten?.anteil?.gp, 10, 'Und bekommt den ganzen Anteil, nicht die Hälfte');
    await sl.ruf('/stash/coins', { methode: 'PUT', koerper: vorherKiste });

    // Ein Spieler, der etwas Verbotenes mitschickt, ändert gar nichts.
    const eigenes = (await spieler.ruf('/characters')).daten.find((c) => c.ownerId);
    const vorherGeteilt = eigenes.shared;
    gleich(
      (await spieler.ruf(`/characters/${eigenes.id}`, { methode: 'PATCH', koerper: { shared: !vorherGeteilt, npc: true } })).status,
      403,
      'Teilen und NSC zugleich: abgewiesen'
    );
    gleich(
      (await spieler.ruf(`/characters/${eigenes.id}`)).daten.shared,
      vorherGeteilt,
      'Und die Absage hat auch das Teilen nicht angefasst'
    );

    // Eine Sitzung beenden heißt: *diese* Sitzung.
    gleich(
      (await sl.ruf('/chronicle/sessions/gibt-es-nicht/ende', { methode: 'POST' })).status,
      404,
      'Eine unbekannte Sitzung lässt sich nicht beenden'
    );

    // Aus dem Kompendium führt kein Weg hinaus – auch nicht kodiert. Über
    // `http` statt `fetch`, weil `fetch` das `%2e%2e` schon selbst auflöst
    // und die Anfrage sonst nie so beim Server ankäme, wie ein Angreifer sie
    // schickt.
    const ausbruch = await new Promise((fertig, fehler) => {
      const anfrage = http.request(
        {
          host: 'localhost',
          port: PORT,
          path: '/api/compendium/%2e%2e/%2e%2e/geheim',
          headers: { cookie: [...sl.kekse].map(([k, v]) => `${k}=${v}`).join('; ') },
        },
        (antwort) => {
          let text = '';
          antwort.on('data', (stueck) => (text += stueck));
          antwort.on('end', () => fertig({ status: antwort.statusCode, text }));
        }
      );
      anfrage.on('error', fehler);
      anfrage.end();
    });
    gleich(ausbruch.status, 400, 'Das Kompendium lässt sich nicht verlassen');
    pruefe(ausbruch.text.includes('ungueltiger_pfad'), 'Mit Schlüssel');
  }

}
