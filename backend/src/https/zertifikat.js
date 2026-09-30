/**
 * Zertifikate für HTTPS im Heimnetz – ausgestellt vom Almanach selbst.
 *
 * Über den Tunnel ist der Almanach verschlüsselt (Cloudflare bringt das
 * Zertifikat mit). Im WLAN dagegen sprach der Browser ihn über `http://`
 * an, und wer im selben Netz mitlas, sah beim Anmelden das Kennwort und
 * danach das Sitzungs-Cookie. Für HTTPS braucht es ein Zertifikat – und für
 * eine Adresse wie `192.168.1.20` stellt keine öffentliche Stelle eines aus.
 *
 * Also stellt der Almanach es selbst aus, in zwei Stufen, wie es auch
 * Werkzeuge wie mkcert tun:
 *
 *   Stammzertifikat   eine eigene kleine Ausstellungsstelle. Wer keine
 *                     Warnung sehen will, installiert *dieses* einmal auf
 *                     seinen Geräten (Download unter /almanach-stamm.crt).
 *   Serverzertifikat  von ihm unterschrieben, für die Adressen und Namen
 *                     dieses Geräts. Das tauscht der Server bei Bedarf aus,
 *                     ohne dass an den Geräten etwas zu tun ist.
 *
 * Das Stammzertifikat ist **beschränkt** (Name Constraints): Es darf nur
 * für private Adressen (10.x, 172.16–31.x, 192.168.x, 127.x, 169.254.x) und
 * Heimnetznamen (`localhost`, `*.local`, `*.lan`, `*.home.arpa`,
 * `*.internal`, `*.fritz.box`, der Name dieses Rechners, und was beim
 * Anlegen eigens genannt wurde) bürgen. Gelangte sein Schlüssel je in
 * falsche Hände, ließe sich damit trotzdem keine Bank und kein Postfach
 * vortäuschen – der Browser lehnt jedes Zertifikat für einen fremden Namen
 * ab, auch wenn es richtig unterschrieben ist.
 *
 * Schlüssel: ECDSA auf P-256, signiert mit SHA-256 – klein, schnell auf
 * einem Pi, und von allen heutigen Browsern angenommen. Laufzeiten: das
 * Serverzertifikat 820 Tage (Apple nimmt höchstens 825 an), das
 * Stammzertifikat zehn Jahre.
 */
import crypto from 'node:crypto';
import os from 'node:os';
import * as der from './der.js';

const OID = {
  ecdsaMitSha256: '1.2.840.10045.4.3.2',
  gebraeuchlicherName: '2.5.4.3',
  organisation: '2.5.4.10',
  basisBeschraenkung: '2.5.29.19',
  schluesselNutzung: '2.5.29.15',
  erweiterteNutzung: '2.5.29.37',
  serverAnmeldung: '1.3.6.1.5.5.7.3.1',
  alternativeNamen: '2.5.29.17',
  schluesselKennung: '2.5.29.14',
  ausstellerKennung: '2.5.29.35',
  namensBeschraenkung: '2.5.29.30',
};

const TAG = 24 * 60 * 60 * 1000;

/** Wie lange das Stammzertifikat gilt: zehn Jahre – es wird einmal installiert. */
export const LAUFZEIT_STAMM_TAGE = 3650;

/** Wie lange ein Serverzertifikat gilt: 820 Tage (Apple nimmt höchstens 825 an). */
export const LAUFZEIT_SERVER_TAGE = 820;

/** Die privaten IPv4-Netze, für die das Stammzertifikat bürgen darf: [Netz, Maske]. */
export const PRIVATE_NETZE = [
  ['10.0.0.0', '255.0.0.0'],
  ['172.16.0.0', '255.240.0.0'],
  ['192.168.0.0', '255.255.0.0'],
  ['127.0.0.0', '255.0.0.0'],
  ['169.254.0.0', '255.255.0.0'],
];

/** Namen, die es nur im eigenen Netz gibt – kein öffentlicher Name endet so. */
export const HEIMNAMEN = ['localhost', 'local', 'lan', 'home.arpa', 'internal', 'fritz.box'];

/** Eine IPv4-Adresse als vier Bytes – oder null, wenn es keine ist. */
export function ipBytes(adresse) {
  const teile = String(adresse).split('.');
  if (teile.length !== 4 || !teile.every((t) => /^\d{1,3}$/.test(t) && Number(t) <= 255)) return null;
  return teile.map(Number);
}

