/**
 * Charakterblätter: anlegen, lesen, schreiben, zuweisen, kopieren.
 *
 * Der Server kennt den **Inhalt** eines Blattes nicht. Er nimmt entgegen,
 * was die Oberfläche als `data` schickt, und gibt es unverändert zurück –
 * ein JSON-Klumpen in einer Spalte. Das ist Absicht: So lassen sich Felder
 * am Blatt ergänzen, ohne die Datenbank anzufassen, und ein anderes
 * Regelsystem braucht keine neue Tabelle.
 *
 * Was der Server dagegen sehr wohl entscheidet, ist **wer was sehen darf**:
 *
 *   – `npc` – NSC-Blätter sind der Zettel hinter dem Schirm. Sie werden
 *     *vor* allen anderen Regeln geprüft; auch ein versehentlich als
 *     „geteilt“ markiertes NSC-Blatt bleibt verborgen.
 *   – `shared` – ein geteiltes Blatt dürfen Mitspieler lesen, nicht ändern.
 *   – `owner_id` – wem das Blatt gehört. Nur die Spielleitung darf das
 *     ändern.
 *
 * Diese Datei hängt nur drei Teilwege hintereinander; die Regeln, wer was
 * sehen und ändern darf, stehen in charaktere/blatt.js:
 *
 *   charaktere/lesen.js        Liste, einzelnes Blatt, Verwaltung
 *   charaktere/schreiben.js    anlegen, speichern, zuteilen, löschen
 *   charaktere/abschriften.js  Abschrift hier, Kopie in eine andere Kampagne
 *
 * Eine Besonderheit, die leicht übersehen wird: Wer Trefferpunkte auf dem
 * Blatt ändert, ändert sie damit auch am verknüpften Kämpfer im Kampf – und
 * wer die Sinne ändert, verschiebt den Nebel am Spieltisch. Beides steht
 * unten in `PUT /:id`.
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import lesen from './charaktere/lesen.js';
import schreiben from './charaktere/schreiben.js';
import abschriften from './charaktere/abschriften.js';

const router = Router();

router.use(requireAuth);
router.use(lesen);
router.use(schreiben);
router.use(abschriften);

export default router;
