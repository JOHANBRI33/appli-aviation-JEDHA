/**
 * app/hangar/page.js — Server Component
 *
 * Écran « Mon Hangar » (écrans 07 et 08 du Figma « Écrans MVP ») :
 *   1. score : points, avions vus en vrai, niveaux de badge obtenus
 *   2. progression du catalogue (modèles différents dans le Hangar / catalogue)
 *   3. « Mes badges par rareté » : un badge ailé par niveau (Bronze → Légendaire)
 *      et le nombre d'avions vus en vrai de ce niveau ; estompé si aucun
 *   4. onglets « Vus en vrai » / « Collection » et grille de vignettes
 *      (composant client HangarTabs)
 *
 * Le nom, le constructeur et la rareté des avions viennent de la table
 * `aircraft`. Les captures sont des DONNÉES D'EXEMPLE (lib/hangar-exemple.js)
 * tant que la table `captures` n'existe pas. Les badges se déduisent de la
 * rareté des avions vus en vrai : pas de table à part.
 */

import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import SkyBackground from '@/components/SkyBackground';
import RarityBadge from '@/components/RarityBadge';
import { pointsForRarity, RARITY_LEVELS } from '@/lib/points';
import { EXAMPLE_CAPTURES, EXAMPLE_COLLECTION } from '@/lib/hangar-exemple';
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

  // Nombre d'avions vus en vrai par niveau de rareté (1 à 5)
  const countsByRarity = Object.fromEntries(Object.keys(RARITY_LEVELS).map(level => [level, 0]));
  for (const aircraft of seen) {
    if (aircraft.rarity in countsByRarity) countsByRarity[aircraft.rarity] += 1;
  }
  const levelsEarned = Object.values(countsByRarity).filter(count => count > 0).length;

  return (
    <div className="flex flex-col gap-4.5">
      <p className="typo-credit text-ink-muted">
        Données d’exemple : tes captures ne sont pas encore enregistrées.
      </p>

      <Score points={points} seenCount={seen.length} levelsEarned={levelsEarned} levelsTotal={Object.keys(RARITY_LEVELS).length} />
      <CatalogueProgress owned={modelsOwned} total={catalogue.length} />
      <BadgesByRarity counts={countsByRarity} />
      <HangarTabs seen={seen} collection={collection} />
    </div>
  );
}

// ─── Blocs de l'en-tête ──────────────────────────────────────────────────────

const numberFr = new Intl.NumberFormat('fr-FR');

function Score({ points, seenCount, levelsEarned, levelsTotal }) {
  const items = [
    { value: numberFr.format(points),            label: 'points' },
    { value: seenCount,                          label: 'vus en vrai' },
    { value: `${levelsEarned} / ${levelsTotal}`, label: 'badges' },
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

function BadgesByRarity({ counts }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="typo-title-md text-ink">Mes badges par rareté</h2>
      <ul className="flex justify-between">
        {Object.entries(RARITY_LEVELS).map(([rarity, level]) => {
          const count = counts[rarity];
          return (
            <li key={rarity} className="flex flex-col items-center">
              <RarityBadge rarity={Number(rarity)} width={60} muted={count === 0} decorative />
              <span className="font-display text-[22px] leading-5.5 font-bold text-ink">×{count}</span>
              <span className="font-mono text-[9px] font-medium tracking-wide text-ink-muted uppercase">{level.label}</span>
              {/* Phrase complète pour le lecteur d'écran */}
              <span className="sr-only">
                {count} avion{count > 1 ? 's' : ''} {level.label} vu{count > 1 ? 's' : ''} en vrai
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
