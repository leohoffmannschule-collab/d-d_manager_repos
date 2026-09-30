# Verzeichnis der Tabellen

> Dieses Kapitel schreibt `npm run handbuch` aus dem Code (scripts/handbuch/referenz/).
> Änderungen gehören in den Code und seine Kommentare, nicht hierher.

Die Datenbank ist eine einzige SQLite-Datei (data/manager.sqlite3). Hier steht jede ihrer 22 Tabellen, wie sie ein frisch gestarteter Almanach hat – samt der Spalten, die erst beim Nachrüsten dazukommen –, nach den Bereichen in backend/src/datenbank/schema/.

Ein paar Gewohnheiten, die überall gelten: Kennungen sind Texte (UUIDs), Zeitpunkte ISO-Zeichenketten in UTC, Wahrheitswerte die Zahlen 0 und 1, und was eine Liste oder ein Objekt ist, steht als JSON in einer TEXT-Spalte. Was zu einer Kampagne gehört, trägt eine Spalte `campaign_id`.

## chat.js

Der Chat am Tisch.

Eine Zeile mit `to_user_id` ist geflüstert und geht nur an die beiden
Beteiligten (siehe routes/chat.js).

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### messages

**Der Chat am Tisch.** to_user_id ist leer, wenn die Nachricht an alle geht; steht dort ein
Konto, wurde geflüstert und nur die beiden Beteiligten bekommen sie.

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `user_id` | TEXT |  |  |  |
| `user_name` | TEXT | ja | `''` |  |
| `color` | TEXT |  |  |  |
| `text` | TEXT | ja |  |  |
| `to_user_id` | TEXT |  |  |  |
| `to_user_name` | TEXT |  |  |  |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

Indizes: `idx_messages_zeit` (created_at).

## chronik.js

Die Chronik der Sitzungen.

Ein Eintrag gehört zu einer Sitzung und geht mit ihr. Verdeckte Einträge
(`secret`) bekommt die Runde nie zu sehen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### game_sessions

Chronik der Sitzungen

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `title` | TEXT | ja |  |  |
| `started_at` | TEXT | ja |  |  |
| `ended_at` | TEXT |  |  |  |
| `summary` | TEXT | ja | `''` |  |
| `campaign_id` | TEXT |  |  |  |

### chronicle

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `session_id` | TEXT |  |  | → game_sessions.id (CASCADE) |
| `kind` | TEXT | ja |  |  |
| `actor` | TEXT | ja | `''` |  |
| `target` | TEXT | ja | `''` |  |
| `text` | TEXT | ja |  |  |
| `meta` | TEXT | ja | `'{}'` |  |
| `secret` | INTEGER | ja | `0` |  |
| `created_at` | TEXT | ja |  |  |

Indizes: `idx_chronicle_session` (session_id, created_at).

## grundstock.js

Die ältesten Tabellen: Charakterblätter und der Spiegel des Kompendiums.

Die Charaktere waren zuerst da – noch vor Konten und Kampagnen. Deshalb
stehen `owner_id`, `shared`, `npc` und `campaign_id` nicht hier, sondern
kommen über datenbank/nachruesten.js und kampagnenwanderung.js dazu.
`api_cache` gehört niemandem: Er hält Antworten der offenen 5e-API vor.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### characters

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `system` | TEXT | ja | `'dnd5e'` |  |
| `data` | TEXT | ja |  |  |
| `created_at` | TEXT | ja |  |  |
| `updated_at` | TEXT | ja |  |  |
| `owner_id` | TEXT |  |  |  |
| `shared` | INTEGER | ja | `1` |  |
| `npc` | INTEGER | ja | `0` |  |
| `campaign_id` | TEXT |  |  |  |

### api_cache

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `cache_key` | TEXT | ja |  | Primärschlüssel |
| `payload` | TEXT | ja |  |  |
| `fetched_at` | TEXT | ja |  |  |

## indizes.js

Indizes für die häufigsten Abfragen.

Figuren einer Szene, die jüngsten Würfe, die Einträge einer Sitzung – das
sind die Abfragen, die bei jedem Zug am Tisch laufen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

## kampagnen.js

Kampagnen und wer darin mitspielt.

Eine Kampagne im Papierkorb erkennt man an `deleted_at` (nachgerüstet in
kampagnenwanderung.js); bis die Frist abläuft, bleibt alles stehen.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### campaigns

**Kampagnen: dieselbe Runde, mehrere Geschichten.** Konten, Rollen und Einladungen bleiben rundenweit gemeinsam; alles, was
am Tisch entsteht (Figuren, Chronik, Spielszenen, Beute …), gehört zu
genau einer Kampagne. Wer an mehreren teilnimmt, wählt nach der
Anmeldung, an welcher gerade gespielt wird – festgehalten in der
eigenen Sitzung (auth_sessions.campaign_id), nicht im Konto selbst.

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `created_by` | TEXT |  |  | → users.id (SET NULL) |
| `created_at` | TEXT | ja |  |  |
| `deleted_at` | TEXT |  |  |  |

