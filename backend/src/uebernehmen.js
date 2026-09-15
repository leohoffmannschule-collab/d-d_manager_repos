import { randomUUID } from 'node:crypto';
import { db, getState, setState } from './db.js';
import { broadcast } from './events.js';

/**
 * Daten von einer Kampagne in eine andere kopieren.
 *
 * Die Vorbereitung – Karten, Bilder, Bestiarium, Begegnungen, Klang – gehört
 * ohnehin der ganzen Runde und liegt in jeder Kampagne bereit; dort gibt es
 * nichts zu kopieren. Was hier hinüberwandert, ist das, was zu *einer*
 * Geschichte gehört: Charaktere, Handzettel, Szenen und die Beutekiste.
 *
 * Kopiert wird, nicht verschoben: Was hier liegt, bleibt liegen, und beide
 * Fassungen gehen danach getrennte Wege. Der Almanach führt auch nicht Buch
 * darüber, was schon einmal hinüber ist – zweimal kopiert heißt zweimal dort.
 *
 * Nicht kopiert wird die Geschichte selbst: Würfe, Chat und Chronik gehören
 * zu den Abenden, an denen sie geschahen, und in einer anderen Kampagne wären
 * sie eine Fälschung. Ein laufender Kampf ebenso wenig – dafür gibt es
 * „Kampf als Begegnung sichern“, und Begegnungen liegen der ganzen Runde
 * bereit.
 */

/** Die Münzsorten der Beutekiste – dieselbe Ordnung wie in routes/stash.js. */
const MUENZEN = ['pp', 'gp', 'ep', 'sp', 'cp'];
const KEINE_MUENZEN = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

const jetzt = () => new Date().toISOString();

/**
 * Darf hier hineingelegt werden?
 *
 * Nur in Kampagnen, in denen die Spielleitung selbst sitzt: Wer nicht
 * hineinsieht, soll auch nichts hineinlegen können. Gibt die Kampagne
 * zurück oder null.
 */
export function zielKampagne(id, userId) {
  if (!id) return null;
  return (
    db
      .prepare(
        `SELECT c.* FROM campaigns c
           JOIN campaign_members m ON m.campaign_id = c.id
          WHERE c.id = ? AND m.user_id = ? AND c.deleted_at IS NULL`
      )
      .get(id, userId) ?? null
  );
}

/**
 * Die Zielkampagne aus dem Rumpf der Anfrage, geprüft und in `req.ziel`
 * abgelegt – oder eine Absage. Jede Kopierroute beginnt mit derselben
 * Vergewisserung, also steht sie einmal hier.
 */
export function zielPruefen(req, res, next) {
  const ziel = req.body?.campaignId;
  if (ziel === req.campaignId) {
    return res.status(400).json({
      code: 'gleiche_kampagne',
      error: 'Das wäre dieselbe Kampagne – kopiert wird nur in eine andere.',
    });
  }
  if (!zielKampagne(ziel, req.user.id)) {
    return res.status(403).json({ code: 'ziel_unbekannt', error: 'In diese Kampagne kannst du nichts legen.' });
  }
  req.ziel = ziel;
  next();
}

/**
 * Ein Verweis auf einen Charakter, übersetzt in die Zielkampagne.
 *
 * Eine Figur auf der Karte und ein getragener Gegenstand zeigen auf ein
 * Charakterblatt – und Blätter gehören zu genau einer Kampagne. Drüben wird
 * deshalb der gleichnamige Charakter gesucht: Wer die Runde zuerst hinüber
 * kopiert und danach die Szene, findet seine Figuren wieder an den Helden
 * hängen. Steht dort niemand dieses Namens, hängt der Verweis eben frei –
 * die Figur bleibt eine Figur, der Gegenstand bleibt ein Gegenstand.
 */
function gleicherCharakter(characterId, ziel) {
  if (!characterId) return null;
  const quelle = db.prepare('SELECT name FROM characters WHERE id = ?').get(characterId);
  if (!quelle) return null;
  const dort = db
    .prepare('SELECT id FROM characters WHERE campaign_id = ? AND name = ? COLLATE NOCASE ORDER BY created_at')
    .get(ziel, quelle.name);
  return dort?.id ?? null;
}

/* --- Die einzelnen Stücke ------------------------------------------------ */

/**
 * Ein Charakterblatt.
 *
 * Bildnisse stecken als Daten-URL im Blatt selbst, hochgeladene Bilder
 * gehören der ganzen Runde – beides wandert von allein mit. Der Besitzer
 * zieht nur mit, wenn er in der Zielkampagne überhaupt mitspielt; sonst
 * gehört das Blatt dort der Spielleitung.
 */
