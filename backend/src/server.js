import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import './db.js';
import charactersRouter from './routes/characters.js';
import compendiumRouter from './routes/compendium.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/characters', charactersRouter);
app.use('/api/compendium', compendiumRouter);

// Serve the built frontend (single-container deployment on the Raspberry Pi).
const frontendDist = path.join(__dirname, '..', 'public');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Pen & Paper Manager backend läuft auf Port ${PORT}`);
});
