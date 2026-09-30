/**
 * Alle Symbole des Almanachs, als SVG von Hand gezeichnet.
 *
 * Warum keine Emoji? Sie sehen auf jedem Gerät anders aus, lassen sich nicht
 * einfärben und passen selten zu einem Pergament. Warum keine Symbol-
 * Bibliothek? Weil der Almanach ohne Netz laufen soll und ein Paket für
 * dreißig Symbole schwerer wöge als diese Datei.
 *
 * Alle bauen auf `Icon` auf und erben von dort `stroke="currentColor"`: Das
 * Symbol nimmt die Textfarbe seiner Umgebung an. Deshalb genügt ein
 * `className="text-gold"` am Symbol, und es ist golden – ohne eine einzige
 * Zeile über Farben hier drin.
 *
 * Ein neues Symbol: `Icon` umhüllen, Pfade hinein, in Vierundzwanzigstel
 * denken (das `viewBox` ist 24×24), und `strokeWidth` dem Rest überlassen.
 * Es kommt in die Datei unter icons/, zu deren Sachgebiet es gehört:
 *
 *   icons/rahmen.jsx       – der gemeinsame Rahmen (Icon)
 *   icons/wuerfel.jsx      – die Würfel
 *   icons/grundformen.jsx  – Plus, Minus, Haken, Kreuz, Lupe, Winkel
 *   icons/almanach.jsx     – Schriftrolle, Buch, Feder, Karte, Kerze …
 *   icons/runde.jsx        – Runde, Spieltisch und Spielleitung
 *   icons/klang.jsx        – der Klangteppich
 *   icons/zierrat.jsx      – der Stern vor jeder Rubrik
 *
 * Eingeführt wird trotzdem immer von hier (`from './icons.jsx'`): Wer ein
 * Symbol braucht, soll nicht wissen müssen, in welcher Schublade es liegt.
 */
export { IconD20, IconD20Detailed } from './icons/wuerfel.jsx';
export {
  IconPlus,
  IconMinus,
  IconCheck,
  IconClose,
  IconSearch,
  IconChevronRight,
} from './icons/grundformen.jsx';
export {
  IconScroll,
  IconBook,
  IconHelp,
  IconShield,
  IconQuill,
  IconMap,
  IconCandle,
  IconSun,
  IconClock,
} from './icons/almanach.jsx';
export {
  IconKey,
  IconSwords,
  IconCrown,
  IconUsers,
  IconEye,
  IconEyeOff,
  IconFog,
  IconTarget,
  IconTrash,
  IconLogout,
  IconUpload,
  IconHeart,
  IconLink,
  IconDownload,
  IconChat,
} from './icons/runde.jsx';
export { IconNote, IconPlay, IconPause, IconSync, IconSpeaker } from './icons/klang.jsx';
export { Fleuron } from './icons/zierrat.jsx';
