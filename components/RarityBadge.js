/**
 * components/RarityBadge.js
 *
 * Badge ailé de la rareté d'un avion (composant « Badge rareté » du Figma
 * « Écrans MVP ») : Bronze, Argent, Or, Platine ou Légendaire.
 * Les dessins sont dans public/badges/<slug>.svg (format 260 × 186).
 *
 * Affiché sur la fiche avion, sur les vignettes du Hangar et dans la rangée
 * « Mes badges par rareté ».
 *
 * Props :
 *   rarity     {number}   1 à 5 (rien n'est affiché sinon)
 *   width      {number}   largeur en pixels (la hauteur suit les proportions)
 *   muted      {boolean}  badge estompé (avion en collection, niveau pas encore obtenu)
 *   decorative {boolean}  true quand le niveau est déjà écrit à côté (étiquette) :
 *                         le lecteur d'écran ne le lit pas deux fois
 *   className  {string}   classes en plus (position, marges)
 */

import { RARITY_LEVELS } from '@/lib/points';

const RATIO = 186 / 260;

export default function RarityBadge({ rarity, width = 72, muted = false, decorative = false, className = '' }) {
  const level = RARITY_LEVELS[rarity];
  if (!level) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG local, pas besoin de next/image
    <img
      src={`/badges/${level.slug}.svg`}
      alt={decorative ? '' : `Badge ${level.label}`}
      width={width}
      height={Math.round(width * RATIO)}
      className={`shrink-0 select-none ${muted ? 'opacity-45 saturate-50' : ''} ${className}`}
      draggable={false}
    />
  );
}
