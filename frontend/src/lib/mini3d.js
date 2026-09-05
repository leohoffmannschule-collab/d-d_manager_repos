import * as THREE from 'three';

/**
 * Die Figurenschmiede.
 *
 * Statt fertige Modelle zu laden, wird jede Miniatur aus einfachen Körpern
 * zusammengesetzt – Kugeln, Kästen, Kegel. Das hat drei Vorteile: Es müssen
 * keine Modelldateien auf den Pi, jede Figur ist in Sekundenbruchteilen neu
 * gebaut, und das Ergebnis sieht aus wie eine bemalte Zinnfigur und nicht wie
 * ein schlecht geratenes Videospiel.
 */

export const VOELKER = [
  { key: 'mensch', label: 'Mensch', groesse: 1 },
  { key: 'elf', label: 'Elf', groesse: 1.02, ohren: true },
  { key: 'zwerg', label: 'Zwerg', groesse: 0.78, breit: 1.25, bart: true },
  { key: 'halbling', label: 'Halbling', groesse: 0.68 },
  { key: 'gnom', label: 'Gnom', groesse: 0.66, ohren: true },
  { key: 'ork', label: 'Ork', groesse: 1.12, breit: 1.3, ohren: true, hauer: true },
  { key: 'drachenblut', label: 'Drachenblütiger', groesse: 1.1, hoerner: true, schnauze: true },
  { key: 'tiefling', label: 'Tiefling', groesse: 1, hoerner: true, schweif: true },
  { key: 'untot', label: 'Untoter', groesse: 0.98, hager: true },
  { key: 'bestie', label: 'Bestie', groesse: 1.15, vierbeinig: true },
];

export const RUESTUNGEN = [
  { key: 'stoff', label: 'Gewand', dicke: 0, glanz: 0.05 },
  { key: 'leder', label: 'Leder', dicke: 0.02, glanz: 0.2 },
  { key: 'kette', label: 'Kettenhemd', dicke: 0.04, glanz: 0.55 },
  { key: 'platte', label: 'Platte', dicke: 0.07, glanz: 0.85 },
];

export const WAFFEN = [
  { key: 'keine', label: 'Keine' },
  { key: 'schwert', label: 'Schwert' },
  { key: 'axt', label: 'Axt' },
  { key: 'hammer', label: 'Hammer' },
  { key: 'dolch', label: 'Dolch' },
  { key: 'stab', label: 'Stab' },
  { key: 'bogen', label: 'Bogen' },
];

export const HAARSCHNITTE = [
  { key: 'kurz', label: 'Kurz' },
  { key: 'lang', label: 'Lang' },
  { key: 'zopf', label: 'Zopf' },
  { key: 'kahl', label: 'Kahl' },
];

export const BAERTE = [
  { key: 'keiner', label: 'Glatt' },
  { key: 'kurz', label: 'Stoppeln' },
  { key: 'voll', label: 'Vollbart' },
];

export const STANDARD_MINI = {
  volk: 'mensch',
  statur: 1,
  haut: '#c68a63',
  haar: '#3a2a1c',
  haarschnitt: 'kurz',
  bart: 'keiner',
  ruestung: 'leder',
  primaer: '#5a6b4a',
  sekundaer: '#7a4b2a',
  umhang: false,
  helm: false,
  waffe: 'schwert',
  schild: false,
  sockel: '#6d5c45',
};

const volkVon = (key) => VOELKER.find((v) => v.key === key) ?? VOELKER[0];
const ruestungVon = (key) => RUESTUNGEN.find((r) => r.key === key) ?? RUESTUNGEN[0];

function material(farbe, glanz = 0.15) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(farbe),
    roughness: Math.max(0.08, 1 - glanz),
    metalness: glanz > 0.5 ? 0.7 : 0.05,
    flatShading: true,
  });
}

function teil(geometry, mat, position, rotation) {
  const mesh = new THREE.Mesh(geometry, mat);
  if (position) mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  return mesh;
}

