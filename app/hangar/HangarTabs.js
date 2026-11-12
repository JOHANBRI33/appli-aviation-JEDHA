'use client';

/**
 * app/hangar/HangarTabs.js
 *
 * Onglets « Vus en vrai » / « Collection » du Hangar et grille de vignettes
 * (2 colonnes). Seul morceau interactif de l'écran : il garde en mémoire
 * l'onglet choisi (useState).
 *
 * Chaque vignette ouvre la fiche /avions/[id]?depuis=hangar : la fiche
 * affiche alors le bouton retour vers le Hangar et « Ma prise de vue »
 * (écran 09).
 *
 * Props :
 *   seen        {object[]}  avions photographiés (lignes de aircraft)
 *   collection  {object[]}  avions ajoutés depuis la recherche
 */

import { useState } from 'react';
import Link from 'next/link';
import HangarTile from '@/components/HangarTile';
import { InfoIcon, PlusIcon } from '@/components/icons';

export default function HangarTabs({ seen, collection }) {
  const [tab, setTab] = useState('seen');

  const tabs = [
    { id: 'seen',       label: `Vus en vrai · ${seen.length}` },
    { id: 'collection', label: `Collection · ${collection.length}` },
  ];
  const items = tab === 'seen' ? seen : collection;

  return (
    <div className="flex flex-col gap-4.5">
      {/* Sélecteur d'onglets */}
      <div role="tablist" aria-label="Avions du Hangar" className="flex gap-1 rounded-md bg-line p-1">
        {tabs.map(({ id, label }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`onglet-${id}`}
              aria-selected={active}
              aria-controls="hangar-grille"
              onClick={() => setTab(id)}
              className={`min-h-11 flex-1 rounded-[11px] text-sm
                          ${active ? 'bg-surface-raised font-semibold text-ink shadow-tab' : 'font-medium text-ink-muted'}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div id="hangar-grille" role="tabpanel" aria-labelledby={`onglet-${tab}`} className="flex flex-col gap-4.5">
        {/* Explication de l'onglet Collection (écran 08) */}
        {tab === 'collection' && (
          <p className="flex gap-2.5 rounded-md bg-brand-blue-soft px-3.5 py-3 text-ink">
            <InfoIcon className="mt-0.5 h-4.5 w-4.5 text-brand-blue" />
            <span className="typo-body-sm">
              Les avions que tu n’as pas pu voir en vrai. Ils complètent ta collection mais ne
              rapportent pas de points : pour ça, il faut les prendre en photo.
            </span>
          </p>
        )}

        {tab === 'seen' && items.length === 0 && (
          <p className="typo-body text-ink-muted">
            Aucun avion vu en vrai pour l’instant. Appuie sur Scanner pour photographier ton premier avion.
          </p>
        )}

        <ul className="grid grid-cols-2 gap-3">
          {items.map(aircraft => (
            <li key={aircraft.id}>
              <HangarTile
                aircraft={aircraft}
                mode={tab}
                href={`/avions/${aircraft.id}?depuis=hangar`}
              />
            </li>
          ))}

          {/* Dernière case de la collection : ajouter un avion depuis la recherche */}
          {tab === 'collection' && (
            <li>
              <Link
                href="/recherche"
                className="flex h-full min-h-47 flex-col items-center justify-center gap-2 rounded-lg
                           border-[1.5px] border-dashed border-brand-blue text-center text-[13px]
                           font-semibold text-brand-blue active:bg-brand-blue-soft"
              >
                <PlusIcon className="h-7 w-7" />
                <span>Ajouter depuis<br />la recherche</span>
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
