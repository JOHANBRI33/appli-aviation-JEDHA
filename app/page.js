// app/page.js — accueil de Flight Hunter (Server Component)
//
// Maquette : écran « 02 · Accueil » du Figma « Écrans MVP ».
//   1. en-tête : « Bonjour <pseudo> » et la pastille de points
//   2. les 4 entrées de l'appli sous forme de cartes. Scanner est la seule
//      en bleu, c'est l'action principale. Sous « Mon Hangar », les vrais
//      compteurs (« 12 avions · 3 badges »)
//   3. « Derniers ajouts » : les 4 derniers avions vus en vrai
// La barre de navigation du bas est ajoutée par app/layout.js.
//
// Écran réservé aux utilisateurs connectés : un visiteur est envoyé sur
// /connexion (par le proxy, puis par requireUser ici), et revient ici après.
//
// La session et le Hangar se lisent dans un seul bloc <Suspense> (cookies,
// cacheComponents) : l'écran s'affiche tout de suite sans pseudo ni
// compteurs, puis se complète. Si la lecture du Hangar échoue, l'accueil
// reste utilisable, sans compteurs.

import { Suspense } from 'react';
import Link from 'next/link';
import { connection } from 'next/server';
import SkyBackground from '@/components/SkyBackground';
import {
  CameraIcon, WarehouseIcon, SearchIcon, CalendarIcon, ChevronRightIcon,
} from '@/components/icons';
import HangarTile from '@/components/HangarTile';
import { getMyProfile, requireUser } from '@/lib/auth';
import { getMyCaptures, signPhotoUrls } from '@/lib/captures';
import { createClient } from '@/lib/supabase/server';
import { pointsForRarity } from '@/lib/points';

const RECENT_COUNT = 4;
const numberFr = new Intl.NumberFormat('fr-FR');

/**
 * Données de l'accueil :
 *   - le pseudo (table profiles) ;
 *   - les avions vus en vrai, du plus récent au plus ancien, avec leur ligne
 *     du catalogue. Mêmes règles que le Hangar et get_leaderboard : seuls
 *     les avions vus en vrai et encore visibles dans le catalogue comptent.
 * `seen` vaut null si le Hangar n'a pas pu être lu : l'accueil reste
 * utilisable, sans compteurs.
 */
async function getHomeData() {
  const user = await requireUser('/');
  const profile = await getMyProfile(user.id).catch(() => null);

  try {
    const seenCaptures = (await getMyCaptures())
      .filter(capture => capture.status === 'seen')
      .sort((a, b) => b.seen_at.localeCompare(a.seen_at));

    const aircraftById = await getAircraftByIds(seenCaptures.map(capture => capture.aircraft_id));
    const seen = seenCaptures
      .map(capture => ({ capture, aircraft: aircraftById.get(capture.aircraft_id) }))
      .filter(item => item.aircraft?.visible);

    return { pseudo: profile?.username ?? null, seen };
  } catch (error) {
    console.error(error);
    return { pseudo: profile?.username ?? null, seen: null };
  }
}

/** Lignes du catalogue de ces avions (table aircraft, lecture publique). */
async function getAircraftByIds(ids) {
  if (ids.length === 0) return new Map();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('aircraft')
    .select('id, name, manufacturer, rarity, visible')
    .in('id', ids);
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  return new Map(data.map(aircraft => [aircraft.id, aircraft]));
}

/** Points : barème de lib/points.js appliqué à chaque avion vu en vrai. */
function totalPoints(seen) {
  return seen.reduce((total, { aircraft }) => total + pointsForRarity(aircraft.rarity), 0);
}

/** Niveaux de badge obtenus : raretés différentes parmi les avions vus (0 à 5). */
function badgesEarned(seen) {
  return new Set(seen.map(({ aircraft }) => aircraft.rarity).filter(Boolean)).size;
}

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      {/* Pendant la lecture des données : l'écran sans pseudo ni compteurs */}
      <Suspense fallback={<HomeView />}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

/**
 * Lit la session et le Hangar (cookies : forcément dans un <Suspense>),
 * puis affiche l'écran complet. Une seule lecture pour toute la page.
 */
async function HomeContent() {
  // connection() : ce bloc se calcule à chaque visite, jamais à l'avance.
  // Sans lui, Next essaie de le préparer avec les seuls cookies (« Partial
  // Prefetching ») et bute sur la vérification du jeton de session, qui lit
  // l'heure (erreur « blocking-prerender-current-time »).
  await connection();
  const { pseudo, seen } = await getHomeData();
  if (!seen) return <HomeView pseudo={pseudo} />;

  const recent = seen.slice(0, RECENT_COUNT);
  // Adresses temporaires des photos de l'utilisateur, en un seul appel
  const photoUrls = await signPhotoUrls(recent.map(({ capture }) => capture.photo_path));

  return (
    <HomeView
      pseudo={pseudo}
      points={totalPoints(seen)}
      hangarText={hangarSummary(seen)}
      recent={recent.map(({ capture, aircraft }) => ({
        id: capture.id,
        aircraft,
        photoUrl: photoUrls.get(capture.photo_path) ?? null,
      }))}
    />
  );
}

