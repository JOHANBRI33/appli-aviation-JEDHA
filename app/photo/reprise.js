/**
 * app/photo/reprise.js — garder un résultat le temps de se reconnecter (navigateur)
 *
 * Cas rare : la session expire entre l'analyse et « Ajouter à mon Hangar ».
 * Avant d'envoyer l'utilisateur sur /connexion, on garde la photo réduite et
 * le résultat dans sessionStorage ; au retour sur /photo?reprise=1, l'écran
 * du résultat réapparaît sans relancer d'analyse (ni consommer de quota Gemini).
 *
 * sessionStorage peut être indisponible ou plein (navigation privée, quota) :
 * rien ne plante, l'écran propose alors simplement de reprendre la photo.
 * Les données restent dans l'onglet, et sont effacées dès qu'elles sont relues.
 */

const STORAGE_KEY = 'flight-hunter:capture-en-attente'

/**
 * Garde le résultat en cours.
 * @param {{ result: object, aircraftId: string, chosenByUser: boolean, place: string, photo: Blob }} pending
 * @returns {Promise<boolean>} false si sessionStorage est indisponible ou plein
 */
export async function savePending({ photo, ...rest }) {
  try {
    const photoDataUrl = await blobToDataUrl(photo)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, photoDataUrl }))
    return true
  } catch (error) {
    console.warn('Résultat non conservé (sessionStorage indisponible ou plein) :', error)
    return false
  }
}

/**
 * Relit puis efface le résultat gardé.
 * @returns {Promise<{ result: object, aircraftId: string, chosenByUser: boolean, place: string, photo: Blob } | null>}
 */
export async function takePending() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
    if (!raw) return null

    const { photoDataUrl, ...rest } = JSON.parse(raw)
    if (!rest.result || !rest.aircraftId || !photoDataUrl) return null
    const photo = await (await fetch(photoDataUrl)).blob()
    return { ...rest, photo }
  } catch (error) {
    console.warn('Résultat gardé illisible :', error)
    return null
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
