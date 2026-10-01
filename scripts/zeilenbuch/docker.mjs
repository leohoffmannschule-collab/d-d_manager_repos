/**
 * Docker erklären: das Dockerfile und docker-compose.yml.
 *
 * Docker packt den Almanach mit allem, was er braucht (Node, die Pakete, die
 * gebaute Oberfläche), in ein Abbild – ein fertiges kleines Linux, das auf
 * jedem Rechner mit Docker gleich läuft, etwa auf dem Raspberry Pi. Das
 * Dockerfile ist das Rezept für dieses Abbild, Schritt für Schritt;
 * docker-compose.yml sagt, welche Behälter (Container) daraus gestartet
 * werden, mit welchen Ports, Ordnern und Einstellungen.
 *
 * Kommentare (#) werden zu Blöcken zusammengefasst; jede andere Zeile
 * erklärt der Befehl bzw. der Schlüssel, mit dem sie beginnt. In YAML
 * zählt die Einrückung: Der Leser merkt sich, unter welchem Schlüssel eine
 * Zeile steht (services → dnd-manager → ports).
 */
import { code, zeile, zitat } from './text.mjs';
import { UMGEBUNG } from './woerterbuch/umgebung.mjs';

/** Kommentarzeilen (#) zu Blöcken zusammenfassen und eintragen. */
function kommentare(blatt, erklaerung) {
  let von = null;
  for (let nr = 1; nr <= blatt.anzahl + 1; nr += 1) {
    const t = blatt.text(nr).trim();
    const istKommentar = nr <= blatt.anzahl && t.startsWith('#') && !t.startsWith('# syntax=');
    if (istKommentar && von === null) von = nr;
    if (!istKommentar && von !== null) {
      const bis = nr - 1;
      const text = erklaerung(von, bis, nr <= blatt.anzahl && !blatt.leer(nr) ? nr : null);
      if (von === bis) blatt.dazu(von, text);
      else blatt.gruppe(von, bis, text);
      von = null;
    }
  }
}

/** Eine Umgebungsvariable mit Wert: `PORT=3001`. */
function umgebung(name, wert, projekt) {
  const was = UMGEBUNG[name] ?? projekt?.umgebung.get(name) ?? null;
  const woher = /^\$\{(\w+):-\}$/.exec(wert ?? '');
  const w = woher ? `den Wert aus der Datei .env (${code(woher[1])}) – oder leer, wenn dort nichts steht` : code(wert ?? '');
  return `Setzt die Einstellung ${code(name)} auf ${w}${was ? ` – ${was}` : ''}.`;
}

/** Was ein Befehl hinter RUN tut. */
function lauf(befehl) {
  const teile = befehl.split(/\s*&&\s*/).map((b) => {
    if (/^npm ci --omit=dev --omit=optional$/.test(b)) return `${code(b)} installiert genau die Fassungen aus der Sperrdatei – ohne die Werkzeuge für die Entwicklung und ohne das optionale better-sqlite3 (Node bringt SQLite selbst mit)`;
    if (/^npm ci$/.test(b)) return `${code(b)} installiert genau die Fassungen, die in der Sperrdatei (package-lock.json) stehen`;
    if (/^npm run build$/.test(b)) return `${code(b)} baut die Oberfläche: Aus JSX und Tailwind werden fertige HTML-, JS- und CSS-Dateien`;
    if (b.startsWith('mkdir -p ')) return `${code(b)} legt den Ordner an (-p: samt fehlender Zwischenordner, ohne Fehler, wenn es ihn schon gibt)`;
    if (b.startsWith('chown -R ')) return `${code(b)} übereignet ihn samt Inhalt der Kennung node`;
    return code(b, 80);
  });
  return teile.join('; dann ');
}

