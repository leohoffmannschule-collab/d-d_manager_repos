/**
 * Fuß und Meter, Pfund und Kilogramm.
 *
 * Die Regel, die das ganze Charakterblatt trägt: **Gespeichert wird immer
 * in Fuß und Pfund**, angezeigt wahlweise metrisch. Umgerechnet wird erst
 * beim Anzeigen.
 *
 * Der Grund ist nicht Bequemlichkeit, sondern Genauigkeit: Würde beim
 * Speichern umgerechnet, sammelten sich Rundungsfehler bei jedem Öffnen
 * und Schließen. Und ein Blatt bliebe nicht dasselbe, gleich wer es
 * aufschlägt.
 *
 * Beim *Maßstab* wird bewusst grob gerundet: Ein Feld sind 5 Fuß oder
 * 1,5 Meter – am Tisch sagt jeder „anderthalb Meter“, niemand
 * „1,524 Meter“. Beim *Gewicht* dagegen wird ehrlich umgerechnet, denn
 * Traglast ist eine Regel, die man ausrechnet.
 */

/**
 * Fuß oder Meter, Pfund oder Kilogramm.
 *
 * Gespeichert wird immer in Fuß und Pfund – daran hängt der Nebel am
 * Spieltisch, der ausrechnet, wie weit eine Figur im Dunkeln sieht. Was hier
 * steht, ist nur die Brille: Wer metrisch spielt, tippt Meter ein und liest
 * Meter ab, im Blatt steht trotzdem, was der Server versteht.
 */
export const MASSSYSTEME = [
  ['metrisch', 'Meter und Kilogramm'],
  ['imperial', 'Fuß und Pfund'],
];

/**
 * Am Tisch misst ein Feld fünf Fuß *oder* anderthalb Meter – das Regelwerk
 * rechnet nicht um, es setzt gleich. Deshalb wird auch hier gesetzt und nicht
 * umgerechnet: drei Zehntel Meter je Fuß. So werden aus 30 Fuß glatte 9 m und
 * aus 60 Fuß Dunkelsicht glatte 18 m, wie es im Regelwerk steht.
 */
export const METER_JE_FUSS = 0.3;

/** Gewichte dagegen sind echte Maße und werden ehrlich umgerechnet. */
export const KILO_JE_PFUND = 0.45359237;

/** Auf eine Nachkommastelle – so genau, wie am Tisch jemand eine Weite nennt. */
const gerundet = (zahl) => Math.round(zahl * 10) / 10;

/**
 * Gespeichert wird eine Stelle genauer, als angezeigt wird. Sonst wandert
 * ein Gewicht bei jedem Umrechnen ein Stück: Wer 11,3 kg einträgt, soll beim
 * nächsten Öffnen wieder 11,3 kg lesen und nicht 11,2.
 */
const genauer = (zahl) => Math.round(zahl * 100) / 100;

/** Spielt dieses Blatt metrisch? Alles außer ausdrücklich „imperial“ gilt als metrisch. */
export const istMetrisch = (units) => units !== 'imperial';

/** Die Einheit, in der Weiten angezeigt werden: „m“ oder „Fuß“. */
export const weiteEinheit = (units) => (istMetrisch(units) ? 'm' : 'Fuß');
/** Die Einheit, in der Gewichte angezeigt werden: „kg“ oder „Pfund“. */
export const gewichtEinheit = (units) => (istMetrisch(units) ? 'kg' : 'Pfund');

/** Eine Weite aus dem Blatt (immer in Fuß) so, wie sie angezeigt wird. */
export function weiteAnzeigen(fuss, units) {
  const wert = Number(fuss) || 0;
  return istMetrisch(units) ? gerundet(wert * METER_JE_FUSS) : wert;
}

/** Und zurück: Was jemand eingetippt hat, wieder in Fuß. */
export function weiteNachFuss(wert, units) {
  const zahl = Number(wert) || 0;
  return istMetrisch(units) ? Math.round(zahl / METER_JE_FUSS) : zahl;
}

/** Ein Gewicht aus dem Blatt (immer in Pfund) so, wie es angezeigt wird – auf eine Stelle gerundet. */
export function gewichtAnzeigen(pfund, units) {
  const wert = Number(pfund) || 0;
  return istMetrisch(units) ? gerundet(wert * KILO_JE_PFUND) : gerundet(wert);
}

/** Und zurück: Was jemand eingetippt hat, wieder in Pfund – eine Stelle genauer als angezeigt. */
export function gewichtNachPfund(wert, units) {
  const zahl = Number(wert) || 0;
  return istMetrisch(units) ? genauer(zahl / KILO_JE_PFUND) : zahl;
}

/** Weite samt Einheit, fertig zum Hinschreiben: „9 m“, „60 Fuß“. */
export const weiteMitEinheit = (fuss, units) => `${weiteAnzeigen(fuss, units)} ${weiteEinheit(units)}`;
/** Gewicht samt Einheit, fertig zum Hinschreiben: „11,3 kg“, „25 Pfund“. */
export const gewichtMitEinheit = (pfund, units) => `${gewichtAnzeigen(pfund, units)} ${gewichtEinheit(units)}`;
