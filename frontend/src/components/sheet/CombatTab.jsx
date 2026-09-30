/**
 * Reiter 2 des Charakterblattes: alles, was im Kampf gebraucht wird.
 *
 * Der am meisten benutzte Reiter des Almanachs – und der einzige, der auch
 * *schreibend* mit dem Rest des Tisches zu tun hat: Trefferpunkte, die hier
 * fallen, stehen sofort in der Kampfliste der Spielleitung, und Schaden von
 * dort steht sofort hier (siehe pages/blatt/useBlatt.js, useLive).
 *
 * Diese Datei stellt nur noch die Karten untereinander. Jede steht für sich
 * in `kampf/` und bringt mit, was sie selbst braucht:
 *
 *   kampf/Kampfwerte.jsx        Rüstung, Initiative, Bewegung
 *   kampf/Trefferpunkte.jsx     TP, Trefferwürfel, Rettungswürfe gegen den Tod
 *   kampf/Rasten.jsx            kurze und lange Rast
 *   kampf/Zustand.jsx           Zustände, Erschöpfung, Konzentration
 *   kampf/Sinne.jsx             Widerstände, Sichtweite, Dunkelsicht
 *   kampf/Ressourcen.jsx        selbstverwaltete Zähler
 *   kampf/Standardaktionen.jsx  was jede Figur ohne Eintrag kann
 *   kampf/Angriffe.jsx          Angriffe und Zaubertricks samt Würfelknöpfen
 *
 *   kampf/felder.js             die Spalten der wiederkehrenden Zeilen
 *   kampf/Todeszeichen.jsx      die drei Kreise für Erfolg und Fehlschlag
 *   kampf/Wurfknopf.jsx         ein Wert, der sich würfeln lässt
 *   kampf/Trefferwuerfel.jsx    der Vorrat für die kurze Rast
 *
 * Drei Handgriffe wandern durch alle Karten, und der Unterschied zwischen
 * ihnen ist wichtig:
 *
 *   `data`    das Blatt, wie es gerade dasteht.
 *   `update`  ein einzelnes Feld ändern, über seinen Pfad
 *             (`update('combat.hp.current', 7)`).
 *   `replace` das ganze Blatt auf einmal ersetzen. Braucht, wer mehrere
 *             Felder in einem Zug ändert – eine Rast oder eine gewürfelte
 *             20 beim Rettungswurf gegen den Tod.
 */
import { Card } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';
import { AKTION_FIELDS } from './kampf/felder.js';
import Kampfwerte from './kampf/Kampfwerte.jsx';
import Trefferpunkte from './kampf/Trefferpunkte.jsx';
import Rasten from './kampf/Rasten.jsx';
import Zustand from './kampf/Zustand.jsx';
import Sinne from './kampf/Sinne.jsx';
import Ressourcen from './kampf/Ressourcen.jsx';
import Standardaktionen from './kampf/Standardaktionen.jsx';
import Angriffe from './kampf/Angriffe.jsx';

export default function CombatTab({ data, update, replace }) {
  return (
    <div className="flex flex-col gap-4">
      <Kampfwerte data={data} update={update} />
      <Trefferpunkte data={data} update={update} replace={replace} />
      <Rasten data={data} replace={replace} />
      <Zustand data={data} update={update} />
      <Sinne data={data} update={update} />

      <Card title="Klassenressourcen">
        <Ressourcen data={data} update={update} />
      </Card>

      <Card title="Aktionen">
        <Standardaktionen />
        <div className="mt-5 border-t border-dashed border-rule pt-4">
          <p className="mb-3 font-display text-[12px] tracking-[0.14em] text-rubric uppercase">Was du außerdem kannst</p>
          <RepeatingRows
            items={data.actions}
            onChange={(rows) => update('actions', rows)}
            fields={AKTION_FIELDS}
            addLabel="Aktion hinzufügen"
            emptyText="Handauflegen, Zweiter Wind, Wildgestalt – was eine Aktion kostet, steht hier."
          />
        </div>
      </Card>

      <Angriffe data={data} update={update} />
    </div>
  );
}
