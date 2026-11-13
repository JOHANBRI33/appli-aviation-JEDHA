/**
 * lib/points.js
 *
 * Barème de la rareté d'un avion (colonne `rarity`, de 1 à 5) : nom du niveau,
 * points gagnés et badge ailé. Source : composants « Étiquette rareté » et
 * « Badge rareté » du Figma « Écrans MVP ».
 *
 * Chaque avion porte le badge de son niveau (fichier public/badges/<slug>.svg,
 * affiché par components/RarityBadge.js).
 *
 * Utilisable côté navigateur et côté serveur (aucune clé, aucun appel réseau).
 */

export const RARITY_LEVELS = {
  1: { label: 'Bronze',     slug: 'bronze',     points: 10 },
  2: { label: 'Argent',     slug: 'argent',     points: 25 },
  3: { label: 'Or',         slug: 'or',         points: 50 },
  4: { label: 'Platine',    slug: 'platine',    points: 100 },
  5: { label: 'Légendaire', slug: 'legendaire', points: 200 },
};

/** Points gagnés pour un avion de cette rareté (0 si la rareté est inconnue). */
export function pointsForRarity(rarity) {
  return RARITY_LEVELS[rarity]?.points ?? 0;
}
