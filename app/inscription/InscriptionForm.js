'use client'

/**
 * app/inscription/InscriptionForm.js — Client Component
 *
 * Formulaire d'inscription, envoyé à la Server Action signUp
 * (app/auth/actions.js). Deux issues :
 *   - confirmation par email activée → message « Vérifie ta boîte mail » ;
 *   - sinon → l'action connecte l'utilisateur et le redirige.
 * Les règles (pseudo, mot de passe) sont rappelées sous chaque champ et
 * vérifiées sur le serveur : le navigateur ne fait que les afficher.
 */

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signUp } from '@/app/auth/actions'
import { TextField, FormError, SubmitButton } from '@/components/AuthForm'
import { MailIcon } from '@/components/icons'
import { safeNextPath } from '@/lib/redirection'

export default function InscriptionForm() {
  const searchParams = useSearchParams()
  const next = safeNextPath(searchParams.get('suivant'))
  const [state, formAction, pending] = useActionState(signUp, null)

  if (state?.sent) return <CheckYourEmail email={state.values.email} />

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="suivant" value={next} />

      <TextField
        label="Pseudo"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        minLength={3}
        maxLength={20}
        pattern="[A-Za-z0-9_\-]{3,20}"
        hint="3 à 20 caractères : lettres sans accent, chiffres, - ou _. Visible dans le classement."
        defaultValue={state?.values?.username}
      />
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
        autoComplete="new-password"
        required
        minLength={8}
        hint="8 caractères minimum."
      />

      <FormError message={state?.error} />

      <div className="flex flex-col gap-3 pt-2">
        <SubmitButton pending={pending} pendingLabel="Création du compte…">Créer mon compte</SubmitButton>
        <p className="typo-body-sm text-center text-ink-muted">
          Déjà un compte ?{' '}
          <Link
            href={`/connexion?suivant=${encodeURIComponent(next)}`}
            className="inline-flex min-h-11 items-center font-semibold text-brand-blue"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </form>
  )
}

/** Après l'inscription, quand Supabase demande de confirmer l'adresse email. */
function CheckYourEmail({ email }) {
  return (
    <div role="status" className="flex flex-col items-start gap-3 rounded-lg border border-line bg-surface-raised p-4">
      <span className="flex h-11 w-11 items-center justify-center rounded-sm bg-success-soft text-success">
        <MailIcon className="h-5.5 w-5.5" />
      </span>
      <h2 className="typo-title-md text-ink">Vérifie ta boîte mail</h2>
      <p className="typo-body text-ink-muted">
        Un lien de confirmation a été envoyé à <span className="font-semibold text-ink">{email}</span>.
        Ouvre-le pour activer ton compte : ta session s’ouvrira automatiquement.
      </p>
      <p className="typo-body-sm text-ink-muted">Rien reçu ? Regarde dans les courriers indésirables.</p>
    </div>
  )
}
