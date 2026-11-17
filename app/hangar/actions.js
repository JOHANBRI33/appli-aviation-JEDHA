'use server'

/**
 * app/hangar/actions.js — Server Actions du Hangar :
 * « Retirer de mon Hangar » et « Ajouter à ma collection »
 *
 * Supprime la capture d'un avion PUIS sa photo, avec la session de
 * l'utilisateur : la RLS n'autorise que ses propres lignes et fichiers.
 *
 * Pourquoi la ligne d'abord : si la photo ne peut pas être supprimée, il
 * reste un fichier invisible (que seul son auteur pourrait lire) ; dans
 * l'ordre inverse, il resterait une capture « vue en vrai » sans photo.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { chooseUsernameUrl, getCurrentUser } from '@/lib/auth'
import { PHOTO_BUCKET } from '@/lib/captures'
import { loginUrl } from '@/lib/redirection'

/**
 * @param {string} aircraftId avion à retirer (lié par .bind dans RemoveCaptureButton)
 * @returns {Promise<{ error: string } | never>} redirige vers /hangar en cas de succès
 */
export async function removeCapture(aircraftId) {
  // Une Server Action est une adresse publique : elle vérifie elle-même la session.
  const user = await getCurrentUser()
  if (!user) redirect(loginUrl('/hangar'))

  if (typeof aircraftId !== 'string' || aircraftId === '') {
    return { error: 'Avion inconnu.' }
  }

  const supabase = await createClient()

  // Suppression de la ligne ; .select renvoie le chemin de la photo supprimée.
  // Le filtre user_id double la RLS (et utilise l'index d'unicité).
  const { data: removed, error } = await supabase
    .from('captures')
    .delete()
    .eq('user_id', user.id)
    .eq('aircraft_id', aircraftId)
    .select('photo_path')
    .maybeSingle()

  if (error) {
    console.error('removeCapture : suppression impossible :', error.message)
    return { error: 'Le retrait a échoué. Réessaie dans un instant.' }
  }

  // Photo privée de la capture (seulement pour un avion vu en vrai)
  if (removed?.photo_path) {
    const { error: storageError } = await supabase.storage.from(PHOTO_BUCKET).remove([removed.photo_path])
    if (storageError) {
      // L'avion est bien retiré ; seul le fichier reste. On le note pour le nettoyer.
      console.error(`removeCapture : photo ${removed.photo_path} non supprimée :`, storageError.message)
    }
  }

  // Déjà retiré (double appui, autre onglet) : même issue, retour au Hangar
  redirect('/hangar')
}

// Une ligne existe déjà pour cet utilisateur et cet avion (contrainte unique)
const UNIQUE_VIOLATION = '23505'
// Clé étrangère absente : ici, un compte sans ligne dans profiles
const FOREIGN_KEY_VIOLATION = '23503'

/**
 * « Ajouter à ma collection » depuis une fiche : capture sans photo, 0 point.
 * Si l'avion est déjà dans le Hangar (collection ou vu en vrai), rien ne change.
 * Redirige ensuite vers la fiche « depuis le Hangar », qui montre l'état réel.
 *
 * @param {string} aircraftId identifiant du catalogue (lié par .bind dans AddToCollectionButton)
 * @returns {Promise<{ error: string } | never>}
 */
export async function addToCollection(aircraftId) {
  if (typeof aircraftId !== 'string' || aircraftId === '') {
    return { error: 'Avion inconnu.' }
  }
  const fichePath = `/avions/${encodeURIComponent(aircraftId)}`

  const user = await getCurrentUser()
  if (!user) redirect(loginUrl(fichePath))

  const supabase = await createClient()
  // user_id est rempli par la base (auth.uid()) ; la RLS vérifie le propriétaire
  const { error } = await supabase
    .from('captures')
    .insert({ aircraft_id: aircraftId, status: 'collection' })

  // Compte sans profil (clé étrangère captures.user_id → profiles.id)
  if (error?.code === FOREIGN_KEY_VIOLATION && /user_id/.test(error.message + error.details)) {
    redirect(chooseUsernameUrl(fichePath))
  }
  if (error && error.code !== UNIQUE_VIOLATION) {
    console.error('addToCollection : ajout impossible :', error.message)
    return { error: 'L’ajout à ta collection a échoué. Réessaie dans un instant.' }
  }

  redirect(`${fichePath}?depuis=hangar`)
}
