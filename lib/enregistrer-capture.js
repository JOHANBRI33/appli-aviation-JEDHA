/**
 * lib/enregistrer-capture.js — « Ajouter à mon Hangar » après une photo (navigateur)
 *
 * L'envoi de la photo et la création de la capture se font depuis le
 * navigateur, avec la session de l'utilisateur : la RLS de la table captures
 * et du bucket « captures » ne l'autorise qu'à écrire chez lui. Pas de clé
 * service_role (décision d'équipe, feat/utilisateurs).
 *
 * Étapes :
 *   1. l'avion est-il déjà dans le Hangar ?
 *      - déjà vu en vrai → rien n'est envoyé, on garde la première photo
 *        (« Déjà dans ton Hangar », aucun point) ;
 *      - dans la collection → il passe en « vu en vrai », avec les points ;
 *   2. envoi de la photo, sans upsert : une photo existante n'est jamais écrasée ;
 *   3. création de la capture « seen » (ou passage collection → seen) ; si la
 *      base refuse, la photo envoyée est supprimée (pas de fichier orphelin).
 *
 * Réseau faible (meeting aérien) : chaque appel a un délai maximum. Le nom
 * de la photo vient de `attemptId`, fixé une fois par photo : un nouvel essai
 * réutilise le même nom. Si un essai précédent avait en fait abouti, on le
 * reconnaît (fichier déjà présent, capture qui pointe vers cette photo) au
 * lieu de créer un doublon ou d'annoncer « déjà vu » à tort.
 */

import { createClient } from '@/lib/supabase/client'

// Bucket privé des photos (supabase/migrations/003_users.sql)
const PHOTO_BUCKET = 'captures'

// Délais maximum : lecture et écriture en base, envoi de la photo (~200 Ko)
const DB_TIMEOUT_MS = 15_000
const UPLOAD_TIMEOUT_MS = 30_000

// Une ligne existe déjà pour cet avion (code Postgres)
const UNIQUE_VIOLATION = '23505'

const NETWORK_MESSAGE = 'Réseau trop faible : ta photo n’a pas pu être envoyée. Réessaie.'
const SERVER_MESSAGE = 'L’ajout à ton Hangar a échoué. Réessaie dans un instant.'

/**
 * Identifiant aléatoire pour le nom de la photo. crypto.randomUUID n'existe
 * que sur une adresse sécurisée (https ou localhost) : sur un téléphone qui
 * teste en http://192.168.x.x, on le fabrique avec getRandomValues.
 */
export function newAttemptId() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Enregistre un avion vu en vrai dans le Hangar de l'utilisateur connecté.
 *
 * @param {object} capture
 * @param {string} capture.aircraftId   identifiant du catalogue (ex. « rafale »)
 * @param {Blob}   capture.photo        photo réduite (JPEG)
 * @param {string} capture.attemptId    fixé une fois par photo (newAttemptId)
 * @param {string} [capture.place]      lieu en texte libre (facultatif)
 * @param {number|null} [capture.confidence] confiance de Gemini (0 à 1), null si choisi par l'utilisateur
 * @returns {Promise<
 *   { status: 'added' } |            // vu en vrai pour la première fois : points gagnés
 *   { status: 'already-seen' } |     // déjà vu en vrai : rien n'a changé
 *   { status: 'logged-out' } |       // session expirée : il faut se reconnecter
 *   { status: 'error', message: string }
 * >}
 */
export async function saveSeenCapture({ aircraftId, photo, attemptId, place, confidence }) {
  try {
    return await save({ aircraftId, photo, attemptId, place, confidence })
  } catch (error) {
    // Délai dépassé ou coupure réseau : rien n'est supprimé, car l'envoi a
    // peut-être abouti. Le nouvel essai le reconnaîtra (même attemptId).
    console.warn('saveSeenCapture : réseau', error)
    return { status: 'error', message: NETWORK_MESSAGE }
  }
}

