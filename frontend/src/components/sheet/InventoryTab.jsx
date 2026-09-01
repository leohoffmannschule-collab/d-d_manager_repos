import { Card, NumberField } from '../ui.jsx';
import RepeatingRows from '../RepeatingRows.jsx';

const ITEM_FIELDS = [
  { key: 'name', label: 'Gegenstand', wide: true },
  { key: 'qty', label: 'Anzahl', type: 'number' },
  { key: 'weight', label: 'Gewicht' },
  { key: 'notes', label: 'Notizen', wide: true },
];

const CURRENCIES = [
  { key: 'cp', label: 'KP' },
  { key: 'sp', label: 'SP' },
  { key: 'ep', label: 'EP' },
  { key: 'gp', label: 'GP' },
  { key: 'pp', label: 'PP' },
];

export default function InventoryTab({ data, update }) {
  const totalWeight = data.inventory.reduce((sum, item) => sum + (Number(item.weight) || 0) * (Number(item.qty) || 1), 0);

  return (
    <div className="space-y-4">
      <Card title="Vermögen">
        <div className="grid grid-cols-5 gap-2">
          {CURRENCIES.map((c) => (
            <NumberField key={c.key} label={c.label} min={0} value={data.currency[c.key]} onChange={(v) => update(`currency.${c.key}`, v)} />
          ))}
        </div>
      </Card>

      <Card title="Ausrüstung">
        <RepeatingRows
          items={data.inventory}
          onChange={(rows) => update('inventory', rows)}
          fields={ITEM_FIELDS}
          addLabel="+ Gegenstand hinzufügen"
          emptyText="Rucksack ist leer."
        />
        {data.inventory.length > 0 && (
          <p className="mt-3 text-xs text-parchment-100/50">Geschätztes Gesamtgewicht: {totalWeight} lb.</p>
        )}
      </Card>
    </div>
  );
}
