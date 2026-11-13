/**
 * components/HangarTile.js
 *
 * Vignette d'un avion du Hangar (composant « Vignette Hangar » du Figma
 * « Écrans MVP »), utilisée dans la grille de 2 colonnes de app/hangar.
 *
 * Deux modes :
 *   - « seen »       : avion photographié → fond bleu, badge et étiquette de rareté
 *   - « collection » : ajouté depuis la recherche → fond gris, bordure en
 *                      pointillés, badge estompé, « Collection · 0 pt »
 *
 * La zone photo montre l'avion dessiné, comme dans le Figma.
 * TODO : afficher la photo de l'utilisateur (captures.photo_path) en mode « seen ».
 *
 * Props :
 *   aircraft  {object}  ligne de la table aircraft (id, name, manufacturer, rarity)
 *   mode      {string}  'seen' ou 'collection'
 *   href      {string}  lien vers la fiche de l'avion
 */

import Link from 'next/link';
import RarityTag from '@/components/RarityTag';
import RarityBadge from '@/components/RarityBadge';
import { PlaneIcon } from '@/components/icons';

export default function HangarTile({ aircraft, mode, href }) {
  const seen = mode === 'seen';

  return (
    <Link
      href={href}
      className={`flex flex-col gap-2 overflow-hidden rounded-lg bg-surface-raised pb-3
                  ${seen ? 'border border-line' : 'border-[1.5px] border-dashed border-line'}`}
    >
      {/* Zone photo, avec le badge de rareté dans le coin (estompé en collection) */}
      <div
        className={`relative flex h-26 items-center justify-center text-on-brand
                    ${seen ? 'bg-linear-to-b from-brand-blue to-brand-blue-soft' : 'bg-linear-to-b from-line to-surface'}`}
      >
        <PlaneIcon className="h-11.5 w-11.5" strokeWidth={1.5} />
        <RarityBadge
          rarity={aircraft.rarity}
          width={68}
          muted={!seen}
          decorative={seen}
          className="absolute top-0.5 right-0.5"
        />
      </div>

      {/* Nom, constructeur, rareté */}
      <div className="flex min-w-0 flex-col items-start gap-1.5 px-3">
        <div className="flex w-full min-w-0 flex-col">
          <span className="typo-item-title truncate text-ink">{aircraft.name}</span>
          <span className="truncate text-xs text-ink-muted">{aircraft.manufacturer}</span>
        </div>
        {seen ? (
          <RarityTag rarity={aircraft.rarity} />
        ) : (
          <span className="typo-data text-ink-muted">Collection · 0 pt</span>
        )}
      </div>
    </Link>
  );
}
