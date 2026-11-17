/**
 * app/choisir-pseudo/page.js — Server Component
 *
 * Écran « Choisis ton pseudo » pour un compte connecté qui n'a pas de profil
 * (compte créé avant la migration 003). Sans profil, rien ne peut entrer
 * dans le Hangar : /hangar, /photo et « Ajouter à ma collection » renvoient
 * ici (lib/auth.js, requireProfile et chooseUsernameUrl).
 *
 * Le profil est créé par la Server Action chooseUsername (app/auth/actions.js),
 * puis l'utilisateur revient à la page d'où il venait (?suivant=).
 */

import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import SkyBackground from '@/components/SkyBackground'
import { getMyProfile, requireUser } from '@/lib/auth'
import { safeNextPath } from '@/lib/redirection'
import ChoisirPseudoForm from './ChoisirPseudoForm'

export const metadata = { title: 'Choisis ton pseudo — Flight Hunter' }

export default function ChoisirPseudoPage({ searchParams }) {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      <header className="flex flex-col gap-0.5 pb-6">
        <h1 className="typo-title-lg text-ink">Choisis ton pseudo</h1>
        <p className="text-sm text-ink-muted">
          Il manque un pseudo à ton compte. C’est le seul nom visible des autres, dans le classement.
        </p>
      </header>

      {/* Lire la session = lire les cookies : seulement dans un <Suspense> */}
      <Suspense fallback={null}>
        <ChoisirPseudoContent searchParams={searchParams} />
      </Suspense>
    </main>
  )
}

async function ChoisirPseudoContent({ searchParams }) {
  const { suivant } = await searchParams
  const next = safeNextPath(suivant)

  const user = await requireUser(`/choisir-pseudo?suivant=${encodeURIComponent(next)}`)
  // Profil déjà là (pseudo choisi dans un autre onglet…) : rien à faire ici
  if (await getMyProfile(user.id)) redirect(next)

  return <ChoisirPseudoForm next={next} />
}