async function save({ aircraftId, photo, attemptId, place, confidence }) {
  const supabase = createClient()

  // getUser() interroge Supabase : une session expirée est bien détectée
  const { data: { user } = {} } = await withTimeout(supabase.auth.getUser(), DB_TIMEOUT_MS)
  if (!user) return { status: 'logged-out' }

  const photoPath = `${user.id}/${attemptId}.jpg`

  // 1. Déjà dans le Hangar ?
  const existing = await findCapture(supabase, aircraftId)
  if (existing.error) return failure('lecture du Hangar', existing.error)
  if (existing.capture?.status === 'seen') {
    // Capture créée par un essai précédent de CETTE photo : c'est bien un ajout
    return { status: existing.capture.photo_path === photoPath ? 'added' : 'already-seen' }
  }

  // 2. Envoi de la photo. Jamais d'écrasement (et le bucket n'a pas de
  //    politique UPDATE : un upsert serait refusé de toute façon). « Déjà
  //    présente » = envoyée par un essai précédent : on continue.
  const { error: uploadError } = await withTimeout(
    supabase.storage
      .from(PHOTO_BUCKET)
      .upload(photoPath, photo, { contentType: 'image/jpeg', upsert: false }),
    UPLOAD_TIMEOUT_MS,
  )
  if (uploadError && !isAlreadyUploaded(uploadError)) return failure('envoi de la photo', uploadError)

  // 3. Capture « vu en vrai ». Lieu vide → null ; user_id et seen_at sont
  //    remplis par la base (valeur par défaut et trigger).
  const fields = {
    status: 'seen',
    photo_path: photoPath,
    place: place?.trim() ? place.trim().slice(0, 120) : null,
    confidence: typeof confidence === 'number' ? Math.round(confidence * 100) / 100 : null,
  }

  const { error: saveError } = await withTimeout(
    existing.capture
      ? supabase                       // dans la collection → vu en vrai
          .from('captures')
          .update(fields)
          .eq('user_id', user.id)
          .eq('aircraft_id', aircraftId)
      : supabase
          .from('captures')
          .insert({ aircraft_id: aircraftId, ...fields }),
    DB_TIMEOUT_MS,
  )

  if (!saveError) return { status: 'added' }

  // La base a refusé : on supprime la photo qu'on vient d'envoyer
  await removePhoto(supabase, photoPath)

  // Vu en vrai entre-temps (autre onglet) : on relit l'état réel
  if (saveError.code === UNIQUE_VIOLATION || saveError.message?.includes('déjà vu en vrai')) {
    const again = await findCapture(supabase, aircraftId)
    if (again.capture?.status === 'seen') return { status: 'already-seen' }
  }
  return failure('création de la capture', saveError)
}

/** Capture de cet avion dans le Hangar (RLS : seulement celles de l'utilisateur). */
async function findCapture(supabase, aircraftId) {
  const { data, error } = await withTimeout(
    supabase.from('captures').select('status, photo_path').eq('aircraft_id', aircraftId).maybeSingle(),
    DB_TIMEOUT_MS,
  )
  return { capture: data, error }
}

/** Le fichier existe déjà (409) : il vient d'un essai précédent avec le même nom. */
function isAlreadyUploaded(error) {
  return String(error.statusCode) === '409' || /already exists/i.test(error.message ?? '')
}

/** Supprime une photo envoyée ; un échec est seulement noté (fichier invisible des autres). */
async function removePhoto(supabase, photoPath) {
  try {
    const { error } = await withTimeout(supabase.storage.from(PHOTO_BUCKET).remove([photoPath]), DB_TIMEOUT_MS)
    if (error) console.error(`saveSeenCapture : photo ${photoPath} non supprimée :`, error.message)
  } catch (error) {
    console.error(`saveSeenCapture : photo ${photoPath} non supprimée :`, error)
  }
}

/** Rejette la promesse si elle dépasse `ms` millisecondes. */
function withTimeout(promise, ms) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Délai dépassé (${ms} ms)`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

function failure(step, error) {
  console.error(`saveSeenCapture : échec (${step}) :`, error.message)
  // supabase-js renvoie une coupure réseau comme une erreur (« Failed to fetch »)
  const network = /fetch|network/i.test(error.message ?? '')
  return { status: 'error', message: network ? NETWORK_MESSAGE : SERVER_MESSAGE }
}
