# Verzeichnis der Einstellungen

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Der Almanach läuft ohne eine einzige Einstellung. Was sich einstellen lässt, steht in einer Datei `.env` im Wurzelverzeichnis (als Vorlage liegt `.env.example` daneben) oder wird beim Start mitgegeben (`PORT=3002 npm start`). Was schon in der Umgebung steht, hat Vorrang vor der Datei.

Die .env gehört nicht ins Git – sie ist in .gitignore eingetragen, denn darin stehen Kennwörter wie das Tunnel-Token.

## Übersicht

| Name | Vorgabe | in .env.example | gelesen in |
|---|---|---|---|
| `CHROME_PFAD` | – |  | scripts/handbuch/drucker.mjs |
| `CHRONIK_KI_MODELL` | `'gpt-4o-mini'` | ja | backend/src/routes/chronik/rueckblick.js |
| `CHRONIK_KI_SCHLUESSEL` | `''` | ja | backend/src/routes/chronik/rueckblick.js |
| `CHRONIK_KI_URL` | `''` | ja | backend/src/routes/chronik/rueckblick.js |
| `CLOUDFLARED` | – |  | scripts/tunnel/grundlagen.mjs |
| `DATA_DIR` | – |  | backend/src/datenbank/verbindung.js, scripts/adresse.mjs, scripts/start.mjs, scripts/tunnel/grundlagen.mjs |
| `DND5E_API_BASE` | `'https://www.dnd5eapi.co/api/2014'` |  | backend/src/routes/compendium.js |
| `DOMAENE` | – | ja | backend/src/domaene.js |
| `HTTPS_PORT` | `3443` |  | backend/src/https/ablage.js |
| `PLAYWRIGHT_BROWSERS_PATH` | – |  | scripts/handbuch/drucker.mjs |
| `PORT` | `3001` |  | backend/src/server.js, scripts/adresse.mjs, scripts/start.mjs, scripts/tunnel/grundlagen.mjs |
| `TRUST_PROXY` | `'loopback'` |  | backend/src/server.js |
| `TUNNEL_ANBIETER` | – |  | scripts/tunnel/anbieter.mjs |
| `TUNNEL_TOKEN` | – | ja | scripts/start.mjs, scripts/tunnel.mjs |

## Im Einzelnen

### CHROME_PFAD

*scripts/handbuch/drucker.mjs, Zeile 55*

### CHRONIK_KI_MODELL

Erzählender Rückblick in der Chronik (freiwillig).
Adresse einer OpenAI-kompatiblen Schnittstelle. Örtlich z. B.
http://localhost:8080/v1/chat/completions für llama.cpp oder Ollama; sonst
die von OpenAI oder Anthropic. Ohne diese Zeile bleibt der Knopf verborgen.

*backend/src/routes/chronik/rueckblick.js, Zeile 33* – ohne Angabe: `'gpt-4o-mini'`

### CHRONIK_KI_SCHLUESSEL

Erzählender Rückblick in der Chronik (freiwillig).
Adresse einer OpenAI-kompatiblen Schnittstelle. Örtlich z. B.
http://localhost:8080/v1/chat/completions für llama.cpp oder Ollama; sonst
die von OpenAI oder Anthropic. Ohne diese Zeile bleibt der Knopf verborgen.

*backend/src/routes/chronik/rueckblick.js, Zeile 34* – ohne Angabe: `''`

### CHRONIK_KI_URL

Erzählender Rückblick in der Chronik (freiwillig).
Adresse einer OpenAI-kompatiblen Schnittstelle. Örtlich z. B.
http://localhost:8080/v1/chat/completions für llama.cpp oder Ollama; sonst
die von OpenAI oder Anthropic. Ohne diese Zeile bleibt der Knopf verborgen.

*backend/src/routes/chronik/rueckblick.js, Zeile 32* – ohne Angabe: `''`

Der Almanach kommt ohne KI aus – das Protokoll oben entsteht allein aus dem,
was am Tisch geschehen ist. Wer möchte, kann zusätzlich ein Sprachmodell
daraus einen Fließtext machen lassen. Das ist bewusst nichts, was
voreingestellt ist: Es kostet entweder Rechenzeit auf dem Pi oder Geld und
schickt das Protokoll aus dem Haus.

Eingestellt wird es über drei Umgebungsvariablen; die Schnittstelle ist die
von OpenAI, die auch llama.cpp und Ollama örtlich anbieten.

Das Sprachmodell bekommt nur, was die Runde ohnehin sehen darf – keine
verdeckten Einträge. Der Rückblick steht hinterher bei *allen* in der
Chronik; ein verborgener Gegner oder ein verdeckter Wurf im Protokoll
stünde sonst, schön ausformuliert, im Text für die ganze Runde.

