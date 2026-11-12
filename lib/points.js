/**
 * lib/points.js
 *
 * Barème des points selon la rareté d'un avion (colonne `rarity`, de 1 à 5).
 * Source : composant « Étiquette rareté » du Figma « Écrans MVP ».
 *
 * Utilisable côté navigateur et côté serveur (aucune clé, aucun appel réseau).
 * TODO : attribution des badges, quand la table badges existera.
 */

export const RARITY_LEVELS = {
  1: { label: 'Commun',     points: 10 },
  2: { label: 'Peu commun', points: 25 },
  3: { label: 'Rare',       points: 50 },
  4: { label: 'Très rare',  points: 100 },
  5: { label: 'Légendaire', points: 200 },
};

/** Points gagnés pour un avion de cette rareté (0 si la rareté est inconnue). */
export function pointsForRarity(rarity) {
  return RARITY_LEVELS[rarity]?.points ?? 0;
}
