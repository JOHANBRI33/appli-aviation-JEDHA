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
 * `aircraft` (catalogue public, en cache). Les captures et le pseudo sont lus
 * avec la session de l'utilisateur (lib/captures.js, lib/auth.js) : la RLS
 * ne lui montre que les siennes. Les photos s'affichent par des adresses
 * signées valables 1 h. Les points et les badges se calculent à partir de
 * la rareté des avions vus en vrai : rien n'est stocké.
 *
 * Hangar vide : un état vide invite à photographier un premier avion.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import SkyBackground from '@/components/SkyBackground';
import RarityBadge from '@/components/RarityBadge';
import { pointsForRarity, RARITY_LEVELS } from '@/lib/points';
import { CameraIcon, LogOutIcon, WarehouseIcon } from '@/components/icons';
import { getMyProfile, requireUser } from '@/lib/auth';
import { getMyCaptures, signPhotoUrls } from '@/lib/captures';
import { signOut } from '@/app/auth/actions';
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
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8 lg:max-w-5xl lg:pt-8">
      <SkyBackground />

      <header className="flex items-center justify-between pb-4.5">
        <h1 className="typo-title-lg text-ink">Mon Hangar</h1>
        {/* Déconnexion : formulaire qui appelle la Server Action signOut */}
        <form action={signOut}>
          <button
            type="submit"
            className="-mr-2 flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-brand-blue"
          >
            <LogOutIcon className="h-4.5 w-4.5" />
            Se déconnecter
          </button>
        </form>
      </header>

      <Suspense fallback={<p className="typo-body text-ink-muted">Chargement du Hangar…</p>}>
        <HangarContent />
      </Suspense>
    </main>
  );
}

async function HangarContent() {
  // Page réservée aux utilisateurs connectés (le proxy redirige déjà, mais
  // chaque page vérifie elle-même la session : lib/auth.js)
  const user = await requireUser('/hangar');

  // Trois lectures indépendantes, lancées en même temps
  const [catalogue, captures, profile] = await Promise.all([
    getCatalogue(),
    getMyCaptures(),
    getMyProfile(user.id),
  ]);
  const byId = new Map(catalogue.map(aircraft => [aircraft.id, aircraft]));

  // Une capture + sa ligne du catalogue. On ne garde que les avions encore
  // visibles dans le catalogue (un avion masqué sort du Hangar et du score,
  // comme dans le classement get_leaderboard).
  const withAircraft = captures
    .map(capture => ({ capture, aircraft: byId.get(capture.aircraft_id) }))
    .filter(item => item.aircraft);

  // Vus en vrai : du plus récent au plus ancien passage en « vu en vrai »
  const seenItems = withAircraft
    .filter(item => item.capture.status === 'seen')
    .sort((a, b) => b.capture.seen_at.localeCompare(a.capture.seen_at));
  // Collection : déjà triée par date d'ajout (getMyCaptures)
  const collectionItems = withAircraft.filter(item => item.capture.status === 'collection');

  const pseudo = profile?.username;
  if (withAircraft.length === 0) return <EmptyHangar pseudo={pseudo} />;

  // Adresses temporaires des photos des avions vus en vrai, en un seul appel
  const photoUrls = await signPhotoUrls(seenItems.map(item => item.capture.photo_path));
  const seen = seenItems.map(item => item.aircraft);
  const collection = collectionItems.map(item => item.aircraft);

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
      {pseudo && <p className="-mt-3 text-sm text-ink-muted">Hangar de {pseudo}</p>}

      <Score points={points} seenCount={seen.length} levelsEarned={levelsEarned} levelsTotal={Object.keys(RARITY_LEVELS).length} />
      <CatalogueProgress owned={modelsOwned} total={catalogue.length} />
      <BadgesByRarity counts={countsByRarity} />
      <HangarTabs
        seen={seenItems.map(({ aircraft, capture }) => ({ aircraft, photoUrl: photoUrls.get(capture.photo_path) ?? null }))}
        collection={collectionItems.map(({ aircraft }) => ({ aircraft, photoUrl: null }))}
      />
    </div>
  );
}

/** Hangar vide : une seule action, photographier un premier avion. */
function EmptyHangar({ pseudo }) {
  return (
    <div className="flex flex-1 flex-col">
      {pseudo && <p className="-mt-3 pb-4.5 text-sm text-ink-muted">Hangar de {pseudo}</p>}

      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-soft text-brand-blue">
          <WarehouseIcon className="h-6 w-6" />
        </span>
        <h2 className="typo-title-md text-ink">Ton Hangar est vide</h2>
        <p className="typo-body text-ink-muted">
          Photographie ton premier avion : l’appli l’identifie, il rejoint ton Hangar et tu gagnes tes premiers points.
        </p>
      </div>

      <Link
        href="/photo"
        className="typo-label flex h-13.5 w-full items-center justify-center gap-2 rounded-md bg-brand-blue
                   px-5 text-on-brand active:bg-brand-blue-strong"
      >
        <CameraIcon className="h-5 w-5" />
        Scanner un avion
      </Link>
      <Link
        href="/recherche"
        className="flex min-h-11 items-center justify-center text-sm font-semibold text-brand-blue"
      >
        Parcourir le catalogue
      </Link>
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
