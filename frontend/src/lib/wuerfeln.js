import { diceApi } from './api.js';
import { formatModifier } from './dnd5e.js';

/**
 * Ein Wurf direkt vom Charakterblatt. Er läuft über den Server und steht
 * damit sofort bei allen am Tisch – genau wie ein Wurf aus dem Würfelbeutel.
 */
export function blattWurf(label, modifier = 0, mode = 'normal') {
  const mod = Number(modifier) || 0;
  return diceApi.roll({
    expression: `1W20${mod ? formatModifier(mod) : ''}`,
    label,
    mode,
  });
}

/** Freier Ausdruck, z. B. Schadenswürfel einer Waffe. */
export function ausdruckWurf(label, expression) {
  return diceApi.roll({ expression, label });
}
