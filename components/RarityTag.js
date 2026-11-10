/**
 * components/RarityTag.js
 *
 * Étiquette de rareté de la charte Flight Hunter (colonne `rarity`, de 1 à 5).
 * Le niveau est toujours écrit en toutes lettres : la couleur seule ne suffit pas.
 *
 * Props :
 *   rarity  {number}  1 à 5 (rien n'est affiché sinon)
 *
 * TODO : ajouter les points (« Rare · 50 pts ») quand lib/points existera.
 */

// Les classes sont écrites en entier pour que Tailwind les détecte dans le code
const LEVELS = {
  1: { label: 'Commun',     className: 'bg-rarity-common-soft text-rarity-common' },
  2: { label: 'Peu commun', className: 'bg-rarity-uncommon-soft text-rarity-uncommon' },
  3: { label: 'Rare',       className: 'bg-rarity-rare-soft text-rarity-rare' },
  4: { label: 'Épique',     className: 'bg-rarity-epic-soft text-rarity-epic' },
  5: { label: 'Légendaire', className: 'bg-rarity-legendary-soft text-rarity-legendary' },
};

export default function RarityTag({ rarity }) {
  const level = LEVELS[rarity];
  if (!level) return null;

  return (
    <span className={`typo-data inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${level.className}`}>
      {/* Point de couleur, dans la couleur du texte */}
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {level.label}
    </span>
  );
}
