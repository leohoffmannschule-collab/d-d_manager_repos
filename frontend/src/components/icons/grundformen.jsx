/**
 * Grundformen: hinzufügen, entfernen, bestätigen, schließen, suchen, weiter.
 *
 * Die Symbole, die in jedem Formular und jeder Liste vorkommen und
 * keinem Sachgebiet gehören. Sie sind absichtlich die schlichtesten: ein,
 * zwei Striche, damit sie neben Text nicht lauter sind als der Text.
 *
 * Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
 * neues Symbol entsteht.
 */
import Icon from './rahmen.jsx';

/** Plus: hinzufügen, erhöhen, aufklappen. */
export function IconPlus(props) {
  return (
    <Icon strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

/** Minus: verringern, einen Zug zurück. */
export function IconMinus(props) {
  return (
    <Icon strokeWidth="2" {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

/** Haken: erledigt, gesichert, bestätigt. */
export function IconCheck(props) {
  return (
    <Icon strokeWidth="3" {...props}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </Icon>
  );
}

/** Kreuz: schließen. */
export function IconClose(props) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

/** Lupe: suchen und filtern. */
export function IconSearch(props) {
  return (
    <Icon strokeWidth="1.6" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

/** Winkel nach rechts: wer gerade dran ist, was weiterführt. */
export function IconChevronRight(props) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  );
}
