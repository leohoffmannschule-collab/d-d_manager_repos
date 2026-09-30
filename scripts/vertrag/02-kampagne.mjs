/**
 * Vertrag, Kapitel: Die Kampagne – die Bühne für alles Weitere.
 *
 * Konten gehören der ganzen Runde, alles Gespielte gehört einer Kampagne.
 * Die Spielleitung bekommt ihre erste beim Einrichten mitgeliefert; wer
 * später dazukommt, steht zunächst vor gar keiner, und der Server antwortet
 * auf jeden Spielweg mit 409. Das ist das Tor, durch das die Oberfläche in
 * die Kampagnenauswahl schickt. Die Spielerinnen treten der Kampagne hier bei.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function kampagne(lage) {
  const { sl, spieler, fremd, zweite } = lage;
  {
    const { status, daten } = await spieler.ruf('/characters');
    gleich(status, 409, 'Ohne gewählte Kampagne kein Spiel');
    gleich(daten?.code, 'keine_kampagne', 'Und das Tor nennt sich beim Namen');
  }
  const kampagne = (await sl.ruf('/campaigns')).daten?.kampagnen?.[0];
  {
    pruefe(typeof kampagne?.id === 'string', 'Die Spielleitung hat vom ersten Tag an eine Kampagne');
    gleich((await sl.ruf('/campaigns')).daten?.aktive, kampagne?.id, 'Und sitzt auch gleich darin');
    pruefe(kampagne?.darfVerwalten === true, 'Wer sie angelegt hat, bestimmt über sie');

    const konten = (await sl.ruf('/auth/users')).daten;
    for (const [name, wer] of [['Vertrag-Spielerin', spieler], ['Vertrag-Zweite', zweite]]) {
      const konto = konten.find((k) => k.name === name);
      await sl.ruf(`/campaigns/${kampagne.id}/mitglieder`, { methode: 'POST', koerper: { userId: konto.id } });
      gleich((await wer.ruf(`/campaigns/${kampagne.id}/aktiv`, { methode: 'POST' })).status, 204, `${name} tritt der Kampagne bei`);
    }
    gleich((await spieler.ruf('/characters')).status, 200, 'Danach steht der Runde die Kampagne offen');
  }

  {
    const { status, daten } = await fremd.ruf('/characters');
    gleich(status, 401, 'Ohne Anmeldung kein Zugriff');
    gleich(daten?.code, 'nicht_angemeldet', 'Auch 401 trägt einen Schlüssel');
  }
  {
    const { status, daten } = await spieler.ruf('/library');
    gleich(status, 403, 'Die Runde kommt nicht ins Bestiarium');
    gleich(daten?.code, 'nur_spielleitung', 'Auch 403 trägt einen Schlüssel');
  }

  Object.assign(lage, { kampagne });
}