### CLOUDFLARED

*scripts/tunnel/grundlagen.mjs, Zeile 36*

*scripts/tunnel/grundlagen.mjs, Zeile 37*

*scripts/tunnel/grundlagen.mjs, Zeile 37*

### DATA_DIR

*backend/src/datenbank/verbindung.js, Zeile 29*

Auch nach außen sichtbar: Skripte wie die Sicherung sollen denselben
Ordner treffen wie der Server – und ihn nicht aus dem Arbeitsverzeichnis
raten müssen, das je nach Aufrufort ein anderer wäre.

Zwei Ebenen hinauf, weil diese Datei in backend/src/datenbank/ liegt und
der Ordner in backend/data/ – ein falscher Schritt hier legt eine zweite,
leere Datenbank an, ohne sich zu beschweren.

*scripts/adresse.mjs, Zeile 32*

*scripts/start.mjs, Zeile 215*

*scripts/tunnel/grundlagen.mjs, Zeile 15*

 Derselbe Datenordner wie der des Servers. 

### DND5E_API_BASE

*backend/src/routes/compendium.js, Zeile 25* – ohne Angabe: `'https://www.dnd5eapi.co/api/2014'`

Die offene SRD-API (https://www.dnd5eapi.co). Umstellbar, damit sich ein
anderes Regelwerk (etwa /api/2024) oder ein eigener Spiegel nutzen lässt.

### DOMAENE

Feste Adresse für die Runde (freiwillig).
Ohne diese Zeilen leiht sich der Schnelltunnel bei jedem Start eine neue
Adresse, und die Runde bekommt vor jedem Spielabend eine andere geschickt.
Mit ihnen heißt der Almanach für alle immer gleich – kostenlos und ganz ohne
Kreditkarte, denn Cloudflare selbst verlangt für einen Tunnel keine.

Die Adresse, die deine Runde eintippt. Nur der nackte Name, ohne https://
und ohne Schrägstrich am Ende.

*backend/src/domaene.js, Zeile 29*

Was in `DOMAENE` steht – auf den nackten Namen gebracht.

Ein Tippfehler hält den Almanach nicht auf: Dann ist `adresse` leer, und der
Aufrufer sagt es beim Start. Eine falsche Adresse in die Runde zu schicken
wäre schlimmer als gar keine.

### HTTPS_PORT

*backend/src/https/ablage.js, Zeile 39* – ohne Angabe: `3443`

 Der Port für HTTPS: `HTTPS_PORT`, sonst 3443. 

### PLAYWRIGHT_BROWSERS_PATH

*scripts/handbuch/drucker.mjs, Zeile 47*

Ein Chromium, das Playwright schon einmal geholt hat – etwa auf einem
Entwicklungsrechner. Genommen wird nur, was schon da ist.

### PORT

*backend/src/server.js, Zeile 60* – ohne Angabe: `3001`

*scripts/adresse.mjs, Zeile 31* – ohne Angabe: `3001`

*scripts/start.mjs, Zeile 216* – ohne Angabe: `3001`

*scripts/tunnel/grundlagen.mjs, Zeile 13* – ohne Angabe: `3001`

 Der Port, auf dem der Almanach lauscht und zu dem der Tunnel die Runde bringt. 

### TRUST_PROXY

*backend/src/server.js, Zeile 68* – ohne Angabe: `'loopback'`

Vor dem Almanach steht entweder gar nichts oder der Cloudflare-Tunnel.
Läuft der als Dienst auf demselben Gerät, meldet er sich von localhost;
steckt er in einem eigenen Container, ist er der erste Zwischenschritt –
dann gehört TRUST_PROXY=1 in die Umgebung. Nur wem wir hier glauben, darf
uns sagen, die Anfrage sei über HTTPS gekommen (und erst dann wird das
Sitzungs-Plätzchen als `Secure` gesetzt).

### TUNNEL_ANBIETER

*scripts/tunnel/anbieter.mjs, Zeile 84*

### TUNNEL_TOKEN

Das Kennwort des *benannten* Tunnels, der diese Domain trägt. Zu finden in
Cloudflare unter Zero Trust → Networks → Tunnels → (dein Tunnel) → Configure;
es ist die lange Zeichenkette hinter `--token` im angezeigten Befehl.

Liegt es hier, baut `npm run tunnel` den benannten statt des Schnelltunnels
auf. Einrichtung Schritt für Schritt: docs/EINRICHTUNG.md, Schritt 6.5.

*scripts/start.mjs, Zeile 219*

*scripts/tunnel.mjs, Zeile 54*

Mit eigener Domain gibt es nichts zu wählen: Dann führt genau ein Weg hinaus.
