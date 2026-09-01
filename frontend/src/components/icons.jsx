// Gezeichnete Symbole statt Emoji – so passen sie zum Stil, lassen sich
// einfärben und bleiben auf jedem Gerät gleich.
function Icon({ size = 20, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

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

export function IconD20Detailed(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.2 20.6 7.1v9.8L12 21.8 3.4 16.9V7.1z" />
      <path d="M12 6.1 17.7 15.5H6.3z" />
      <path d="M12 6.1V2.2M17.7 15.5l2.9 1.4M17.7 15.5l2.9-8.4M6.3 15.5l-2.9 1.4M6.3 15.5 3.4 7.1M6.3 15.5 12 21.8l5.7-6.3" />
    </Icon>
  );
}

export function IconScroll(props) {
  return (
    <Icon {...props}>
      <path d="M6 3h9a3 3 0 0 1 3 3v15H8a2 2 0 0 1-2-2z" />
      <path d="M18 3a3 3 0 0 0-3 3v12" />
      <path d="M9 8h6M9 12h6" />
    </Icon>
  );
}

export function IconBook(props) {
  return (
    <Icon {...props}>
      <path d="M3 5.5C5.5 4 8.5 4 12 5.8 15.5 4 18.5 4 21 5.5v13c-2.5-1.5-5.5-1.5-9 .3-3.5-1.8-6.5-1.8-9-.3z" />
      <path d="M12 5.8v13" />
    </Icon>
  );
}

export function IconHelp(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.2a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.6" />
      <path d="M12 17.2h.01" />
    </Icon>
  );
}

export function IconShield(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.2c2.8 1.2 5.2 1.6 7 1.4v7.1c0 4.1-2.8 7.1-7 9.1-4.2-2-7-5-7-9.1V4.6c1.8.2 4.2-.2 7-1.4z" />
      <path d="M12 8.2v6.4M9 11.4h6" />
    </Icon>
  );
}

export function IconPlus(props) {
  return (
    <Icon strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function IconMinus(props) {
  return (
    <Icon strokeWidth="2" {...props}>
      <path d="M5 12h14" />
    </Icon>
  );
}

export function IconCheck(props) {
  return (
    <Icon strokeWidth="3" {...props}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </Icon>
  );
}

export function IconClose(props) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  );
}

export function IconSearch(props) {
  return (
    <Icon strokeWidth="1.6" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </Icon>
  );
}

export function IconChevronRight(props) {
  return (
    <Icon strokeWidth="1.8" {...props}>
      <path d="m9 5 7 7-7 7" />
    </Icon>
  );
}

export function IconQuill(props) {
  return (
    <Icon {...props}>
      <path d="M4 20c1.5-6 5.5-11 15-14-1 7-5 11.5-11 12.5" />
      <path d="M4 20c2.5-1 4.5-2 6-3.5" />
    </Icon>
  );
}

export function IconMap(props) {
  return (
    <Icon {...props}>
      <path d="M9 4.5 3.5 6.8v12.7L9 17.2l6 2.3 5.5-2.3V4.5L15 6.8z" />
      <path d="M9 4.5v12.7M15 6.8v12.7" />
    </Icon>
  );
}

export function IconCandle(props) {
  return (
    <Icon {...props}>
      <path d="M12 3c1.8 1.8 2.6 3.1 2.6 4.3a2.6 2.6 0 0 1-5.2 0C9.4 6.1 10.2 4.8 12 3z" />
      <path d="M8.5 12h7v8.5h-7z" />
      <path d="M12 9.9V12" />
    </Icon>
  );
}

export function IconSun(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.2 12H2M22 12h-2.2M6.4 6.4 4.9 4.9M19.1 19.1l-1.5-1.5M17.6 6.4l1.5-1.5M4.9 19.1l1.5-1.5" />
    </Icon>
  );
}

export function IconClock(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5l3 2" />
    </Icon>
  );
}

/** Vierstrahliger Stern – der goldene Zierrat vor jeder Rubrik. */
export function Fleuron({ size = 14, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.5 14 9l6.5 1.5L15.5 15l1.5 6.5L12 18l-5 3.5L8.5 15 3.5 10.5 10 9z" />
    </svg>
  );
}

/** Rankenlinie als Abschluss unter Überschriften. */
export function Vine({ width = 60, className = '' }) {
  return (
    <svg width={width} height="12" viewBox="0 0 60 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M2 10c6 0 8-8 12-8s6 8 12 8 8-8 12-8 6 8 12 8" />
    </svg>
  );
}
