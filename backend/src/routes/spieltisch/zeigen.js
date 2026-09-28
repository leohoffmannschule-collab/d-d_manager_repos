/**
 * Der Zeigefinger: „Schaut mal hierhin.“
 *
 * Nichts davon wird gespeichert. Das Ereignis geht hinaus, leuchtet auf den
 * Schirmen kurz auf und ist danach fort.
 */
import { Router } from 'express';
import { broadcast } from '../../events.js';
import { toNumber } from '../../spieltisch/umwandlung.js';

const router = Router();

// POST /api/scenes/ping – ein kurzes Aufleuchten für alle, nichts wird gespeichert
router.post('/ping', (req, res) => {
  const body = req.body ?? {};
  broadcast(
    'ping',
    { x: toNumber(body.x, 0), y: toNumber(body.y, 0), color: req.user.color, name: req.user.name, at: Date.now() },
    { campaignId: req.campaignId }
  );
  res.status(204).end();
});

export default router;
