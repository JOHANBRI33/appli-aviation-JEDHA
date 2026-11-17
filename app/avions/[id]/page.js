/**
 * app/avions/[id]/page.js — Server Component
 *
 * Fiche d'un avion du catalogue : /avions/rafale, /avions/a320…
 * Le contenu vient de la table `aircraft` (lecture publique, RLS).
 *
 * Le catalogue change rarement : la lecture est mise en cache une heure
 * ('use cache' + cacheLife) avec un client Supabase sans cookies, car la
 * table est publique et un cache ne peut pas dépendre de la session.
 *
 * Bas de fiche selon l'origine : ?depuis=hangar → écran 09 « Ma prise de vue »,
 * lu dans la capture de l'utilisateur connecté (lib/captures.js), avec sa
 * photo (adresse signée 1 h) et le bouton « Retirer de mon Hangar ».
 * Sinon : « Ajouter à ma collection » (Server Action addToCollection,
 * app/hangar/actions.js), ou « Déjà dans ton Hangar » si l'avion y est.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import AircraftSheet from '@/components/AircraftSheet';
import { PlaneIcon } from '@/components/icons';
import Link from 'next/link';
import RemoveCaptureButton from '@/components/RemoveCaptureButton';
import AddToCollectionButton from '@/components/AddToCollectionButton';
import { pointsForRarity } from '@/lib/points';
import { getCurrentUser } from '@/lib/auth';
import { loginUrl } from '@/lib/redirection';
import { getMyCapture, seenDateFr, signPhotoUrls } from '@/lib/captures';

const FICHE_COLUMNS = [
  'id', 'name', 'manufacturer', 'category', 'description',
  'first_flight', 'max_speed_kmh', 'length_m', 'wingspan_m',
  'units_built', 'rarity',
  'image_url', 'image_author', 'image_license',
  'image_license_url', 'image_source_url', 'wikipedia_url',
].join(', ');

/** Fiche d'un avion visible, ou null s'il n'existe pas. */
async function getAircraft(id) {
  'use cache';
  cacheLife('hours');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const { data, error } = await supabase
    .from('aircraft')
    .select(FICHE_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  // Erreur Supabase : on la remonte (error.js / page d'erreur) plutôt que
  // d'afficher « avion introuvable » à tort
  if (error) throw new Error(`Lecture de la fiche « ${id} » impossible : ${error.message}`);
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const fiche = await getAircraft(id);
  return { title: `${fiche?.name ?? 'Avion'} — Flight Hunter` };
}

export default function AircraftPage({ params, searchParams }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface">
      <Suspense fallback={<p className="typo-body px-6 py-8 text-ink-muted">Chargement de la fiche…</p>}>
        <AircraftContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AircraftContent({ params, searchParams }) {
  const { id } = await params;
  const { depuis } = await searchParams;
  const fiche = await getAircraft(id);
  if (!fiche) notFound();

  // Ouverte depuis le Hangar (écran 09) : retour au Hangar et, si l'avion est
  // dans le Hangar de l'utilisateur connecté, le panneau du bas. La fiche
  // reste publique : sans session, elle s'affiche simplement sans panneau.
  if (depuis === 'hangar') {
    const user = await getCurrentUser();
    const capture = user ? await getMyCapture(id) : null;

    let panel = null;
    if (capture?.status === 'seen') {
      const urls = await signPhotoUrls([capture.photo_path]);
      panel = <MyCapture capture={capture} photoUrl={urls.get(capture.photo_path) ?? null} fiche={fiche} />;
    } else if (capture?.status === 'collection') {
      panel = <InMyCollection fiche={fiche} />;
    }

    return (
      <AircraftSheet fiche={fiche} backHref="/hangar">
        {panel}
      </AircraftSheet>
    );
  }

  // Ouverte depuis ailleurs : « Ajouter à ma collection » (ou l'état actuel)
  const user = await getCurrentUser();
  const capture = user ? await getMyCapture(id) : null;

  return (
    <AircraftSheet fiche={fiche} backHref="/">
      <CollectionPanel fiche={fiche} loggedIn={Boolean(user)} capture={capture} />
    </AircraftSheet>
  );
}

/**
 * Bas de fiche publique : ajouter l'avion à sa collection (sans photo,
 * 0 point). Déjà dans le Hangar → on le dit, avec un lien vers sa fiche
 * « depuis le Hangar ». Visiteur non connecté → lien vers la connexion.
 */
function CollectionPanel({ fiche, loggedIn, capture }) {
  const fichePath = `/avions/${encodeURIComponent(fiche.id)}`;

  if (!loggedIn) {
    return (
      <Link href={loginUrl(fichePath)} className="flex min-h-11 items-center text-sm font-semibold text-brand-blue">
        Connecte-toi pour l’ajouter à ta collection
      </Link>
    );
  }

  if (capture) {
    return (
      <div className="flex w-full items-center justify-between gap-3">
        <p className="typo-item-title text-ink">
          {capture.status === 'seen' ? 'Déjà dans ton Hangar · vu en vrai' : 'Déjà dans ta collection'}
        </p>
        <Link href={`${fichePath}?depuis=hangar`} className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-brand-blue">
          Voir
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="typo-body-sm w-full text-ink-muted">
        Pas encore vu en vrai ? Ajoute-le à ta collection. Il rapportera {pointsForRarity(fiche.rarity)} pts
        quand tu le prendras en photo.
      </p>
      <AddToCollectionButton aircraftId={fiche.id} />
    </>
  );
}

/**
 * Bas de fiche « depuis le Hangar » (écran 09), avion vu en vrai : la photo
 * de l'utilisateur, la date du passage en « vu en vrai », le lieu et les
 * points gagnés.
 */
function MyCapture({ capture, photoUrl, fiche }) {
  const points = pointsForRarity(fiche.rarity);
  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h2 className="typo-title-md text-ink">Ma prise de vue</h2>
        <span className="typo-data rounded-full bg-success-soft px-2.5 py-1.25 text-success">
          +{points} pts gagnés
        </span>
      </div>

      <div className="flex w-full items-center gap-3.5">
        {/* Photo de l'utilisateur (Storage privé, adresse signée valable 1 h) */}
        <div className="flex h-19 w-19 shrink-0 items-center justify-center overflow-hidden rounded-md bg-linear-to-b from-brand-blue to-brand-blue-soft text-on-brand">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- adresse signée Supabase, temporaire : next/image ne doit pas la mettre en cache
            <img src={photoUrl} alt={`Ta photo du ${fiche.name}`} className="h-full w-full object-cover" />
          ) : (
            <PlaneIcon className="h-8.5 w-8.5" strokeWidth={1.5} />
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-0.75">
          <p className="typo-item-title text-ink">Vu en vrai le {seenDateFr.format(new Date(capture.seen_at))}</p>
          {capture.place && <p className="typo-body-sm text-ink-muted">{capture.place}</p>}
          <p className="typo-credit text-ink-muted">Photo privée · visible par toi seul</p>
        </div>
      </div>

      <RemoveCaptureButton aircraftId={fiche.id} points={points} />
    </>
  );
}

/**
 * Bas de fiche « depuis le Hangar », avion de la collection (sans photo) :
 * rappel qu'il ne rapporte rien tant qu'il n'est pas vu en vrai.
 */
function InMyCollection({ fiche }) {
  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h2 className="typo-title-md text-ink">Dans ma collection</h2>
        <span className="typo-data text-ink-muted">0 pt</span>
      </div>
      <p className="typo-body-sm w-full text-ink-muted">
        Prends-le en photo quand tu le croises pour gagner {pointsForRarity(fiche.rarity)} pts.
      </p>
      <RemoveCaptureButton aircraftId={fiche.id} points={0} />
    </>
  );
}