/** Eine Zeile des Dockerfiles. */
function dockerZeile(t, stufen) {
  let m;
  if ((m = /^# syntax=(.+)$/.exec(t))) return `Sagt Docker, welche Fassung der Dockerfile-Sprache gilt (${code(m[1])}).`;
  if ((m = /^FROM (\S+)(?: AS (\S+))?$/i.exec(t))) {
    if (m[2]) stufen.push(m[2]);
    return `Beginnt eine Bau-Stufe${m[2] ? ` namens ${code(m[2])}` : ''} auf der Grundlage ${code(m[1])} – ein schlankes Debian-Linux (bookworm) mit Node 22.`;
  }
  if ((m = /^WORKDIR (\S+)$/i.exec(t))) return `Arbeitsordner im Abbild: ${code(m[1])} – alle folgenden Befehle laufen dort.`;
  if ((m = /^COPY --from=(\S+) (\S+) (\S+)$/i.exec(t))) return `Kopiert ${code(m[2])} aus der Stufe ${code(m[1])} nach ${code(m[3])} – von der gebauten Oberfläche kommt nur das Ergebnis mit, nicht die Werkzeuge, mit denen sie gebaut wurde.`;
  if ((m = /^COPY (\S+) (\S+)$/i.exec(t))) return `Kopiert ${code(m[1])} vom Rechner ins Abbild, nach ${code(m[2])}.${/package\*\.json/.test(m[1]) ? ' Erst nur die Paketlisten: Ändert sich der Code, aber nicht die Liste, nimmt Docker die installierten Pakete aus dem Zwischenspeicher.' : ''}`;
  if ((m = /^RUN (.+)$/i.exec(t))) return `Führt beim Bauen aus: ${lauf(m[1])}.`;
  if ((m = /^ENV (\w+)=(.*)$/i.exec(t))) return umgebung(m[1], m[2]);
  if ((m = /^USER (\S+)$/i.exec(t))) return `Ab hier läuft alles unter der Kennung ${code(m[1])} statt als root – ein Fehler im Almanach kann so nicht das ganze Abbild verändern.`;
  if ((m = /^VOLUME \["?([^"\]]+)"?\]$/i.exec(t))) return `${code(m[1])} ist ein Datenbereich (Volume): Was dort liegt, überlebt jedes neue Abbild – hier stehen Datenbank und Bilder.`;
  if ((m = /^EXPOSE (.+)$/i.exec(t))) return `Der Behälter bietet die Ports ${m[1].split(/\s+/).map((p) => code(p)).join(' und ')} an (welcher davon nach außen geht, sagt docker-compose.yml).`;
  if ((m = /^HEALTHCHECK (.+?)\s*\\?$/i.exec(t))) {
    return `Gesundheitsprüfung: ${code(m[1], 80)} – alle 60 Sekunden fragt sich der Behälter selbst, ob der Server noch antwortet; nach drei Fehlschlägen gilt er als krank.`;
  }
  if ((m = /^CMD (.+)$/i.exec(t))) {
    const befehl = m[1];
    if (/fetch\(/.test(befehl)) return `Der Befehl der Prüfung: Node fragt ${code('/api/health')} ab und meldet 0 (gesund) oder 1 (krank) – ganz ohne curl oder wget im Abbild.`;
    return `Was beim Start des Behälters läuft: ${code(befehl)} – der Server.`;
  }
  return `${code(t, 80)}.`;
}

/**
 * Das Dockerfile erklären.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 */
export function erklaereDockerfile(blatt) {
  let erster = true;
  kommentare(blatt, (von, bis, naechste) => {
    const titel = von === bis && /^#\s*-{2,}\s*(.+?)\s*-*$/.exec(blatt.text(von).trim());
    if (titel) return `Zwischenüberschrift: Hier beginnt der Abschnitt ${zitat(titel[1])}.`;
    const text = `Kommentar${naechste ? ` zu ${zeile(naechste)}` : ''}${erster ? ': Er erklärt, warum die Zeile darunter so dasteht. Zeilen mit # am Anfang überspringt Docker' : ''}.`;
    erster = false;
    return text;
  });
  const stufen = [];
  let fortsetzung = false;
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const t = blatt.text(nr).trim();
    if (!t || (t.startsWith('#') && !t.startsWith('# syntax='))) continue;
    if (/^# ?-{3}/.test(t)) continue;
    blatt.dazu(nr, fortsetzung ? dockerZeile(t.replace(/^\s*/, ''), stufen) : dockerZeile(t, stufen));
    fortsetzung = t.endsWith('\\');
  }
}

/** Was ein Schlüssel in docker-compose.yml bedeutet – abhängig davon, wo er steht. */
function composeSchluessel(pfad, schluessel, wert) {
  const oben = pfad[pfad.length - 1];
  if (pfad.length === 0) {
    if (schluessel === 'services') return 'Die Dienste: jeder ein eigener Behälter (Container). Darunter steht je Dienst, woraus er gebaut wird und wie er läuft.';
    if (schluessel === 'volumes') return 'Die benannten Datenbereiche (Volumes), die die Dienste benutzen – Docker legt sie beim ersten Start an.';
  }
  if (oben === 'services') {
    const was = {
      'dnd-manager': 'der Almanach selbst',
      cloudflared: 'der Schnelltunnel nach außen – mit einer geliehenen Adresse, die bei jedem Neustart wechselt',
      'cloudflared-domaene': 'der benannte Tunnel nach außen – mit fester Adresse (eigene Domain)',
    }[schluessel];
    return `Der Dienst ${code(schluessel)}${was ? `: ${was}` : ''}.`;
  }
  if (oben === 'volumes' && pfad.length === 1) return `Der Datenbereich ${code(schluessel)} – hier liegen Datenbank, Bilder und Sicherungen; er überlebt jedes neue Abbild.`;
  const fest = {
    build: `Gebaut wird aus dem Dockerfile im Ordner ${code(wert ?? '.')} (dem Wurzelordner des Almanachs).`,
    image: `So heißt das Abbild: ${code(wert ?? '')}${/cloudflare/.test(wert ?? '') ? ' – das offizielle Abbild von Cloudflare, aus dem Netz geholt' : ''}.`,
    container_name: `So heißt der laufende Behälter: ${code(wert ?? '')} (etwa für ${code(`docker logs ${wert}`)}).`,
    restart: `Neustart-Regel ${code(wert ?? '')}: Stürzt der Behälter ab oder startet der Rechner neu, startet Docker ihn wieder – außer man hat ihn von Hand angehalten.`,
    ports: 'Welche Ports des Rechners auf welche Ports im Behälter zeigen (Rechner:Behälter):',
    volumes: 'Welche Datenbereiche wohin im Behälter eingehängt werden:',
    environment: 'Die Einstellungen (Umgebungsvariablen) für diesen Dienst:',
    logging: 'Wie Docker die Ausgaben des Behälters aufbewahrt:',
    driver: `Protokollart ${code(wert ?? '')}: die Ausgaben als Dateien auf dem Rechner.`,
    options: 'Die Einstellungen dazu:',
    'max-size': `Eine Protokolldatei wird höchstens ${code(wert ?? '')} groß …`,
    'max-file': `… und es gibt höchstens ${code(wert ?? '')} davon – ältere werden gelöscht, damit die Speicherkarte nie volläuft.`,
    command: `Der Befehl, mit dem der Behälter startet: ${code(wert ?? '')}${/--url http:\/\/dnd-manager:3001/.test(wert ?? '') ? ' – ein Schnelltunnel zum Almanach (im Netz der Behälter heißt er einfach dnd-manager)' : (wert ?? '').endsWith('run') ? ' – der benannte Tunnel, dessen Kennwort in TUNNEL_TOKEN steht' : ''}.`,
    depends_on: 'Wartet auf einen anderen Dienst, bevor er startet:',
    condition: `… und zwar, bis der als ${code(wert ?? '')} gilt – also seine Gesundheitsprüfung besteht.`,
    profiles: 'Gehört zu einem Profil: Er startet nur, wenn man das Profil ausdrücklich nennt (docker compose --profile …).',
  }[schluessel];
  if (fest) return fest;
  if (oben === 'depends_on') return `… auf den Dienst ${code(schluessel)}:`;
  return `Schlüssel ${code(schluessel)}${wert ? ` mit dem Wert ${code(wert)}` : ''}.`;
}

/** Ein Listeneintrag (`- …`) in docker-compose.yml. */
function composeEintrag(pfad, wert, projekt) {
  const oben = pfad[pfad.length - 1];
  const w = wert.replace(/^"|"$/g, '');
  let m;
  if (oben === 'ports' && (m = /^(\d+):(\d+)$/.exec(w))) return `Port ${m[1]} des Rechners führt auf Port ${m[2]} im Behälter.`;
  if (oben === 'volumes' && (m = /^([^:]+):(.+)$/.exec(w))) return `Der Datenbereich ${code(m[1])} erscheint im Behälter als Ordner ${code(m[2])}.`;
  if (oben === 'environment' && (m = /^(\w+)=(.*)$/.exec(w))) return umgebung(m[1], m[2], projekt);
  if (oben === 'profiles') return `Das Profil ${code(w)} – gestartet mit ${code(`docker compose --profile ${w} up -d`)}.`;
  return `Eintrag ${code(w)}.`;
}

/**
 * docker-compose.yml erklären.
 *
 * @param {import('./blatt.mjs').Blatt} blatt
 * @param {object} projekt  für die Erklärungen der Umgebungsvariablen aus der .env.example
 */
export function erklaereCompose(blatt, projekt) {
  let erster = true;
  kommentare(blatt, (von, bis, naechste) => {
    const text = `Kommentar${naechste ? ` zu ${zeile(naechste)}` : ''}${erster ? ': Er erklärt die Einstellung darunter. Zeilen mit # am Anfang überspringt Docker' : ''}.`;
    erster = false;
    return text;
  });
  const stapel = [];
  for (let nr = 1; nr <= blatt.anzahl; nr += 1) {
    const roh = blatt.text(nr);
    const t = roh.trim();
    if (!t || t.startsWith('#')) continue;
    const einzug = roh.length - roh.trimStart().length;
    while (stapel.length && stapel[stapel.length - 1].einzug >= einzug && !t.startsWith('-')) stapel.pop();
    while (stapel.length && stapel[stapel.length - 1].einzug > einzug) stapel.pop();
    const pfad = stapel.map((s) => s.schluessel);
    let m;
    if ((m = /^-\s+(.*)$/.exec(t))) {
      blatt.dazu(nr, composeEintrag(pfad, m[1], projekt));
      continue;
    }
    if ((m = /^([\w.-]+):\s*(.*)$/.exec(t))) {
      const wert = m[2].replace(/^"|"$/g, '') || null;
      blatt.dazu(nr, composeSchluessel(pfad, m[1], wert));
      if (!wert) stapel.push({ einzug, schluessel: m[1] });
      continue;
    }
    blatt.dazu(nr, `${code(t, 80)}.`);
  }
}
