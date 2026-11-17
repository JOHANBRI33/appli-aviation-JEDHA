'use client'

/**
 * components/RemoveCaptureButton.js
 *
 * Bouton « Retirer de mon Hangar » en deux temps : un premier appui affiche
 * ce que l'utilisateur va perdre, le second confirme. (Pas de fenêtre
 * confirm() du navigateur : elle est peu lisible sur téléphone.)
 *
 * Appelle la Server Action removeCapture (app/hangar/actions.js), qui
 * redirige vers le Hangar une fois l'avion retiré.
 *
 * Props :
 *   aircraftId  {string}  avion à retirer
 *   points      {number}  points perdus (0 pour un avion en collection)
 */

import { useActionState, useState } from 'react'
import { removeCapture } from '@/app/hangar/actions'
import { FormError } from '@/components/AuthForm'

export default function RemoveCaptureButton({ aircraftId, points }) {
  const [confirming, setConfirming] = useState(false)
  // .bind : l'identifiant de l'avion est fixé ici, le formulaire n'envoie rien d'autre
  const [state, formAction, pending] = useActionState(removeCapture.bind(null, aircraftId), null)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-11 text-sm font-semibold text-danger"
      >
        Retirer de mon Hangar
      </button>
    )
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2.5">
      <p className="typo-body-sm text-ink">
        {points > 0
          ? `Tu perdras ${points} pts et ta photo sera supprimée.`
          : 'L’avion quittera ta collection.'}
      </p>
      <FormError message={state?.error} />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="typo-label min-h-11 flex-1 rounded-md border border-line bg-surface-raised text-ink"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="typo-label min-h-11 flex-1 rounded-md border-[1.5px] border-danger text-danger disabled:opacity-60"
        >
          {pending ? 'Retrait…' : 'Oui, retirer'}
        </button>
      </div>
    </form>
  )
}
