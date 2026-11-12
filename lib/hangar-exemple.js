/**
 * lib/hangar-exemple.js
 *
 * DONNÉES D'EXEMPLE du Hangar, en attendant les tables Supabase
 * `captures`, `badges` et `user_badges` (pas encore créées au 12/11/2026).
 *
 * Les identifiants d'avions sont ceux de la table `aircraft` : le nom, le
 * constructeur et la rareté viennent donc bien de la base, seules les
 * captures et les badges obtenus sont inventés.
 *
 * TODO : quand les tables existeront, remplacer ces constantes par des
 * lectures Supabase (captures de l'utilisateur connecté, user_badges) et
 * supprimer ce fichier.
 */

/** Avions photographiés (futures lignes de `captures`), du plus récent au plus ancien. */
export const EXAMPLE_CAPTURES = [
  { aircraft_id: 'rafale',      created_at: '2026-06-14', place: 'Meeting aérien de La Ferté-Alais' },
  { aircraft_id: 'a320',        created_at: '2026-06-02', place: 'Aéroport de Lyon-Saint-Exupéry' },
  { aircraft_id: 'mirage-2000', created_at: '2026-05-24', place: 'Meeting de la base aérienne 701' },
  { aircraft_id: 'spitfire',    created_at: '2026-05-24', place: 'Meeting de la base aérienne 701' },
  { aircraft_id: 'b747',        created_at: '2026-04-11', place: 'Aéroport de Paris-Charles-de-Gaulle' },
  { aircraft_id: 'dc3',         created_at: '2026-03-29', place: 'Aérodrome de Cerny' },
  { aircraft_id: 'f16',         created_at: '2026-03-08', place: 'Salon du Bourget' },
  { aircraft_id: 'a380',        created_at: '2026-02-15', place: 'Aéroport de Toulouse-Blagnac' },
  { aircraft_id: 'p51',         created_at: '2026-01-20', place: 'Aérodrome de Cerny' },
];

/** Avions ajoutés depuis la recherche, sans photo (0 point). */
export const EXAMPLE_COLLECTION = ['concorde', 'a350', 'hurricane'];

/**
 * Les 6 badges du MVP (future table `badges`), dans l'ordre du Figma.
 * `color` : classes de la médaille quand le badge est obtenu.
 */
export const BADGES = [
  { code: 'premier-contact',     name: 'Premier contact',          description: 'Ton premier avion vu en vrai',
    color: 'bg-rarity-legendary-soft text-rarity-legendary' },
  { code: 'chasseur-raretes',    name: 'Chasseur de raretés',      description: 'Ton premier avion rare ou plus',
    color: 'bg-rarity-rare-soft text-rarity-rare' },
  { code: 'warbird',             name: 'Warbird',                  description: 'Un avion de collection vu en vrai',
    color: 'bg-rarity-epic-soft text-rarity-epic' },
  { code: 'collectionneur',      name: 'Collectionneur',           description: '10 avions différents vus en vrai',
    color: 'bg-rarity-uncommon-soft text-rarity-uncommon' },
  { code: 'mur-du-son',          name: 'Mur du son',               description: 'Un avion supersonique vu en vrai',
    color: 'bg-rarity-rare-soft text-rarity-rare' },
  { code: 'fidele-constructeur', name: 'Fidèle d’un constructeur', description: '5 avions du même constructeur',
    color: 'bg-rarity-epic-soft text-rarity-epic' },
];

/** Badges obtenus (future table `user_badges`). */
export const EXAMPLE_EARNED_BADGES = ['premier-contact', 'chasseur-raretes', 'warbird'];

/** Capture d'exemple d'un avion, ou undefined s'il n'a pas été photographié. */
export function findExampleCapture(aircraftId) {
  return EXAMPLE_CAPTURES.find(capture => capture.aircraft_id === aircraftId);
}
