/**
 * Umziehen: Daten aus dieser Kampagne in eine andere kopieren.
 *
 * Gedacht für eine Runde, die in einer neuen Geschichte weiterspielt: die
 * Helden mitnehmen, die Hausregeln mitnehmen, die Karten stehen ohnehin
 * bereit. Was dabei wie kopiert wird, steht in ../../uebernehmen.js.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { requireCampaign, requireDm } from '../../auth.js';
import { ARTEN, istArt, meldeNachZiel, uebernimmAlles, umfang, zielPruefen } from '../../uebernehmen.js';
import { sendeSzene } from '../../spieltisch/melden.js';

const router = Router();

/**
 * GET /api/campaigns/umfang – was liegt in dieser Kampagne?
 *
 * Bevor jemand „alles übernehmen“ anklickt, soll dastehen, was „alles“ heißt.
 */
router.get('/umfang', requireDm, requireCampaign, (req, res) => {
  res.json({
    arten: Object.fromEntries(
      Object.entries(ARTEN).map(([art, { label, eins, viele }]) => [art, { label, eins, viele }])
    ),
    ...umfang(req.campaignId),
  });
});

/**
 * POST /api/campaigns/uebernehmen  { campaignId, arten: [...] }
 *
 * Die ganze Kampagne – oder das Gewählte davon – in eine andere kopieren.
 * Gedacht für den Umzug einer laufenden Runde in eine neue Geschichte: die
 * Helden mitnehmen, die Hausregeln mitnehmen, die Karten stehen ohnehin
 * bereit.
 *
 * Kopiert wird, nicht verschoben, und es wird nicht abgeglichen: Zweimal
 * ausgeführt steht drüben alles zweimal. Entweder es geht ganz durch oder
 * gar nicht – eine halb umgezogene Kampagne wäre schlimmer als keine.
 */
router.post('/uebernehmen', requireDm, requireCampaign, zielPruefen, (req, res) => {
  // `istArt` statt `art in ARTEN`: `in` fände auch „toString“ und
  // „constructor“ auf der Prototypkette und hielte sie für eine Auswahl.
  const gewaehlt = Array.isArray(req.body?.arten) ? req.body.arten.filter(istArt) : [];
  if (gewaehlt.length === 0) {
    return res.status(400).json({ code: 'nichts_gewaehlt', error: 'Es wurde nicht gesagt, was mitkommen soll.' });
  }

  const bericht = uebernimmAlles(req.campaignId, req.ziel, gewaehlt);
  for (const art of gewaehlt) meldeNachZiel(art, req.ziel);
  // Szenen melden sich nicht über meldeNachZiel: Was auf dem Tisch liegt,
  // hängt an der Sicht des Einzelnen und kommt aus spieltisch/melden.js.
  if (gewaehlt.includes('szenen')) sendeSzene(req.ziel);

  const ziel = db.prepare('SELECT id, name FROM campaigns WHERE id = ?').get(req.ziel);
  res.json({ ziel, bericht });
});

export default router;
