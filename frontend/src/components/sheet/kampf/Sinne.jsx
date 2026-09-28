/**
 * Widerstand und Sinne – und damit die Werte, an denen am Spieltisch der
 * Nebel hängt.
 *
 * *Sichtweite* ist, wie weit der Blick bei Licht reicht; 0 heißt
 * unbegrenzt, denn bei Tageslicht sieht man bis zum Horizont. Die vier
 * darunter – Dunkelsicht, Blindsicht, Erschütterung, Wahrer Blick – zählen
 * erst, wenn die Szene dunkel ist.
 *
 * Eingetragen wird in der Einheit des Blattes; `WeiteField` rechnet
 * zwischen Fuß und Metern um, gespeichert wird immer in Fuß.
 */
import { Card, TextAreaField, TextField, WeiteField } from '../../ui.jsx';

export default function Sinne({ data, update }) {
  return (
  <Card title="Widerstand und Sinne">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <TextAreaField
        label="Resistenzen"
        rows={2}
        value={data.combat.defenses.resistances}
        onChange={(v) => update('combat.defenses.resistances', v)}
      />
      <TextAreaField
        label="Immunitäten"
        rows={2}
        value={data.combat.defenses.immunities}
        onChange={(v) => update('combat.defenses.immunities', v)}
      />
      <TextAreaField
        label="Verwundbarkeiten"
        rows={2}
        value={data.combat.defenses.vulnerabilities}
        onChange={(v) => update('combat.defenses.vulnerabilities', v)}
      />
    </div>
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <WeiteField
        label="Sichtweite"
        fuss={data.combat.senses.sight ?? 0}
        units={data.units}
        step={data.units === 'imperial' ? 5 : 1}
        onChange={(v) => update('combat.senses.sight', v)}
      />
      <p className="text-[15px] text-sepia italic sm:col-span-2 sm:self-end sm:pb-2">
        Wie weit dein Blick bei Licht reicht. <span className="font-display">0 heißt unbegrenzt</span> –
        bei Tageslicht sieht man bis zum Horizont. Trägst du etwas ein, bekommst du am Spieltisch ein
        Nebelfenster, das an deiner Figur hängt und sich nur bewegt, wenn sie sich bewegt.
      </p>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[
        ['Dunkelsicht', 'darkvision'],
        ['Blindsicht', 'blindsight'],
        ['Erschütterung', 'tremorsense'],
        ['Wahrer Blick', 'truesight'],
      ].map(([label, feld]) => (
        <WeiteField
          key={feld}
          label={label}
          fuss={data.combat.senses[feld] ?? 0}
          units={data.units}
          step={data.units === 'imperial' ? 5 : 1}
          onChange={(v) => update(`combat.senses.${feld}`, v)}
        />
      ))}
    </div>
    <p className="mt-2 text-[15px] text-sepia italic">
      Diese vier zählen erst, wenn die Szene <span className="font-display">dunkel</span> ist: Dann nimmst
      du so weit wahr, wie hier steht, auch ohne jedes Licht. Im Dunkeln reicht dein Blick so weit, wie
      deine Sichtweite <span className="font-display">oder deine eigene Fackel</span> trägt – was von
      beidem weiter ist. Dafür zündet man sie schließlich an.
    </p>
    <div className="mt-4">
      <TextField
        label="Weitere Sinne"
        value={data.combat.senses.notes}
        onChange={(v) => update('combat.senses.notes', v)}
        placeholder="Sinnesschärfe, besondere Wahrnehmung …"
      />
    </div>
  </Card>
  );
}
