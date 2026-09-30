/**
 * Der Server: hier läuft alles zusammen.
 *
 * Diese Datei ist kurz und soll es bleiben. Sie tut vier Dinge:
 *
 *   1. *Vorbereiten* – Umgebung lesen, Datenbank öffnen (durch den Import
 *      von db.js), Sicherheitskopfzeilen setzen.
 *   2. *Einhängen* – jeden Zweig der API an seinen Weg hängen. Die Zeile
 *      `app.use('/api/characters', requireCampaign, charactersRouter)`
 *      ist zugleich die Zugangsregel: Der Wächter steht *vor* dem Router,
 *      also gilt er für jeden Weg darin.
 *   3. *Ausliefern* – die gebaute Oberfläche aus `backend/public`, samt
 *      der Regel, dass jede unbekannte Adresse die index.html bekommt
 *      (das braucht der Router im Browser).
 *   4. *Berichten* – beim Start in Klartext sagen, was los ist: welche
 *      Datenbank, welcher Datenordner, welche Adressen, was fehlt (das steht
 *      in start/bericht.js).
 *
 * Die Reihenfolge der `app.use`-Aufrufe ist keine Geschmacksfrage. Express
 * arbeitet sie von oben nach unten ab: Der erste, der antwortet, gewinnt.
 * Deshalb steht der Bilderzweig vor dem allgemeinen JSON-Leser (er braucht
 * einen größeren Rahmen), und der Fehlerbehandler ganz unten.
 */

// Ganz oben, und das mit Absicht: Diese Zeile liest die Datei `.env` ein, und
// sie muss gelesen sein, bevor ein anderes Modul die Umgebung befragt – die
// Datenbank etwa sucht ihren Ordner schon beim Laden.
import './umgebung.js';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import db, { driver } from './db.js';
import { festeAdresse } from './domaene.js';
import { attachUser, requireAuth, requireCampaign } from './auth.js';
import { addClient, presence } from './events.js';
import { raeumePapierkorb } from './kampagnen.js';
import { berichteStart, portBelegt } from './start/bericht.js';
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

// Kein CORS, und das mit Absicht. Oberfläche und API kommen immer aus
// derselben Quelle – im Betrieb liefert dieser Server beides aus, beim
// Entwickeln reicht Vite `/api` an ihn durch (vite.config.js). Eine
// CORS-Freigabe mit Anmelde-Cookie für jede beliebige Herkunft, wie sie hier
// früher stand, hätte jeder Seite im selben Netz (oder auf localhost) erlaubt,
// im Namen der angemeldeten Spielleitung zu lesen und zu schreiben.

app.use((req, res, next) => {
  // Hochgeladene Karten und Bildnisse gibt der Server so zurück, wie sie
  // abgelegt wurden – der Browser soll den Typ nicht selbst erraten.
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  // Keine fremde Seite darf den Almanach in einen Rahmen setzen und darüber
  // einen unsichtbaren Knopf legen („Kampagne endgültig entfernen“).
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
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

// Die gebaute Oberfläche, sofern `npm run build` sie hierher kopiert hat.
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

// Die feste Adresse, unter der die Runde spielt – sofern eine eingetragen ist.
const domaene = festeAdresse();

// Was länger als die Frist im Papierkorb lag, wird beim Start geräumt.
const geraeumt = raeumePapierkorb();

const server = app.listen(PORT, () => berichteStart({ PORT, hasFrontend, domaene, geraeumt }));
server.on('error', (err) => portBelegt(err, PORT));
