/** Ein Knopf, der einen Wurf für alle sichtbar auf den Tisch legt. */
import { blattWurf } from '../../../lib/wuerfeln.js';
import { IconD20 } from '../../icons.jsx';

export default function Wurfknopf({ label, modifier, name }) {
  return (
    <button
      type="button"
      onClick={() => blattWurf(name, modifier)}
      title={`${name} würfeln`}
      className="flex min-h-9 items-center gap-1 border border-transparent px-1.5 font-display font-semibold text-rubric hover:border-gold"
    >
      <IconD20 size={13} className="text-faint" />
      {label}
    </button>
  );
}