### campaign_members

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `campaign_id` | TEXT | ja |  | Primärschlüssel → campaigns.id (CASCADE) |
| `user_id` | TEXT | ja |  | Primärschlüssel → users.id (CASCADE) |
| `joined_at` | TEXT | ja |  |  |

## runde.js

Die Runde: Konten, Anmeldungen, Einladungen.

Konten gehören der ganzen Runde, nicht einer Kampagne. Eine Sitzung
(`auth_sessions`) trägt nur den Hash ihres Kennzeichens – nie das
Kennzeichen selbst.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### users

Runde: Konten, Anmeldungen, Einladungen

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `name_key` | TEXT | ja |  |  |
| `password_hash` | TEXT | ja |  |  |
| `role` | TEXT | ja | `'spieler'` |  |
| `color` | TEXT | ja | `'#9a2b22'` |  |
| `created_at` | TEXT | ja |  |  |

### auth_sessions

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `token_hash` | TEXT | ja |  | Primärschlüssel |
| `user_id` | TEXT | ja |  | → users.id (CASCADE) |
| `campaign_id` | TEXT |  |  |  |
| `created_at` | TEXT | ja |  |  |
| `last_seen` | TEXT | ja |  |  |

### invites

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `code` | TEXT | ja |  | Primärschlüssel |
| `note` | TEXT | ja | `''` |  |
| `created_at` | TEXT | ja |  |  |
| `used_by` | TEXT |  |  |  |
| `used_at` | TEXT |  |  |  |

## sammlungen.js

Die Sammlungen: gespeicherte Begegnungen, Beutekiste, Klangteppich.

Begegnungen und Klänge sind Vorbereitung der ganzen Runde; die Beute
gehört einer Kampagne – ihre Münzen stehen nicht hier, sondern als
Einzelwert `beute` in `app_state`.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### encounters

Gespeicherte Begegnungen

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `notes` | TEXT | ja | `''` |  |
| `entries` | TEXT | ja | `'[]'` |  |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

### stash_items

Beutekiste der Runde

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `qty` | INTEGER | ja | `1` |  |
| `weight` | REAL | ja | `0` |  |
| `notes` | TEXT | ja | `''` |  |
| `holder_id` | TEXT |  |  | → characters.id (SET NULL) |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

### ambience

Klangteppich: hinterlegte Spotify-Links

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `uri` | TEXT | ja |  |  |
| `kind` | TEXT | ja |  |  |
| `tags` | TEXT | ja | `'[]'` |  |
| `notes` | TEXT | ja | `''` |  |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

## spielleitung.js

Was die Spielleitung führt: laufender Kampf, Bestiarium, Notizen, Würfe.

`combatants` sind die Kämpfer des *laufenden* Kampfes einer Kampagne;
`library` ist das Bestiarium der ganzen Runde. Würfe (`rolls`) stehen hier,
weil sie wie der Kampf von der Spielleitung verdeckt werden können.

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### combatants

Spielleitung: Kampf, Bestiarium, Notizen

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `type` | TEXT | ja | `'monster'` |  |
| `initiative` | INTEGER | ja | `0` |  |
| `hp` | INTEGER | ja | `0` |  |
| `max_hp` | INTEGER | ja | `0` |  |
| `ac` | INTEGER | ja | `10` |  |
| `conditions` | TEXT | ja | `'[]'` |  |
| `notes` | TEXT | ja | `''` |  |
| `character_id` | TEXT |  |  | → characters.id (SET NULL) |
| `hidden` | INTEGER | ja | `0` |  |
| `created_at` | TEXT | ja |  |  |
| `media_id` | TEXT |  |  |  |
| `campaign_id` | TEXT |  |  |  |

### library

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `category` | TEXT | ja | `'monster'` |  |
| `ac` | INTEGER |  |  |  |
| `hp` | INTEGER |  |  |  |
| `speed` | TEXT | ja | `''` |  |
| `stats` | TEXT | ja | `'{}'` |  |
| `abilities` | TEXT | ja | `''` |  |
| `actions` | TEXT | ja | `''` |  |
| `notes` | TEXT | ja | `''` |  |
| `tags` | TEXT | ja | `'[]'` |  |
| `created_at` | TEXT | ja |  |  |
| `mini` | TEXT | ja | `'{}'` |  |
| `media_id` | TEXT |  |  |  |
| `campaign_id` | TEXT |  |  |  |

