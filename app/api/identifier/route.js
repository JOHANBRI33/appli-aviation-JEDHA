/**
 * app/api/identifier/route.js
 *
 * Route serveur : reçoit une image, Gemini identifie librement l'avion
 * (sans catalogue), puis la fiche est récupérée sur Wikidata + Commons.
 *
 * ⚠️  ACCÈS RESTREINT AU DÉVELOPPEMENT
 * Cette route appelle l'API Gemini et consomme notre quota.
 * En production (NODE_ENV === 'production'), elle renvoie 404 pour que
 * personne ne puisse s'en servir une fois le site en ligne.
 * Supprimer ce guard uniquement quand la gestion du quota et
 * l'authentification utilisateur seront en place (semaine 3+).
 */

import { NextResponse } from 'next/server';
import { identifyAircraftFree, THINKING_LEVEL, SERVICE_OVERLOADED, UNKNOWN_ID } from '@/lib/identification';
import { fetchAircraftFiche } from '@/lib/wikidata';

// Types MIME acceptés (le navigateur peut envoyer du HEIC mais ne peut pas
// toujours l'afficher — la validation côté serveur reste nécessaire)
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const VALID_THINKING_LEVELS = new Set(['minimal', 'low', 'medium', 'high']);

export async function POST(request) {
  // ── Guard production ────────────────────────────────────────────────────────
  // Voir commentaire en haut de fichier.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Non disponible.' }, { status: 404 });
  }

  // ── Lecture du formulaire multipart ────────────────────────────────────────
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'La requête doit être de type multipart/form-data.' },
      { status: 400 }
    );
  }

  const imageFile = formData.get('image');
  if (!imageFile || typeof imageFile === 'string') {
    return NextResponse.json(
      { error: 'Champ « image » manquant dans le formulaire.' },
      { status: 400 }
    );
  }

  // ── Validation du type MIME ─────────────────────────────────────────────────
  if (!ACCEPTED_TYPES.has(imageFile.type)) {
    return NextResponse.json(
      {
        error: `Format non accepté : ${imageFile.type || 'inconnu'}. ` +
               'Formats supportés : JPEG, PNG, WebP, HEIC.',
      },
      { status: 415 }
    );
  }

  // ── Validation de la taille ─────────────────────────────────────────────────
  if (imageFile.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: `Image trop lourde (${(imageFile.size / 1024 / 1024).toFixed(1)} Mo). Maximum : 5 Mo.` },
      { status: 413 }
    );
  }

  // ── Niveau de réflexion (paramètre facultatif) ──────────────────────────────
  const thinkingLevelParam = formData.get('thinkingLevel');
  const thinkingLevel =
    thinkingLevelParam && VALID_THINKING_LEVELS.has(thinkingLevelParam)
      ? thinkingLevelParam
      : THINKING_LEVEL; // défaut défini dans lib/identification.js

  // ── Appel à Gemini ──────────────────────────────────────────────────────────
  const startMs = Date.now();

  let imageBase64;
  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    imageBase64 = Buffer.from(arrayBuffer).toString('base64');
  } catch {
    return NextResponse.json(
      { error: 'Impossible de lire le fichier image.' },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await identifyAircraftFree(imageBase64, imageFile.type, thinkingLevel);
  } catch (err) {
    const msg = err.message ?? 'Erreur inconnue.';

    // Gemini saturé après tous les essais (détail technique déjà dans la console)
    if (err.code === SERVICE_OVERLOADED) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    // Quota dépassé
    if (msg.includes('Quota') || msg.includes('quota')) {
      return NextResponse.json({ error: msg }, { status: 429 });
    }
    // Modèle indisponible sur le palier gratuit
    if (msg.includes('palier gratuit')) {
      return NextResponse.json({ error: msg }, { status: 503 });
    }
    // Toute autre erreur Gemini
    return NextResponse.json(
      { error: `Erreur lors de l'analyse : ${msg}` },
      { status: 502 }
    );
  }

  const gemini_ms = Date.now() - startMs;
  console.log(`/api/identifier: réponse de ${result.model_used} en ${gemini_ms} ms (${result.attempts} tentative(s))`);

  // Aucun avion visible sur la photo : pas de recherche Wikidata
  if (result.aircraft_name === UNKNOWN_ID) {
    return NextResponse.json({
      indices:       result.indices,
      aircraft_id:   UNKNOWN_ID,
      aircraft_name: 'Avion non reconnu',
      confidence:    result.confidence,
      suggestions:   [],
      fichesById:    {},
      duration_ms:   gemini_ms,
      model_used:    result.model_used,
      attempts:      result.attempts,
    });
  }

  // ── Fiche Wikidata ────────────────────────────────────────────────────────
  // Seulement pour l'avion choisi par Gemini : Wikidata bloque les appels
  // trop nombreux. Les suggestions restent de simples noms.
  let fiche = null;
  try {
    fiche = await fetchAircraftFiche(result.aircraft_name, result.category);
  } catch (err) {
    // Wikidata injoignable : on renvoie quand même le nom donné par Gemini
    console.warn(`/api/identifier: fiche Wikidata indisponible pour « ${result.aircraft_name} » :`, err.message);
  }

  // L'avion est désigné par son numéro Wikidata (ex. Q6475) s'il a été
  // trouvé, sinon par le nom donné par Gemini.
  const aircraft_id = fiche?.id ?? result.aircraft_name;
  const fichesById = fiche ? { [fiche.id]: fiche } : {};
  const suggestions = [...new Set([
    aircraft_id,
    ...result.suggestions.filter(name => name !== result.aircraft_name),
  ])].slice(0, 3);

  const duration_ms = Date.now() - startMs;
  console.log(`/api/identifier: fiche Wikidata en ${duration_ms - gemini_ms} ms`);

  // La clé API n'apparaît jamais dans la réponse (elle reste dans lib/identification.js)
  return NextResponse.json({
    indices:       result.indices,
    aircraft_id,
    aircraft_name: fiche?.name ?? result.aircraft_name,
    confidence:    result.confidence,
    suggestions,
    fichesById,    // { id: fiche } — vide si Wikidata n'a rien trouvé
    duration_ms,
    model_used:    result.model_used,
    attempts:      result.attempts,
  });
}
