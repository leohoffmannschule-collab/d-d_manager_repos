/**
 * Vertrag, Kapitel: Ein volles Blatt übersteht den Weg zum Server und zurück.
 *
 * Ein Blatt mit allem, was die Oberfläche kennt – Zauber, Merkmale,
 * Ausrüstung, Münzen, Aussehen –, wandert unverändert zum Server und zurück.
 * Der Server kennt den Inhalt nicht und darf nichts daran verlieren.
 *
 * Das Blatt ist der einzige Teil des Almanachs, dessen Inhalt der Server
 * nicht kennt: Er nimmt entgegen, was die Oberfläche schickt, und gibt es
 * unverändert zurück. Genau das wird hier nachgewiesen – mit einem Blatt,
 * auf dem jedes Feld gefüllt ist, das ein gedruckter Charakterbogen kennt.
 *
 * Ein Kapitel des Prüfdurchgangs (siehe ../vertrag.mjs). Es bekommt den
 * gemeinsamen Stand `lage` – die angemeldeten Klienten und was frühere
 * Kapitel angelegt haben – und trägt ein, was spätere brauchen.
 */
import { gleich } from './werkzeug.mjs';

export default async function vollesBlatt(lage) {
  const { spieler } = lage;
  {
    const vollesBlatt = {
      race: 'Elf',
      subrace: 'Hochelf',
      className: 'Paladin',
      subclass: 'Eid der Ergebenheit',
      level: 1,
      background: 'Adelig',
      alignment: 'Rechtschaffen Gut',
      playerName: 'Leo',
      experienceMode: 'meilenstein',
      experience: 0,
      units: 'metrisch',
      abilities: { str: 18, dex: 13, con: 19, int: 15, wis: 8, cha: 19 },
      savingThrows: { str: true, cha: true },
      savingThrowNote: 'Vorteil gegen die Bezaubert-Bedingung.',
      skills: { athletics: { proficient: true, expertise: false }, persuasion: { proficient: true, expertise: true } },
      combat: {
        armorClass: 18,
        initiativeBonus: 0,
        speed: 30,
        hp: { max: 14, current: 14, temp: 0 },
        hitDice: '1d10',
        hitDicePool: { size: 10, total: 1, used: 0 },
        deathSaves: { successes: 0, failures: 0 },
        conditions: [],
        exhaustion: 0,
        concentration: { active: false, spell: '' },
        defenses: { resistances: '', immunities: 'Magischer Schlaf', vulnerabilities: '' },
        senses: { sight: 0, darkvision: 60, blindsight: 0, tremorsense: 0, truesight: 0, notes: '' },
      },
      inspiration: false,
      actions: [
        { id: 'a1', name: 'Handauflegen', art: 'bonus', description: 'Berühre ein Geschöpf und heile es aus dem Vorrat.' },
      ],
      attacks: [{ id: 'w1', name: 'Verteidiger-Kriegshammer', bonus: '+6', damage: '1W8+4 Wucht', notes: 'Vielseitig' }],
      resources: [{ id: 'r1', name: 'Heilungsvorrat', current: 5, max: 5, recharge: 'lang' }],
      attunement: ['Verteidiger-Kriegshammer', '', ''],
      inventory: [{ id: 'g1', name: 'Kettenhemd', qty: 1, weight: 55.12, notes: '' }],
      currency: { cp: 0, sp: 0, ep: 0, gp: 216, pp: 0 },
      features: [
        { id: 'm1', name: 'Handauflegen', category: 'klasse', source: 'PHB-2024', page: '109', description: 'Vorrat an Heilkraft.' },
        { id: 'm2', name: 'Feenblut', category: 'spezies', source: 'PHB-2024', page: '190', description: 'Vorteil gegen Bezaubert.' },
        { id: 'm3', name: 'Waffenmeisterschaft', category: 'talent', source: 'PHB-2024', page: '110', description: 'Stoß und Verlangsamt.' },
      ],
      spellcasting: {
        ability: 'cha',
        manualSaveDC: null,
        manualAttackBonus: null,
        slots: { 1: { max: 0, used: 0 } },
        spells: [
          {
            id: 'z1',
            name: 'Kleine Illusion',
            level: 0,
            prepared: false,
            source: 'Elfische Abstammungszauber',
            save: '--',
            time: '1 A',
            range: '9 m',
            components: 'S, M',
            duration: '1 Minute',
            page: 'PHB-2024 298',
            notes: '1,5-m-Würfel',
          },
        ],
      },
      proficiencies: {
        armor: 'Schwere Rüstung, Schilde',
        weapons: 'Kriegswaffen, Einfache Waffen',
        tools: 'Würfelset',
        languages: 'Gemeinsprache, Zwergisch, Elfisch',
      },
      appearance: {
        gender: 'weiblich',
        age: '124',
        size: 'Mittelgroß',
        height: '182 cm',
        weight: '84 kg',
        faith: 'Silenus',
        skin: 'blass',
        eyes: 'grün',
        hair: 'blond',
      },
      traits: {
        personality: 'Ich stelle mich nicht über andere.',
        ideals: 'Respekt gebührt allen.',
        bonds: 'Das Volk soll mich als Held sehen.',
        flaws: 'Ich werde schnell zornig.',
        backstory: 'Aus einem alten Haus.',
        notes: '',
        look: 'Hochgewachsen, in gepflegter Robe.',
        allies: 'Das Haus Adams',
      },
    };

    const angelegt = (
      await spieler.ruf('/characters', { methode: 'POST', koerper: { name: 'Ophelia', data: vollesBlatt } })
    ).daten;
    const zurueck = (await spieler.ruf(`/characters/${angelegt.id}`)).daten.data;

    gleich(
      JSON.stringify(zurueck),
      JSON.stringify(vollesBlatt),
      'Ein volles Blatt kommt Feld für Feld unverändert zurück'
    );

    // Und einzeln, damit ein Fehlschlag oben zeigt, wo es hakt.
    gleich(zurueck.units, 'metrisch', 'Das Maßsystem bleibt am Blatt');
    gleich(zurueck.experienceMode, 'meilenstein', 'Meilensteine bleiben Meilensteine');
    gleich(zurueck.savingThrowNote, 'Vorteil gegen die Bezaubert-Bedingung.', 'Der Rettungswurf-Vermerk bleibt');
    gleich(zurueck.actions[0].art, 'bonus', 'Eine Bonusaktion bleibt eine Bonusaktion');
    gleich(zurueck.features[1].category, 'spezies', 'Die Herkunft eines Merkmals bleibt');
    gleich(zurueck.features[0].page, '109', 'Die Seitenzahl eines Merkmals bleibt');
    gleich(zurueck.spellcasting.spells[0].range, '9 m', 'Die Reichweite eines Zaubers bleibt');
    gleich(zurueck.spellcasting.spells[0].components, 'S, M', 'Die Komponenten eines Zaubers bleiben');
    gleich(zurueck.appearance.eyes, 'grün', 'Das Aussehen bleibt');
    gleich(zurueck.traits.allies, 'Das Haus Adams', 'Verbündete bleiben');
    gleich(zurueck.attunement[0], 'Verteidiger-Kriegshammer', 'Der eingestimmte Gegenstand bleibt');

    // Die Sinne stehen in Fuß im Blatt – daran hängt der Nebel am Spieltisch,
    // gleich ob die Spielerin Meter oder Fuß abliest.
    gleich(zurueck.combat.senses.darkvision, 60, 'Dunkelsicht liegt in Fuß im Blatt');

    await spieler.ruf(`/characters/${angelegt.id}`, { methode: 'DELETE' });
  }

}
