/**
 * lib/identification.js
 *
 * Logique de reconnaissance d'avions par Gemini.
 * Utilisé par :
 *   - scripts/test-vision/run.js (script Node.js de test)
 *   - app/api/identifier/route.js (route serveur Next.js)
 *
 * Ce module ne tourne QUE côté serveur : il lit VISION_API_KEY depuis
 * les variables d'environnement et ne doit jamais être importé côté client.
 * L'import 'server-only' ci-dessous fait échouer le build Next.js si
 * quelqu'un essaie de l'importer dans un composant navigateur par erreur.
 */
import 'server-only';

import { GoogleGenAI, Type } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// ─── CONSTANTES FACILES À MODIFIER ───────────────────────────────────────────
// Choix mesuré le 09/11/2026 sur 18 photos (3 réelles + 15 du catalogue) :
//   gemini-3.5-flash-lite (minimal) : 17/18 justes, 0 erreur de réponse, médiane 1,2 s
//   gemini-3.1-flash-lite (minimal) : 16/18 justes, médiane 2,1 s
//   gemini-3.6-flash      (minimal) : 13/18, 5 erreurs 503/504, médiane 5 s
//   gemini-3.8-flash      (low)     : 0/18, saturé (503/504) sur toutes les photos
export const MODEL = 'gemini-3.5-flash-lite';      // changer de modèle ici
export const FALLBACK_MODEL = 'gemini-3.1-flash-lite'; // autre modèle, autre file d'attente chez Google
export const THINKING_LEVEL = 'minimal';   // 'minimal' | 'low' | 'medium' | 'high'
const HEDGE_DELAY_MS = 5_000;             // si MODEL n'a pas répondu, on lance aussi FALLBACK_MODEL
const REQUEST_TIMEOUT_MS = 15_000;        // durée maximale d'un appel à Gemini
const CATALOGUE_CACHE_MS = 5 * 60_000;    // le catalogue est gardé en mémoire 5 minutes

// Réponse attendue quand l'avion n'est pas dans le catalogue
export const UNKNOWN_ID = 'inconnu';
// ─────────────────────────────────────────────────────────────────────────────

// Code porté par l'erreur quand tous les essais ont échoué pour cause de saturation.
// La route API s'en sert pour répondre avec un statut 503.
export const SERVICE_OVERLOADED = 'SERVICE_OVERLOADED';

// ─── CATALOGUE ───────────────────────────────────────────────────────────────

/**
 * Charge le catalogue d'avions depuis Supabase (avions visibles uniquement).
 * Utilise la clé publique (anon) — la RLS autorise la lecture par tous.
 *
 * En cas d'erreur ou de table vide, bascule sur scripts/test-vision/catalogue.json
 * avec un avertissement dans la console.
 *
 * @returns {Promise<Array<{id, name, manufacturer, recognition_hints}>>}
 */
let catalogueCache = null;   // { data, loadedAt } — évite un appel Supabase par photo

export async function loadCatalogue() {
  if (catalogueCache && Date.now() - catalogueCache.loadedAt < CATALOGUE_CACHE_MS) {
    return catalogueCache.data;
  }
  const data = await fetchCatalogue();
  catalogueCache = { data, loadedAt: Date.now() };
  return data;
}

async function fetchCatalogue() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data, error } = await supabase
        .from('aircraft')
        .select('id, name, manufacturer, recognition_hints')
        .eq('visible', true)
        .order('id');

      if (!error && data && data.length > 0) {
        return data; // succès : catalogue depuis Supabase
      }

      if (error) {
        console.warn('[identification] Supabase :', error.message, '→ fallback catalogue.json');
      } else {
        console.warn('[identification] Supabase : table vide → fallback catalogue.json');
      }
    } catch (err) {
      console.warn('[identification] Supabase injoignable → fallback catalogue.json :', err.message);
    }
  } else {
    console.warn('[identification] Supabase non configuré → fallback catalogue.json');
  }

  // Fallback : fichier JSON local (données de développement)
  const cataloguePath = path.join(process.cwd(), 'scripts/test-vision/catalogue.json');
  return JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
}

// ─── SCHÉMA DE RÉPONSE JSON ──────────────────────────────────────────────────

// Schéma imposé à l'API Gemini pour garantir un JSON structuré valide.
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    indices: {
      type: Type.STRING,
      description: 'Description en 1-2 phrases des indices visuels observés',
    },
    aircraft_id: {
      type: Type.STRING,
      description: 'id choisi parmi le catalogue fourni',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confiance entre 0 et 1',
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 ids du catalogue par ordre de probabilité décroissante',
    },
  },
  required: ['indices', 'aircraft_id', 'confidence', 'suggestions'],
};

// ─── CONSTRUCTION DU PROMPT ──────────────────────────────────────────────────

