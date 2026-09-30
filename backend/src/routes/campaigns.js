/**
 * Kampagnen: anlegen, wechseln, Mitglieder, umbenennen, wegräumen,
 * übernehmen.
 *
 * Der Grundsatz dahinter, und er erklärt den ganzen Rest des Almanachs:
 * **Konten gehören der Runde, alles Gespielte gehört einer Kampagne.**
 * Dieselben Leute können mehrere Geschichten nebeneinander spielen, ohne
 * sich neu anzumelden.
 *
 * Welche Kampagne offen ist, hängt an der **Sitzung**, nicht am Konto
 * (`auth_sessions.campaign_id`). Dieselbe Spielleitung kann deshalb in zwei
 * Browserfenstern in zwei Kampagnen sitzen. Wer noch keine gewählt hat,
 * bekommt auf jedem Spielweg ein 409 `keine_kampagne` – das ist das Tor,
 * durch das die Oberfläche in ihre Auswahl schickt.
 *
 * Diese Datei hängt nur vier Teilwege hintereinander:
 *
 *   kampagnen/liste.js       auflisten, anlegen, wechseln, umbenennen
 *   kampagnen/mitglieder.js  wer mitspielt [SL]
 *   kampagnen/umzug.js       in eine andere Kampagne kopieren [SL]
 *   kampagnen/papierkorb.js  wegräumen, wiederherstellen, entfernen
 *
 * Über eine Kampagne bestimmt, wer sie angelegt hat (`darfVerwalten`) –
 * auch keine andere Spielleitung. Gelöscht wird zweistufig: erst in den
 * Papierkorb, nach 30 Tagen endgültig (siehe ../kampagnen.js).
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import liste from './kampagnen/liste.js';
import mitglieder from './kampagnen/mitglieder.js';
import umzug from './kampagnen/umzug.js';
import papierkorb from './kampagnen/papierkorb.js';

const router = Router();

router.use(requireAuth);

// Die Reihenfolge ist die des früheren Flusses der Datei. Keiner der Wege
// überschneidet sich mit einem anderen, aber wer einen `GET /:id` ergänzt,
// muss ihn hinter `/umfang` und `/papierkorb` hängen.
router.use(liste);
router.use(mitglieder);
router.use(umzug);
router.use(papierkorb);

export default router;
