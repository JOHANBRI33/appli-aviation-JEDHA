/**
 * lib/catalogue.js
 *
 * Lecture et ajout d'avions dans la table Supabase « aircraft », pour la
 * route /api/identifier :
 *   - findByNames : retrouve les avions dont Gemini a donné le nom ;
 *   - addToCatalogue : ajoute un avion trouvé sur Wikidata (verified = false).
 *
 * Serveur uniquement : l'ajout utilise la clé service_role.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/wikidata'

// Colonnes renvoyées au navigateur : toute la fiche, sauf les indices pour
// Gemini (recognition_hints, jamais affichés) et les horodatages.
const FICHE_COLUMNS = [
  'id', 'name', 'manufacturer', 'category', 'description',
  'first_flight', 'max_speed_kmh', 'length_m', 'wingspan_m', 'height_m',
  'range_km', 'ceiling_m', 'service_entry', 'retirement',
  'country_of_origin', 'engines', 'units_built', 'rarity',
  'image_url', 'image_author', 'image_license', 'image_license_url', 'image_source_url',
  'wikidata_id', 'enwiki_title', 'aliases', 'wikipedia_url', 'sources', 'verified',
].join(', ')

/**
 * Client pour lire la table : le client administrateur s'il est configuré,
 * sinon le client public (lecture des avions visibles, autorisée par la RLS).
 */
function readClient() {
  return createAdminClient() ?? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } },
  )
}

/**
 * Cherche dans la table les avions correspondant à des noms donnés par Gemini.
 * La colonne `aliases` contient, en minuscules, le titre Wikipédia anglais,
 * les libellés et les alias Wikidata : une seule requête suffit.
 *
 * @param {string[]} names - ex. ['Boeing 747', 'Airbus A380']
 * @returns {Promise<Map<string, object>>} nom en minuscules → fiche
 */
export async function findByNames(names) {
  const wanted = [...new Set(names.filter(Boolean).map(n => n.trim().toLowerCase()))]
  const found = new Map()
  if (wanted.length === 0) return found

  const { data, error } = await readClient()
    .from('aircraft')
    .select(FICHE_COLUMNS)
    .overlaps('aliases', wanted)      // au moins un nom en commun
    .eq('visible', true)
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`)

  for (const name of wanted) {
    const fiche = data.find(row => row.aliases.includes(name))
    if (fiche) found.set(name, fiche)
  }
  return found
}

/** Fiche d'un avion du catalogue par son numéro Wikidata, ou null. */
export async function findByWikidataId(wikidataId) {
  const { data, error } = await readClient()
    .from('aircraft')
    .select(FICHE_COLUMNS)
    .eq('wikidata_id', wikidataId)
    .eq('visible', true)
    .maybeSingle()
  if (error) throw new Error(`Lecture du catalogue impossible : ${error.message}`)
  return data
}

/**
 * Ajoute au catalogue un avion trouvé en direct sur Wikidata, marqué
 * verified = false (données non relues par l'équipe).
 *
 * L'identifiant court vient du titre Wikipédia anglais (« boeing-777 ») ;
 * s'il est déjà pris par un autre avion, on y ajoute le numéro Wikidata.
 *
 * @param {object} fiche - fiche construite par fetchAircraftFiche (lib/wikidata.js)
 * @param {string} [nameFromGemini] - nom donné par Gemini, ajouté aux alias
 * @returns {Promise<object | null>} la fiche enregistrée, ou null si la clé
 *          service_role n'est pas configurée
 */
export async function addToCatalogue(fiche, nameFromGemini) {
  const admin = createAdminClient()
  if (!admin) {
    console.warn('[catalogue] SUPABASE_SERVICE_ROLE_KEY absente : avion non ajouté au catalogue')
    return null
  }

  let id = slugify(fiche.enwiki_title ?? fiche.name)
  const { data: taken } = await admin.from('aircraft').select('id').eq('id', id).maybeSingle()
  if (taken) id = `${id}-${fiche.wikidata_id.toLowerCase()}`

  // Le nom donné par Gemini devient un alias : la prochaine photo du même
  // avion sera retrouvée directement dans la table
  const aliases = [...new Set([...fiche.aliases, nameFromGemini?.trim().toLowerCase()].filter(Boolean))]

  // ignoreDuplicates : si une autre requête vient d'ajouter le même avion
  // (même wikidata_id), on ne fait rien et on relit la ligne existante
  const { error } = await admin
    .from('aircraft')
    .upsert({ ...fiche, id, aliases, verified: false }, { onConflict: 'wikidata_id', ignoreDuplicates: true })
  if (error) throw new Error(`Ajout au catalogue impossible : ${error.message}`)

  return findByWikidataId(fiche.wikidata_id)
}
