// Ganz oben, und das mit Absicht: Diese Zeile liest die Datei `.env` ein, und
// sie muss gelesen sein, bevor ein anderes Modul die Umgebung befragt – die
// Datenbank etwa sucht ihren Ordner schon beim Laden.
import { umgebung } from './umgebung.js';
import express from 'express';
import cors from 'cors';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db, { dataDir, driver, mediaDir } from './db.js';
import { festeAdresse } from './domaene.js';
import { attachUser, countUsers, requireAuth, requireCampaign } from './auth.js';
import { addClient, presence } from './events.js';
import { raeumePapierkorb } from './kampagnen.js';
import ambienceRouter from './routes/ambience.js';
import authRouter from './routes/auth.js';
import campaignsRouter from './routes/campaigns.js';
import chronicleRouter from './routes/chronicle.js';
import charactersRouter from './routes/characters.js';
import chatRouter from './routes/chat.js';
import compendiumRouter from './routes/compendium.js';
import diceRouter from './routes/dice.js';
import encounterRouter from './routes/encounter.js';
import encountersRouter from './routes/encounters.js';
import libraryRouter from './routes/library.js';
import mapsRouter from './routes/maps.js';
import mediaRouter from './routes/media.js';
import notesRouter from './routes/notes.js';
import scenesRouter from './routes/scenes.js';
import stashRouter from './routes/stash.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Vor dem Almanach steht entweder gar nichts oder der Cloudflare-Tunnel.
// Läuft der als Dienst auf demselben Gerät, meldet er sich von localhost;
// steckt er in einem eigenen Container, ist er der erste Zwischenschritt –
// dann gehört TRUST_PROXY=1 in die Umgebung. Nur wem wir hier glauben, darf
// uns sagen, die Anfrage sei über HTTPS gekommen (und erst dann wird das
// Sitzungs-Plätzchen als `Secure` gesetzt).
const TRUST_PROXY = process.env.TRUST_PROXY || 'loopback';
app.set('trust proxy', /^\d+$/.test(TRUST_PROXY) ? Number(TRUST_PROXY) : TRUST_PROXY);

// Beim Betrieb über eine feste Adresse kommen Oberfläche und API aus derselben
// Quelle; die Ausnahme ist die Entwicklung mit Vite auf Port 5173.
app.use(cors({ origin: true, credentials: true }));

app.use((req, res, next) => {
  // Hochgeladene Karten und Bildnisse gibt der Server so zurück, wie sie
  // abgelegt wurden – der Browser soll den Typ nicht selbst erraten.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});

app.use(attachUser);

// Karten sind zu groß für den allgemeinen Rahmen – dieser Zweig bringt
// deshalb seinen eigenen mit und steht vor dem gemeinsamen JSON-Leser.
app.use('/api/media', mediaRouter);

app.use(express.json({ limit: '2mb' }));

/**
 * Lebenszeichen – auch für den Healthcheck des Containers.
 *
 * Die Datenbank wird dabei wirklich angefasst. Ein Server, der noch antwortet,
 * aber nicht mehr an seine Daten kommt (volle Karte, kaputtes Dateisystem),
 * soll nicht als gesund durchgehen: Docker startet ihn dann neu, statt eine
 * stille Ruine am Laufen zu halten.
 */
app.get('/api/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
  } catch (err) {
    return res.status(503).json({ code: 'datenbank_unerreichbar', error: err.message, driver });
  }
  res.json({ status: 'ok', driver, angemeldet: !!req.user, time: new Date().toISOString() });
});

/**
 * Der Live-Kanal. Alle offenen Fenster hängen hier und bekommen Änderungen
 * an Kampf, Spieltisch, Würfen und Charakteren zugeschickt.
 */
app.get('/api/stream', requireCampaign, (req, res) => {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  addClient(req, res, req.user, req.campaignId);
});

app.get('/api/anwesenheit', requireCampaign, (req, res) => {
  res.json(presence(req.campaignId));
});

app.use('/api/ambience', requireCampaign, ambienceRouter);
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/characters', requireCampaign, charactersRouter);
app.use('/api/chat', requireCampaign, chatRouter);
app.use('/api/compendium', requireAuth, compendiumRouter);
app.use('/api/dice', requireCampaign, diceRouter);
app.use('/api/chronicle', requireCampaign, chronicleRouter);
app.use('/api/encounter', requireCampaign, encounterRouter);
app.use('/api/encounters', requireCampaign, encountersRouter);
app.use('/api/library', requireCampaign, libraryRouter);
app.use('/api/maps', requireCampaign, mapsRouter);
app.use('/api/notes', requireCampaign, notesRouter);
app.use('/api/scenes', requireCampaign, scenesRouter);
app.use('/api/stash', requireCampaign, stashRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ code: 'route_unbekannt', error: 'Diesen Weg kennt der Almanach nicht.' });
});

