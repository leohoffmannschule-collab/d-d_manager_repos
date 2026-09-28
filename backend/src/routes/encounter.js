/**
 * Die Wege des **laufenden** Kampfes: Initiative, Trefferpunkte, Zustände,
 * wer dran ist.
 *
 * Nicht zu verwechseln mit routes/encounters.js (mit s) – das sind die
 * *vorbereiteten* Begegnungen. Hier geht es um den Kampf, der gerade
 * stattfindet.
 *
 * Diese Datei hängt nur noch zwei Teilwege hintereinander; gerechnet und
 * verschickt wird zwei Ordner weiter:
 *
 *   kampf/kaempfer.js   eintragen, ändern, Schaden, Initiative, entfernen
 *   kampf/ablauf.js     eine Runde weiter, zurück, von vorn, Runde holen
 *
 *   ../kampf/umwandlung.js  Zeilen in Objekte, Reihenfolge, Zustand
 *   ../kampf/sicht.js       die zwei Sichten – der Kern des Ganzen
 *   ../kampf/blatt.js       Trefferpunkte zurück aufs Charakterblatt
 *
 * Die Aufteilung hat denselben Grund wie beim Spieltisch: Was die Runde
 * nicht sehen darf, wird an genau einer Stelle entschieden. Stünde die
 * Filterung an zwei Stellen, wäre sie an einer davon irgendwann falsch –
 * und „falsch“ hieße hier: Der Tisch weiß, wie viel das Ungetüm noch
 * aushält.
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import { encounterView } from '../kampf/sicht.js';
import kaempfer from './kampf/kaempfer.js';
import ablauf from './kampf/ablauf.js';

const router = Router();
router.use(requireAuth);

// GET /api/encounter – der ganze Kampf, in der Sicht des Fragenden
router.get('/', (req, res) => {
  res.json(encounterView(req.user, req.campaignId));
});

router.use(kaempfer);
router.use(ablauf);

export default router;
