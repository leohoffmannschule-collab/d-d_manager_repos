import { Card, NumberField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const ITEM_FIELDS = [
  { key: 'name', label: 'Gegenstand', wide: true },
  { key: 'qty', label: 'Anzahl', type: 'number' },
  { key: 'weight', label: 'Gewicht' },
  { key: 'notes', label: 'Anmerkungen', wide: true },
];

const CURRENCIES = [
  { key: 'pp', label: 'Platin' },
  { key: 'gp', label: 'Gold' },
  { key: 'ep', label: 'Elektrum' },
  { key: 'sp', label: 'Silber' },
  { key: 'cp', label: 'Kupfer' },
];

export default function InventoryTab({ data, update }) {
  const totalWeight = data.inventory.reduce(
    (sum, item) => sum + (Number(item.weight) || 0) * (Number(item.qty) || 1),
    0
  );

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
          fields={ITEM_FIELDS}
          addLabel="Gegenstand hinzufügen"
          emptyText="Der Rucksack ist leer."
        />
        {data.inventory.length > 0 && (
          <p className="mt-4 border-t border-dashed border-rule pt-3 text-sepia italic">
            Getragenes Gewicht <span className="font-display font-semibold text-ink not-italic">{totalWeight}</span> Pfund
          </p>
        )}
      </Card>
    </div>
  );
}
