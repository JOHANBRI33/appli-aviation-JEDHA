'use client'

/**
 * app/connexion/ConnexionForm.js — Client Component
 *
 * Formulaire de connexion. L'envoi passe par la Server Action signIn
 * (app/auth/actions.js) ; useActionState garde sa réponse (erreur, valeurs
 * saisies) et indique quand l'envoi est en cours.
 */

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from '@/app/auth/actions'
import { TextField, FormError, SubmitButton } from '@/components/AuthForm'
import { safeNextPath } from '@/lib/redirection'

// Messages affichés quand on arrive ici avec ?erreur=…
const URL_ERRORS = {
  lien: 'Ce lien de confirmation a expiré ou a déjà servi. Connecte-toi, ou inscris-toi à nouveau.',
}

export default function ConnexionForm() {
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get('suivant'))
  const [state, formAction, pending] = useActionState(signIn, null)

  const error = state?.error ?? URL_ERRORS[searchParams.get('erreur')]

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Page où revenir après la connexion */}
      <input type="hidden" name="suivant" value={next} />

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        defaultValue={state?.values?.email}
      />
      <TextField
        label="Mot de passe"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />

      <FormError message={error} />

      <div className="flex flex-col gap-3 pt-2">
        <SubmitButton pending={pending} pendingLabel="Connexion…">Se connecter</SubmitButton>
        <p className="typo-body-sm text-center text-ink-muted">
          Pas encore de compte ?{' '}
          <Link
            href={`/inscription?suivant=${encodeURIComponent(next)}`}
            className="inline-flex min-h-11 items-center font-semibold text-brand-blue"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </form>
  )
}
