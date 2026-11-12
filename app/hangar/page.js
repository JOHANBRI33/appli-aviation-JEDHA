/**
 * app/hangar/page.js — Server Component
 *
 * Écran « Mon Hangar » (écrans 07 et 08 du Figma « Écrans MVP ») :
 *   1. score : points, avions vus en vrai, badges obtenus
 *   2. progression du catalogue (modèles différents dans le Hangar / catalogue)
 *   3. rangée des 6 badges (obtenus en couleur, verrouillés en gris pointillé)
 *   4. onglets « Vus en vrai » / « Collection » et grille de vignettes
 *      (composant client HangarTabs)
 *
 * Le nom, le constructeur et la rareté des avions viennent de la table
 * `aircraft`. Les captures et les badges sont des DONNÉES D'EXEMPLE
 * (lib/hangar-exemple.js) tant que les tables `captures` et `user_badges`
 * n'existent pas.
 */

import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import SkyBackground from '@/components/SkyBackground';
import { AwardIcon } from '@/components/icons';
import { pointsForRarity } from '@/lib/points';
import {
  EXAMPLE_CAPTURES, EXAMPLE_COLLECTION, BADGES, EXAMPLE_EARNED_BADGES,
} from '@/lib/hangar-exemple';
import HangarTabs from './HangarTabs';

export const metadata = { title: 'Mon Hangar — Flight Hunter' };

/**
 * Catalogue visible (lecture publique). Mis en cache une heure, comme la
 * fiche avion : un client sans cookies suffit, la table est publique.
 */
async function getCatalogue() {
  'use cache';
  cacheLife('hours');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { data, error } = await supabase
    .from('aircraft')
    .select('id, name, manufacturer, rarity')
    .order('name');

  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  return data;
}

export default function HangarPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <header className="pb-4.5">
        <h1 className="typo-title-lg text-ink">Mon Hangar</h1>
      </header>

      <Suspense fallback={<p className="typo-body text-ink-muted">Chargement du Hangar…</p>}>
        <HangarContent />
      </Suspense>
    </main>
  );
}

async function HangarContent() {
  const catalogue = await getCatalogue();
  const byId = new Map(catalogue.map(aircraft => [aircraft.id, aircraft]));

  // On ne garde que les avions encore présents dans le catalogue
  const seen = EXAMPLE_CAPTURES.map(c => byId.get(c.aircraft_id)).filter(Boolean);
  const collection = EXAMPLE_COLLECTION.map(id => byId.get(id)).filter(Boolean);

  // Points : barème de lib/points.js appliqué à chaque avion vu en vrai
  // (la collection rapporte 0 point)
  const points = seen.reduce((total, aircraft) => total + pointsForRarity(aircraft.rarity), 0);

  // Modèles différents dans le Hangar, vus en vrai ou en collection
  const modelsOwned = new Set([...seen, ...collection].map(aircraft => aircraft.id)).size;

  const earned = new Set(EXAMPLE_EARNED_BADGES);

  return (
    <div className="flex flex-col gap-4.5">
      <p className="typo-credit text-ink-muted">
        Données d’exemple : tes captures et tes badges ne sont pas encore enregistrés.
      </p>

      <Score points={points} seenCount={seen.length} badgesEarned={earned.size} badgesTotal={BADGES.length} />
      <CatalogueProgress owned={modelsOwned} total={catalogue.length} />
      <Badges earned={earned} />
      <HangarTabs seen={seen} collection={collection} />
    </div>
  );
}

// ─── Blocs de l'en-tête ──────────────────────────────────────────────────────

const numberFr = new Intl.NumberFormat('fr-FR');

function Score({ points, seenCount, badgesEarned, badgesTotal }) {
  const items = [
    { value: numberFr.format(points),            label: 'points' },
    { value: seenCount,                          label: 'vus en vrai' },
    { value: `${badgesEarned} / ${badgesTotal}`, label: 'badges' },
  ];

  return (
    <dl className="flex rounded-lg bg-brand-navy py-3.5">
      {items.map(({ value, label }) => (
        // flex-col-reverse : le chiffre s'affiche au-dessus, mais le lecteur
        // d'écran lit d'abord l'intitulé (dt) puis la valeur (dd)
        <div key={label} className="flex flex-1 flex-col-reverse items-center gap-0.5">
          <dt className="typo-data text-on-brand/75">{label}</dt>
          <dd className="font-display text-[30px] leading-7.5 font-bold text-on-brand">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CatalogueProgress({ owned, total }) {
  const percent = total > 0 ? Math.round((owned / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold text-ink">Catalogue</span>
        <span className="font-mono text-xs font-medium text-ink-muted">{owned} / {total} modèles</span>
      </div>
      <div
        role="progressbar"
        aria-label="Progression du catalogue"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={owned}
        className="h-2 overflow-hidden rounded-full bg-line"
      >
        <div className="h-full rounded-full bg-brand-blue" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function Badges({ earned }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="typo-title-md text-ink">Mes badges</h2>
      <ul className="flex justify-between">
        {BADGES.map(badge => {
          const isEarned = earned.has(badge.code);
          return (
            <li
              key={badge.code}
              title={`${badge.name} : ${badge.description}`}
              className={`flex h-12 w-12 items-center justify-center rounded-full
                          ${isEarned ? badge.color : 'border-[1.5px] border-dashed border-ink-muted/40 bg-line text-ink-muted/50'}`}
            >
              <AwardIcon className="h-6 w-6" />
              {/* Le nom et l'état sont lus par le lecteur d'écran (la couleur seule ne suffit pas) */}
              <span className="sr-only">
                {badge.name} : {isEarned ? 'obtenu' : 'verrouillé'} ({badge.description})
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
