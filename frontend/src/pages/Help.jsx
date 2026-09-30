/**
 * Die Hilfeseite – das Handbuch im Almanach selbst.
 *
 * Reiner Text, keine Logik: Sie holt nichts vom Server und rechnet nichts
 * aus. Die einzige Verzweigung ist `isDm` – die Spielleitung bekommt
 * zusätzliche Abschnitte, die für die Runde nur verwirrend wären.
 *
 * Für Mitarbeitende am Code: Wer ein Werkzeug ändert oder hinzufügt, ändert
 * es bitte auch hier. Eine Hilfe, die etwas anderes behauptet als die
 * Oberfläche, ist schlimmer als gar keine. Dasselbe gilt für docs/ –
 * SPIELLEITUNG.md und SPIELER.md sind die ausführlichen Fassungen davon.
 *
 * Die Abschnitte liegen in hilfe/, einer je Thema, in der Reihenfolge, in
 * der sie auf der Seite stehen.
 */
import { useAuth } from '../lib/auth.jsx';
import Blatt from './hilfe/Blatt.jsx';
import Geraet from './hilfe/Geraet.jsx';
import Gespraech from './hilfe/Gespraech.jsx';
import Grundlagen from './hilfe/Grundlagen.jsx';
import Musik from './hilfe/Musik.jsx';
import Quellen from './hilfe/Quellen.jsx';
import Spielleitung from './hilfe/Spielleitung.jsx';
import Spieltisch from './hilfe/Spieltisch.jsx';

export default function Help() {
  const { isDm } = useAuth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">Hilfe</h1>
        <p className="mt-1 text-sepia italic">Kurze Anleitung für den Gebrauch am Spieltisch</p>
      </div>
      <Grundlagen isDm={isDm} />
      <Spieltisch />
      {isDm && <Spielleitung />}
      <Musik />
      <Blatt />
      <Gespraech />
      <Geraet />
      <Quellen />
    </div>
  );
}
