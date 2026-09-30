/**
 * Die Symbole des Klangteppichs.
 *
 * Die Klangleiste am Tisch und die Klangbibliothek hinter dem Schirm:
 * abspielen, anhalten, alle auf dieselbe Stelle ziehen, mithören.
 *
 * Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
 * neues Symbol entsteht.
 */
import Icon from './rahmen.jsx';

/** Note: der Klangteppich. */
export function IconNote(props) {
  return (
    <Icon {...props}>
      <path d="M9.2 17.4V5.6l9-1.8v11.6" />
      <circle cx="6.9" cy="17.6" r="2.3" />
      <circle cx="15.9" cy="15.6" r="2.3" />
    </Icon>
  );
}

/** Dreieck: abspielen. */
export function IconPlay(props) {
  return (
    <Icon {...props}>
      <path d="M7.6 5.2l11 6.8-11 6.8z" />
    </Icon>
  );
}

/** Zwei Balken: anhalten. */
export function IconPause(props) {
  return (
    <Icon {...props}>
      <path d="M8 5v14M16 5v14" />
    </Icon>
  );
}

/** Zwei Pfeile im Kreis: alle wieder auf dieselbe Stelle ziehen. */
export function IconSync(props) {
  return (
    <Icon {...props}>
      <path d="M20 11a8 8 0 0 0-13.7-5.6L4 7.6" />
      <path d="M4 4v4h4" />
      <path d="M4 13a8 8 0 0 0 13.7 5.6L20 16.4" />
      <path d="M20 20v-4h-4" />
    </Icon>
  );
}

/**
 * Lautsprecher mit Schallwellen: hier mithören.
 *
 * Ein Ohr wäre das nähere Bild, liest sich bei sechzehn Bildpunkten aber wie
 * ein Fragezeichen. Der Lautsprecher ist unmissverständlich.
 */
export function IconSpeaker(props) {
  return (
    <Icon {...props}>
      <path d="M11 5L6.5 9H3.5v6h3L11 19z" />
      <path d="M15 9.5a4 4 0 0 1 0 5" />
      <path d="M17.8 6.8a8 8 0 0 1 0 10.4" />
    </Icon>
  );
}