/** Die Waffe in der rechten Hand. */
function baueWaffe(art, holz, metall) {
  const gruppe = new THREE.Group();
  if (art === 'keine') return gruppe;

  if (art === 'stab') {
    gruppe.add(teil(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 6), holz, [0, 0.15, 0]));
    gruppe.add(teil(new THREE.IcosahedronGeometry(0.07, 0), metall, [0, 0.76, 0]));
    return gruppe;
  }
  if (art === 'bogen') {
    gruppe.add(
      teil(new THREE.TorusGeometry(0.32, 0.022, 5, 12, Math.PI * 1.15), holz, [0, 0.2, 0], [0, Math.PI / 2, 0])
    );
    gruppe.add(teil(new THREE.CylinderGeometry(0.005, 0.005, 0.6, 4), metall, [0, 0.2, 0]));
    return gruppe;
  }

  const griffLaenge = art === 'dolch' ? 0.13 : art === 'hammer' || art === 'axt' ? 0.42 : 0.2;
  gruppe.add(teil(new THREE.CylinderGeometry(0.019, 0.019, griffLaenge, 6), holz, [0, griffLaenge / 2, 0]));

  if (art === 'schwert' || art === 'dolch') {
    const klinge = art === 'dolch' ? 0.24 : 0.62;
    gruppe.add(teil(new THREE.BoxGeometry(0.055, klinge, 0.014), metall, [0, griffLaenge + klinge / 2, 0]));
    gruppe.add(teil(new THREE.BoxGeometry(0.19, 0.03, 0.04), metall, [0, griffLaenge, 0]));
  } else if (art === 'axt') {
    gruppe.add(teil(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), holz, [0, 0.45, 0]));
    gruppe.add(teil(new THREE.BoxGeometry(0.06, 0.22, 0.16), metall, [0.07, 0.66, 0], [0, 0, -0.15]));
  } else if (art === 'hammer') {
    gruppe.add(teil(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), holz, [0, 0.45, 0]));
    gruppe.add(teil(new THREE.BoxGeometry(0.15, 0.13, 0.13), metall, [0, 0.7, 0]));
  }
  return gruppe;
}

/**
 * Baut die ganze Figur. Der Sockel steht auf y = 0, ein Mensch misst
 * ungefähr 1,8 Einheiten.
 */
