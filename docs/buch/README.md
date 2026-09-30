# Das Handbuch zum Abenteuer-Almanach

Dieses Buch beschreibt den Abenteuer-Almanach vollständig: wie man ihn am Spieltisch benutzt, wie man ihn einrichtet und betreibt, wie er gebaut ist und wie man daran weiterarbeitet. Es richtet sich an vier Leserschaften, und jede kann dort einsteigen, wo sie etwas sucht – die Teile bauen nicht aufeinander auf.

**Wer mitspielt**, liest die Einführung und Teil II. Dort steht, was man am Spielabend anklickt, was das Blatt ausrechnet und was die anderen sehen.

**Wer den Almanach aufstellt** – auf einem Raspberry Pi, einem alten Laptop oder dem Rechner, der am Spielabend ohnehin läuft –, findet in Teil III die Einrichtung Schritt für Schritt, den Alltag mit Sicherungen und Aktualisierungen und eine Fehlersuche, die von dem ausgeht, was man sieht.

**Wer am Code arbeitet**, liest Teil IV und V: wie Server, Live-Kanal und Oberfläche zusammenspielen, warum der Server die Wahrheit ist, wie Sicht und Nebel gerechnet werden, und nach welchen Grundsätzen Änderungen geprüft werden.

**Wer etwas nachschlagen will**, findet in Teil VI die Verzeichnisse: jede Datei, jeden Weg der Schnittstelle, jede Tabelle, jedes Live-Ereignis, jeden Fehlerschlüssel. Sie werden bei jedem Bau des Buches aus dem Code selbst geschrieben und können deshalb nicht veralten.

Die Kapitel sind gewöhnliche Markdown-Dateien in `docs/buch/` und lassen sich auf GitHub einzeln lesen. Gedruckt ergeben sie dieses Buch als PDF – mit Inhaltsverzeichnis, Seitenzahlen und Verweisen, die man anklicken kann: `docs/Abenteuer-Almanach-Handbuch.pdf`.

## Inhalt

### Teil I · Einführung

Was der Almanach ist, wofür er gebaut wurde, und die Wörter, mit denen dieses Buch über ihn spricht.

1. [Was der Almanach ist](01-einleitung.md)
2. [Ein Rundgang](02-rundgang.md)
3. [Begriffe](03-begriffe.md)

### Teil II · Am Tisch

Für alle, die mitspielen oder leiten: die Betriebsanleitungen, das Handbuch im Almanach selbst, das Charakterblatt Feld für Feld und ein ganzer Spielabend, erzählt von der Vorbereitung bis zur Chronik.

4. [Für die Runde](../SPIELER.md)
5. [Für die Spielleitung](../SPIELLEITUNG.md)
6. [Das Handbuch im Almanach](../HANDBUCH.md)
7. [Das Charakterblatt Feld für Feld](07-charakterblatt.md)
8. [Ein Spielabend von Anfang bis Ende](08-spielabend.md)

### Teil III · Betrieb

Für die Person, die den Almanach aufstellt und am Laufen hält: Einrichtung, Alltag und was zu tun ist, wenn etwas nicht geht.

9. [Einrichtung](../EINRICHTUNG.md)
10. [Betrieb im Alltag](10-betrieb.md)
11. [Fehlersuche](11-fehlersuche.md)

### Teil IV · Wie er gebaut ist

Der Almanach von innen: die Teile und wie sie zusammenspielen, der Server, die Sicherheit, der Live-Kanal, die Rechnung hinter Sicht und Nebel, die Oberfläche, das Datenmodell des Blattes und die Schnittstelle.

12. [Der Almanach von innen](../CODE.md)
13. [Architektur](13-architektur.md)
14. [Der Server](14-server.md)
15. [Anmeldung, Rollen und Sicherheit](15-sicherheit.md)
16. [Der Live-Kanal](16-live-kanal.md)
17. [Sicht und Nebel](17-sicht-und-nebel.md)
18. [Die Oberfläche](18-oberflaeche.md)
19. [Das Blatt: Datenmodell und Ausfuhr](19-blatt-datenmodell.md)
20. [Die Schnittstelle](../API.md)

### Teil V · Entwicklung

Für alle, die am Almanach weiterbauen: der Arbeitsablauf mit Proben und Vertrag, die Grundsätze, nach denen Änderungen geprüft werden, und wie dieses Buch entsteht.

21. [Arbeiten am Almanach](21-arbeiten.md)
22. [Grundsätze und Review-Leitfaden](22-grundsaetze.md)
23. [Das Handbuch bauen](23-handbuch-bauen.md)

### Teil VI · Verzeichnisse

Zum Nachschlagen. Jedes dieser Kapitel schreibt das Werkzeug bei jedem Bau des Buches aus dem Code: aus den Kopfkommentaren der Dateien, den Wegen der Schnittstelle, dem Schema der Datenbank, den Prüfungen des Vertrags und dem Verlauf von git.

24. [Dateien: der Server](referenz/80-dateien-server.md)
25. [Dateien: die Oberfläche](referenz/81-dateien-oberflaeche.md)
26. [Dateien: die Werkzeuge](referenz/82-dateien-werkzeuge.md)
27. [Die Wege der Schnittstelle](referenz/83-wege.md)
28. [Die Tabellen der Datenbank](referenz/84-datenbank.md)
29. [Die Live-Ereignisse](referenz/85-ereignisse.md)
30. [Die Einstellungen](referenz/86-einstellungen.md)
31. [Die Befehle](referenz/87-befehle.md)
32. [Die zwölf Vorlagen](referenz/88-vorlagen.md)
33. [Die Regeln, mit denen das Blatt rechnet](referenz/89-regeln.md)
34. [Das Prüfnetz](referenz/90-pruefnetz.md)
35. [Die Fehlerschlüssel](referenz/91-fehlerschluessel.md)
36. [Wie der Almanach entstand](referenz/92-geschichte.md)

## Anhang zum Verzeichnis

### Das PDF bauen

```bash
npm run handbuch
```

Der Befehl schreibt zuerst die Verzeichnisse in `docs/buch/referenz/` neu, setzt dann alle Kapitel in der Reihenfolge dieser Datei zu einer HTML-Seite und lässt einen Browser, der ohnehin auf dem Rechner liegt (Chromium, Chrome oder Edge), daraus `docs/Abenteuer-Almanach-Handbuch.pdf` drucken – zweimal, damit im Inhaltsverzeichnis die richtigen Seitenzahlen stehen. Findet sich kein Browser, bleibt es bei der gesetzten Fassung `docs/druck/handbuch.html`; jeder Browser macht mit `Strg+P` → „Als PDF sichern“ dasselbe daraus.

Wie das im Einzelnen geht und wie man ein Kapitel hinzufügt, steht im Kapitel [Das Handbuch bauen](23-handbuch-bauen.md).

### Diese Datei ist der Bauplan

Die Reihenfolge der Kapitel oben ist zugleich die Reihenfolge im Druck. Eine Zeile `### Teil …` beginnt einen Teil, der Text darunter steht auf seinem Teilblatt, eine nummerierte Zeile mit Verweis ist ein Kapitel. Alles ab „Anhang zum Verzeichnis“ gehört nicht mehr zum Buch.
