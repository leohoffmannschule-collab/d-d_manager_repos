/**
 * Wörterbuch: die Umgebungsvariablen des Almanachs.
 *
 * Eine Umgebungsvariable ist eine Einstellung, die einem Programm von außen
 * mitgegeben wird – im Dockerfile mit `ENV`, in docker-compose.yml unter
 * `environment`, beim Start von Hand in der Datei `.env`. Der Code liest sie
 * über `process.env`, mit ihrem Namen dahinter. Was hier steht, ergänzt die
 * Erklärungen aus der .env.example (die der Projekt-Index liest) um die
 * Variablen, die dort nicht stehen, weil man sie selten anfasst.
 */

/** Name → was die Einstellung bewirkt. */
export const UMGEBUNG = {
  PORT: 'der Port, auf dem der Server lauscht (Vorgabe 3001)',
  HTTPS_PORT: 'der Port für den verschlüsselten Zugang im Heimnetz (Vorgabe 3443) – nur in Betrieb, wenn ein Zertifikat angelegt ist',
  DATA_DIR: 'der Ordner für alles, was bleiben soll: Datenbank, Bilder, Sicherungen, Zertifikate',
  NODE_ENV: 'die Betriebsart: production heißt fertige Fassung, ohne Hilfen für die Entwicklung',
  DND5E_API_BASE: 'die Adresse der offenen 5e-Schnittstelle, aus der das Kompendium seine Einträge holt (2014 oder 2024er Regeln)',
  TRUST_PROXY: 'wie vielen Zwischenstationen vor dem Server (etwa dem Tunnel) er glaubt, wenn sie ihm die echte Adresse einer Anfrage nennen',
  DOMAENE: 'die feste Adresse, unter der die Runde spielt (freiwillig; nur der Name, ohne https://)',
  TUNNEL_TOKEN: 'das Kennwort eines benannten Cloudflare-Tunnels – geheim, gehört nie ins Git',
  CHRONIK_KI_URL: 'die Adresse einer Sprach-KI für den erzählenden Rückblick der Chronik (freiwillig)',
  CHRONIK_KI_MODELL: 'welches Modell diese KI benutzen soll',
  CHRONIK_KI_SCHLUESSEL: 'der Schlüssel für diese KI – geheim',
  CLOUDFLARED: 'wo das Programm cloudflared liegt, wenn es nicht von selbst gefunden wird',
  TUNNEL_ANBIETER: 'erzwingt einen bestimmten Weg nach außen: cloudflared, ssh oder localtunnel',
  CHROME_PFAD: 'welcher Browser die Handbücher als PDF druckt, wenn keiner von selbst gefunden wird',
};
