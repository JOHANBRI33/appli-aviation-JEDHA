/**
 * app/photo/page.js — Server Component
 *
 * Écran « Scanner » : l'utilisateur prend un avion en photo et voit le résultat.
 *
 * Connexion obligatoire pour analyser une photo : chaque analyse consomme
 * notre quota Gemini (décision d'équipe, phase 2 de feat/utilisateurs).
 * Un visiteur non connecté voit une invitation à se connecter, pas une
 * erreur. La route /api/identifier vérifie aussi la session de son côté
 * (401 sinon) : cette page n'est qu'un confort d'affichage.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import SkyBackground from '@/components/SkyBackground';
import { CameraIcon } from '@/components/icons';
import { getCurrentUser } from '@/lib/auth';
import { loginUrl } from '@/lib/redirection';
import PhotoClient from './PhotoClient';

export const metadata = {
  title: 'Scanner un avion — Flight Hunter',
};

export default function PhotoPage() {
  // Lire la session = lire les cookies : seulement dans un <Suspense>
  return (
    <Suspense fallback={null}>
      <PhotoGate />
    </Suspense>
  );
}

async function PhotoGate() {
  const user = await getCurrentUser();
  return user ? <PhotoClient /> : <LoginRequired />;
}

/** Visiteur non connecté : explication et accès à la connexion. */
function LoginRequired() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue-soft text-brand-blue">
          <CameraIcon className="h-6 w-6" />
        </span>
        <h1 className="typo-title-md text-ink">Connexion obligatoire pour analyser une photo</h1>
        <p className="typo-body text-ink-muted">
          Connecte-toi pour identifier un avion et l’ajouter à ton Hangar.
        </p>
      </div>

      <div className="flex flex-col items-center gap-3.5">
        <Link
          href={loginUrl('/photo')}
          className="typo-label flex h-13.5 w-full items-center justify-center rounded-md bg-brand-blue
                     px-5 text-on-brand active:bg-brand-blue-strong"
        >
          Se connecter
        </Link>
        <Link
          href={`/inscription?suivant=${encodeURIComponent('/photo')}`}
          className="flex min-h-11 items-center justify-center text-sm font-semibold text-brand-blue"
        >
          Créer un compte
        </Link>
        <Link href="/" className="flex min-h-11 items-center justify-center text-sm font-semibold text-ink-muted">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
