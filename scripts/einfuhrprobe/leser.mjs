/**
 * Der Leser der Einfuhrprobe: aus einer Quelldatei nur den Code behalten.
 *
 * Eigene Datei, weil er das einzige wirklich knifflige Stück der Probe ist
 * – ein kleiner Zustandsautomat über Code, Kommentare, Zeichenketten,
 * Vorlagen und Suchmuster. Wer an ihm schraubt, soll ihn für sich lesen
 * können, ohne die Namenssuche drumherum.
 */

/**
 * Kommentare und Zeichenketten entfernen – aber nichts, was Code ist.
 *
 * Ohne das hielte die Probe jedes erwähnte Wort in einem Kommentar für eine
 * Benutzung – und gerade dieser Almanach ist voller Kommentare, die Namen
 * nennen.
 *
 * Mit einer Handvoll Ersetzungen kommt man hier nicht weit: In einer Vorlage
 * mit Gegenstrichen (`` `…${esc(name)}…` ``) steckt *beides* – Text, der weg
 * soll, und Code, der bleiben muss. Genau dort, in der Blattausfuhr, steht
 * der meiste Code des Almanachs. Deshalb läuft hier ein kleiner Leser Zeichen
 * für Zeichen durch die Datei und merkt sich, wo er gerade ist:
 *
 *   Code      → wird übernommen; Kommentare, Zeichenketten und
 *                Suchmuster werden übersprungen.
 *   Vorlage   → wird verworfen, bis ein `${` kommt: dann ist wieder Code.
 *
 * Die Lagen stapeln sich, denn in einem `${…}` darf wieder eine Vorlage
 * stehen, und darin wieder ein `${…}`.
 */
export function nurCode(text) {
  let raus = '';
  // Das letzte bedeutsame Zeichen – nur dafür da, einen Schrägstrich als
  // Suchmuster (`/\d+/`) von einer Division (`a / b`) zu unterscheiden.
  let letztes = '';
  const lagen = [{ art: 'code', klammern: 0 }];

  const schreiben = (zeichen) => {
    raus += zeichen;
    if (!/\s/.test(zeichen)) letztes = zeichen;
  };

  for (let i = 0; i < text.length; i++) {
    const lage = lagen[lagen.length - 1];
    const z = text[i];
    const dann = text[i + 1];

    if (lage.art === 'vorlage') {
      if (z === '\\') i++;                                   // \` bleibt Text
      else if (z === '`') { lagen.pop(); schreiben(' '); }
      else if (z === '$' && dann === '{') { lagen.push({ art: 'code', klammern: 0 }); i++; schreiben(' '); }
      continue;                                              // alles andere ist Text
    }

    // Kommentare.
    if (z === '/' && dann === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      raus += '\n';
      continue;
    }
    if (z === '/' && dann === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      schreiben(' ');
      continue;
    }

    // Zeichenketten. Der Abbruch am Zeilenende ist Absicht: Ein einzelnes
    // Hochkomma in einem Text („Das ist's“) soll höchstens eine Zeile
    // verschlucken, nicht den Rest der Datei.
    if (z === "'" || z === '"') {
      i++;
      while (i < text.length && text[i] !== z && text[i] !== '\n') i += text[i] === '\\' ? 2 : 1;
      schreiben(' ');
      continue;
    }

    // Vorlagen mit Gegenstrich.
    if (z === '`') { lagen.push({ art: 'vorlage' }); schreiben(' '); continue; }

    // Suchmuster. Ein Schrägstrich beginnt eines nur dort, wo kein Wert
    // davorsteht – nach `(`, `=`, `,` und dergleichen. Steht ein Name oder
    // eine schließende Klammer davor, ist es geteilt.
    if (z === '/' && !/[\w$)\]]/.test(letztes)) {
      i++;
      let klasse = false;
      while (i < text.length && text[i] !== '\n') {
        if (text[i] === '\\') i++;
        else if (text[i] === '[') klasse = true;
        else if (text[i] === ']') klasse = false;
        else if (text[i] === '/' && !klasse) break;
        i++;
      }
      while (i + 1 < text.length && /[a-z]/.test(text[i + 1])) i++;   // Flaggen
      schreiben(' ');
      continue;
    }

    // Die Klammern zählen, damit ein `}` das Ende eines `${…}` erkennt.
    if (z === '{') lage.klammern++;
    if (z === '}') {
      if (lage.klammern === 0 && lagen.length > 1) { lagen.pop(); schreiben(' '); continue; }
      lage.klammern--;
    }
    schreiben(z);
  }

  return raus;
}
