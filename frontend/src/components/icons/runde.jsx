/**
 * Symbole für Runde, Spieltisch und Spielleitung.
 *
 * Konten und Rollen (Schlüssel, Krone, Runde), der Kampf (Schwerter, Herz),
 * die Sicht am Tisch (Auge, Nebel, Zielscheibe, Lineal) und die Handgriffe drumherum
 * (Hochladen, Mitnehmen, Löschen, Abmelden, Gespräch).
 *
 * Gezeichnet wird auf dem Rahmen aus rahmen.jsx – siehe dort, wie ein
 * neues Symbol entsteht.
 */
import Icon from './rahmen.jsx';

/** Schlüssel: Kennwort, Einladungen, Anmeldung. */
export function IconKey(props) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="4.2" />
      <path d="M11 11 20 20M17.5 17.5l2-2M14.5 14.5l2-2" />
    </Icon>
  );
}

/** Gekreuzte Schwerter: Kampf und Initiative. */
export function IconSwords(props) {
  return (
    <Icon {...props}>
      <path d="M4 4h3.2l9.3 9.3-3.2 3.2L4 7.2z" />
      <path d="M20 4h-3.2l-4 4M14.4 14.4 20 20M4 20l3.6-3.6" />
    </Icon>
  );
}

/** Krone: die Spielleitung. */
export function IconCrown(props) {
  return (
    <Icon {...props}>
      <path d="M3 7.5 6.5 13 12 5.5 17.5 13 21 7.5V18H3z" />
      <path d="M3 20.5h18" />
    </Icon>
  );
}

/** Zwei Köpfe: die Runde. */
export function IconUsers(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c0-3.4 2.8-5.6 6.2-5.6s6.2 2.2 6.2 5.6" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 6.6M17.5 14.8c2.2.6 3.7 2.5 3.7 5.2" />
    </Icon>
  );
}

/** Auge: sichtbar, für die Runde gezeigt. */
export function IconEye(props) {
  return (
    <Icon {...props}>
      <path d="M1.8 12S5.4 5.8 12 5.8 22.2 12 22.2 12 18.6 18.2 12 18.2 1.8 12 1.8 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </Icon>
  );
}

/** Durchgestrichenes Auge: verborgen, nur für die Spielleitung. */
export function IconEyeOff(props) {
  return (
    <Icon {...props}>
      <path d="M9.6 6.2A9.6 9.6 0 0 1 12 5.8c6.6 0 10.2 6.2 10.2 6.2a17 17 0 0 1-3.3 4M6.1 8A17 17 0 0 0 1.8 12S5.4 18.2 12 18.2c1.4 0 2.6-.3 3.7-.7" />
      <path d="M10 10a2.8 2.8 0 0 0 4 4M3 3l18 18" />
    </Icon>
  );
}

/** Nebelschwaden: Nebel des Krieges und der Vorhang. */
export function IconFog(props) {
  return (
    <Icon {...props}>
      <path d="M4 8.5h9M16 8.5h4M3 12.5h5M11 12.5h10M5 16.5h11M19 16.5h1" />
    </Icon>
  );
}

/** Zielscheibe: auf eine Stelle der Karte zeigen. */
export function IconTarget(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
    </Icon>
  );
}

/** Lineal: Entfernungen auf der Karte messen. */
export function IconLineal(props) {
  return (
    <Icon {...props}>
      <path d="M3.5 15.5 15.5 3.5l5 5-12 12z" />
      <path d="M6 13l2.2 2.2M8.5 10.5l1.4 1.4M11 8l2.2 2.2M13.5 5.5l1.4 1.4" />
    </Icon>
  );
}

/** Papierkorb: löschen und entfernen. */
export function IconTrash(props) {
  return (
    <Icon {...props}>
      <path d="M4 6.5h16M9.5 6.5V4.2h5v2.3M6.2 6.5 7 20.2h10l.8-13.7" />
      <path d="M10.2 10.5v6M13.8 10.5v6" />
    </Icon>
  );
}

/** Tür mit Pfeil: abmelden. */
export function IconLogout(props) {
  return (
    <Icon {...props}>
      <path d="M14.5 4.5h-8v15h8" />
      <path d="M11 12h10M17.5 8.2 21.3 12l-3.8 3.8" />
    </Icon>
  );
}

/** Pfeil nach oben: Bild oder Datei hochladen. */
export function IconUpload(props) {
  return (
    <Icon {...props}>
      <path d="M12 16.5V4.2M7.8 8.4 12 4.2l4.2 4.2" />
      <path d="M3.8 15v4.8h16.4V15" />
    </Icon>
  );
}

/** Herz: Trefferpunkte, Heilung – und die Beutekiste am Tisch. */
export function IconHeart(props) {
  return (
    <Icon {...props}>
      <path d="M12 20.5S3.2 15 3.2 9.2A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.8 2.6c0 5.8-8.8 11.3-8.8 11.3z" />
    </Icon>
  );
}

/** Kettenglied: Verweise (Einladungslink, Spotify-Adresse). */
export function IconLink(props) {
  return (
    <Icon {...props}>
      <path d="M10 13.8a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.6 1.6" />
      <path d="M14 10.2a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.6-1.6" />
    </Icon>
  );
}

/** Pfeil nach unten: das Blatt mitnehmen. */
export function IconDownload(props) {
  return (
    <Icon {...props}>
      <path d="M12 3.8v12.4M7.8 12l4.2 4.2 4.2-4.2" />
      <path d="M3.8 15v4.8h16.4V15" />
    </Icon>
  );
}

/** Sprechblase: das Gespräch am Tisch. */
export function IconChat(props) {
  return (
    <Icon {...props}>
      <path d="M20 12.6c0 3.4-3.6 6.2-8 6.2-1 0-2-.15-2.9-.4L4 20l1.4-3.5C4.2 15.4 3.5 14.1 3.5 12.6c0-3.4 3.6-6.2 8-6.2s8.5 2.8 8.5 6.2z" />
      <path d="M8.6 12.4h6.8M8.6 9.8h4.4" />
    </Icon>
  );
}
