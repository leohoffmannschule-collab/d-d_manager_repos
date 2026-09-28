/**
 * Eine Hülle für Wege mit `async`.
 *
 * Express 4 kennt keine Promises. Wirft ein async-Handler, merkt Express
 * davon nichts: Die Anfrage bleibt ohne Antwort hängen, bis der Browser
 * aufgibt, und Node meldet eine unbehandelte Ablehnung. Diese Hülle reicht
 * den Fehler an `next()` weiter, damit der Fehlerbehandler am Ende von
 * server.js wie bei jedem anderen Weg antwortet.
 *
 *   router.post('/login', asynchron(async (req, res) => { … }));
 *
 * (Express 5 macht das von selbst. Sobald der Almanach umzieht, kann diese
 * Datei weg.)
 */
export const asynchron = (weg) => (req, res, next) => Promise.resolve(weg(req, res, next)).catch(next);
