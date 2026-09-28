/**
 * Das Nachschlagewerk – ein Spiegel der offenen D&D-5e-API.
 *
 * Der Browser fragt nicht selbst dort an, sondern immer über diesen Weg.
 * Das hat drei Gründe:
 *
 *   1. *Schnelligkeit.* Jede Antwort wird in `api_cache` abgelegt; beim
 *      zweiten Mal kommt sie ohne Umweg.
 *   2. *Am Spieltisch.* Mit wackligem Netz funktioniert das Nachschlagen
 *      weiter, solange es einmal geladen war.
 *   3. *Höflichkeit.* Ein fremder Dienst soll nicht für jedes geöffnete
 *      Fenster erneut angefragt werden.
 *
 * Die Adresse lässt sich über die Umgebung umstellen, falls die API einmal
 * umzieht oder jemand einen eigenen Spiegel betreibt.
 */
import { Router } from 'express';
import { db } from '../db.js';
import { asynchron } from '../asynchron.js';

const router = Router();

// Die offene SRD-API (https://www.dnd5eapi.co). Umstellbar, damit sich ein
// anderes Regelwerk (etwa /api/2024) oder ein eigener Spiegel nutzen lässt.
const API_BASE = (process.env.DND5E_API_BASE || 'https://www.dnd5eapi.co/api/2014').replace(/\/+$/, '');

// Nachschlagedaten ändern sich so gut wie nie. Deshalb bleiben sie lange
// liegen – und ein abgelaufener Eintrag wird immer noch ausgeliefert, wenn
// die API gerade nicht erreichbar ist (auf dem Pi mit wackligem Netz Gold wert).
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage

const getCached = db.prepare('SELECT payload, fetched_at FROM api_cache WHERE cache_key = ?');
const upsertCached = db.prepare(
  `INSERT INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)
   ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`
);

/**
 * Die Adresse bei der API – oder `null`, wenn der Pfad aus ihr herausführt.
 *
 * Geprüft wird die *fertig aufgelöste* Adresse, nicht der Rohtext. Ein
 * `..` im Rohtext zu suchen genügt nicht: `%2e%2e` sieht nicht danach aus,
 * wird vom URL-Leser aber genauso als „eine Ebene hinauf“ gelesen.
 */
function upstreamUrl(subPath) {
  let url;
  try {
    url = new URL(`${API_BASE}/${subPath}`);
  } catch {
    return null;
  }
  const basis = new URL(`${API_BASE}/`);
  if (url.origin !== basis.origin || !url.pathname.startsWith(basis.pathname)) return null;
  // Und ein kodierter Schrägstrich („..%2f“) überlebt den URL-Leser als ein
  // Stück – wie die Gegenseite ihn liest, wissen wir nicht. Also auch weg.
  try {
    if (decodeURIComponent(url.pathname).split(/[/\\]/).includes('..')) return null;
  } catch {
    return null;
  }
  return url;
}

async function fetchFromUpstream(url) {
  // Eine hängende API soll das Nachschlagen nicht ewig offen halten; nach
  // der Frist kommt der alte Stand aus dem Zwischenspeicher, falls es einen gibt.
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) {
    throw new Error(`Upstream antwortete mit Status ${response.status}`);
  }
  return response.json();
}

// GET /api/compendium/*  ->  der gleichnamige Pfad bei der API, zwischengespeichert
router.get(
  /.*/,
  asynchron(async (req, res) => {
    // req.url ist der Pfad relativ zum Mount-Punkt, samt Query-Parametern.
    const subPath = req.url.replace(/^\/+/, '');
    const url = upstreamUrl(subPath);
    if (!url) {
      return res.status(400).json({ code: 'ungueltiger_pfad', error: 'Ungültiger Pfad.' });
    }

    const cacheKey = subPath || 'index';
    const cached = getCached.get(cacheKey);

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < CACHE_TTL_MS) {
        return res.json(JSON.parse(cached.payload));
      }
    }

    try {
      const data = await fetchFromUpstream(url);
      upsertCached.run(cacheKey, JSON.stringify(data), new Date().toISOString());
      res.json(data);
    } catch (err) {
      // Lieber veraltet als gar nicht.
      if (cached) return res.json(JSON.parse(cached.payload));
      res.status(502).json({
        code: 'kompendium_nicht_erreichbar',
        error: 'D&D 5e API ist nicht erreichbar und es liegt kein Cache vor.',
        detail: err.message,
      });
    }
  })
);

export default router;