### notes

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `title` | TEXT | ja |  |  |
| `content` | TEXT | ja | `''` |  |
| `tags` | TEXT | ja | `'[]'` |  |
| `visibility` | TEXT | ja | `'sl'` |  |
| `created_at` | TEXT | ja |  |  |
| `updated_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

### rolls

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `user_id` | TEXT |  |  |  |
| `user_name` | TEXT | ja | `''` |  |
| `label` | TEXT | ja | `''` |  |
| `expression` | TEXT | ja |  |  |
| `mode` | TEXT | ja | `'normal'` |  |
| `details` | TEXT | ja | `'[]'` |  |
| `total` | INTEGER | ja | `0` |  |
| `secret` | INTEGER | ja | `0` |  |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

Indizes: `idx_rolls_created` (created_at).

## spieltisch.js

Der Spieltisch: Szenen, Karten, Figuren, Bilder, der kleine Schlüssel-Wert-Speicher.

Eine *Karte* (`maps`) ist Vorbereitung und gehört der Runde, eine *Szene*
(`scenes`) ist eine Karte im Spiel und gehört einer Kampagne. Bilder
(`media`) liegen als Dateien neben der Datenbank; hier steht nur der
Verweis darauf. `app_state` hält Einzelwerte je Kampagne – welche Szene
aufliegt, ob der Vorhang zu ist (siehe db.js, getState/setState).

Nur der *Ausgangszustand* einer neuen Datenbank – was später dazukam,
steht in ../nachruesten.js und ../kampagnenwanderung.js.

### scenes

Spieltisch: Szenen, Figuren, Nebel

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `media_id` | TEXT |  |  |  |
| `width` | INTEGER | ja | `0` |  |
| `height` | INTEGER | ja | `0` |  |
| `grid_size` | INTEGER | ja | `70` |  |
| `grid_offset_x` | INTEGER | ja | `0` |  |
| `grid_offset_y` | INTEGER | ja | `0` |  |
| `grid_visible` | INTEGER | ja | `1` |  |
| `fog_enabled` | INTEGER | ja | `1` |  |
| `fog` | TEXT | ja | `'[]'` |  |
| `created_at` | TEXT | ja |  |  |
| `map_id` | TEXT |  |  |  |
| `dark` | INTEGER | ja | `0` |  |
| `sight` | REAL | ja | `0` |  |
| `unit` | TEXT | ja | `'fuss'` |  |
| `scale` | REAL | ja | `5` |  |
| `campaign_id` | TEXT |  |  |  |

### maps

**Kartenbibliothek der Spielleitung.** Eine Karte ist Vorbereitung: das Bild samt einmal eingestelltem Raster.
Eine Szene ist eine Karte im Spiel, mit Nebel und Figuren darauf. Aus
einer Karte lassen sich beliebig viele Szenen legen, ohne sie erneut
hochzuladen oder das Raster neu auszurichten.

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `name` | TEXT | ja |  |  |
| `media_id` | TEXT |  |  |  |
| `thumb_media_id` | TEXT |  |  |  |
| `width` | INTEGER | ja | `0` |  |
| `height` | INTEGER | ja | `0` |  |
| `grid_size` | INTEGER | ja | `70` |  |
| `grid_offset_x` | INTEGER | ja | `0` |  |
| `grid_offset_y` | INTEGER | ja | `0` |  |
| `tags` | TEXT | ja | `'[]'` |  |
| `notes` | TEXT | ja | `''` |  |
| `created_at` | TEXT | ja |  |  |
| `ambience_id` | TEXT |  |  |  |
| `unit` | TEXT | ja | `'fuss'` |  |
| `scale` | REAL | ja | `5` |  |
| `campaign_id` | TEXT |  |  |  |

### tokens

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `scene_id` | TEXT | ja |  | → scenes.id (CASCADE) |
| `name` | TEXT | ja | `''` |  |
| `x` | REAL | ja | `0` |  |
| `y` | REAL | ja | `0` |  |
| `size` | INTEGER | ja | `1` |  |
| `color` | TEXT | ja | `'#9a2b22'` |  |
| `media_id` | TEXT |  |  |  |
| `character_id` | TEXT |  |  | → characters.id (SET NULL) |
| `combatant_id` | TEXT |  |  | → combatants.id (SET NULL) |
| `hidden` | INTEGER | ja | `0` |  |
| `created_at` | TEXT | ja |  |  |
| `light_bright` | INTEGER | ja | `0` |  |
| `light_dim` | INTEGER | ja | `0` |  |

Indizes: `idx_tokens_scene` (scene_id).

### media

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `id` | TEXT | ja |  | Primärschlüssel |
| `filename` | TEXT | ja |  |  |
| `mime` | TEXT | ja |  |  |
| `bytes` | INTEGER | ja | `0` |  |
| `created_at` | TEXT | ja |  |  |
| `campaign_id` | TEXT |  |  |  |

### app_state

| Spalte | Typ | Pflicht | Vorgabe | Schlüssel |
|---|---|---|---|---|
| `key` | TEXT | ja |  | Primärschlüssel |
| `value` | TEXT | ja |  |  |
