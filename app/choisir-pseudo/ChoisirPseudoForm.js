'use client'

/**
 * app/choisir-pseudo/ChoisirPseudoForm.js — Client Component
 *
 * Formulaire du pseudo, envoyé à la Server Action chooseUsername
 * (app/auth/actions.js). Mêmes règles qu'à l'inscription, vérifiées sur le
 * serveur : le navigateur ne fait que les afficher.
 *
 * Props :
 *   next  {string}  page où revenir une fois le pseudo choisi (déjà filtrée)
 */

import { useActionState } from 'react'
import { chooseUsername } from '@/app/auth/actions'
import { TextField, FormError, SubmitButton } from '@/components/AuthForm'

export default function ChoisirPseudoForm({ next }) {
  const [state, formAction, pending] = useActionState(chooseUsername, null)

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

      <FormError message={state?.error} />

      <div className="pt-2">
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">Valider mon pseudo</SubmitButton>
      </div>
    </form>
  )
}
