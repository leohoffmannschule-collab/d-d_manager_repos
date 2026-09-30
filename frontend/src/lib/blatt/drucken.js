/**
 * Der Druckknopf im mitgenommenen Blatt.
 *
 * Diese Datei läuft nicht im Almanach, sondern *in der Datei*, die
 * blattAusfuhr.js erzeugt: Sie wird beim Bauen als Text geholt (`?raw`) und
 * dort am Ende eingebettet. Ein eigenes Skript statt `onclick="…"` am Knopf,
 * damit auch der Code des Blattes in einer echten .js-Datei steht, die
 * geprüft und gelesen werden kann wie jede andere.
 *
 * Kein Modul, kein Import: Die Datei muss auf jedem Rechner laufen, der sie
 * doppelklickt – ohne Netz und ohne Almanach dahinter.
 */
document.getElementById('drucken')?.addEventListener('click', () => window.print());
