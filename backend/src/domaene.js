/**
 * Die feste Adresse der Runde.
 *
 * Ohne eigene Domain leiht sich der Schnelltunnel bei jedem Start eine neue
 * Adresse, und die Runde bekommt vor jedem Spielabend eine andere geschickt.
 * Wer eine Domain hat, trägt sie einmal ein:
 *
 *   DOMAENE=www.deinemudda.fun
 *
 * Danach heißt der Almanach für alle immer gleich – gleichgültig, in welchem
 * Netz der Rechner gerade steht. Getragen wird die Adresse vom *benannten*
 * Tunnel (`npm run tunnel` mit gesetztem `TUNNEL_TOKEN`); dieser Wert hier ist
 * nur das, was der Almanach der Runde nennt.
 *
 * Geschrieben werden darf sie, wie man sie in den Browser tippt: mit oder ohne
 * `https://`, mit oder ohne Schrägstrich am Ende.
 */

const SCHEMA = /^[a-z][a-z0-9+.-]*:\/\//i;
const GUELTIG = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+(:\d{1,5})?$/;

/**
 * Was in `DOMAENE` steht – auf den nackten Namen gebracht.
 *
 * Ein Tippfehler hält den Almanach nicht auf: Dann ist `adresse` leer, und der
 * Aufrufer sagt es beim Start. Eine falsche Adresse in die Runde zu schicken
 * wäre schlimmer als gar keine.
 */
export function festeAdresse(roh = process.env.DOMAENE) {
  const text = String(roh ?? '').trim();
  if (!text) return { gesetzt: false, name: null, adresse: null, roh: '' };

  const name = text
    .replace(SCHEMA, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  if (!GUELTIG.test(name)) return { gesetzt: true, name: null, adresse: null, roh: text };
  return { gesetzt: true, name, adresse: `https://${name}`, roh: text };
}
