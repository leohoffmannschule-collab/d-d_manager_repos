import {
  getragenesGewicht,
  gewichtAnzeigen,
  gewichtEinheit,
  gewichtNachPfund,
  traglastStufen,
} from '../../lib/dnd5e.js';
import { Card, NumberField, TextField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const CURRENCIES = [
  { key: 'pp', label: 'Platin' },
  { key: 'gp', label: 'Gold' },
  { key: 'ep', label: 'Elektrum' },
  { key: 'sp', label: 'Silber' },
  { key: 'cp', label: 'Kupfer' },
];

/** Was der Rucksack fasst, hängt an der Stärke – und am gewählten Maß. */
function Traglast({ data }) {
  const einheit = gewichtEinheit(data.units);
  const getragen = getragenesGewicht(data.inventory);
  const { ueberladen, schieben } = traglastStufen(data.abilities.str);
  const zuViel = getragen > ueberladen;

  const marken = [
    ['Getragenes Gewicht', getragen, zuViel],
    ['Überladen ab', ueberladen, false],
    ['Schieben / Ziehen / Heben', schieben, false],
  ];

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {marken.map(([label, pfund, warnung]) => (
          <div key={label} className="border border-rule bg-panel-soft/60 px-3 py-2 text-center">
            <p className="font-display text-[10px] leading-tight tracking-[0.12em] text-faint uppercase">{label}</p>
            <p className={`font-display text-2xl font-bold ${warnung ? 'text-rubric' : 'text-ink'}`}>
              {gewichtAnzeigen(pfund, data.units)}
              <span className="text-[14px] text-faint"> {einheit}</span>
            </p>
          </div>
        ))}
      </div>
      {zuViel && (
        <p className="mt-2 text-rubric italic">
          So viel trägt niemand mit sich herum – über dieser Marke kommst du nicht mehr vom Fleck.
        </p>
      )}
    </>
  );
}

export default function InventoryTab({ data, update }) {
  const itemFields = [
    { key: 'name', label: 'Gegenstand', wide: true },
    { key: 'qty', label: 'Anzahl', type: 'number' },
    {
      key: 'weight',
      label: `Gewicht (${gewichtEinheit(data.units)})`,
      type: 'number',
      format: (pfund) => gewichtAnzeigen(pfund, data.units),
      parse: (wert) => gewichtNachPfund(wert, data.units),
    },
    { key: 'notes', label: 'Anmerkungen', wide: true },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Card title="Beutel & Münzen">
        <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:grid-cols-5">
          {CURRENCIES.map((c) => (
            <NumberField
              key={c.key}
              label={c.label}
              min={0}
              value={data.currency[c.key]}
              onChange={(v) => update(`currency.${c.key}`, v)}
            />
          ))}
        </div>
      </Card>

      <Card title="Ausrüstung">
        <RepeatingRows
          items={data.inventory}
          onChange={(rows) => update('inventory', rows)}
          fields={itemFields}
          addLabel="Gegenstand hinzufügen"
          emptyText="Der Rucksack ist leer."
        />
        <div className="mt-4 border-t border-dashed border-rule pt-4">
          <Traglast data={data} />
        </div>
      </Card>

      <Card title="Angelegte magische Gegenstände">
        <p className="mb-3 text-sepia italic">Auf mehr als drei magische Gegenstände lässt sich niemand einstimmen.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((platz) => (
            <TextField
              key={platz}
              label={`Platz ${platz + 1}`}
              value={data.attunement?.[platz] ?? ''}
              onChange={(v) => {
                const naechste = [...(data.attunement ?? ['', '', ''])];
                naechste[platz] = v;
                update('attunement', naechste);
              }}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