export function kopiereCharakter(row, ziel) {
  const besitzerBleibt =
    row.owner_id &&
    db.prepare('SELECT 1 FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(ziel, row.owner_id);

  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO characters (id, name, system, data, owner_id, shared, npc, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, row.name, row.system, row.data, besitzerBleibt ? row.owner_id : null, row.shared, row.npc, ziel, now, now);

  return { id, name: row.name, besitzerMitgenommen: !!besitzerBleibt };
}

/** Ein Handzettel. Ob er ausgeteilt war, zieht mit – drüben ist es ein neuer Abend. */
export function kopiereNotiz(row, ziel) {
  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO notes (id, title, content, tags, visibility, campaign_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, row.title, row.content, row.tags, row.visibility, ziel, now, now);
  return { id, name: row.title };
}

/**
 * Eine Szene samt Figuren und aufgedecktem Nebel.
 *
 * Die Karte dahinter gehört der Runde und bleibt dieselbe – kopiert wird das
 * Spiel darauf. Der Nebel kommt so mit, wie er steht; wer der neuen Runde
 * alles wieder verhüllen will, schließt ihn drüben mit einem Klick.
 */
export function kopiereSzene(row, ziel) {
  const id = randomUUID();
  const now = jetzt();
  db.prepare(
    `INSERT INTO scenes (id, name, media_id, width, height, grid_size, grid_offset_x, grid_offset_y,
                         grid_visible, fog_enabled, fog, dark, sight, unit, scale, map_id, campaign_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    row.name,
    row.media_id,
    row.width,
    row.height,
    row.grid_size,
    row.grid_offset_x,
    row.grid_offset_y,
    row.grid_visible,
    row.fog_enabled,
    row.fog,
    row.dark,
    row.sight,
    row.unit,
    row.scale,
    row.map_id,
    ziel,
    now
  );

  const einfuegen = db.prepare(
    `INSERT INTO tokens (id, scene_id, name, x, y, size, color, media_id, character_id, combatant_id,
                         hidden, light_bright, light_dim, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`
  );
  const figuren = db.prepare('SELECT * FROM tokens WHERE scene_id = ? ORDER BY created_at').all(row.id);
  for (const figur of figuren) {
    // Der Verweis auf den Kämpfer bleibt hier: Ein laufender Kampf reist nicht mit.
    einfuegen.run(
      randomUUID(),
      id,
      figur.name,
      figur.x,
      figur.y,
      figur.size,
      figur.color,
      figur.media_id,
      gleicherCharakter(figur.character_id, ziel),
      figur.hidden,
      figur.light_bright,
      figur.light_dim,
      now
    );
  }

  // Liegt drüben noch nichts auf dem Tisch, kommt die erste Kopie gleich
  // darauf – wie bei einer neu angelegten Szene. Ohne Szene bleibt der
  // Spieltisch dort sonst leer und die halbe Werkzeugleiste stumm.
  if (!getState('szene', ziel, null)) setState('szene', ziel, id);

  return { id, name: row.name, figuren: figuren.length };
}

/** Ein Stück aus der Beutekiste. Getragen wird es drüben nur von jemandem gleichen Namens. */
export function kopiereGegenstand(row, ziel) {
  const id = randomUUID();
  db.prepare(
    'INSERT INTO stash_items (id, name, qty, weight, notes, holder_id, campaign_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, row.name, row.qty, row.weight, row.notes, gleicherCharakter(row.holder_id, ziel), ziel, jetzt());
  return { id, name: row.name };
}

/**
 * Die Münzen der Kiste – dazugelegt, nicht ersetzt.
 *
 * Drüben liegt vielleicht schon etwas, und das darf ein Kopiervorgang nicht
 * verschlucken. Also wird addiert. Wer zweimal kopiert, hat drüben auch
 * zweimal das Gold: Kopieren ist Kopieren, kein Abgleich.
 */
export function kopiereMuenzen(von, ziel) {
  const hier = getState('beute', von, null);
  if (!hier) return null;
  const dort = { ...KEINE_MUENZEN, ...(getState('beute', ziel, null) ?? {}) };
  const summe = { ...KEINE_MUENZEN };
  for (const m of MUENZEN) summe[m] = (Number(dort[m]) || 0) + (Number(hier[m]) || 0);
  setState('beute', ziel, summe);
  return summe;
}

/* --- Die Arten, in der Reihenfolge, in der kopiert wird ------------------ */

/**
 * Charaktere stehen mit Bedacht vorn: Figuren und getragene Gegenstände
 * suchen drüben ihren gleichnamigen Charakter, und den gibt es nur, wenn er
 * schon dort ist.
 */
export const ARTEN = {
  charaktere: {
    // `label` steht über der Liste, `eins` und `viele` stehen in Sätzen:
    // „1 Charakter“ liest sich, „1 Charaktere“ nicht.
    label: 'Charaktere',
    eins: 'Charakter',
    viele: 'Charaktere',
    // Unberührte Vorlagen bleiben hier: Jede Kampagne bringt dieselben zwölf
    // von selbst mit, und zwölf Abziehbilder daneben hülfen niemandem. Wer
    // eine Vorlage bearbeitet hat, hat daraus etwas Eigenes gemacht – das
    // kommt mit. Und wer eine einzelne ausdrücklich kopiert, bekommt sie
    // ohnehin: Diese Ausnahme gilt nur für „alles auf einmal“.
    alle: (von) =>
      db
        .prepare(
          `SELECT * FROM characters
            WHERE campaign_id = ?
              AND NOT (id LIKE 'vorlage-%--' || ? AND created_at = updated_at)
            ORDER BY created_at`
        )
        .all(von, von),
    einzeln: (id, von) => db.prepare('SELECT * FROM characters WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereCharakter,
  },
  notizen: {
    label: 'Notizen und Handzettel',
    eins: 'Notiz',
    viele: 'Notizen',
    alle: (von) => db.prepare('SELECT * FROM notes WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM notes WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereNotiz,
  },
  szenen: {
    label: 'Szenen mit Figuren',
    eins: 'Szene',
    viele: 'Szenen',
    alle: (von) => db.prepare('SELECT * FROM scenes WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM scenes WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereSzene,
  },
  beute: {
    label: 'Beutekiste',
    eins: 'Fundstück',
    viele: 'Fundstücke',
    alle: (von) => db.prepare('SELECT * FROM stash_items WHERE campaign_id = ? ORDER BY created_at').all(von),
    einzeln: (id, von) => db.prepare('SELECT * FROM stash_items WHERE id = ? AND campaign_id = ?').get(id, von),
    kopiere: kopiereGegenstand,
    // Die Kiste ist mehr als ihre Gegenstände: Münzen liegen nicht als Zeile
    // in einer Tabelle, sondern als Stand am Tisch.
    dazu: kopiereMuenzen,
  },
};

export const istArt = (art) => Object.hasOwn(ARTEN, art);

/** Was liegt in dieser Kampagne? Für die Frage „was nehme ich mit?“. */
export function umfang(campaignId) {
  const zahlen = {};
  for (const [art, eintrag] of Object.entries(ARTEN)) zahlen[art] = eintrag.alle(campaignId).length;
  const muenzen = getState('beute', campaignId, null);
  return { ...zahlen, muenzen: muenzen ? { ...KEINE_MUENZEN, ...muenzen } : null };
}

/* --- Alles auf einmal ---------------------------------------------------- */

/**
 * Ein Block, der ganz oder gar nicht geschrieben wird.
 *
 * Eine halb kopierte Kampagne – Charaktere da, Szenen nicht – wäre schwerer
 * zu beheben als ein klarer Fehlschlag. Beide Datenbanktreiber verstehen
 * BEGIN und COMMIT; eine eigene Transaktions-API haben sie nicht gemeinsam.
 */
function imBlock(arbeit) {
  db.exec('BEGIN');
  try {
    const ergebnis = arbeit();
    db.exec('COMMIT');
    return ergebnis;
  } catch (fehler) {
    db.exec('ROLLBACK');
    throw fehler;
  }
}

/**
 * Alles Gewählte aus einer Kampagne in eine andere.
 *
 * Die Reihenfolge gibt ARTEN vor, nicht der Aufrufer – sie ist keine
 * Geschmacksfrage, sondern hält die Verweise heil.
 */
export function uebernimmAlles(von, ziel, arten) {
  const gewaehlt = Object.keys(ARTEN).filter((art) => arten.includes(art));
  return imBlock(() => {
    const bericht = {};
    for (const art of gewaehlt) {
      const eintrag = ARTEN[art];
      const stuecke = eintrag.alle(von);
      for (const row of stuecke) eintrag.kopiere(row, ziel);
      bericht[art] = stuecke.length;
      if (eintrag.dazu) bericht.muenzen = eintrag.dazu(von, ziel);
    }
    return bericht;
  });
}

/* --- Die Zielkampagne soll es sofort sehen ------------------------------- */

/**
 * Wer drüben gerade ein Fenster offen hat, soll nicht erst neu laden müssen.
 *
 * Szenen fehlen hier mit Absicht: Was auf dem Tisch liegt, hängt an der
 * Sicht des Einzelnen und wird von routes/scenes.js verschickt.
 */
export function meldeNachZiel(art, ziel) {
  if (art === 'notizen') broadcast('notizen:aktualisiert', {}, { campaignId: ziel });
  if (art === 'beute') {
    broadcast(
      'beute',
      {
        items: db
          .prepare('SELECT * FROM stash_items WHERE campaign_id = ? ORDER BY created_at')
          .all(ziel)
          .map((row) => ({
            id: row.id,
            name: row.name,
            qty: row.qty,
            weight: row.weight,
            notes: row.notes,
            holderId: row.holder_id,
            createdAt: row.created_at,
          })),
        coins: { ...KEINE_MUENZEN, ...(getState('beute', ziel, null) ?? {}) },
      },
      { campaignId: ziel }
    );
  }
}
