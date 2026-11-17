import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * lib/captures.js — les avions du Hangar de l'utilisateur connecté (serveur uniquement)
 *
 * Tout passe par la session de l'utilisateur (client lib/supabase/server.js) :
 * la RLS de la table captures et du bucket « captures » ne lui laisse voir
 * que ses propres lignes et photos. Pas de clé service_role ici.
 *
 * Pas de 'use cache' : ces lectures dépendent des cookies. Les appeler dans
 * un composant enveloppé par <Suspense>, après requireUser (lib/auth.js).
 */

// Bucket privé des photos (supabase/migrations/003_users.sql)
export const PHOTO_BUCKET = 'captures'

// Durée de validité d'une adresse de photo : 1 heure. Passé ce délai,
// l'adresse ne marche plus ; la page en crée de nouvelles à chaque affichage.
const SIGNED_URL_SECONDS = 60 * 60

const CAPTURE_COLUMNS = 'id, aircraft_id, status, photo_path, place, confidence, seen_at, created_at'

/**
 * Toutes les captures de l'utilisateur connecté, les plus récentes d'abord.
 * @returns {Promise<Array<{ id: string, aircraft_id: string, status: 'seen' | 'collection',
 *   photo_path: string | null, place: string | null, confidence: number | null,
 *   seen_at: string | null, created_at: string }>>}
 */
export async function getMyCaptures() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('captures')
    .select(CAPTURE_COLUMNS)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Lecture du Hangar impossible : ${error.message}`)
  return data
}

/**
 * Capture d'un avion dans le Hangar de l'utilisateur connecté, ou null.
 * @param {string} aircraftId identifiant du catalogue (ex. « rafale »)
 */
export async function getMyCapture(aircraftId) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('captures')
    .select(CAPTURE_COLUMNS)
    .eq('aircraft_id', aircraftId)
    .maybeSingle()

  if (error) throw new Error(`Lecture de la capture « ${aircraftId} » impossible : ${error.message}`)
  return data
}

/**
 * Adresses temporaires (1 h) des photos privées, en un seul appel.
 * Une photo introuvable n'empêche pas la page de s'afficher : elle est
 * simplement absente du résultat (la vignette montre alors l'avion dessiné).
 *
 * @param {string[]} paths chemins dans le bucket (<user_id>/<fichier>)
 * @returns {Promise<Map<string, string>>} chemin → adresse signée
 */
export async function signPhotoUrls(paths) {
  const urls = new Map()
  const wanted = paths.filter(Boolean)
  if (wanted.length === 0) return urls

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .createSignedUrls(wanted, SIGNED_URL_SECONDS)

  if (error) {
    console.warn('signPhotoUrls : adresses des photos indisponibles :', error.message)
    return urls
  }
  for (const item of data) {
    if (item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  }
  return urls
}

/**
 * Date d'une prise de vue, en heure de Paris (« 14 juin 2026 »).
 * Le fuseau est fixé pour que le serveur (Vercel, en UTC) et le téléphone
 * affichent le même jour.
 */
export const seenDateFr = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris',
})
