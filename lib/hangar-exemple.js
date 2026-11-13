/**
 * lib/hangar-exemple.js
 *
 * DONNÉES D'EXEMPLE du Hangar, en attendant la table Supabase `captures`
 * (pas encore créée au 13/11/2026). Les badges n'ont plus besoin de table :
 * ils se déduisent de la rareté des avions vus en vrai (lib/points.js).
 *
 * Les identifiants d'avions sont ceux de la table `aircraft` : le nom, le
 * constructeur et la rareté viennent donc bien de la base, seules les
 * captures sont inventées.
 *
 * TODO : quand la table existera, remplacer ces constantes par une lecture
 * Supabase (captures de l'utilisateur connecté) et supprimer ce fichier.
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

/** Capture d'exemple d'un avion, ou undefined s'il n'a pas été photographié. */
export function findExampleCapture(aircraftId) {
  return EXAMPLE_CAPTURES.find(capture => capture.aircraft_id === aircraftId);
}
