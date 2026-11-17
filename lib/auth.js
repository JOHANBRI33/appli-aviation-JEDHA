import 'server-only'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginUrl } from '@/lib/redirection'

/**
 * lib/auth.js — qui est connecté ? (serveur uniquement)
 *
 * Toutes les pages et routes passent par ici pour lire la session, au lieu
 * de faire confiance au seul proxy.js. getClaims() vérifie la signature du
 * jeton : un cookie bricolé est refusé.
 *
 * Avec cacheComponents, lire la session (donc les cookies) n'est possible
 * qu'à l'intérieur d'un <Suspense> : appeler ces fonctions dans un composant
 * enveloppé par Suspense, jamais au premier niveau d'une page.
 */

/**
 * Utilisateur connecté, ou null.
 * @returns {Promise<{ id: string, email: string | null, username: string | null } | null>}
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  return {
    id: claims.sub,
    email: claims.email ?? null,
    // Pseudo transmis à l'inscription (copié dans la table profiles par le trigger)
    username: claims.user_metadata?.username ?? null,
  }
}

/**
 * Utilisateur connecté, sinon redirection vers /connexion, qui ramènera
 * ensuite à `nextPath`.
 * @param {string} nextPath page où revenir après la connexion
 */
export async function requireUser(nextPath) {
  const user = await getCurrentUser()
  if (!user) redirect(loginUrl(nextPath))
  return user
}
