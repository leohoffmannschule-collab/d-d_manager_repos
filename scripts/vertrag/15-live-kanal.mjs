/**
 * Vertrag, Kapitel: Der Live-Kanal.
 *
 * Der Live-Kanal öffnet sich, spricht Server-Sent Events, begrüßt mit der
 * Fensterkennung und trägt Änderungen am Kampf.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { BASIS, gleich, pruefe } from './werkzeug.mjs';

export default async function liveKanal(lage) {
  const { sl, spieler } = lage;
  {
    const kekse = [...spieler.kekse].map(([k, v]) => `${k}=${v}`).join('; ');
    const antwort = await fetch(`${BASIS}/stream`, { headers: { cookie: kekse } });
    gleich(antwort.status, 200, 'Der Live-Kanal öffnet sich');
    gleich(
      antwort.headers.get('content-type')?.split(';')[0],
      'text/event-stream',
      'Der Live-Kanal spricht Server-Sent Events'
    );

    const leser = antwort.body.getReader();
    const gelesen = [];
    const frist = setTimeout(() => leser.cancel().catch(() => {}), 4000);

    // Etwas auslösen, das ankommen muss.
    setTimeout(() => sl.ruf('/encounter/next-turn', { methode: 'POST' }), 300);

    // Beim Verbinden treffen sofort „willkommen“ und „anwesenheit“ ein.
    // Gewartet wird deshalb gezielt auf das ausgelöste Kampfereignis.
    try {
      while (!gelesen.join('').includes('event: kampf')) {
        const { value, done } = await leser.read();
        if (done) break;
        gelesen.push(new TextDecoder().decode(value));
      }
    } catch {
      /* Frist abgelaufen */
    }
    clearTimeout(frist);
    await leser.cancel().catch(() => {});

    const strom = gelesen.join('');
    pruefe(strom.includes('event: willkommen'), 'Der Kanal begrüßt mit der Fensterkennung');
    pruefe(strom.includes('event: kampf'), 'Änderungen am Kampf laufen über den Kanal ein');
  }

}
