import { useState } from 'react';
import Initiative from '../components/Initiative.jsx';
import Bestiary from '../components/dm/Bestiary.jsx';
import Encounters from '../components/dm/Encounters.jsx';
import Kartenbibliothek from '../components/dm/Kartenbibliothek.jsx';
import Klangbibliothek from '../components/dm/Klangbibliothek.jsx';
import Notes from '../components/dm/Notes.jsx';
import Party from '../components/dm/Party.jsx';
import { IconBook, IconCrown, IconMap, IconNote, IconQuill, IconShield, IconSwords, IconUsers } from '../components/icons.jsx';

const REITER = [
  { id: 'kampf', label: 'Kampf', Icon: IconSwords },
  { id: 'bestiarium', label: 'Bestiarium', Icon: IconBook },
  { id: 'begegnungen', label: 'Begegnungen', Icon: IconShield },
  { id: 'karten', label: 'Karten', Icon: IconMap },
  { id: 'klang', label: 'Klang', Icon: IconNote },
  { id: 'notizen', label: 'Notizen', Icon: IconQuill },
  { id: 'runde', label: 'Runde', Icon: IconUsers },
];

/** Das Board der Spielleitung – alles, was die Runde nicht sehen soll. */
export default function DmBoard() {
  const [reiter, setReiter] = useState('kampf');

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-semibold tracking-[0.08em] text-ink uppercase sm:text-[27px]">
            <IconCrown size={26} className="text-gold" />
            Spielleitung
          </h1>
          <p className="mt-1 text-sepia italic">Hinter diesem Schirm sieht dir niemand zu.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-rule">
        {REITER.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setReiter(id)}
            className={`flex items-center gap-2 px-4 py-3 font-display text-[13px] tracking-[0.10em] uppercase ${
              reiter === id ? '-mb-px border-b-2 border-gold text-ink' : 'text-sepia hover:text-ink'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {reiter === 'kampf' && <Initiative variant="voll" />}
      {reiter === 'bestiarium' && <Bestiary />}
      {reiter === 'begegnungen' && <Encounters />}
      {reiter === 'karten' && <Kartenbibliothek />}
      {reiter === 'klang' && <Klangbibliothek />}
      {reiter === 'notizen' && <Notes />}
      {reiter === 'runde' && <Party />}
    </div>
  );
}
