/**
 * Die Würfel des Almanachs.
 *
 * Der Zwanzigseiter ist das Zeichen des Almanachs schlechthin: Er steht im
 * Kopf der Seite, auf jedem Wurfknopf und im Würfelbecher. Zwei Fassungen –
 * eine schlichte, die auch bei 16 Bildpunkten noch als W20 lesbar ist, und
 * eine mit allen Kanten für große Flächen.
 *
 * Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
 * neues Symbol entsteht.
 */
import Icon from './rahmen.jsx';

// Zwanzigseiter: Sechseck-Umriss mit der oben stehenden Mittelfläche –
// so liest man ihn auch bei 18 Pixeln als W20 und nicht als Würfelkasten.
export function IconD20(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.2 20.6 7.1v9.8L12 21.8 3.4 16.9V7.1z" />
      <path d="M12 6.1 17.7 15.5H6.3z" />
    </Icon>
  );
}

/** Zwanzigseiter mit allen Kanten – groß gezeigt, wo gewürfelt wird (Würfelbecher, Anmeldung). */
export function IconD20Detailed(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.2 20.6 7.1v9.8L12 21.8 3.4 16.9V7.1z" />
      <path d="M12 6.1 17.7 15.5H6.3z" />
      <path d="M12 6.1V2.2M17.7 15.5l2.9 1.4M17.7 15.5l2.9-8.4M6.3 15.5l-2.9 1.4M6.3 15.5 3.4 7.1M6.3 15.5 12 21.8l5.7-6.3" />
    </Icon>
  );
}
