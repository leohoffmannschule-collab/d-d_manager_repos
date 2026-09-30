/**
 * Die Wege zur Chronik: Sitzungen, Einträge, Protokoll, Rückblick.
 *
 * Geschrieben wird die Chronik nicht hier, sondern im Vorbeigehen von
 * überall her (`chronik.log(...)` in ../chronicle.js). Diese Datei liest
 * sie und gibt sie heraus – in drei Formen:
 *
 *   – als Liste von Einträgen für die Chronikseite,
 *   – als **Protokoll** in Markdown, zum Ausdrucken oder Weitergeben,
 *   – als **Rückblick**, von einem Sprachmodell erzählt.
 *
 * Der Rückblick ist die einzige Stelle im ganzen Almanach, an der etwas
 * nach außen geht, und er ist freiwillig: Ohne Schlüssel in der `.env`
 * antwortet der Weg, dass die Chronik-KI nicht eingerichtet ist. Ohne ihn
 * funktioniert alles andere unverändert.
 *
 * Verdeckte Einträge (`secret`) bekommt ein Spielerfenster nicht – gefiltert
 * wird in `eintraege()` (chronik/abfragen.js), also an einer einzigen Stelle.
 *
 * Die drei Teilwege:
 *
 *   chronik/sitzungen.js  Sitzungen und eigene Einträge
 *   chronik/protokoll.js  die Sitzung als Markdown
 *   chronik/rueckblick.js der Rückblick eines Sprachmodells
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import sitzungen from './chronik/sitzungen.js';
import protokoll from './chronik/protokoll.js';
import rueckblick from './chronik/rueckblick.js';

const router = Router();
router.use(requireAuth);

router.use(sitzungen);
router.use(protokoll);
router.use(rueckblick);

export default router;
