/**
 * Die Ansicht auf die Karte: Maßstab und Verschiebung.
 *
 * Hier steckt alles, was mit *Schauen* zu tun hat, und nichts, was mit
 * Spielen zu tun hat – deshalb eine eigene Datei. Der Spieltisch bekommt
 * daraus vier Dinge:
 *
 *   ansicht   – { scale, tx, ty }, der Zustand der Ansicht
 *   setAnsicht– zum Schieben mit der Maus (macht der Tisch selbst)
 *   zuSzene   – ein Bildschirmpunkt als Punkt auf der Karte
 *   zoomen    – um einen Punkt herum vergrößern oder verkleinern
 *
 * Gezoomt und geschoben wird nicht, indem jedes Ding einzeln umgerechnet
 * wird, sondern über *eine* CSS-Transformation auf dem Behälter. Diese
 * Datei verwaltet nur die drei Zahlen dafür.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

// Der Zoom-Boden ist keine feste Zahl: Eine Karte über zweihundert Meter ist
// zwölftausend Bildpunkte breit und passt bei 0,12 nicht auf den Schirm. Der
// Boden richtet sich deshalb nach der Karte – man darf immer so weit heraus,
// bis das Ganze zu sehen ist, aber nicht weiter.
const MIN_SCALE = 0.12;
const MAX_SCALE = 4;

/**
 * @param {{ current: HTMLElement|null }} huelle  das Element, in dem der Tisch liegt
 * @param {object|null} scene  die aufgelegte Szene – eine neue wird eingepasst
 * @returns {{ ansicht: {scale:number,tx:number,ty:number}, setAnsicht: Function, zuSzene: Function, zoomen: Function }}
 */
export function useAnsicht(huelle, scene) {
  const [ansicht, setAnsicht] = useState({ scale: 1, tx: 0, ty: 0 });
  const [boden, setBoden] = useState(MIN_SCALE);
  // Welche Szene schon eingepasst wurde. Ohne das würfe jedes Neuzeichnen
  // einen mitten im Verschieben zurück auf die Anfangsansicht.
  const gepasst = useRef(null);

  /** Bildpunkte der Karte aus einem Bildschirmpunkt. */
  const zuSzene = useCallback(
    (clientX, clientY) => {
      const box = huelle.current.getBoundingClientRect();
      return {
        x: (clientX - box.left - ansicht.tx) / ansicht.scale,
        y: (clientY - box.top - ansicht.ty) / ansicht.scale,
      };
    },
    [huelle, ansicht]
  );

  /**
   * Um einen Punkt herum zoomen.
   *
   * Der Punkt unter dem Zeiger soll unter dem Zeiger bleiben – deshalb wird
   * die Verschiebung mitgerechnet und nicht nur der Maßstab geändert.
   */
  const zoomen = useCallback(
    (faktor, punktX, punktY) => {
      setAnsicht((a) => {
        const scale = Math.max(boden, Math.min(MAX_SCALE, a.scale * faktor));
        const wirklich = scale / a.scale;
        return {
          scale,
          tx: punktX - (punktX - a.tx) * wirklich,
          ty: punktY - (punktY - a.ty) * wirklich,
        };
      });
    },
    [boden]
  );

  // Beim ersten Anzeigen die Karte einpassen. Gebraucht wird dafür die
  // *gemessene* Größe der Hülle, die erst nach dem Zeichnen feststeht.
  useEffect(() => {
    if (gepasst.current === scene.id || !huelle.current || !scene.width) return;
    gepasst.current = scene.id;
    const box = huelle.current.getBoundingClientRect();
    const passend = Math.min(box.width / scene.width, box.height / scene.height, 1);
    // Etwas Luft unter dem Einpassen, damit man den Rand noch sieht.
    const neuerBoden = Math.min(MIN_SCALE, passend * 0.85);
    setBoden(neuerBoden);

    // Mit dem *geklemmten* Maßstab rechnen, sonst sitzt die Karte versetzt.
    const scale = Math.max(neuerBoden, passend);
    setAnsicht({
      scale,
      tx: (box.width - scene.width * scale) / 2,
      ty: (box.height - scene.height * scale) / 2,
    });
  }, [huelle, scene.id, scene.width, scene.height]);

  /**
   * Zoomen mit dem Rad – von Hand angemeldet, nicht über `onWheel`.
   *
   * React meldet Rad-Ereignisse als „passiv“ an; darin darf man das Blättern
   * der Seite nicht unterdrücken, und der Browser schimpft. Auf einer Karte
   * über zweihundert Meter ist das Rad aber der Hauptweg durch die Gegend,
   * und dann soll unter dem Zeiger gezoomt und nicht die Seite gescrollt
   * werden.
   */
  useEffect(() => {
    const el = huelle.current;
    if (!el) return undefined;
    const beiRad = (e) => {
      e.preventDefault();
      const box = el.getBoundingClientRect();
      zoomen(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - box.left, e.clientY - box.top);
    };
    el.addEventListener('wheel', beiRad, { passive: false });
    return () => el.removeEventListener('wheel', beiRad);
  }, [huelle, zoomen]);

  return { ansicht, setAnsicht, zuSzene, zoomen };
}