export function baueMini(config = {}) {
  const c = { ...STANDARD_MINI, ...config };
  const volk = volkVon(c.volk);
  const ruestung = ruestungVon(c.ruestung);

  const gruppe = new THREE.Group();
  const haut = material(c.haut, 0.1);
  const gewand = material(c.primaer, ruestung.glanz);
  const beschlag = material(c.sekundaer, Math.min(0.9, ruestung.glanz + 0.2));
  const haar = material(c.haar, 0.1);
  const holz = material('#4a3423', 0.12);
  const metall = material('#b9bec6', 0.8);

  // Breite wirkt nur als Streckung zur Seite. Würde sie in den Radius der
  // Körper einfließen, würden breite Figuren zu Eiern, in denen der Kopf
  // verschwindet – genau das war hier zuerst der Fall.
  const breite = (volk.breit ?? 1) * (0.9 + Number(c.statur ?? 1) * 0.2) * (volk.hager ? 0.85 : 1);
  const h = volk.groesse;
  const dicke = ruestung.dicke;

  // Köpfe wachsen langsamer als der Rest – ein Halbling ist kein geschrumpfter
  // Mensch, sondern hat einen verhältnismäßig größeren Kopf.
  const kopfR = 0.132 * (0.62 + 0.38 * h) * (volk.breit ? 1.06 : 1);

  const sockelHoehe = 0.07;
  gruppe.add(
    teil(
      new THREE.CylinderGeometry(0.3 * breite + 0.08, 0.32 * breite + 0.09, sockelHoehe, 20),
      material(c.sockel, 0.1),
      [0, sockelHoehe / 2, 0]
    )
  );

  if (volk.vierbeinig) {
    // Bestien stehen auf allen vieren.
    gruppe.add(
      teil(new THREE.CapsuleGeometry(0.22, 0.55, 3, 8), gewand, [0, 0.6 * h, 0], [0, 0, Math.PI / 2])
    );
    for (const [x, z] of [
      [0.26, 0.16],
      [0.26, -0.16],
      [-0.26, 0.16],
      [-0.26, -0.16],
    ]) {
      gruppe.add(teil(new THREE.CylinderGeometry(0.055, 0.045, 0.5 * h, 6), gewand, [x, 0.32 * h, z]));
    }
    gruppe.add(teil(new THREE.SphereGeometry(0.18, 10, 8), haut, [0.45, 0.7 * h, 0]));
    for (const z of [0.09, -0.09]) {
      gruppe.add(teil(new THREE.ConeGeometry(0.05, 0.17, 6), beschlag, [0.47, 0.88 * h, z], [0, 0, -0.3]));
    }
    gruppe.userData.hoehe = 1 * h;
    return gruppe;
  }

  const beinHoehe = 0.6 * h;
  const rumpfHoehe = 0.56 * h;
  const rumpfY = sockelHoehe + beinHoehe + rumpfHoehe / 2;
  const rumpfR = 0.185 + dicke;
  const halbeBreite = rumpfR * breite;

  // --- Beine --------------------------------------------------------------
  for (const x of [-halbeBreite * 0.5, halbeBreite * 0.5]) {
    gruppe.add(
      teil(new THREE.CylinderGeometry(0.065, 0.055, beinHoehe, 7), gewand, [x, sockelHoehe + beinHoehe / 2, 0])
    );
    gruppe.add(teil(new THREE.BoxGeometry(0.12, 0.055, 0.19), beschlag, [x, sockelHoehe + 0.028, 0.03]));
  }

  // --- Rumpf --------------------------------------------------------------
  const rumpf = teil(
    new THREE.CapsuleGeometry(rumpfR, Math.max(0.06, rumpfHoehe - 2 * rumpfR), 3, 10),
    gewand,
    [0, rumpfY, 0]
  );
  rumpf.scale.set(breite, 1, 0.75);
  gruppe.add(rumpf);

  const guertel = teil(
    new THREE.CylinderGeometry(rumpfR * 1.04, rumpfR * 1.04, 0.05, 14),
    beschlag,
    [0, rumpfY - rumpfHoehe * 0.28, 0]
  );
  guertel.scale.set(breite, 1, 0.75);
  gruppe.add(guertel);

  const schulterY = rumpfY + rumpfHoehe * 0.33;

  const schulterlinie = teil(
    new THREE.CylinderGeometry(rumpfR * 0.99, rumpfR * 0.99, 0.08, 14),
    ruestung.key === 'stoff' ? gewand : beschlag,
    [0, schulterY + 0.01, 0]
  );
  schulterlinie.scale.set(breite * 1.06, 1, 0.75);
  gruppe.add(schulterlinie);

  if (ruestung.key === 'platte' || ruestung.key === 'kette') {
    for (const seite of [-1, 1]) {
      const schulter = teil(new THREE.SphereGeometry(0.075 + dicke * 0.4, 8, 6), beschlag, [
        seite * halbeBreite * 1.0,
        schulterY,
        0,
      ]);
      schulter.scale.set(1, 0.72, 1);
      gruppe.add(schulter);
    }
  }

  // --- Arme ---------------------------------------------------------------
  const armLaenge = 0.46 * h;
  const armX = halbeBreite + 0.055;
  for (const seite of [-1, 1]) {
    gruppe.add(
      teil(
        new THREE.CapsuleGeometry(0.05, armLaenge * 0.6, 3, 7),
        gewand,
        [seite * armX, schulterY - armLaenge * 0.45, 0.02],
        [0, 0, seite * -0.1]
      )
    );
    gruppe.add(
      teil(new THREE.SphereGeometry(0.05, 7, 6), haut, [seite * (armX + 0.025), schulterY - armLaenge, 0.035])
    );
  }

  // --- Hals und Kopf ------------------------------------------------------
  const rumpfOben = rumpfY + rumpfHoehe / 2;
  const kopfY = rumpfOben + 0.045 + kopfR;
  gruppe.add(teil(new THREE.CylinderGeometry(0.05, 0.058, 0.09, 8), haut, [0, rumpfOben + 0.02, 0]));
  gruppe.add(teil(new THREE.SphereGeometry(kopfR, 12, 10), haut, [0, kopfY, 0]));

  if (volk.schnauze) {
    gruppe.add(
      teil(new THREE.ConeGeometry(0.075, 0.18, 7), haut, [0, kopfY - 0.01, kopfR * 0.85], [Math.PI / 2, 0, 0])
    );
  }
  if (volk.ohren) {
    for (const seite of [-1, 1]) {
      gruppe.add(
        teil(new THREE.ConeGeometry(0.03, 0.14, 5), haut, [seite * kopfR * 0.92, kopfY + 0.04, 0], [0, 0, seite * -0.55])
      );
    }
  }
  if (volk.hoerner) {
    for (const seite of [-1, 1]) {
      gruppe.add(
        teil(new THREE.ConeGeometry(0.038, 0.2, 6), beschlag, [seite * kopfR * 0.65, kopfY + kopfR * 0.85, -0.02], [
          -0.35,
          0,
          seite * 0.5,
        ])
      );
    }
  }
  if (volk.hauer) {
    for (const seite of [-1, 1]) {
      gruppe.add(
        teil(new THREE.ConeGeometry(0.019, 0.08, 5), material('#e8e2cf', 0.2), [
          seite * 0.05,
          kopfY - kopfR * 0.5,
          kopfR * 0.75,
        ])
      );
    }
  }

  // --- Haar, Bart, Helm ---------------------------------------------------
  if (c.haarschnitt !== 'kahl' && !c.helm) {
    gruppe.add(
      teil(new THREE.SphereGeometry(kopfR * 1.06, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), haar, [0, kopfY + 0.012, 0])
    );
    if (c.haarschnitt === 'lang') {
      gruppe.add(teil(new THREE.BoxGeometry(kopfR * 1.7, 0.3, kopfR * 1.2), haar, [0, kopfY - 0.13, -0.03]));
    }
    if (c.haarschnitt === 'zopf') {
      gruppe.add(teil(new THREE.CylinderGeometry(0.04, 0.025, 0.34, 6), haar, [0, kopfY - 0.16, -kopfR * 0.8]));
    }
  }
  if (c.bart !== 'keiner') {
    const voll = c.bart === 'voll';
    gruppe.add(
      teil(
        voll ? new THREE.ConeGeometry(kopfR * 0.85, 0.3, 8) : new THREE.SphereGeometry(kopfR * 0.75, 8, 6),
        haar,
        [0, kopfY - (voll ? 0.19 : 0.07), kopfR * 0.35],
        voll ? [Math.PI, 0, 0] : undefined
      )
    );
  }
  if (c.helm) {
    gruppe.add(
      teil(new THREE.SphereGeometry(kopfR * 1.12, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.62), beschlag, [
        0,
        kopfY + 0.01,
        0,
      ])
    );
    gruppe.add(teil(new THREE.BoxGeometry(0.03, 0.13, kopfR * 1.9), beschlag, [0, kopfY + 0.02, 0]));
  }

  // --- Umhang -------------------------------------------------------------
  if (c.umhang) {
    const umhang = teil(
      new THREE.ConeGeometry(halbeBreite * 1.35, rumpfHoehe + beinHoehe * 0.5, 9, 1, true),
      material(c.sekundaer, 0.08),
      [0, schulterY - (rumpfHoehe + beinHoehe * 0.5) / 2 + 0.06, -0.06]
    );
    umhang.material.side = THREE.DoubleSide;
    // Flach an den Rücken gelegt, statt die Figur zu umschließen.
    umhang.scale.set(1, 1, 0.45);
    gruppe.add(umhang);
  }

  if (volk.schweif) {
    gruppe.add(
      teil(new THREE.ConeGeometry(0.042, 0.55, 6), haut, [0.04, rumpfY - rumpfHoehe * 0.3, -halbeBreite - 0.06], [0.95, 0, 0.2])
    );
  }

  // --- Waffe und Schild ---------------------------------------------------
  const waffe = baueWaffe(c.waffe, holz, metall);
  waffe.position.set(armX + 0.05, schulterY - armLaenge, 0.04);
  waffe.rotation.set(-0.15, 0, -0.12);
  gruppe.add(waffe);

  if (c.schild) {
    const schild = new THREE.Group();
    schild.add(teil(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12), beschlag, [0, 0, 0], [Math.PI / 2, 0, 0]));
    schild.add(teil(new THREE.SphereGeometry(0.045, 8, 6), metall, [0, 0, 0.03]));
    schild.position.set(-armX - 0.06, schulterY - armLaenge * 0.7, 0.1);
    schild.rotation.set(0, 0.35, 0.1);
    gruppe.add(schild);
  }

  gruppe.userData.hoehe = kopfY + kopfR + (c.helm ? 0.12 : 0.04);
  return gruppe;
}

