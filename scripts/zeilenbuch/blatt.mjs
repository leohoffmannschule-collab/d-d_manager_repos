/**
 * Das Blatt einer Datei: zu jeder Zeile ihre Erklärung.
 *
 * Die Erklärer (js/, css.mjs, sql.mjs …) schreiben hier hinein – Zeile für
 * Zeile mit `dazu()`, für zusammenhängende Kommentarblöcke mit `gruppe()`.
 * `abschnitte()` macht daraus die Reihen, die satz.mjs setzt: jede Zeile
 * genau einmal, ein Kommentarblock als *eine* Reihe über mehrere Zeilen.
 *
 * Ein Teil ist entweder Erklärung (`text`) oder ein Hinweis (`hinweis`) –
 * das, was ein Wort aus dem Code allgemein bedeutet („`map` wendet eine
 * Funktion auf jedes Element an …“). Hinweise setzt das Buch kleiner,
 * damit die eigentliche Erklärung vorne steht.
 */

/** Zu jeder Zeile einer Datei ihre Erklärung. */
export class Blatt {
  /** @param {string} text  der Inhalt der Datei */
  constructor(text) {
    this.zeilen = text.replace(/\r\n/g, '\n').split('\n');
    // Eine Datei endet fast immer mit einem Zeilenumbruch – die leere
    // „Zeile“ dahinter gibt es im Editor nicht.
    if (this.zeilen.length > 1 && this.zeilen[this.zeilen.length - 1] === '') this.zeilen.pop();
    this.teile = this.zeilen.map(() => []);
    this.gruppen = [];
  }

  /** Wie viele Zeilen die Datei hat. */
  get anzahl() {
    return this.zeilen.length;
  }

  /** Der Text der Zeile `nr` (ab 1). */
  text(nr) {
    return this.zeilen[nr - 1] ?? '';
  }

  /** Steht in Zeile `nr` nichts als Leerraum? */
  leer(nr) {
    return !this.text(nr).trim();
  }

  /** Hat Zeile `nr` schon eine Erklärung – eigene oder als Teil einer Gruppe? */
  hat(nr) {
    return this.teile[nr - 1].some((t) => t.art === 'text') || this.gruppen.some((g) => g.von <= nr && nr <= g.bis);
  }

  /** Eine Erklärung an Zeile `nr` anhängen. Leere Texte fallen weg. */
  dazu(nr, text, art = 'text') {
    if (!text || nr < 1 || nr > this.anzahl) return;
    const liste = this.teile[nr - 1];
    if (!liste.some((t) => t.text === text)) liste.push({ art, text });
  }

  /** Eine Erklärung vor alle anderen der Zeile `nr` stellen. */
  vorn(nr, text) {
    if (!text || nr < 1 || nr > this.anzahl) return;
    const liste = this.teile[nr - 1];
    if (!liste.some((t) => t.text === text)) liste.unshift({ art: 'text', text });
  }

  /** Einen Hinweis an Zeile `nr` anhängen (kleiner gesetzt, nach der Erklärung). */
  hinweis(nr, text) {
    this.dazu(nr, text, 'hinweis');
  }

  /**
   * Mehrere Zeilen zu einer Reihe zusammenfassen – für Kommentarblöcke, die
   * man als Ganzes liest. Überschneidet sich die Gruppe mit einer schon
   * vorhandenen, bleibt die vorhandene.
   */
  gruppe(von, bis, text) {
    if (von > bis || this.gruppen.some((g) => g.von <= bis && von <= g.bis)) return;
    this.gruppen.push({ von, bis, text });
  }

  /**
   * Die Reihen des Buches, in Zeilenfolge: `{ von, bis, teile, leer }`.
   * Jede Zeile kommt genau einmal vor. Leere Zeilen werden zu leeren
   * Reihen, damit die Gestalt des Codes erhalten bleibt.
   */
  abschnitte() {
    const gruppen = [...this.gruppen].sort((a, b) => a.von - b.von);
    const raus = [];
    let nr = 1;
    while (nr <= this.anzahl) {
      const g = gruppen.find((x) => x.von === nr);
      if (g) {
        const teile = [{ art: 'text', text: g.text }];
        for (let i = g.von; i <= g.bis; i += 1) teile.push(...this.teile[i - 1]);
        raus.push({ von: g.von, bis: g.bis, teile, leer: false });
        nr = g.bis + 1;
        continue;
      }
      raus.push({ von: nr, bis: nr, teile: this.teile[nr - 1], leer: this.leer(nr) });
      nr += 1;
    }
    return raus;
  }

  /** Die Zeilen mit Code, die noch keine Erklärung haben – für die Abschlussprüfung. */
  offen() {
    const raus = [];
    for (let nr = 1; nr <= this.anzahl; nr += 1) if (!this.leer(nr) && !this.hat(nr)) raus.push(nr);
    return raus;
  }
}
