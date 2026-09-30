/**
 * Die Wege rund um Konten: anmelden, abmelden, einrichten, einladen,
 * verwalten.
 *
 * Diese Datei hängt nur drei Teilwege hintereinander:
 *
 *   konten/anmeldung.js    anmelden, abmelden, einrichten, Kennwort
 *   konten/verwaltung.js   Konten der Runde verwalten [SL]
 *   konten/einladungen.js  Einladungscodes [SL]
 *
 * Gemeinsames steht in konten/regeln.js, die Anmeldebremse in
 * konten/drossel.js.
 *
 * Drei Dinge, die hier anders sind als überall sonst im Almanach:
 *
 *   – *Das erste Konto führt die Spielleitung.* Nicht weil jemand es
 *     auswählt, sondern weil es das erste ist. Danach braucht jedes weitere
 *     einen Einladungscode; ohne den stünde ein Almanach, der im Netz
 *     erreichbar ist, jedem offen, der die Adresse kennt.
 *   – *Die Anmeldung wird gedrosselt.* Nach zu vielen Fehlversuchen je
 *     Absender und Name ist für eine Weile Schluss (429). Das macht das
 *     Durchprobieren von Kennwörtern aussichtslos, ohne jemanden
 *     auszusperren, der sich nur vertippt hat.
 *   – *Das erste Konto bekommt gleich eine Kampagne* samt zwölf Vorlagen,
 *     sonst stünde die frisch eingerichtete Spielleitung vor einem leeren
 *     Almanach ohne Weg hinein.
 */
import { Router } from 'express';
import anmeldung from './konten/anmeldung.js';
import verwaltung from './konten/verwaltung.js';
import einladungen from './konten/einladungen.js';

const router = Router();

router.use(anmeldung);
router.use(verwaltung);
router.use(einladungen);

export default router;
