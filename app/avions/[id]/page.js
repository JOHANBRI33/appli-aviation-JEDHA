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
 * TODO : actions du bas de fiche selon l'origine (écran 09 « depuis le
 * Hangar », écran 11 « depuis la recherche ») quand ces écrans existeront.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import AircraftSheet from '@/components/AircraftSheet';

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

export default function AircraftPage({ params }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-surface">
      <Suspense fallback={<p className="typo-body px-6 py-8 text-ink-muted">Chargement de la fiche…</p>}>
        <AircraftContent params={params} />
      </Suspense>
    </main>
  );
}

async function AircraftContent({ params }) {
  const { id } = await params;
  const fiche = await getAircraft(id);
  if (!fiche) notFound();

  return <AircraftSheet fiche={fiche} backHref="/" />;
}
