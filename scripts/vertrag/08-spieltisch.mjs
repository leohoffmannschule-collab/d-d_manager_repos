/**
 * Vertrag, Kapitel: Spieltisch und Kartenbibliothek.
 *
 * Szenen, Figuren, Nebel und Zeigefinger; dazu die Kartenbibliothek, aus der
 * Szenen samt ausgerichtetem Raster aufgelegt werden.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function spieltisch(lage) {
  const { sl, spieler, held } = lage;
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

}
