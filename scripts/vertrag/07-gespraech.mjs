/**
 * Vertrag, Kapitel: Chronik, verdeckte Würfe und Chat.
 *
 * Was am Tisch gesagt und gewürfelt wird – und wer davon was erfährt:
 * Chronik als Struktur statt Prosa, verdeckte Würfe, Chat an alle und
 * geflüstert.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich, pruefe } from './werkzeug.mjs';

export default async function gespraech(lage) {
  const { sl, spieler, zweite } = lage;
  {
    const sitzungen = (await sl.ruf('/chronicle/sessions')).daten;
    pruefe(sitzungen.length > 0, 'Die Chronik hat von selbst begonnen');
    const sitzung = (await sl.ruf(`/chronicle/sessions/${sitzungen[0].id}`)).daten;
    const schaden = sitzung.entries.find((e) => e.kind === 'schaden');
    pruefe(!!schaden, 'Schaden steht in der Chronik');
    pruefe(typeof schaden?.meta?.amount === 'number', 'Chronikeintrag trägt Strukturdaten, nicht nur Prosa');
    pruefe(typeof schaden?.meta?.target === 'string', 'Chronikeintrag nennt das Ziel als Feld');
    pruefe(typeof schaden?.text === 'string', 'Zum Eintrag gibt es einen fertigen Satz als Rückfallebene');

    const rundenSicht = (await spieler.ruf(`/chronicle/sessions/${sitzungen[0].id}`)).daten;
    pruefe(
      rundenSicht.entries.every((e) => e.secret === false),
      'Verdeckte Einträge fehlen in der Fassung für die Runde'
    );
  }

  // --- Verdeckte Würfe ---------------------------------------------------
  {
    await sl.ruf('/dice/roll', { methode: 'POST', koerper: { expression: '1W20', secret: true, label: 'Geheim' } });
    const rundenChronik = (await spieler.ruf('/dice/history')).daten;
    pruefe(!rundenChronik.some((w) => w.label === 'Geheim'), 'Verdeckte Würfe bleiben verdeckt');
    const slChronik = (await sl.ruf('/dice/history')).daten;
    pruefe(slChronik.some((w) => w.label === 'Geheim'), 'Die Spielleitung sieht ihren verdeckten Wurf');
  }

  // --- Chat: an alle und geflüstert ---------------------------------------
  {
    const { status, daten } = await spieler.ruf('/chat', {
      methode: 'POST',
      koerper: { text: 'Wer öffnet die Tür?' },
    });
    gleich(status, 201, 'Eine Nachricht lässt sich sagen');
    pruefe(daten?.toUserId === null, 'Ohne Empfänger geht sie an alle');

    const beiDerSl = (await sl.ruf('/chat')).daten;
    pruefe(beiDerSl.some((z) => z.text === 'Wer öffnet die Tür?'), 'Gesagtes erreicht die Spielleitung');
    const beiDerZweiten = (await zweite.ruf('/chat')).daten;
    pruefe(beiDerZweiten.some((z) => z.text === 'Wer öffnet die Tür?'), 'Gesagtes erreicht die ganze Runde');
  }
  {
    // Die Spielerin flüstert der zweiten Spielerin zu – die Spielleitung
    // steht ausdrücklich daneben und darf davon nichts mitbekommen.
    const wer = (await spieler.ruf('/chat/wer')).daten;
    const ziel = wer.find((p) => p.name === 'Vertrag-Zweite');
    pruefe(!!ziel, 'Die Liste der Empfänger nennt die Mitspieler');
    pruefe(!wer.some((p) => p.name === 'Vertrag-Spielerin'), 'Man selbst steht nicht darin');

    const { status } = await spieler.ruf('/chat', {
      methode: 'POST',
      koerper: { text: 'Ich nehme heimlich den Ring.', an: ziel.id },
    });
    gleich(status, 201, 'Flüstern geht');

    const beiDerZweiten = (await zweite.ruf('/chat')).daten;
    pruefe(beiDerZweiten.some((z) => z.text === 'Ich nehme heimlich den Ring.'), 'Die Gemeinte liest es');
    const beiDerSprecherin = (await spieler.ruf('/chat')).daten;
    pruefe(beiDerSprecherin.some((z) => z.text === 'Ich nehme heimlich den Ring.'), 'Und die Sprecherin auch');
    const beiDerSl = (await sl.ruf('/chat')).daten;
    pruefe(
      !beiDerSl.some((z) => z.text === 'Ich nehme heimlich den Ring.'),
      'Geflüstertes erreicht nicht einmal die Spielleitung'
    );
  }
  {
    const { status, daten } = await spieler.ruf('/chat', { methode: 'POST', koerper: { text: '   ' } });
    gleich(status, 400, 'Leeres wird abgewiesen');
    gleich(daten?.code, 'nachricht_leer', 'Auch das trägt einen Schlüssel');
  }
  {
    const { status, daten } = await spieler.ruf('/chat', { methode: 'DELETE' });
    gleich(status, 403, 'Leeren darf nur die Spielleitung');
    gleich(daten?.code, 'nur_spielleitung', 'Mit Schlüssel');
  }
  {
    gleich((await sl.ruf('/chat', { methode: 'DELETE' })).status, 200, 'Die Spielleitung darf leeren');
    gleich((await sl.ruf('/chat')).daten.length, 0, 'Danach ist der Tisch still');
  }

}
