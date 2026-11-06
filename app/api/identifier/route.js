/**
 * app/api/identifier/route.js
 *
 * Route serveur : reçoit une image et retourne la reconnaissance Gemini.
 *
 * ⚠️  ACCÈS RESTREINT AU DÉVELOPPEMENT
 * Cette route appelle l'API Gemini et consomme notre quota.
 * En production (NODE_ENV === 'production'), elle renvoie 404 pour que
 * personne ne puisse s'en servir une fois le site en ligne.
 * Supprimer ce guard uniquement quand la gestion du quota et
 * l'authentification utilisateur seront en place (semaine 3+).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { loadCatalogue, identifyAircraft, THINKING_LEVEL, SERVICE_OVERLOADED } from '@/lib/identification';

// Types MIME acceptés (le navigateur peut envoyer du HEIC mais ne peut pas
// toujours l'afficher — la validation côté serveur reste nécessaire)
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
const VALID_THINKING_LEVELS = new Set(['low', 'medium', 'high']);

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

  const catalogue = await loadCatalogue();

  let result;
  try {
    result = await identifyAircraft(imageBase64, imageFile.type, catalogue, thinkingLevel);
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

  const duration_ms = Date.now() - startMs;

  // Nom de l'avion reconnu (depuis le catalogue déjà chargé)
  const matched = catalogue.find(a => a.id === result.aircraft_id);
  const aircraft_name = matched?.name ?? result.aircraft_id;

  // ── Fiches Supabase ───────────────────────────────────────────────────────
  // Récupère la fiche complète de l'avion reconnu + les 3 suggestions
  // pour les afficher dans la page labo sans appel supplémentaire côté client.
  // Si Supabase est indisponible ou la table vide, fichesById = {} et la carte
  // n'est simplement pas affichée — la reconnaissance reste fonctionnelle.
  let fichesById = {};
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const allIds = [...new Set([result.aircraft_id, ...(result.suggestions ?? [])])];

      const { data: fiches } = await supabase
        .from('aircraft')
        .select([
          'id', 'name', 'manufacturer', 'category', 'description',
          'first_flight', 'max_speed_kmh', 'length_m', 'wingspan_m',
          'units_built', 'rarity',
          'image_url', 'image_author', 'image_license',
          'image_license_url', 'image_source_url',
        ].join(', '))
        .in('id', allIds);

      if (fiches) {
        fichesById = Object.fromEntries(fiches.map(f => [f.id, f]));
      }
    }
  } catch (err) {
    // Supabase injoignable — les fiches seront absentes, l'appli reste utilisable
    console.warn('/api/identifier: fiches Supabase indisponibles :', err.message);
  }

  // La clé API n'apparaît jamais dans la réponse (elle est dans result côté lib seulement)
  return NextResponse.json({
    indices:      result.indices,
    aircraft_id:  result.aircraft_id,
    aircraft_name,
    confidence:   result.confidence,
    suggestions:  result.suggestions,
    fichesById,   // { aircraft_id: fiche, ... } — peut être vide si Supabase indisponible
    duration_ms,
    model_used:   result.model_used,
    attempts:     result.attempts,
  });
}
