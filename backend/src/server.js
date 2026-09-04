import express from 'express';
import cors from 'cors';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { driver } from './db.js';
import { attachUser, countUsers, requireAuth } from './auth.js';
import { addClient, presence } from './events.js';
import ambienceRouter from './routes/ambience.js';
import authRouter from './routes/auth.js';
import chronicleRouter from './routes/chronicle.js';
import charactersRouter from './routes/characters.js';
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
// uns sagen, die Anfrage sei über HTTPS gekommen.
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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', driver, angemeldet: !!req.user, time: new Date().toISOString() });
});

/**
 * Der Live-Kanal. Alle offenen Fenster hängen hier und bekommen Änderungen
 * an Kampf, Spieltisch, Würfen und Charakteren zugeschickt.
 */
app.get('/api/stream', requireAuth, (req, res) => {
  req.socket.setTimeout(0);
  req.socket.setNoDelay(true);
  req.socket.setKeepAlive(true);
  addClient(req, res, req.user);
});

app.get('/api/anwesenheit', requireAuth, (req, res) => {
  res.json(presence());
});

app.use('/api/ambience', ambienceRouter);
app.use('/api/auth', authRouter);
app.use('/api/characters', charactersRouter);
app.use('/api/compendium', requireAuth, compendiumRouter);
app.use('/api/dice', diceRouter);
app.use('/api/chronicle', chronicleRouter);
app.use('/api/encounter', encounterRouter);
app.use('/api/encounters', encountersRouter);
app.use('/api/library', libraryRouter);
app.use('/api/maps', mapsRouter);
app.use('/api/notes', notesRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/stash', stashRouter);

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

function localAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
    .map((iface) => iface.address);
}

app.listen(PORT, () => {
  console.log('');
  console.log('  Abenteuer-Almanach läuft');
  console.log(`  Datenbank      : ${driver}`);
  console.log(`  Oberfläche     : ${hasFrontend ? 'wird mit ausgeliefert' : 'separat über "npm run dev" (Port 5173)'}`);
  console.log(`  Auf diesem PC  : http://localhost:${PORT}`);
  for (const address of localAddresses()) {
    console.log(`  Im Netzwerk    : http://${address}:${PORT}   (für iPad/iPhone)`);
  }
  if (countUsers() === 0) {
    console.log('');
    console.log('  Noch kein Konto vorhanden: Das erste angelegte Konto führt die Spielleitung.');
  }
  console.log('');
});
