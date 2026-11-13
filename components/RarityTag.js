/**
 * components/RarityTag.js
 *
 * Étiquette de rareté (composant « Étiquette rareté » du Figma « Écrans MVP ») :
 * un point de couleur, le niveau et les points, par ex. « OR · 50 PTS ».
 * Le niveau est toujours écrit en toutes lettres : la couleur seule ne suffit pas.
 *
 * Props :
 *   rarity  {number}  1 à 5 (rien n'est affiché sinon)
 */

import { RARITY_LEVELS } from '@/lib/points';

// Couleurs de chaque niveau, écrites en entier pour que Tailwind les détecte
const COLORS = {
  1: 'bg-rarity-bronze-soft text-rarity-bronze',
  2: 'bg-rarity-argent-soft text-rarity-argent',
  3: 'bg-rarity-or-soft text-rarity-or',
  4: 'bg-rarity-platine-soft text-rarity-platine',
  5: 'bg-rarity-legendaire-soft text-rarity-legendaire',
};

export default function RarityTag({ rarity }) {
  const level = RARITY_LEVELS[rarity];
  if (!level) return null;

  return (
    <span className={`typo-data inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.25 ${COLORS[rarity]}`}>
      {/* Point de couleur, dans la couleur du texte */}
      <span aria-hidden="true" className="h-1.75 w-1.75 rounded-full bg-current" />
      {level.label} · {level.points} pts
    </span>
  );
}
