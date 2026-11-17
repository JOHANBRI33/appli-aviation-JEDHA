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
 * Le pseudo n'est pas ici : il se lit dans la table profiles (getMyProfile),
 * seule source à jour (les métadonnées d'inscription ne bougent plus).
 * @returns {Promise<{ id: string, email: string | null } | null>}
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null

  return { id: claims.sub, email: claims.email ?? null }
}

/**
 * Profil public de l'utilisateur connecté (son pseudo), ou null.
 * Colonnes nommées : un select('*') sur profiles est refusé (droits par colonne).
 * @param {string} userId identifiant renvoyé par getCurrentUser / requireUser
 * @returns {Promise<{ id: string, username: string } | null>}
 */
export async function getMyProfile(userId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(`Lecture du profil impossible : ${error.message}`)
  return data
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

/** Adresse de l'écran « Choisis ton pseudo », qui ramènera ensuite à `nextPath`. */
export function chooseUsernameUrl(nextPath) {
  return `/choisir-pseudo?suivant=${encodeURIComponent(nextPath)}`
}

/**
 * Utilisateur connecté ET son profil. Sans session → /connexion ; compte
 * sans profil (créé avant la migration 003) → /choisir-pseudo. Sans
 * profil, rien ne peut entrer dans le Hangar (captures.user_id → profiles.id).
 * @param {string} nextPath page où revenir ensuite
 * @returns {Promise<{ user: { id: string, email: string | null }, profile: { id: string, username: string } }>}
 */
export async function requireProfile(nextPath) {
  const user = await requireUser(nextPath)
  const profile = await getMyProfile(user.id)
  if (!profile) redirect(chooseUsernameUrl(nextPath))
  return { user, profile }
}
