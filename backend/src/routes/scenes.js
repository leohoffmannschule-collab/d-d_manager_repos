/**
 * Die Wege des Spieltisches: Szenen, Nebel, Figuren, Vorhang, Zeigen.
 *
 * Diese Datei hängt nur noch vier Teilwege hintereinander. Gebaut werden sie
 * nebenan in `spieltisch/`, gerechnet und verschickt wird eine Ebene
 * darunter:
 *
 *   spieltisch/szenen.js   anlegen, ändern, auflegen, löschen, Vorhang
 *   spieltisch/nebel.js    Striche setzen, alles verhüllen, alles aufdecken
 *   spieltisch/figuren.js  auslegen, schieben, wegnehmen, aus dem Kampf holen
 *   spieltisch/zeigen.js   der Zeigefinger
 *
 *   ../spieltisch/umwandlung.js    Zeilen in Objekte, und die Nachschlagefragen
 *   ../spieltisch/sichtbarkeit.js  wer sieht was (die Kernfrage)
 *   ../spieltisch/melden.js        wer erfährt wann davon
 *
 * Die Aufteilung ist keine Ordnungsliebe: Die Sichtbarkeit wird auch von
 * anderen Wegen gebraucht (ein Nebelstrich kann eine Figur aufdecken, ein
 * geändertes Charakterblatt die Sichtweite ändern), und eine Rechnung, die
 * an zwei Stellen steht, ist an einer davon irgendwann falsch. In diesem
 * Fall hieße „falsch“: Die Runde sieht den Hinterhalt.
 *
 * Die Reihenfolge der vier Teilwege ist dieselbe wie früher im Fluss der
 * Datei. Bei Express zählt sie: Der erste Weg, dessen Muster passt, gewinnt.
 */
import { Router } from 'express';
import { requireAuth } from '../auth.js';
import szenen from './spieltisch/szenen.js';
import nebel from './spieltisch/nebel.js';
import figuren from './spieltisch/figuren.js';
import zeigen from './spieltisch/zeigen.js';

const router = Router();

// Ein Wächter für alle vier: Wer nicht angemeldet ist, kommt hier nicht
// vorbei. Alles Weitere – wer Spielleitung sein muss – steht bei den
// einzelnen Wegen.
router.use(requireAuth);

router.use(szenen);
router.use(nebel);
router.use(figuren);
router.use(zeigen);

export default router;
