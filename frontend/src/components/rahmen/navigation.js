/**
 * Die Hauptnavigation, als Liste statt als JSX.
 *
 * Der Schirm der Spielleitung kommt nur für sie dazu – und zwar hier, nicht
 * über ein `hidden` im Kopf: Was nicht in der Liste steht, gibt es für
 * dieses Fenster nicht. (Geschützt ist der Weg dahinter ohnehin im Server;
 * das hier ist nur die Höflichkeit, ihn gar nicht erst anzubieten.)
 */
import { IconBook, IconCrown, IconMap, IconQuill, IconScroll } from '../icons.jsx';

export function navItems(isDm) {
  return [
    { to: '/', label: 'Charaktere', Icon: IconScroll, end: true },
    { to: '/tisch', label: 'Spieltisch', Icon: IconMap },
    { to: '/kompendium', label: 'Kompendium', Icon: IconBook },
    { to: '/chronik', label: 'Chronik', Icon: IconQuill },
    ...(isDm ? [{ to: '/spielleitung', label: 'Spielleitung', Icon: IconCrown }] : []),
  ];
}