/** Sous-titre de la carte « Mon Hangar » : « 12 avions · 3 badges ». */
function hangarSummary(seen) {
  if (seen.length === 0) return 'Aucun avion vu pour l’instant';
  const planes = seen.length;
  const badges = badgesEarned(seen);
  return `${planes} avion${planes > 1 ? 's' : ''} · ${badges} badge${badges > 1 ? 's' : ''}`;
}

/**
 * L'écran d'accueil. Sans données (pendant le chargement, ou si le Hangar
 * est illisible) : pas de pseudo, pas de points, pas de derniers ajouts.
 */
function HomeView({ pseudo = null, points = null, hangarText = 'Ta collection d’avions', recent = null }) {
  return (
    <>
      {/* En-tête : pseudo et pastille de points */}
      <header className="flex items-start justify-between gap-3 pb-5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h1 className="typo-title-lg truncate text-ink">{pseudo ? `Bonjour ${pseudo}` : 'Bonjour'}</h1>
          <p className="text-sm text-ink-muted">Prêt pour le prochain meeting ?</p>
        </div>

        {points !== null && (
          <Link
            href="/hangar"
            className="flex shrink-0 items-baseline gap-1 rounded-full bg-reward-soft px-3 py-1.5 text-reward-text"
          >
            <span className="font-mono text-sm font-bold">{numberFr.format(points)}</span>
            <span className="font-mono text-xs font-medium">pts</span>
            <span className="sr-only">au total, voir mon Hangar</span>
          </Link>
        )}
      </header>

      <nav aria-label="Accès rapides" className="flex flex-col gap-3">
        {/* Carte principale : Scanner un avion */}
        <Link
          href="/photo"
          className="flex items-center gap-3.5 rounded-lg bg-brand-blue px-[18px] py-[22px]
                     text-on-brand active:bg-brand-blue-strong"
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-brand-blue-strong">
            <CameraIcon className="h-[26px] w-[26px]" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-xl font-bold">Scanner un avion</span>
            <span className="typo-body-sm opacity-90">Prends-le en photo, l’appli l’identifie</span>
          </span>
          <ChevronRightIcon className="h-5 w-5" />
        </Link>

        <ActionCard href="/hangar"     Icon={WarehouseIcon} title="Mon Hangar"           text={hangarText} />
        <ActionCard href="/recherche"  Icon={SearchIcon}    title="Rechercher par type"  text="Fiches, constructeurs, caractéristiques" />
        <ActionCard href="/calendrier" Icon={CalendarIcon}  title="Calendrier des shows" text="Meetings et shows aériens à venir" />
      </nav>

      {recent && <RecentCaptures recent={recent} />}
    </>
  );
}

function ActionCard({ href, Icon, title, text }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 rounded-lg border border-line bg-surface-raised
                 px-[18px] py-4 active:bg-brand-blue-soft"
    >
      <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-brand-blue-soft text-brand-blue">
        <Icon className="h-[22px] w-[22px]" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="text-[17px] font-bold text-ink">{title}</span>
        <span className="typo-body-sm text-ink-muted">{text}</span>
      </span>
      <ChevronRightIcon className="h-5 w-5 text-ink-muted" />
    </Link>
  );
}

/** « Derniers ajouts » : du plus récent au plus ancien, chaque vignette ouvre la carte. */
function RecentCaptures({ recent }) {
  return (
    <section aria-labelledby="derniers-ajouts" className="flex flex-col gap-3 pt-6">
      <div className="flex items-baseline justify-between">
        <h2 id="derniers-ajouts" className="typo-title-md text-ink">Derniers ajouts</h2>
        {recent.length > 0 && (
          <Link href="/hangar" className="text-sm font-semibold text-brand-blue-strong">Tout voir</Link>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="typo-body-sm rounded-lg border-[1.5px] border-dashed border-line px-4 py-5 text-center text-ink-muted">
          Ton premier avion vu en vrai apparaîtra ici, avec ses points.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {recent.map(({ id, aircraft, photoUrl }) => (
            <li key={id}>
              <HangarTile aircraft={aircraft} photoUrl={photoUrl} mode="seen" href={`/hangar/carte/${aircraft.id}`} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
