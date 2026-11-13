'use client';

/**
 * app/recherche/RechercheClient.js
 *
 * Partie interactive de l'écran « Rechercher » (écran 10 du Figma) :
 *   - champ de recherche : filtre en direct par nom ou constructeur,
 *     sans tenir compte des majuscules ni des accents (« airbus » trouve
 *     « Airbus », « aerospatiale » trouve « Aérospatiale ») ;
 *   - filtres en pastilles selon la colonne `category` ;
 *   - nombre de résultats, puis une ligne par avion (vers /avions/[id]) ;
 *   - message si rien ne correspond, avec un lien vers le scan.
 *
 * Le filtrage se fait entièrement dans le navigateur : le catalogue complet
 * est reçu une seule fois de la page serveur.
 *
 * Props :
 *   catalogue  {object[]}  lignes de aircraft (id, name, manufacturer, category, image_url)
 */

import { useState } from 'react';
import Link from 'next/link';
import { SearchIcon, ChevronRightIcon, PlaneIcon } from '@/components/icons';

// Filtres affichés, dans l'ordre (valeurs de la colonne aircraft.category)
const FILTERS = [
  { id: 'tous',       label: 'Tous' },
  { id: 'ligne',      label: 'Ligne' },
  { id: 'militaire',  label: 'Militaire' },
  { id: 'collection', label: 'Collection' },
  { id: 'autre',      label: 'Autre' },
];

const CATEGORY_LABELS = Object.fromEntries(FILTERS.map(({ id, label }) => [id, label]));

/**
 * Met un texte sous une forme comparable : minuscules et sans accents.
 * « Hélicoptère » → « helicoptere ». normalize('NFD') sépare chaque lettre
 * de son accent, puis on supprime les accents (caractères U+0300 à U+036F).
 */
function normalize(text) {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export default function RechercheClient({ catalogue }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('tous');

  const search = normalize(query);
  const results = catalogue.filter(aircraft => {
    const inCategory = category === 'tous' || aircraft.category === category;
    const matches = search === ''
      || normalize(aircraft.name).includes(search)
      || normalize(aircraft.manufacturer).includes(search);
    return inCategory && matches;
  });

  return (
    <div className="flex flex-col gap-3.5">
      {/* Champ de recherche */}
      <label
        className="flex h-13 items-center gap-2.5 rounded-md border-[1.5px] border-line
                   bg-surface-raised px-3.5 focus-within:border-ink"
      >
        <SearchIcon className="h-5 w-5 text-ink" />
        <span className="sr-only">Rechercher un avion par nom ou constructeur</span>
        <input
          type="search"
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Nom ou constructeur"
          autoComplete="off"
          className="typo-body-lg min-w-0 flex-1 bg-transparent text-ink outline-none
                     placeholder:text-ink-muted"
        />
      </label>

      {/* Filtres par catégorie : défilent horizontalement si l'écran est étroit.
          -mx-6 px-6 : la rangée va jusqu'aux bords de l'écran, comme dans le Figma. */}
      <div role="group" aria-label="Filtrer par catégorie" className="-mx-6 flex gap-2 overflow-x-auto px-6">
        {FILTERS.map(({ id, label }) => {
          const active = category === id;
          return (
            // Bouton de 44 px de haut (cible tactile), pastille de 35 px dedans
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(id)}
              className="flex min-h-11 shrink-0 items-center"
            >
              <span
                className={`rounded-full border px-3.5 py-2 text-sm leading-4.5
                            ${active
                              ? 'border-brand-navy bg-brand-navy font-semibold text-on-brand'
                              : 'border-line bg-surface-raised font-medium text-ink'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nombre de résultats, annoncé par le lecteur d'écran quand il change */}
      <p aria-live="polite" className="typo-data text-ink-muted">
        {results.length} résultat{results.length > 1 ? 's' : ''}
      </p>

      {results.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {results.map(aircraft => (
            <li key={aircraft.id}>
              <AircraftRow aircraft={aircraft} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-start gap-1 rounded-lg border border-line bg-surface-raised p-4">
          <p className="typo-item-title text-ink">Aucun avion ne correspond</p>
          <p className="typo-body-sm text-ink-muted">
            Essaie un autre nom ou une autre catégorie. Tu as l’avion sous les yeux ?
            Prends-le en photo, l’appli l’identifie.
          </p>
          <Link
            href="/photo"
            className="typo-label flex min-h-11 items-center gap-1 text-brand-blue active:text-brand-blue-strong"
          >
            Scanner un avion
            <ChevronRightIcon className="h-4.5 w-4.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

/** Ligne d'un avion (composant « Ligne avion · Recherche » du Figma). */
function AircraftRow({ aircraft }) {
  const details = [aircraft.manufacturer, CATEGORY_LABELS[aircraft.category]].filter(Boolean).join(' · ');

  return (
    <Link
      href={`/avions/${aircraft.id}`}
      className="flex items-center gap-3 rounded-lg border border-line bg-surface-raised
                 py-3 pr-3.5 pl-3 active:bg-brand-blue-soft"
    >
      {/* Vignette : photo du catalogue (créditée sur la fiche), sinon avion dessiné */}
      <span
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-sm
                   bg-linear-to-b from-brand-blue to-brand-blue-soft text-on-brand"
      >
        {aircraft.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- URL externe Wikimedia, next/image nécessite un domaine configuré
          <img src={aircraft.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <PlaneIcon className="h-6.5 w-6.5" strokeWidth={1.5} />
        )}
      </span>

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="typo-item-title truncate text-ink">{aircraft.name}</span>
        {details && <span className="truncate text-xs text-ink-muted">{details}</span>}
      </span>

      <ChevronRightIcon className="h-4.5 w-4.5 text-ink" />
    </Link>
  );
}
