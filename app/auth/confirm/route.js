/**
 * app/auth/confirm/route.js — retour du lien de confirmation reçu par email
 *
 * Après l'inscription, Supabase envoie un mail dont le lien arrive ici.
 * On échange le contenu du lien contre une session (l'utilisateur est alors
 * connecté), puis on l'envoie sur son Hangar.
 *
 * Deux formes de lien sont acceptées :
 *   - ?token_hash=…&type=email : modèle d'email personnalisé (recommandé),
 *     marche même si le mail est ouvert sur un autre appareil ;
 *   - ?code=… : modèle d'email par défaut de Supabase (PKCE), ne marche que
 *     dans le navigateur qui a servi à s'inscrire.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { safeNextPath } from '@/lib/redirection'

// Types de lien gérés ici (inscription uniquement pour le MVP)
const ACCEPTED_TYPES = new Set(['email', 'signup'])

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const code = searchParams.get('code')
  const next = safeNextPath(searchParams.get('suivant'))

  const supabase = await createClient()
  let error = null

  if (tokenHash && ACCEPTED_TYPES.has(type)) {
    ;({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  } else if (code) {
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else {
    error = { message: 'lien incomplet' }
  }

  if (error) {
    console.warn('/auth/confirm : lien refusé :', error.message)
    // Lien expiré, déjà utilisé ou ouvert dans un autre navigateur
    redirect('/connexion?erreur=lien')
  }

  redirect(next)
}
