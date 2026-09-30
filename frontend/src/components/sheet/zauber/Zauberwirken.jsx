/**
 * Die Karte „Zauberwirken“: Zauberattribut, Zauber-SG und Angriffsbonus.
 *
 * SG und Bonus rechnet `zauberwerte()` (lib/regeln/rechnen.js) – dieselbe
 * Funktion, die auch die Blattausfuhr benutzt. Beide lassen sich hier von
 * Hand überschreiben: für den Stab des Zauberers, einen Pakt, eine
 * Hausregel. Das Feld zeigt dann den eigenen Wert und darunter, was die
 * Regeln ergäben; „gerechnet“ nimmt den eigenen Wert wieder zurück.
 *
 * Ein leeres Feld heißt „rechnen“ (gespeichert als null) – nicht 0. Ein SG
 * von 0 wäre eine Zahl, die jemand absichtlich eingetragen hätte.
 */
import { ABILITIES, formatModifier } from '../../../lib/dnd5e.js';
import { Card, FieldLabel } from '../../ui.jsx';

/** Aus dem Eingabefeld: leer → null (rechnen), sonst eine ganze Zahl. */
const alsWert = (text) => (text.trim() === '' || !Number.isFinite(Number(text)) ? null : Math.trunc(Number(text)));

/** Ein Wert mit Eingabefeld für den eigenen und dem gerechneten darunter. */
function Wert({ titel, vonHand, berechnet, anzeigen, onVonHand }) {
  return (
    <label className="block border border-rule px-4 py-2">
      <FieldLabel>{titel}</FieldLabel>
      <input
        type="number"
        inputMode="numeric"
        value={vonHand ?? ''}
        placeholder={anzeigen(berechnet)}
        onChange={(e) => onVonHand(alsWert(e.target.value))}
        className="w-full bg-transparent font-display text-2xl font-bold text-rubric placeholder:text-rubric"
        aria-label={`${titel} von Hand`}
      />
      <span className="flex items-center justify-between gap-2 text-[13px] text-faint">
        {vonHand == null ? (
          'gerechnet'
        ) : (
          <>
            <span>gerechnet wäre {anzeigen(berechnet)}</span>
            <button type="button" onClick={() => onVonHand(null)} className="min-h-9 text-sepia hover:text-ink">
              zurück
            </button>
          </>
        )}
      </span>
    </label>
  );
}

export default function Zauberwirken({ ability, werte, onAbility, onVonHand }) {
  return (
    <Card title="Zauberwirken">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="block">
          <FieldLabel>Zauberattribut</FieldLabel>
          <select
            value={ability}
            onChange={(e) => onAbility(e.target.value)}
            className="field-box"
          >
            {ABILITIES.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <Wert
          titel="Zauber-SG"
          vonHand={werte.sgVonHand}
          berechnet={werte.berechneterSg}
          anzeigen={String}
          onVonHand={(wert) => onVonHand('manualSaveDC', wert)}
        />
        <Wert
          titel="Angriffsbonus"
          vonHand={werte.bonusVonHand}
          berechnet={werte.berechneterBonus}
          anzeigen={formatModifier}
          onVonHand={(wert) => onVonHand('manualAttackBonus', wert)}
        />
      </div>
    </Card>
  );
}
