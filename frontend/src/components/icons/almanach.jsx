/**
 * Die Symbole der Bücher und Seiten: Schriftrolle, Buch, Feder, Karte, Kerze.
 *
 * Alles, was nach Schreibstube aussieht: Die Seiten des Almanachs
 * (Chronik, Kompendium, Hilfe, Karten) und die beiden Erscheinungsbilder
 * (Kerzenlicht und Pergament).
 *
 * Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
 * neues Symbol entsteht.
 */
import Icon from './rahmen.jsx';

/** Schriftrolle: Kampagnen, Chronik, Handzettel. */
export function IconScroll(props) {
  return (
    <Icon {...props}>
      <path d="M6 3h9a3 3 0 0 1 3 3v15H8a2 2 0 0 1-2-2z" />
      <path d="M18 3a3 3 0 0 0-3 3v12" />
      <path d="M9 8h6M9 12h6" />
    </Icon>
  );
}

/** Aufgeschlagenes Buch: Bestiarium, Zauberverzeichnis, Chronik. */
export function IconBook(props) {
  return (
    <Icon {...props}>
      <path d="M3 5.5C5.5 4 8.5 4 12 5.8 15.5 4 18.5 4 21 5.5v13c-2.5-1.5-5.5-1.5-9 .3-3.5-1.8-6.5-1.8-9-.3z" />
      <path d="M12 5.8v13" />
    </Icon>
  );
}

/** Fragezeichen im Kreis: zur Hilfe. */
export function IconHelp(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.6" />
      <path d="M12 17.2h.01" />
    </Icon>
  );
}

/** Schild: vorbereitete Begegnungen. */
export function IconShield(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.2c2.8 1.2 5.2 1.6 7 1.4v7.1c0 4.1-2.8 7.1-7 9.1-4.2-2-7-5-7-9.1V4.6c1.8.2 4.2-.2 7-1.4z" />
      <path d="M12 8.2v6.4M9 11.4h6" />
    </Icon>
  );
}

/** Schreibfeder: bearbeiten, Notizen, Chronik. */
export function IconQuill(props) {
  return (
    <Icon {...props}>
      <path d="M4 20c1.5-6 5.5-11 15-14-1 7-5 11.5-11 12.5" />
      <path d="M4 20c2.5-1 4.5-2 6-3.5" />
    </Icon>
  );
}

/** Gefaltete Karte: Karten und Szenen. */
export function IconMap(props) {
  return (
    <Icon {...props}>
      <path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" />
      <path d="M9 4.5v12.7M15 6.8v12.7" />
    </Icon>
  );
}

/** Kerze: das dunkle Erscheinungsbild (Kerzenlicht), die lange Rast. */
export function IconCandle(props) {
  return (
    <Icon {...props}>
      <path d="M12 3c1.8 1.8 2.6 3.1 2.6 4.3a2.6 2.6 0 0 1-5.2 0C9.4 6.1 10.2 4.8 12 3z" />
      <path d="M8.5 12h7v8.5h-7z" />
      <path d="M12 9.9V12" />
    </Icon>
  );
}

/** Sonne: das helle Erscheinungsbild (Pergament), die kurze Rast. */
export function IconSun(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.4 6.4 4.9 4.9M19.1 19.1l-1.5-1.5M17.6 6.4l1.5-1.5M4.9 19.1l1.5-1.5" />
    </Icon>
  );
}

/** Uhr: Zeitangaben im Kompendium (Zauberdauer, Wirkungsdauer). */
export function IconClock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3 2" />
    </Icon>
  );
}
