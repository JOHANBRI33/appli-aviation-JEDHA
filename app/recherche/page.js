/**
 * app/recherche/page.js — Server Component
 *
 * Écran « Rechercher » (écran 10 du Figma « Écrans MVP ») :
 * un champ de recherche, des filtres par catégorie et la liste des avions
 * du catalogue. Chaque ligne ouvre la fiche /avions/[id].
 *
 * Le catalogue est petit (15 à 50 avions) : on le charge une seule fois ici,
 * côté serveur, puis le composant client RechercheClient le filtre en direct
 * dans le navigateur, sans nouvel appel à Supabase à chaque lettre tapée.
 */

import { Suspense } from 'react';
import { cacheLife } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import SkyBackground from '@/components/SkyBackground';
import RechercheClient from './RechercheClient';

export const metadata = { title: 'Rechercher — Flight Hunter' };

/**
 * Catalogue visible (lecture publique, RLS : visible = true). Mis en cache une
 * heure, comme dans le Hangar : un client sans cookies suffit.
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
    .select('id, name, manufacturer, category, image_url')
    .order('name');

  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`);
  return data;
}

export default function RecherchePage() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <header className="pb-4.5">
        <h1 className="typo-title-lg text-ink">Rechercher</h1>
      </header>

      <Suspense fallback={<p className="typo-body text-ink-muted">Chargement du catalogue…</p>}>
        <RechercheContent />
      </Suspense>
    </main>
  );
}

async function RechercheContent() {
  const catalogue = await getCatalogue();
  return <RechercheClient catalogue={catalogue} />;
}