function buildPrompt(catalogue) {
  const catalogueList = catalogue
    // recognition_hints vient de Supabase ; description vient du fallback catalogue.json
    .map(a => `- id: ${a.id}  |  ${a.name} (${a.manufacturer})  |  ${a.recognition_hints ?? a.description ?? ''}`)
    .join('\n');

  return `Tu es un expert en identification d'aéronefs.

1. INDICES VISUELS : en une phrase, les indices observés (moteurs, ailes,
   dérive, train, cocardes ou livrée).

2. IDENTIFICATION : choisis l'id parmi le catalogue ci-dessous.
   Si l'avion n'y figure pas, ou si aucun avion n'est visible, réponds "${UNKNOWN_ID}"
   plutôt que de choisir l'avion le plus ressemblant.

Catalogue :
${catalogueList}

Remplis suggestions avec les 3 ids du catalogue les plus probables.`;
}

// ─── APPEL EN PARALLÈLE (MODÈLE PRINCIPAL + SECOURS) ─────────────────────────

// Saturation (500/503) ou délai dépassé (AbortError de notre côté, 504 côté Google)
function isOverloadError(err) {
  return [500, 503, 504].includes(err?.status) || err?.name === 'AbortError';
}

/**
 * Lance MODEL. Si MODEL échoue, ou n'a pas répondu après HEDGE_DELAY_MS,
 * lance aussi FALLBACK_MODEL. La première réponse valide gagne et l'autre
 * appel est annulé. Temps maximal : HEDGE_DELAY_MS + REQUEST_TIMEOUT_MS.
 *
 * @param {(model: string, signal: AbortSignal) => Promise} generate
 * @returns {Promise<{ response, model_used, attempts }>}
 * @throws  Error avec le code SERVICE_OVERLOADED si les deux modèles sont saturés
 */
function generateFastest(generate) {
  return new Promise((resolve, reject) => {
    const controllers = [];
    let failures = 0;
    let lastError;
    let done = false;

    const launch = model => {
      const controller = new AbortController();
      controllers.push(controller);
      generate(model, controller.signal).then(
        response => {
          if (done) return;
          done = true;
          clearTimeout(hedgeTimer);
          controllers.forEach(c => c !== controller && c.abort()); // annule l'autre appel
          resolve({ response, model_used: model, attempts: controllers.length });
        },
        err => {
          if (done) return;
          failures++;
          lastError = err;
          console.warn(`[identification] ${model} : échec (${err?.status ?? err?.name})`);
          if (controllers.length === 1) {
            launchFallback();                      // MODEL a échoué : secours tout de suite
          } else if (failures === controllers.length) {
            done = true;
            reject(lastError);                     // les deux ont échoué
          }
        }
      );
    };

    const launchFallback = () => {
      clearTimeout(hedgeTimer);
      if (controllers.length === 1) launch(FALLBACK_MODEL);
    };

    const hedgeTimer = setTimeout(launchFallback, HEDGE_DELAY_MS);
    launch(MODEL);
  }).catch(err => {
    if (!isOverloadError(err)) throw err;
    console.error('[identification] Les deux modèles ont échoué :', err.message);
    const overloaded = new Error('Le service de reconnaissance est surchargé. Réessayez dans une minute.');
    overloaded.code = SERVICE_OVERLOADED;
    throw overloaded;
  });
}


// ─── APPEL À GEMINI ──────────────────────────────────────────────────────────

/**
 * Envoie une image à Gemini et retourne le résultat de la reconnaissance.
 *
 * @param {string} imageBase64  - Image encodée en base64
 * @param {string} mimeType     - Type MIME de l'image ('image/jpeg', 'image/png', etc.)
 * @param {Array}  catalogue    - Liste des avions (id, name, manufacturer, description)
 * @param {string} thinkingLevel - 'minimal' | 'low' | 'medium' | 'high' (optionnel, défaut : THINKING_LEVEL)
 * @returns {{ indices, aircraft_id, confidence, suggestions, model_used, attempts, inputTokens, outputTokens, thinkingTokens }}
 * @throws  Error avec un message en français si l'API échoue
 */
export async function identifyAircraft(
  imageBase64,
  mimeType,
  catalogue,
  thinkingLevel = THINKING_LEVEL
) {
  const { parsed, ...meta } = await callGemini(
    imageBase64, mimeType, buildPrompt(catalogue), responseSchema, thinkingLevel
  );

  return {
    indices: parsed.indices,
    aircraft_id: parsed.aircraft_id,
    confidence: parsed.confidence,
    suggestions: parsed.suggestions ?? [],
    ...meta, // model_used, attempts, compteurs de tokens
  };
}

// ─── IDENTIFICATION LIBRE (SANS CATALOGUE) ───────────────────────────────────
// Gemini nomme lui-même l'avion. Le nom sert ensuite à chercher la fiche
// sur Wikidata (lib/wikidata.js). Utilisé par app/api/identifier/.

