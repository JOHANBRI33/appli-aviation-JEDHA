'use server'

/**
 * app/hangar/actions.js — Server Action « Retirer de mon Hangar »
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
import { getCurrentUser } from '@/lib/auth'
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
