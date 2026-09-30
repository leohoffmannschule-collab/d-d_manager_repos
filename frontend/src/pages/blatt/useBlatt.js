/**
 * Das Blatt laden, halten und von selbst speichern – der Zustand hinter der
 * Seite des Charakterblattes (CharacterSheet.jsx).
 *
 * Zwei Dinge lohnen besondere Aufmerksamkeit, weil sie leicht zu übersehen
 * und schwer zu finden sind, wenn sie fehlen:
 *
 *   1. *Gespeichert wird von selbst*, 600 ms nach dem letzten Tastendruck
 *      (siehe `persist`). Es gibt keinen Speichern-Knopf und soll keinen
 *      geben – niemand soll mitten im Kampf ans Sichern denken müssen.
 *   2. *Von außen kommt auch etwas herein*: Teilt die Spielleitung Schaden
 *      aus, wandern die Trefferpunkte über den Live-Draht aufs Blatt. Damit
 *      beides sich nicht in die Quere kommt, gibt es `offeneAenderung`.
 *
 * Eigene Datei, weil genau diese Abstimmung – Zeitgeber, Zähler, die
 * Sperre für den Live-Draht – das Heikelste an der ganzen Seite ist. Hier
 * steht sie allein und lässt sich lesen, ohne dass einem das Aussehen des
 * Blattes dazwischenkommt.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { charactersApi } from '../../lib/api.js';
import { setPath } from '../../lib/setPath.js';
import { withDefaults } from '../../lib/dnd5e.js';
import { useLive } from '../../lib/live.jsx';

/**
 * @param {string} id  die Kennung des Blattes aus der Adresse
 * @returns {{
 *   character: object|null,
 *   error: string,
 *   setError: (text: string) => void,
 *   saveStatus: 'idle'|'pending'|'saving'|'saved'|'error',
 *   updateName: (name: string) => void,
 *   updateData: (pfad: string, wert: unknown) => void,
 *   replaceData: (data: object) => void,
 * }}
 */
export function useBlatt(id) {
  const [character, setCharacter] = useState(null);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  // Der laufende Zeitgeber fürs verzögerte Speichern. Als useRef, weil sein
  // Wechsel kein Neuzeichnen auslösen soll und er in Rückrufen gebraucht wird.
  const saveTimer = useRef(null);
  // Solange hier noch ungesicherte Änderungen liegen, darf nichts von außen
  // hereinschreiben – sonst überholt die Spielleitung den eigenen Federstrich.
  const offeneAenderung = useRef(false);
  // Zählt jede Speicheranfrage. Nur die jüngste – und nur, wenn nicht schon
  // die nächste wartet – darf `offeneAenderung` wieder freigeben: Sonst gäbe
  // eine langsame ältere Anfrage bei ihrer Rückkehr den Live-Draht frei,
  // während die nächste Änderung noch ungesichert hier liegt.
  const speicherStand = useRef(0);
  // Steht auf true, wenn die nächste Änderung am Blatt von *hier* kam und
  // gespeichert werden muss – im Gegensatz zu einer, die über den
  // Live-Draht hereinkam und schon gespeichert ist.
  const zuSpeichern = useRef(false);

  useEffect(() => {
    setCharacter(null);
    charactersApi
      .get(id)
      // Blätter aus früheren Fassungen kennen die neuen Felder noch nicht.
      .then((geladen) =>
        setCharacter(geladen.system === 'dnd5e' ? { ...geladen, data: withDefaults(geladen.data) } : geladen)
      )
      .catch((err) => setError(err.message));
  }, [id]);

  // Teilt die Spielleitung im Kampf Schaden aus, wandern die Trefferpunkte
  // von selbst aufs Blatt.
  useLive('charakter:aktualisiert', (nachricht) => {
    if (nachricht.id !== id || offeneAenderung.current || !nachricht.hp) return;
    setCharacter((prev) =>
      prev ? { ...prev, data: setPath(prev.data, 'combat.hp', { ...prev.data?.combat?.hp, ...nachricht.hp }) } : prev
    );
  });

  /**
   * Speichern mit Verzögerung („debounce“).
   *
   * Jeder Tastendruck ruft das hier auf. Statt jedes Mal zu schicken, wird
   * der vorige Zeitgeber verworfen und ein neuer gesetzt: Erst wenn 600 ms
   * lang nichts mehr passiert, geht *eine* Anfrage hinaus. Ohne das würde
   * ein getippter Name zehn Anfragen auslösen.
   *
   * `offeneAenderung` steht währenddessen auf true und hält den Live-Draht
   * davon ab, dazwischenzufunken.
   */
  const persist = useCallback(
    (next) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      offeneAenderung.current = true;
      setSaveStatus('pending');
      saveTimer.current = setTimeout(async () => {
        saveTimer.current = null;
        const dieser = ++speicherStand.current;
        setSaveStatus('saving');
        try {
          await charactersApi.update(id, { name: next.name, data: next.data });
          if (dieser === speicherStand.current) setSaveStatus('saved');
        } catch (err) {
          setSaveStatus('error');
          setError(err.message);
        } finally {
          if (dieser === speicherStand.current && !saveTimer.current) offeneAenderung.current = false;
        }
      }, 600);
    },
    [id]
  );

  /**
   * Das Blatt örtlich ändern und zum Speichern vormerken.
   *
   * Gespeichert wird *nicht* im Rückruf von setCharacter: Der soll rein
   * sein, und React ruft ihn im Entwicklungsmodus absichtlich doppelt auf.
   * Stattdessen merkt sich `zuSpeichern`, dass die nächste Änderung von hier
   * kam, und der Effekt darunter speichert, sobald sie gerendert ist.
   */
  function aendern(bauen) {
    zuSpeichern.current = true;
    offeneAenderung.current = true;
    setCharacter(bauen);
  }

  useEffect(() => {
    if (!zuSpeichern.current || !character) return;
    zuSpeichern.current = false;
    persist(character);
  }, [character, persist]);

  const updateName = (name) => aendern((prev) => ({ ...prev, name }));

  /** Ein einzelnes Feld: `updateData('combat.hp.current', 5)`. */
  const updateData = (path, value) => aendern((prev) => ({ ...prev, data: setPath(prev.data, path, value) }));

  // Für Vorgänge, die viele Felder auf einmal betreffen – etwa eine Rast.
  const replaceData = (data) => aendern((prev) => ({ ...prev, data }));

  return { character, error, setError, saveStatus, updateName, updateData, replaceData };
}