/** Licht und Bühne – für Vorschau und Abzug dieselbe. */
export function baueSzene(config) {
  const scene = new THREE.Scene();
  const figur = baueMini(config);
  scene.add(figur);

  scene.add(new THREE.HemisphereLight(0xfff2d8, 0x40301c, 2.1));
  const sonne = new THREE.DirectionalLight(0xfff6e2, 2.4);
  sonne.position.set(2.4, 4.2, 3);
  scene.add(sonne);
  const gegenlicht = new THREE.DirectionalLight(0x9ab0d0, 0.8);
  gegenlicht.position.set(-3, 1.6, -2.4);
  scene.add(gegenlicht);

  return { scene, figur };
}

export function stelleKamera(camera, figur, ansicht) {
  const kasten = new THREE.Box3().setFromObject(figur);
  const masse = kasten.getSize(new THREE.Vector3());
  const mitte = kasten.getCenter(new THREE.Vector3());
  const halberWinkel = ((camera.fov * Math.PI) / 180) / 2;

  if (ansicht === 'portraet') {
    // Kopf und Schultern, auf Augenhöhe.
    const ausschnitt = masse.y * 0.42;
    const kopfY = kasten.max.y - ausschnitt * 0.45;
    const abstand = (ausschnitt / 2 / Math.tan(halberWinkel)) * 1.15;
    camera.position.set(0, kopfY, abstand);
    camera.lookAt(0, kopfY, 0);
    return;
  }

  // Ganze Figur, leicht von oben – wie eine Zinnfigur auf dem Tisch. Beim
  // Drehen können Breite und Tiefe die Plätze tauschen, deshalb zählt die
  // größte Ausdehnung überhaupt.
  const groesste = Math.max(masse.x, masse.y, masse.z);
  const abstand = (groesste / 2 / Math.tan(halberWinkel)) * 1.45;
  camera.position.set(0, mitte.y + masse.y * 0.4, abstand);
  camera.lookAt(0, mitte.y, 0);
}

/** Alles freigeben, was three.js sonst im Speicher behält. */
export function raeumeAuf(objekt) {
  objekt?.traverse?.((kind) => {
    kind.geometry?.dispose?.();
    if (Array.isArray(kind.material)) kind.material.forEach((m) => m.dispose?.());
    else kind.material?.dispose?.();
  });
}

/**
 * Ein Abzug der Figur als PNG mit durchsichtigem Grund – daraus wird das Bild
 * auf dem Spieltisch und das Bildnis auf dem Charakterblatt.
 */
export function rendereAbzug(config, { size = 320, ansicht = 'figur', drehung = 0.35 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setSize(size, size, false);
  renderer.setPixelRatio(1);

  const { scene, figur } = baueSzene(config);
  figur.rotation.y = drehung;

  const camera = new THREE.PerspectiveCamera(ansicht === 'portraet' ? 30 : 26, 1, 0.1, 60);
  stelleKamera(camera, figur, ansicht);

  renderer.render(scene, camera);
  const datenUrl = renderer.domElement.toDataURL('image/png');

  raeumeAuf(scene);
  renderer.dispose();
  renderer.forceContextLoss?.();
  return datenUrl;
}