/** Liegt die Adresse in einem der privaten Netze? */
export function istPrivat(adresse) {
  const bytes = ipBytes(adresse);
  if (!bytes) return false;
  return PRIVATE_NETZE.some(([netz, maske]) => {
    const n = ipBytes(netz);
    const m = ipBytes(maske);
    return bytes.every((b, i) => (b & m[i]) === n[i]);
  });
}

/** Ein brauchbarer DNS-Name: Buchstaben, Ziffern, Bindestriche, durch Punkte getrennt. */
export const istName = (name) =>
  typeof name === 'string' && name.length <= 253 && /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/i.test(name);

/** Deckt eine Liste erlaubter Namen (wie im Stammzertifikat) diesen Namen? */
export const namensraumDeckt = (erlaubt, name) =>
  erlaubt.some((e) => name.toLowerCase() === e || name.toLowerCase().endsWith(`.${e}`));

/** Der Name dieses Rechners, wenn er als DNS-Name taugt („raspberrypi“). */
export function rechnername() {
  const name = os.hostname().toLowerCase();
  return istName(name) ? name : null;
}

/** Ein Name im Zertifikat: Organisation und gebräuchlicher Name. */
function x500Name(gebraeuchlich) {
  return der.folge(
    der.menge(der.folge(der.kennung(OID.organisation), der.text('Abenteuer-Almanach'))),
    der.menge(der.folge(der.kennung(OID.gebraeuchlicherName), der.text(gebraeuchlich)))
  );
}

/** Eine Erweiterung: Kennung, kritisch oder nicht, Wert als OCTET STRING. */
function erweiterung(oid, wert, kritisch = false) {
  return der.folge(der.kennung(oid), ...(kritisch ? [der.wahr()] : []), der.oktette(wert));
}

/** Die Schlüsselkennung: SHA-1 über den öffentlichen Punkt (RFC 5280, Verfahren 1). */
function schluesselKennung(oeffentlich) {
  const jwk = oeffentlich.export({ format: 'jwk' });
  const punkt = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]);
  return crypto.createHash('sha1').update(punkt).digest();
}

/** Ein Zertifikat ausstellen und unterschreiben. */
function ausstellen({ subjekt, aussteller, oeffentlich, ausstellerSchluessel, tage, erweiterungen }) {
  const jetzt = Date.now();
  const algorithmus = der.folge(der.kennung(OID.ecdsaMitSha256));
  // Positiv und zufällig; das oberste Bit bleibt frei, damit die Zahl ohne
  // Vorsatz-Null auskommt.
  const seriennummer = crypto.randomBytes(16);
  seriennummer[0] = (seriennummer[0] & 0x7f) | 0x01;
  const tbs = der.folge(
    der.kontext(0, der.kleineZahl(2)), // Fassung 3
    der.ganzzahl(seriennummer),
    algorithmus,
    aussteller,
    // Eine Stunde zurückdatiert: Geht die Uhr eines Telefons ein wenig nach,
    // wäre ein „erst ab gleich gültiges“ Zertifikat sonst ungültig.
    der.folge(der.zeit(new Date(jetzt - 60 * 60 * 1000)), der.zeit(new Date(jetzt + tage * TAG))),
    subjekt,
    oeffentlich.export({ type: 'spki', format: 'der' }),
    der.kontext(3, der.folge(...erweiterungen))
  );
  const unterschrift = crypto.sign('sha256', tbs, ausstellerSchluessel);
  return der.folge(tbs, algorithmus, der.bits(unterschrift));
}

