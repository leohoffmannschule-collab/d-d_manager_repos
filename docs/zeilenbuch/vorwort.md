# Vorwort

Dieses Buch enthält den ganzen Code des Abenteuer-Almanachs – jede Datei, jede Zeile – und neben jeder Zeile eine Erklärung, was sie tut. Es ist für alle gedacht, die verstehen wollen, wie der Almanach von innen aussieht: wer gerade programmieren lernt und an einem echten Projekt sehen will, wie die Teile zusammenspielen; wer am Almanach mitarbeiten will und einen Einstieg sucht; und wer einfach wissen möchte, was in Zeile 42 einer bestimmten Datei eigentlich passiert.

Das große Handbuch (*Abenteuer-Almanach – Handbuch*) erklärt den Almanach von oben: wofür es ihn gibt, wie er aufgebaut ist, warum er so gebaut ist. Dieses Buch erklärt ihn von unten, Zeile für Zeile. Die beiden ergänzen sich: Wer hier über einen Begriff stolpert, findet ihn im Handbuch im Zusammenhang; wer dort eine Datei genannt bekommt, findet sie hier ausgeschrieben.

## Wie man eine Seite liest

Jede Datei beginnt mit ihrem Pfad, ihrer Sprache, der Zahl ihrer Zeilen und – kursiv – dem, wozu es sie gibt. Darunter steht sie in einer Tabelle mit zwei Spalten:

- **Links der Code**, genau wie im Editor, mit der Zeilennummer davor. Lange Zeilen brechen um; die Nummer steht dann nur vor dem Anfang.
- **Rechts die Erklärung** dieser Zeile. Wörter in `Schreibmaschinenschrift` sind Code – Namen, Werte, Befehle, so wie sie dastehen.
- **Kleine Zeilen mit ▸** sind Hinweise: Sie erklären ein Wort oder ein Sprachmittel allgemein – was `map` tut, was ein Hook ist, wofür `?.` steht. Jeder Hinweis erscheint in einer Datei nur einmal, beim ersten Vorkommen. Wer mitten in einer Datei einsteigt und ein Wort nicht kennt, findet es weiter oben in derselben Datei oder in der Lesehilfe.
- **„Zeile 17“** ist ein Verweis auf eine andere Zeile derselben Datei. Im PDF lässt er sich anklicken. So sagt etwa eine schließende Klammer, wessen Ende sie ist und wo es angefangen hat.
- **Kommentarblöcke** – Text für Menschen, den das Programm überspringt – stehen als *eine* Reihe da, weil man sie als Ganzes liest. Die Erklärung daneben sagt, wozu der Kommentar gehört.
- **Leerzeilen** sind nur schmale Lücken. Sie tun nichts, gliedern aber den Code, und die Nummern bleiben so dieselben wie im Editor.

## Wie die Erklärungen entstehen

Niemand hat die Erklärungen in diesem Buch einzeln von Hand geschrieben – bei über 40.000 Zeilen wären sie veraltet gewesen, bevor das Buch fertig wäre. Sie entstehen mit `npm run zeilenbuch` aus dem Code selbst, und zwar aus drei Quellen:

1. **Aus dem Code.** Jede Datei wird mit dem Parser ihrer Sprache in ihre Bestandteile zerlegt – bei JavaScript in einen Baum aus Anweisungen, Ausdrücken und Elementen. Für jede Zeile wird bestimmt, was in ihr *neu beginnt* (eine Anweisung, ein Argument, ein Attribut) und was in ihr *endet* (eine Funktion, ein Element). Das gibt die Erklärung ihre Gestalt: „Legt den Zustand `offen` an …“, „Schließt das `<div>` aus Zeile 12“.
2. **Aus den Kommentaren des Almanachs.** Jede Datei beginnt mit einem Kommentar, der sagt, wozu es sie gibt, und über fast jeder Funktion steht, was sie tut. Das Buch verfolgt jeden Namen über Dateigrenzen hinweg bis zu seiner Erklärung: Ruft eine Komponente `blattWurf(…)` auf, steht daneben, was im Kommentar über `blattWurf` in `lib/wuerfeln.js` steht. Ruft die Oberfläche den Server, steht daneben, welcher Weg der Schnittstelle getroffen wird und was der Kommentar über diesem Weg sagt.
3. **Aus Wörterbüchern** für alles, was nicht aus dem Almanach stammt: die eingebauten Teile von JavaScript, React, Node, Express, der Browser, CSS und jede Tailwind-Klasse, HTML, SQL, Docker, die Shell. Sie stehen in `scripts/zeilenbuch/woerterbuch/`.

Das heißt auch: Die Erklärungen sagen genau, *was* eine Zeile tut. *Warum* sie es tut, steht dort, wo es der Code verrät – in den Kommentaren, die in der linken Spalte mitgedruckt sind und rechts zugeordnet werden, und in den Kommentaren der gerufenen Funktionen. Mancher Satz klingt deshalb etwas förmlich; dafür stimmt er, und er stimmt auch nach der nächsten Änderung noch, sobald das Buch neu gebaut ist.

## Was im Buch steht – und was nicht

Im Buch steht jede Datei, die Code ist: die Programme des Servers und der Oberfläche, ihre Stilblätter, die HTML-Seiten, die Werkzeuge in `scripts/`, die Skripte zum Starten, das Dockerfile, die Einstellungsdateien – und die Entwürfe in `design/`. Auch dieses Buch selbst steht darin: Sein Generator ist Code wie jeder andere (Teil IV, `scripts/zeilenbuch/`).

Nicht im Buch stehen die Handbücher in `docs/` (sie sind Text, kein Code), Bilder, Schriften und die Datenbank – und `package-lock.json`. Diese Datei schreibt npm selbst, Eintrag für Eintrag so, wie es die installierten Pakete vorfindet; sie zu erklären hieße, das Verzeichnis von npm abzuschreiben.

## Wo man anfängt

Niemand liest dieses Buch von vorn nach hinten. Ein guter Weg für den Einstieg führt von klein nach groß, von der Oberfläche zum Server:

1. **Eine kleine Komponente:** `frontend/src/components/sheet/kampf/Wurfknopf.jsx` (17 Zeilen) – ein Knopf, der würfelt. Daran sieht man, was eine Komponente ist, was Props sind und wie ein Klick etwas auslöst.
2. **Eine Komponente mit Liste:** `frontend/src/components/sheet/kampf/Todeszeichen.jsx` – drei Kreise aus einer Liste, ein Wert von außen, eine Rückmeldung nach oben.
3. **Eine ganze Seite:** `frontend/src/pages/Dashboard.jsx` – Zustand, Daten vom Server, bedingte Anzeige.
4. **Der Weg zum Server:** `frontend/src/lib/api/blatt.js` – wie die Oberfläche den Server fragt.
5. **Ein Weg im Server:** `backend/src/routes/charaktere/schreiben.js` – wie der Server eine Anfrage prüft, in die Datenbank schreibt und antwortet.
6. **Die Datenbank:** `backend/src/datenbank/schema/` – die Tabellen, Spalte für Spalte.

Die Lesehilfe auf den nächsten Seiten erklärt vorab die Sprachen und Begriffe, die dabei vorkommen.