const freeResponseSchema = {
  type: Type.OBJECT,
  properties: {
    indices: {
      type: Type.STRING,
      description: 'Description en 1-2 phrases des indices visuels observés',
    },
    aircraft_name: {
      type: Type.STRING,
      description: 'Nom du modèle en anglais, comme le titre de sa page Wikipédia anglaise',
    },
    category: {
      type: Type.STRING,
      enum: ['ligne', 'militaire', 'collection', 'autre'],
      description: 'Catégorie de l\'avion',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Confiance entre 0 et 1',
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: '3 noms de modèles par ordre de probabilité décroissante',
    },
  },
  required: ['indices', 'aircraft_name', 'category', 'confidence', 'suggestions'],
};

const FREE_PROMPT = `Tu es un expert en identification d'aéronefs.

1. INDICES VISUELS : en une phrase, les indices observés (moteurs, ailes,
   dérive, train, cocardes ou livrée).

2. IDENTIFICATION : donne le modèle exact de l'aéronef, en anglais, tel qu'il
   est nommé dans le titre de sa page Wikipédia anglaise
   (ex. "Airbus A320", "Boeing 747", "Dassault Rafale", "Supermarine Spitfire").
   Sois aussi précis que la photo le permet, sans inventer une version
   que tu ne peux pas distinguer.
   Si aucun aéronef n'est visible, réponds "${UNKNOWN_ID}".

3. CATÉGORIE : "ligne" (transport de passagers ou de fret), "militaire",
   "collection" (avion ancien ou historique), sinon "autre".

Remplis suggestions avec les 3 modèles les plus probables, le premier
étant celui que tu as choisi.`;

/**
 * Identifie l'avion d'une photo sans liste imposée.
 *
 * @returns {{ indices, aircraft_name, category, confidence, suggestions, model_used, attempts, ... }}
 */
export async function identifyAircraftFree(imageBase64, mimeType, thinkingLevel = THINKING_LEVEL) {
  const { parsed, ...meta } = await callGemini(
    imageBase64, mimeType, FREE_PROMPT, freeResponseSchema, thinkingLevel
  );

  return {
    indices: parsed.indices,
    aircraft_name: parsed.aircraft_name,
    category: parsed.category,
    confidence: parsed.confidence,
    suggestions: parsed.suggestions ?? [],
    ...meta,
  };
}

// ─── APPEL COMMUN À GEMINI ───────────────────────────────────────────────────

/**
 * Envoie la photo et la consigne à Gemini, et retourne la réponse JSON lue.
 * Partagé par identifyAircraft (avec catalogue) et identifyAircraftFree (libre).
 *
 * @returns {{ parsed, model_used, attempts, inputTokens, outputTokens, thinkingTokens }}
 * @throws  Error avec un message en français si l'API échoue
 */
async function callGemini(imageBase64, mimeType, prompt, schema, thinkingLevel) {
  const apiKey = process.env.VISION_API_KEY;
  if (!apiKey) {
    throw new Error('VISION_API_KEY absent des variables d\'environnement.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let response, model_used, attempts;
  try {
    ({ response, model_used, attempts } = await generateFastest((model, signal) =>
      ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: imageBase64,
                },
              },
              { text: prompt },
            ],
          },
        ],
        config: {
          // Sans ce délai, le SDK attend sans limite un modèle qui ne répond pas
          httpOptions: { timeout: REQUEST_TIMEOUT_MS },
          abortSignal: signal, // permet d'annuler l'appel perdant
          responseMimeType: 'application/json',
          responseSchema: schema,
          thinkingConfig: {
            thinkingLevel,
          },
        },
      })
    ));
  } catch (err) {
    // Saturation : le message est déjà prêt pour l'utilisateur
    if (err?.code === SERVICE_OVERLOADED) throw err;

    const msg = err?.message ?? String(err);

    // Modèle non disponible sur le palier gratuit → erreur explicite
    if (msg.includes('not available') || msg.includes('free tier') || err?.status === 403) {
      throw new Error(
        'Ce modèle n\'est pas disponible sur le palier gratuit. ' +
        'Vérifiez votre quota Google AI Studio.'
      );
    }

    // Quota dépassé
    if (msg.includes('429') || err?.status === 429 || msg.toLowerCase().includes('quota')) {
      throw new Error('Quota Gemini dépassé. Attendez quelques secondes et réessayez.');
    }

    throw new Error(`Erreur Gemini : ${msg}`);
  }

  // Extraction des compteurs de tokens (disponibles selon le modèle)
  const usage = response.usageMetadata ?? {};
  const inputTokens = usage.promptTokenCount ?? null;
  const outputTokens = usage.candidatesTokenCount ?? null;
  const thinkingTokens = usage.thoughtsTokenCount ?? null;

  // Parse le JSON retourné par l'API
  const rawText = response.text ?? '';
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('La réponse de Gemini n\'est pas un JSON valide.');
  }

  return {
    parsed,
    model_used,
    attempts,
    inputTokens,
    outputTokens,
    thinkingTokens,
  };
}
