import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// The public D&D 5e SRD API (https://www.dnd5eapi.co/api). Configurable so a
// different ruleset (e.g. /api/2024) or a self-hosted mirror can be used.
const API_BASE = (process.env.DND5E_API_BASE || 'https://www.dnd5eapi.co/api/2014').replace(/\/+$/, '');

// Cached reference data almost never changes, so we keep it for a long time
// and always serve a stale cache entry if the upstream API is unreachable
// (handy on a Raspberry Pi with a flaky internet connection).
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const getCached = db.prepare('SELECT payload, fetched_at FROM api_cache WHERE cache_key = ?');
const upsertCached = db.prepare(
  `INSERT INTO api_cache (cache_key, payload, fetched_at) VALUES (?, ?, ?)
   ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`
);

async function fetchFromUpstream(subPath) {
  const url = `${API_BASE}/${subPath}`.replace(/([^:])\/\/+/g, '$1/');
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Upstream antwortete mit Status ${response.status}`);
  }
  return response.json();
}

// GET /api/compendium/*  ->  proxies + caches https://www.dnd5eapi.co/api/2014/*
router.get(/.*/, async (req, res) => {
  // req.url ist der Pfad relativ zum Mount-Punkt, samt Query-Parametern.
  const subPath = req.url.replace(/^\/+/, '');

  // Keine Ausbrüche aus dem API-Pfad zulassen.
  if (subPath.split('/').includes('..')) {
    return res.status(400).json({ error: 'Ungültiger Pfad' });
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
    const data = await fetchFromUpstream(subPath);
    upsertCached.run(cacheKey, JSON.stringify(data), new Date().toISOString());
    res.json(data);
  } catch (err) {
    if (cached) {
      // Serve stale data rather than failing outright.
      return res.json(JSON.parse(cached.payload));
    }
    res.status(502).json({
      error: 'D&D 5e API ist nicht erreichbar und es liegt kein Cache vor.',
      detail: err.message,
    });
  }
});

export default router;
