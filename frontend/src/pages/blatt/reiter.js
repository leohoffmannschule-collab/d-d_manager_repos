/**
 * Die Reiter des 5e-Blattes, in der Reihenfolge, in der sie oben stehen.
 *
 * Ein Blatt mit `system !== 'dnd5e'` bekommt stattdessen das freie Blatt
 * (FreeformSheet) – ein leeres Textfeld für alles, was nicht D&D ist.
 *
 * Jeder Reiter bekommt dasselbe: `data` (das ganze Blatt), `update(pfad,
 * wert)` für ein einzelnes Feld und `replace(data)` für Vorgänge, die viele
 * Felder auf einmal ändern (etwa eine Rast).
 */
import OverviewTab from '../../components/sheet/OverviewTab.jsx';
import CombatTab from '../../components/sheet/CombatTab.jsx';
import InventoryTab from '../../components/sheet/InventoryTab.jsx';
import SpellsTab from '../../components/sheet/SpellsTab.jsx';
import BackgroundTab from '../../components/sheet/BackgroundTab.jsx';

export const DND_TABS = [
  { key: 'overview', label: 'Übersicht', Component: OverviewTab },
  { key: 'combat', label: 'Kampf', Component: CombatTab },
  { key: 'inventory', label: 'Inventar', Component: InventoryTab },
  { key: 'spells', label: 'Zauber', Component: SpellsTab },
  { key: 'background', label: 'Hintergrund', Component: BackgroundTab },
];
