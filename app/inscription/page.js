/**
 * app/inscription/page.js — Server Component
 *
 * Écran « Créer un compte » : pseudo, email, mot de passe.
 * Le pseudo est la seule information visible des autres (classement).
 */

import { Suspense } from 'react'
import SkyBackground from '@/components/SkyBackground'
import InscriptionForm from './InscriptionForm'

export const metadata = { title: 'Créer un compte — Flight Hunter' }

export default function InscriptionPage() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <header className="flex flex-col gap-0.5 pb-6">
        <h1 className="typo-title-lg text-ink">Créer un compte</h1>
        <p className="text-sm text-ink-muted">Garde tes avions dans ton Hangar et gagne des points.</p>
      </header>

      <Suspense fallback={null}>
        <InscriptionForm />
      </Suspense>
    </main>
  )
}
