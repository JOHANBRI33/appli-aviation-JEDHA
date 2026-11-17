'use client'

/**
 * components/AddToCollectionButton.js
 *
 * Bouton « Ajouter à ma collection » en bas d'une fiche avion : l'avion entre
 * dans l'onglet Collection du Hangar, sans photo et sans points.
 *
 * Appelle la Server Action addToCollection (app/hangar/actions.js), qui
 * redirige vers la fiche « depuis le Hangar » une fois l'avion ajouté.
 *
 * Props :
 *   aircraftId  {string}  identifiant du catalogue
 */

import { useActionState } from 'react'
import { addToCollection } from '@/app/hangar/actions'
import { FormError } from '@/components/AuthForm'
import { PlusIcon } from '@/components/icons'

export default function AddToCollectionButton({ aircraftId }) {
  // .bind : l'identifiant de l'avion est fixé ici, le formulaire n'envoie rien d'autre
  const [state, formAction, pending] = useActionState(addToCollection.bind(null, aircraftId), null)

  return (
    <form action={formAction} className="flex w-full flex-col gap-2.5">
      <FormError message={state?.error} />
      <button
        type="submit"
        disabled={pending}
        className="typo-label flex min-h-13.5 w-full items-center justify-center gap-2 rounded-md
                   bg-brand-blue px-5 text-on-brand active:bg-brand-blue-strong disabled:opacity-60"
      >
        <PlusIcon className="h-5 w-5" />
        {pending ? 'Ajout…' : 'Ajouter à ma collection'}
      </button>
    </form>
  )
}
