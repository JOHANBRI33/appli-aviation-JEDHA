/**
 * components/RarityTag.js
 *
 * Étiquette de rareté (composant « Étiquette rareté » du Figma « Écrans MVP ») :
 * un point de couleur, le niveau et les points, par ex. « RARE · 50 PTS ».
 * Le niveau est toujours écrit en toutes lettres : la couleur seule ne suffit pas.
 *
 * Props :
 *   rarity  {number}  1 à 5 (rien n'est affiché sinon)
 */

import { RARITY_LEVELS } from '@/lib/points';

// Couleurs de chaque niveau, écrites en entier pour que Tailwind les détecte
const COLORS = {
  1: 'bg-rarity-common-soft text-rarity-common',
  2: 'bg-rarity-uncommon-soft text-rarity-uncommon',
  3: 'bg-rarity-rare-soft text-rarity-rare',
  4: 'bg-rarity-epic-soft text-rarity-epic',          // « Très rare »
  5: 'bg-rarity-legendary-soft text-rarity-legendary',
};

export default function RarityTag({ rarity }) {
  const level = RARITY_LEVELS[rarity];
  if (!level) return null;

  return (
    <span className={`typo-data inline-flex items-center gap-1.5 rounded-full px-2.5 py-[5px] ${COLORS[rarity]}`}>
      {/* Point de couleur, dans la couleur du texte */}
      <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-current" />
      {level.label} · {level.points} pts
    </span>
  );
}