/** DER als PEM – die Textform, die Node und die Geräte lesen. */
export function alsPem(roh) {
  const zeilen = roh.toString('base64').match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${zeilen}\n-----END CERTIFICATE-----\n`;
}

/** Der gebräuchliche Name aus einem gelesenen Zertifikat. */
const gebraeuchlicherName = (zertifikat) =>
  zertifikat.subject.split('\n').find((z) => z.startsWith('CN='))?.slice(3) ?? '';

/**
 * Ein neues Stammzertifikat.
 *
 * @param {string[]} zusatzNamen  weitere Namensräume, für die es bürgen darf
 *   (etwa „almanach.example“ für einen eigenen Namen im Heimnetz)
 * @returns {{ schluessel: string, zertifikat: string, namen: string[] }} beides als PEM
 */
export function erzeugeStamm(zusatzNamen = []) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const namen = [...new Set([...HEIMNAMEN, rechnername(), ...zusatzNamen.map((n) => n.toLowerCase())].filter(Boolean))];

  const subjekt = x500Name(`Abenteuer-Almanach Stammzertifikat (${os.hostname()})`.slice(0, 64));
  // permittedSubtrees [0]: je ein GeneralSubtree mit dNSName [2] oder
  // iPAddress [7] (Adresse und Maske, acht Bytes).
  const beschraenkung = der.folge(
    der.kontext(
      0,
      Buffer.concat([
        ...namen.map((n) => der.folge(der.kontextEinfach(2, Buffer.from(n, 'ascii')))),
        ...PRIVATE_NETZE.map(([netz, maske]) =>
          der.folge(der.kontextEinfach(7, Buffer.from([...ipBytes(netz), ...ipBytes(maske)])))
        ),
      ])
    )
  );

  const roh = ausstellen({
    subjekt,
    aussteller: subjekt,
    oeffentlich: publicKey,
    ausstellerSchluessel: privateKey,
    tage: LAUFZEIT_STAMM_TAGE,
    erweiterungen: [
      // Eine Ausstellungsstelle, die selbst keine weiteren unter sich hat.
      erweiterung(OID.basisBeschraenkung, der.folge(der.wahr(), der.kleineZahl(0)), true),
      // Nur Zertifikate und Sperrlisten unterschreiben (Bits 5 und 6).
      erweiterung(OID.schluesselNutzung, der.bits(Buffer.from([0x06]), 1), true),
      erweiterung(OID.schluesselKennung, der.oktette(schluesselKennung(publicKey))),
      erweiterung(OID.namensBeschraenkung, beschraenkung, true),
    ],
  });

  return {
    schluessel: privateKey.export({ type: 'pkcs8', format: 'pem' }),
    zertifikat: alsPem(roh),
    namen,
  };
}

/**
 * Ein Serverzertifikat, unterschrieben vom Stammzertifikat.
 *
 * @param {object} args
 * @param {string} args.stammSchluessel  PEM
 * @param {string} args.stammZertifikat  PEM
 * @param {string[]} args.namen          DNS-Namen (localhost, raspberrypi.local …)
 * @param {string[]} args.adressen       IPv4-Adressen im Heimnetz
 * @returns {{ schluessel: string, zertifikat: string }} beides als PEM
 */
export function erzeugeServer({ stammSchluessel, stammZertifikat, namen, adressen }) {
  const stamm = new crypto.X509Certificate(stammZertifikat);
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });

  const alternative = der.folge(
    ...namen.map((n) => der.kontextEinfach(2, Buffer.from(n, 'ascii'))),
    ...adressen.map((a) => der.kontextEinfach(7, Buffer.from(ipBytes(a))))
  );

  const roh = ausstellen({
    subjekt: x500Name('Abenteuer-Almanach'),
    // Der Name des Ausstellers muss Byte für Byte dem Subjekt des
    // Stammzertifikats gleichen – deshalb mit demselben Baustein gebaut.
    aussteller: x500Name(gebraeuchlicherName(stamm)),
    oeffentlich: publicKey,
    ausstellerSchluessel: crypto.createPrivateKey(stammSchluessel),
    tage: LAUFZEIT_SERVER_TAGE,
    erweiterungen: [
      erweiterung(OID.basisBeschraenkung, der.folge(), true),
      // Nur Unterschriften beim Verbindungsaufbau (Bit 0).
      erweiterung(OID.schluesselNutzung, der.bits(Buffer.from([0x80]), 7), true),
      erweiterung(OID.erweiterteNutzung, der.folge(der.kennung(OID.serverAnmeldung))),
      erweiterung(OID.alternativeNamen, alternative),
      erweiterung(OID.schluesselKennung, der.oktette(schluesselKennung(publicKey))),
      erweiterung(OID.ausstellerKennung, der.folge(der.kontextEinfach(0, schluesselKennung(stamm.publicKey)))),
    ],
  });

  return { schluessel: privateKey.export({ type: 'pkcs8', format: 'pem' }), zertifikat: alsPem(roh) };
}

/** Der SHA-256-Fingerabdruck eines Zertifikats, wie ihn Geräte beim Installieren zeigen. */
export const fingerabdruck = (pem) => new crypto.X509Certificate(pem).fingerprint256;
