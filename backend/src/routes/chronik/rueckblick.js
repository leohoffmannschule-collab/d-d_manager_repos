/**
 * Der Rückblick: ein Sprachmodell erzählt eine Sitzung nach – freiwillig.
 *
 * Die einzige Stelle im ganzen Almanach, an der etwas nach außen geht. Ohne
 * `CHRONIK_KI_URL` in der Umgebung antwortet der Weg nur, dass nichts
 * eingerichtet ist.
 */
import { Router } from 'express';
import { db } from '../../db.js';
import { requireDm } from '../../auth.js';
import { broadcast } from '../../events.js';
import { eintraege, sitzungHolen } from './abfragen.js';
import { protokoll } from './protokoll.js';

const router = Router();

/**
 * Der Almanach kommt ohne KI aus – das Protokoll oben entsteht allein aus dem,
 * was am Tisch geschehen ist. Wer möchte, kann zusätzlich ein Sprachmodell
 * daraus einen Fließtext machen lassen. Das ist bewusst nichts, was
 * voreingestellt ist: Es kostet entweder Rechenzeit auf dem Pi oder Geld und
 * schickt das Protokoll aus dem Haus.
 *
 * Eingestellt wird es über drei Umgebungsvariablen; die Schnittstelle ist die
 * von OpenAI, die auch llama.cpp und Ollama örtlich anbieten.
 *
 * Das Sprachmodell bekommt nur, was die Runde ohnehin sehen darf – keine
 * verdeckten Einträge. Der Rückblick steht hinterher bei *allen* in der
 * Chronik; ein verborgener Gegner oder ein verdeckter Wurf im Protokoll
 * stünde sonst, schön ausformuliert, im Text für die ganze Runde.
 */
const KI_URL = process.env.CHRONIK_KI_URL || '';
const KI_MODELL = process.env.CHRONIK_KI_MODELL || 'gpt-4o-mini';
const KI_SCHLUESSEL = process.env.CHRONIK_KI_SCHLUESSEL || '';
// Ein Sprachmodell auf dem Pi braucht gern eine Minute; länger heißt: hängt.
// Ohne Frist bliebe die Anfrage der Spielleitung sonst ewig offen.
const KI_FRIST_MS = 3 * 60 * 1000;

// GET /api/chronicle/ki – ist ein Sprachmodell eingestellt? Die Oberfläche
// zeigt den Knopf „Rückblick schreiben lassen“ nur, wenn ja.
router.get('/ki', (req, res) => {
  res.json({ verfuegbar: !!KI_URL, modell: KI_URL ? KI_MODELL : null });
});

// POST /api/chronicle/sessions/:id/rueckblick – das Sprachmodell einen
// Rückblick auf die Sitzung schreiben lassen und ihn an der Sitzung speichern.
// Geschickt wird nur, was die Runde sehen darf (siehe oben), und nur auf
// Anfrage der Spielleitung – nie von selbst.
router.post('/sessions/:id/rueckblick', requireDm, async (req, res) => {
  if (!KI_URL) {
    return res.status(501).json({
      code: 'ki_nicht_eingerichtet',
      error:
'Es ist kein Sprachmodell eingestellt. Setze CHRONIK_KI_URL (und bei Bedarf CHRONIK_KI_MODELL und ' +
        'CHRONIK_KI_SCHLUESSEL), um den Rückblick schreiben zu lassen. Das Protokoll selbst gibt es auch ohne.',
    });
  }

  const row = sitzungHolen(req.params.id, req.campaignId);
  if (!row) return res.status(404).json({ code: 'sitzung_nicht_gefunden', error: 'Sitzung nicht gefunden.' });

  // Die Sicht der Runde, nicht die der Spielleitung – siehe oben.
  const liste = eintraege(row.id, { role: 'spieler' });
  if (liste.length === 0) return res.status(400).json({ code: 'sitzung_leer', error: 'In dieser Sitzung steht noch nichts.' });

  // Ohne den alten Rückblick: Das Modell soll aus dem Abend erzählen, nicht
  // aus seiner eigenen früheren Fassung.
  const roh = protokoll({ ...row, summary: '' }, liste);

  try {
    const antwort = await fetch(KI_URL, {
      signal: AbortSignal.timeout(KI_FRIST_MS),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(KI_SCHLUESSEL ? { Authorization: `Bearer ${KI_SCHLUESSEL}` } : {}),
      },
      body: JSON.stringify({
        model: KI_MODELL,
        messages: [
          {
            role: 'system',
            content:
              'Du bist der Chronist einer Pen-&-Paper-Runde. Aus dem folgenden Protokoll machst du einen ' +
              'zusammenhängenden Rückblick auf Deutsch, wie die Nacherzählung einer Folge: höchstens sechs ' +
              'Absätze, im Präteritum, ohne Aufzählungszeichen, ohne Würfelergebnisse einzeln zu nennen. ' +
              'Erfinde nichts hinzu, was nicht im Protokoll steht.',
          },
          { role: 'user', content: roh },
        ],
        temperature: 0.7,
      }),
    });

    if (!antwort.ok) {
      const text = await antwort.text();
      return res.status(502).json({ code: 'ki_fehler', error: `Das Sprachmodell antwortete mit ${antwort.status}: ${text.slice(0, 200)}` });
    }

    const daten = await antwort.json();
    const rueckblick = daten?.choices?.[0]?.message?.content?.trim();
    if (!rueckblick) return res.status(502).json({ code: 'ki_leer', error: 'Das Sprachmodell hat nichts geschrieben.' });

    db.prepare('UPDATE game_sessions SET summary = ? WHERE id = ?').run(rueckblick, row.id);
    broadcast('chronik:geaendert', {}, { campaignId: req.campaignId });
    res.json({ summary: rueckblick });
  } catch (err) {
    res.status(502).json({ code: 'ki_nicht_erreichbar', error: `Das Sprachmodell war nicht erreichbar: ${err.message}` });
  }
});

export default router;
