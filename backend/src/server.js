import express from 'express';
import cors from 'cors';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { driver } from './db.js';
import charactersRouter from './routes/characters.js';
import compendiumRouter from './routes/compendium.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', driver, time: new Date().toISOString() });
});

app.use('/api/characters', charactersRouter);
app.use('/api/compendium', compendiumRouter);

// Serve the built frontend when it has been copied here (npm run build).
const frontendDist = path.join(__dirname, '..', 'public');
const hasFrontend = fs.existsSync(path.join(frontendDist, 'index.html'));
if (hasFrontend) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

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
  console.log('');
});
