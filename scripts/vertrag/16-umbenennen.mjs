/**
 * Vertrag, Kapitel: Umbenennen.
 *
 * Umbenennen darf nur, wer die Kampagne angelegt hat; der Name hängt an
 * nichts, also zieht nichts nach.
 *
 * Der Name hängt an nichts: Alles darin zeigt auf die Kennung. Genau das
 * wird hier nachgewiesen – nach dem Umbenennen steht dieselbe Habe da.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich } from './werkzeug.mjs';

export default async function umbenennen(lage) {
  const { sl, spieler, kampagne } = lage;
  {
    const vorher = (await sl.ruf('/campaigns')).daten.kampagnen.find((k) => k.id === kampagne.id).name;
    const habe = (await sl.ruf('/characters')).daten.length;

    const zuKurz = await sl.ruf(`/campaigns/${kampagne.id}`, { methode: 'PATCH', koerper: { name: 'X' } });
    gleich(zuKurz.status, 400, 'Ein Name aus einem Zeichen wird abgewiesen');
    gleich(zuKurz.daten?.code, 'name_ungueltig', 'Mit Schlüssel');

    const fremd = await spieler.ruf(`/campaigns/${kampagne.id}`, {
      methode: 'PATCH',
      koerper: { name: 'Heimlich umbenannt' },
    });
    gleich(fremd.status, 403, 'Umbenennen darf nur, wer die Kampagne angelegt hat');
    gleich(fremd.daten?.code, 'nicht_angelegt', 'Mit Schlüssel');

    const benannt = await sl.ruf(`/campaigns/${kampagne.id}`, {
      methode: 'PATCH',
      koerper: { name: '  Der Preis von Klarwasser  ' },
    });
    gleich(benannt.status, 200, 'Die Spielleitung darf ihre Kampagne umbenennen');
    gleich(benannt.daten?.name, 'Der Preis von Klarwasser', 'Rundherum Leerzeichen fallen weg');
    gleich(benannt.daten?.vorher, vorher, 'Der Bericht nennt auch den alten Namen');

    const liste = (await sl.ruf('/campaigns')).daten.kampagnen.find((k) => k.id === kampagne.id);
    gleich(liste?.name, 'Der Preis von Klarwasser', 'Und die Liste zeigt ihn');
    gleich((await sl.ruf('/characters')).daten.length, habe, 'Die Habe der Kampagne bleibt unberührt');

    // Unter dem neuen Namen wird gelöscht – der alte gilt nicht mehr.
    const alterName = await sl.ruf(`/campaigns/${kampagne.id}`, { methode: 'DELETE', koerper: { name: vorher } });
    gleich(alterName.status, 400, 'Zum Löschen zählt der neue Name, nicht der alte');

    await sl.ruf(`/campaigns/${kampagne.id}`, { methode: 'PATCH', koerper: { name: vorher } });
    gleich(
      (await sl.ruf('/campaigns')).daten.kampagnen.find((k) => k.id === kampagne.id)?.name,
      vorher,
      'Und wieder zurück'
    );
  }

}
