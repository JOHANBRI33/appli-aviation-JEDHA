/**
 * components/AuthForm.js
 *
 * Briques communes aux écrans /connexion et /inscription :
 * champ de saisie, message d'erreur, bouton principal.
 * Pas de 'use client' : ces composants n'ont pas d'état, ils peuvent être
 * utilisés côté serveur comme côté navigateur.
 */

import { CircleAlertIcon } from '@/components/icons'

/**
 * Champ de formulaire avec son libellé au-dessus (et une aide facultative).
 * Les autres props (type, autoComplete, required…) vont à l'<input>.
 */
export function TextField({ label, name, hint, ...inputProps }) {
  const hintId = hint ? `${name}-aide` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[13px] font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-describedby={hintId}
        className="typo-body-lg h-13 rounded-md border-[1.5px] border-line bg-surface-raised px-3.5
                   text-ink outline-none placeholder:text-ink-muted focus:border-ink"
        {...inputProps}
      />
      {hint && <p id={hintId} className="typo-body-sm text-ink-muted">{hint}</p>}
    </div>
  )
}

/** Message d'erreur (toujours une icône et un texte, jamais la couleur seule). */
export function FormError({ message }) {
  if (!message) return null
  return (
    <p role="alert" className="typo-body-sm flex items-start gap-2 text-danger">
      <CircleAlertIcon className="mt-0.5 h-4 w-4" />
      {message}
    </p>
  )
}

/** Bouton principal du formulaire (une seule action principale par écran). */
export function SubmitButton({ pending, children, pendingLabel }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="typo-label flex h-13.5 w-full items-center justify-center rounded-md bg-brand-blue
                 px-5 text-on-brand active:bg-brand-blue-strong disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  )
}
