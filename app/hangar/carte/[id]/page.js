/**
 * app/hangar/carte/[id]/page.js — Server Component
 *
 * Écran « Ma carte » (écrans 13 et 13b du Figma « Écrans MVP ») : la carte à
 * collectionner d'un avion vu en vrai, en grand sur fond bleu nuit.
 * On y arrive en touchant une vignette « Vus en vrai » du Hangar.
 *
 * Seuls les avions photographiés ont une carte : un avion de l'onglet
 * « Collection » (ou inconnu) renvoie la page « introuvable ».
 *
 * Le nom, les caractéristiques et la rareté viennent de la table `aircraft`.
 * La prise de vue et le numéro de la carte sont des DONNÉES D'EXEMPLE
 * (lib/hangar-exemple.js) tant que la table `captures` n'existe pas.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import CollectibleCard from '@/components/CollectibleCard';
import { ChevronLeftIcon } from '@/components/icons';
import { EXAMPLE_CAPTURES, findExampleCapture } from '@/lib/hangar-exemple';
import ShareCardButton from './ShareCardButton';

const CARD_COLUMNS = [
  'id', 'name', 'manufacturer', 'category', 'description',
  'first_flight', 'max_speed_kmh', 'wingspan_m', 'rarity',
  'image_url', 'image_author', 'image_license',
].join(', ');

/** Client Supabase sans cookies : la table aircraft est en lecture publique. */
function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Données de la carte d'un avion, ou null s'il n'existe pas. Mis en cache une heure. */
async function getAircraft(id) {
  'use cache';
  cacheLife('hours');

  const { data, error } = await publicClient().from('aircraft').select(CARD_COLUMNS).eq('id', id).maybeSingle();
  if (error) throw new Error(`Lecture de la carte « ${id} » impossible : ${error.message}`);
  return data;
}

/** Nombre d'avions du catalogue (le « 040 » de « N° 007/040 »). */
async function getCatalogueSize() {
  'use cache';
  cacheLife('hours');

  const { count, error } = await publicClient().from('aircraft').select('id', { count: 'exact', head: true });
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  return count ?? 0;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const aircraft = await getAircraft(id);
  return { title: `Ma carte ${aircraft?.name ?? ''} — Flight Hunter` };
}

export default function CardPage({ params }) {
  return (
    <main className="flex min-h-dvh flex-col bg-brand-navy bg-[radial-gradient(ellipse_at_50%_45%,var(--color-brand-blue-strong)_0%,var(--color-brand-navy)_70%)]">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-9">
        <Suspense fallback={<p className="typo-body py-8 text-on-brand">Chargement de la carte…</p>}>
          <CardContent params={params} />
        </Suspense>
      </div>
    </main>
  );
}

async function CardContent({ params }) {
  const { id } = await params;
  const capture = findExampleCapture(id);
  if (!capture) notFound();

  const [aircraft, total] = await Promise.all([getAircraft(id), getCatalogueSize()]);
  if (!aircraft) notFound();

  // Numéro de la carte : ordre d'arrivée dans le Hangar (la plus ancienne est la n° 1)
  const number = EXAMPLE_CAPTURES.length - EXAMPLE_CAPTURES.indexOf(capture);

  return (
    <>
      {/* Barre de titre : retour au Hangar et taille de la collection */}
      <div className="flex items-center justify-between pb-5">
        <Link href="/hangar" aria-label="Retour au Hangar" className="-ml-2.5 flex h-11 w-11 items-center justify-center text-on-brand">
          <ChevronLeftIcon className="h-6 w-6" />
        </Link>
        <p className="typo-data text-on-brand">Ma collection · {EXAMPLE_CAPTURES.length} cartes</p>
      </div>

      <CollectibleCard aircraft={aircraft} capture={capture} number={number} total={total} />

      {/* Une seule action principale : partager. La fiche reste accessible. */}
      <div className="mt-auto flex flex-col gap-3 pt-10">
        <ShareCardButton name={aircraft.name} />
        <Link
          href={`/avions/${aircraft.id}?depuis=hangar`}
          className="typo-label flex min-h-13.5 items-center justify-center rounded-md border border-line bg-surface-raised text-ink"
        >
          Voir la fiche de l’avion
        </Link>
      </div>
    </>
  );
}
