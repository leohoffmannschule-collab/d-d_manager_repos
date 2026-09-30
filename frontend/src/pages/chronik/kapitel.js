/**
 * Die Chronik ordnen: Symbole je Art, Uhrzeiten und die Einteilung eines
 * Abends in Kapitel.
 *
 * Ohne JSX, damit sich die Einteilung auch ohne Oberfläche prüfen ließe –
 * sie ist reine Rechnung über eine Liste.
 */
import {
  IconD20,
  IconEyeOff,
  IconHeart,
  IconMap,
  IconQuill,
  IconScroll,
  IconSwords,
} from '../../components/icons.jsx';

// Ein Symbol je Art von Eintrag. Fehlt eine Art hier, bleibt die Zeile
// schlicht – das ist gewollt, damit eine neue Art nichts kaputt macht.
export const SYMBOL = {
  wurf: IconD20,
  schaden: IconSwords,
  heilung: IconHeart,
  tod: IconSwords,
  zustand: IconEyeOff,
  runde: IconSwords,
  kampf: IconSwords,
  auftritt: IconSwords,
  szene: IconMap,
  handzettel: IconScroll,
  rast: IconHeart,
  notiz: IconQuill,
};

/** Uhrzeit eines Eintrags, wie sie am Rand steht: „20:15“. */
export const uhrzeit = (iso) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

/**
 * Aus der Folge von Einträgen Kapitel machen – wie im Protokoll.
 *
 * Die Einträge kommen als flache, zeitlich sortierte Liste. Hier werden sie
 * an den Szenenwechseln aufgeteilt, damit der Abend gegliedert dasteht
 * statt als eine Wand aus zweihundert Zeilen.
 */
export function inKapitel(entries) {
  const kapitel = [];
  let aktuell = null;
  for (const e of entries) {
    if (e.kind === 'szene' || e.meta?.kapitel) {
      aktuell = { titel: e.text.replace(/\.$/, ''), zeit: e.createdAt, eintraege: [] };
      kapitel.push(aktuell);
      continue;
    }
    if (!aktuell) {
      aktuell = { titel: 'Zu Beginn', zeit: e.createdAt, eintraege: [] };
      kapitel.push(aktuell);
    }
    aktuell.eintraege.push(e);
  }
  return kapitel;
}