// Serve the built frontend when it has been copied here (npm run build).
const frontendDist = path.join(__dirname, '..', 'public');
const hasFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));
if (hasFrontend) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Ganz zum Schluss, damit auch Fehler aus der Auslieferung der Oberfläche
// hier ankommen.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ code: 'daten_zu_gross', error: 'Die gesendeten Daten sind zu groß.' });
  }
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ code: 'serverfehler', error: 'Im Almanach ist etwas schiefgegangen.' });
});

/**
 * Karten und Bildnisse liegen als Dateien neben der Datenbank. Beim Umzug auf
 * ein anderes Gerät bleibt der Ordner gern zurück (oder landet eine Ebene zu
 * tief) – dann steht jeder Eintrag noch, aber der Spieltisch bleibt leer. Das
 * fällt sonst erst mitten im Spielabend auf, deshalb steht es beim Start da.
 */
function fehlendeBilder() {
  const alle = db.prepare('SELECT filename FROM media').all();
  const fehlen = alle.filter(({ filename }) => !fs.existsSync(path.join(mediaDir, filename)));
  return { gesamt: alle.length, fehlen: fehlen.length };
}

function localAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}

// Die feste Adresse, unter der die Runde spielt – sofern eine eingetragen ist.
const domaene = festeAdresse();

// Was länger als die Frist im Papierkorb lag, wird beim Start geräumt.
const geraeumt = raeumePapierkorb();

const server = app.listen(PORT, () => {
  console.log('');
  console.log('  Abenteuer-Almanach läuft');
  console.log(`  Datenbank      : ${driver}`);
  // Wer zwei Ordner nebeneinander betreibt – den laufenden Almanach und einen
  // zum Ausprobieren –, sieht hier auf einen Blick, welcher von beiden gerade
  // spricht. Beide heißen sonst gleich und sehen gleich aus.
  console.log(`  Datenordner    : ${dataDir}`);
  console.log(`  Oberfläche     : ${hasFrontend ? 'wird mit ausgeliefert' : 'separat über "npm run dev" (Port 5173)'}`);
  if (domaene.adresse) {
    console.log(`  Für die Runde  : ${domaene.adresse}   (solange der Weg nach außen offen ist)`);
  }
  console.log(`  Auf diesem PC  : http://localhost:${PORT}`);
  for (const address of localAddresses()) {
    console.log(`  Im Netzwerk    : http://${address}:${PORT}   (für iPad/iPhone)`);
  }
  if (domaene.gesetzt && !domaene.adresse) {
    console.log('');
    console.log(`  DOMAENE=${domaene.roh} ergibt keinen Domainnamen – bitte in .env nachsehen.`);
    console.log('  Erwartet wird der nackte Name, etwa: DOMAENE=www.deinemudda.fun');
  }
  if (umgebung.grund === 'node_zu_alt') {
    console.log('');
    console.log('  Es liegt eine .env daneben, aber dieses Node kann sie nicht lesen');
    console.log(`  (${process.version}, nötig wäre 20.12 oder neuer). Alles darin bleibt unbeachtet.`);
  }
  if (umgebung.grund === 'fehler') {
    console.log('');
    console.log(`  Die .env ließ sich nicht lesen: ${umgebung.fehler}`);
  }
  const bilder = fehlendeBilder();
  if (bilder.fehlen > 0) {
    console.log('');
    console.log(`  ${bilder.fehlen} von ${bilder.gesamt} Bildern fehlen auf der Platte.`);
    console.log(`  Erwartet werden sie in: ${mediaDir}`);
    console.log('  Beim Umzug ist der Ordner "medien" wohl nicht (oder eine Ebene zu tief) mitgekommen.');
  }
  if (geraeumt > 0) {
    console.log('');
    console.log(`  ${geraeumt} Kampagne(n) im Papierkorb waren über die Frist – endgültig entfernt.`);
  }
  if (countUsers() === 0) {
    console.log('');
    console.log('  Noch kein Konto vorhanden: Das erste angelegte Konto führt die Spielleitung.');
  }
  console.log('');
});

/**
 * Zwei Almanache auf demselben Port gehen nicht – und das ist gut so.
 *
 * Wer einen zweiten Ordner zum Ausprobieren betreibt, soll ihn nicht
 * versehentlich neben den laufenden stellen: Über die Domain käme sonst mal
 * der eine und mal der andere. Statt eines Stapelauszugs sagt der Almanach
 * deshalb geradeheraus, was zu tun ist.
 */
server.on('error', (err) => {
  if (err.code !== 'EADDRINUSE') throw err;
  console.log('');
  console.log(`  Auf Port ${PORT} lauscht schon jemand – sehr wahrscheinlich ein anderer Almanach.`);
  console.log('  Es kann immer nur einer den Port haben, und nur wer ihn hat, wird über die');
  console.log('  Domain ausgeliefert.');
  console.log('');
  console.log('  Also: im anderen Fenster mit Strg+C beenden, dann hier neu starten.');
  console.log(`  (Oder diesen hier auf einen eigenen Port legen: PORT=3002 in die .env.)`);
  console.log('');
  process.exit(1);
});
