/**
 * app/connexion/page.js — Server Component
 *
 * Écran « Connexion » : email + mot de passe.
 * Le formulaire (composant client) lit l'adresse (?suivant=, ?erreur=) :
 * il est donc placé dans un <Suspense>, le reste de la page est statique.
 */

import { Suspense } from 'react'
import SkyBackground from '@/components/SkyBackground'
import ConnexionForm from './ConnexionForm'

export const metadata = { title: 'Connexion — Flight Hunter' }

export default function ConnexionPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <header className="flex flex-col gap-0.5 pb-6">
        <h1 className="typo-title-lg text-ink">Connexion</h1>
        <p className="text-sm text-ink-muted">Retrouve ton Hangar et tes points.</p>
      </header>

      <Suspense fallback={null}>
        <ConnexionForm />
      </Suspense>
    </main>
  )
}
