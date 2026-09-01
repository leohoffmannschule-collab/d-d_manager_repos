/**
 * Erzeugt eine eindeutige Kennung für Würfe, Gegenstände, Zauber usw.
 *
 * `crypto.randomUUID()` gibt es im Browser nur in einem „sicheren Kontext“
 * (HTTPS oder localhost). Vom iPad aus wird der Almanach aber über eine
 * gewöhnliche Netzwerkadresse aufgerufen (http://192.168.…), und dort fehlt
 * die Funktion – deshalb hier ein Ersatz, der überall funktioniert.
 */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // getRandomValues ist auch ohne sicheren Kontext verfügbar.
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variante
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Letzte Rückfallebene für sehr alte Browser.
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
