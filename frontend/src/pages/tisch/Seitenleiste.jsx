/**
 * Die Leiste rechts am Tisch: Kampf, Beute, Handzettel – und für die
 * Spielleitung die gewählte Figur.
 *
 * Auf schmalen Schirmen liegt sie nicht neben, sondern *statt* der Karte;
 * `offen` schaltet zwischen beiden um (der Knopf dafür sitzt auf der
 * Karte, siehe Tabletop.jsx).
 *
 * Welcher Reiter offen ist, hält die Seite: Wählt die Spielleitung auf der
 * Karte eine Figur, springt die Leiste von selbst auf „Figur“.
 */
import Initiative from '../../components/Initiative.jsx';
import Beute from '../../components/Beute.jsx';
import TokenPanel from '../../components/tabletop/TokenPanel.jsx';
import { IconHeart, IconPlus, IconScroll, IconSwords } from '../../components/icons.jsx';
import Handzettel from './Handzettel.jsx';

export default function Seitenleiste({
  offen: seite,
  reiter,
  onReiter: setReiter,
  isDm,
  scene,
  gewaehlteFigur,
  onFigurAuslegen,
  onFigurGeaendert,
  onFigurEntfernt,
}) {
  const reiterListe = [
    { id: 'kampf', label: 'Kampf', Icon: IconSwords },
    { id: 'beute', label: 'Beute', Icon: IconHeart },
    { id: 'handzettel', label: 'Handzettel', Icon: IconScroll },
    ...(isDm && scene ? [{ id: 'figur', label: 'Figur', Icon: IconPlus }] : []),
  ];
  return (
    <aside
      className={`w-full shrink-0 border-rule bg-panel lg:block lg:w-[22rem] lg:overflow-y-auto lg:border-l ${
        seite ? 'block' : 'hidden'
      }`}
    >
      <div className="flex border-b border-rule">
        {reiterListe.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setReiter(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 font-display text-[11px] tracking-[0.08em] uppercase ${
              reiter === id ? 'border-b-2 border-gold text-ink' : 'text-sepia'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div className="p-4">
        {reiter === 'kampf' && <Initiative variant="tafel" />}
        {reiter === 'beute' && <Beute />}
        {reiter === 'handzettel' && <Handzettel />}
        {reiter === 'figur' && isDm && scene && (
          <>
            <button
              onClick={onFigurAuslegen}
              className="btn btn-seal mb-4 w-full"
            >
              <IconPlus size={16} /> Figur auslegen
            </button>
            <TokenPanel
              token={gewaehlteFigur}
              onChanged={onFigurGeaendert}
              onRemoved={onFigurEntfernt}
            />
          </>
        )}
      </div>
    </aside>
  );
}
