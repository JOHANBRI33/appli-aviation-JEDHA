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
 * Bas de fiche selon l'origine : ?depuis=hangar → écran 09 « Ma prise de vue ».
 * TODO : écran 11 « depuis la recherche » quand la recherche existera.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import AircraftSheet from '@/components/AircraftSheet';
import { PlaneIcon } from '@/components/icons';
import { pointsForRarity } from '@/lib/points';
import { findExampleCapture } from '@/lib/hangar-exemple';

const FICHE_COLUMNS = [
  'id', 'name', 'manufacturer', 'category', 'description',
  'first_flight', 'max_speed_kmh', 'length_m', 'wingspan_m',
  'units_built', 'rarity',
  'image_url', 'image_author', 'image_license',
  'image_license_url', 'image_source_url',
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

  // Ouverte depuis le Hangar (écran 09) : retour au Hangar et, si l'avion a
  // été photographié, le panneau « Ma prise de vue »
  if (depuis === 'hangar') {
    const capture = findExampleCapture(id);
    return (
      <AircraftSheet fiche={fiche} backHref="/hangar">
        {capture && <MyCapture capture={capture} rarity={fiche.rarity} />}
      </AircraftSheet>
    );
  }

  return <AircraftSheet fiche={fiche} backHref="/" />;
}

const dateFr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Bas de fiche « depuis le Hangar » (écran 09) : la photo de l'utilisateur,
 * la date, le lieu et les points gagnés.
 * DONNÉES D'EXEMPLE (lib/hangar-exemple.js) tant que la table `captures` n'existe pas.
 */
function MyCapture({ capture, rarity }) {
  return (
    <>
      <div className="flex w-full items-center justify-between">
        <h2 className="typo-title-md text-ink">Ma prise de vue</h2>
        <span className="typo-data rounded-full bg-success-soft px-2.5 py-1.25 text-success">
          +{pointsForRarity(rarity)} pts gagnés
        </span>
      </div>

      <div className="flex w-full items-center gap-3.5">
        {/* TODO : photo de l'utilisateur (captures.photo_path, Storage privé) */}
        <div className="flex h-19 w-19 shrink-0 items-center justify-center rounded-md bg-linear-to-b from-brand-blue to-brand-blue-soft text-on-brand">
          <PlaneIcon className="h-8.5 w-8.5" strokeWidth={1.5} />
        </div>
        <div className="flex min-w-0 flex-col gap-0.75">
          <p className="typo-item-title text-ink">Vu en vrai le {dateFr.format(new Date(capture.created_at))}</p>
          <p className="typo-body-sm text-ink-muted">{capture.place}</p>
          <p className="typo-credit text-ink-muted">Photo privée · visible par toi seul</p>
        </div>
      </div>

      {/* TODO : supprimer la capture quand la table `captures` existera */}
      <button
        type="button"
        disabled
        title="Bientôt disponible"
        className="min-h-11 text-sm font-semibold text-ink-muted disabled:opacity-60"
      >
        Retirer de mon Hangar
      </button>
    </>
  );
}
