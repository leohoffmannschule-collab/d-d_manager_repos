/**
 * Das Charakterblatt – die Seite, an der die Runde am meisten sitzt.
 *
 * Sie hält das Blatt als *einen* Zustand (`character`) und reicht ihn an
 * fünf Reiter weiter, die jeweils einen Ausschnitt anzeigen. Geändert wird
 * nie direkt: Die Reiter rufen `updateData('combat.hp.current', 5)` auf,
 * und daraus entsteht ein neues Blatt (siehe lib/setPath.js).
 *
 * Laden, Speichern und der Live-Draht stecken in blatt/useBlatt.js – dort
 * steht auch, warum es keinen Speichern-Knopf gibt. Diese Seite kümmert
 * sich um die Handgriffe drumherum (Bildnis, Mitnehmen, Löschen) und
 * darum, welcher Reiter offen ist.
 *
 *   blatt/Blattkopf.jsx      – Bildnis, Name, Speicherstand, Knöpfe
 *   blatt/Speicherstand.jsx  – „Tinte trocknet …“
 *   blatt/reiter.js          – die fünf Reiter des 5e-Blattes
 */
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { charactersApi } from '../lib/api.js';
import { fileToResizedDataUrl } from '../lib/setPath.js';
import { ladeBlattHerunter } from '../lib/blattAusfuhr.js';
import FreeformSheet from '../components/sheet/FreeformSheet.jsx';
import Blattkopf from './blatt/Blattkopf.jsx';
import { DND_TABS } from './blatt/reiter.js';
import { useBlatt } from './blatt/useBlatt.js';

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { character, error, setError, saveStatus, updateName, updateData, replaceData } = useBlatt(id);
  const [tab, setTab] = useState('overview');
  const [mitnehmen, setMitnehmen] = useState('bereit');

  /**
   * Das Bildnis. Es landet als `data:`-URL *im Blatt selbst*, nicht als
   * Datei daneben – deshalb wird es vorher kräftig verkleinert
   * (siehe lib/setPath.js, fileToResizedDataUrl).
   */
  async function handlePortrait(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      updateData('portrait', await fileToResizedDataUrl(file));
    } catch {
      // Ein Bild, das der Browser nicht lesen kann (HEIC vom iPhone etwa),
      // soll nicht stumm verpuffen.
      setError('Dieses Bild ließ sich nicht lesen. Am sichersten sind JPEG und PNG.');
    }
  }

  // Das Blatt als eigenständige Datei mitnehmen – für die Vorbereitung,
  // wenn der Almanach gerade nicht läuft.
  async function handleMitnehmen() {
    setMitnehmen('laeuft');
    try {
      await ladeBlattHerunter(character);
      setMitnehmen('fertig');
      setTimeout(() => setMitnehmen('bereit'), 2500);
    } catch (err) {
      setError(err.message);
      setMitnehmen('bereit');
    }
  }

  async function handleDelete() {
    if (!confirm(`„${character.name}“ wirklich unwiderruflich aus dem Almanach tilgen?`)) return;
    try {
      await charactersApi.remove(id);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="panel border-rubric p-4 text-rubric">{error}</p>;
  if (!character) return <p className="text-sepia italic">Das Blatt wird aufgeschlagen …</p>;

  const isDnd = character.system === 'dnd5e';
  const hp = character.data?.combat?.hp;
  // Fremde Blätter liegen offen auf dem Tisch, aber schreiben darf nur, wem
  // sie gehören (und die Spielleitung).
  const schreibbar = character.editable !== false;

  return (
    <div>
      <Blattkopf
        character={character}
        isDnd={isDnd}
        hp={hp}
        schreibbar={schreibbar}
        saveStatus={saveStatus}
        mitnehmen={mitnehmen}
        onName={updateName}
        onPortrait={handlePortrait}
        onMitnehmen={handleMitnehmen}
        onLoeschen={handleDelete}
      />

      {isDnd ? (
        <>
          <div className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-rule-strong px-4">
            {DND_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 border px-4 py-3 font-display text-[14px] tracking-[0.08em] ${
                  tab === t.key
                    ? '-mb-px border-rule-strong border-b-panel bg-panel text-rubric'
                    : 'border-transparent text-sepia'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <fieldset disabled={!schreibbar} className="min-w-0 border-0 p-0">
            {DND_TABS.map(
              (t) =>
                tab === t.key && (
                  <t.Component key={t.key} data={character.data} update={updateData} replace={replaceData} />
                )
            )}
          </fieldset>
        </>
      ) : (
        <fieldset disabled={!schreibbar} className="min-w-0 border-0 p-0">
          <FreeformSheet data={character.data} update={updateData} />
        </fieldset>
      )}
    </div>
  );
}

