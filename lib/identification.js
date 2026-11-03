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
import fs from 'fs';
import path from 'path';

// ─── CONSTANTES FACILES À MODIFIER ───────────────────────────────────────────
export const MODEL = 'gemini-3.8-flash';  // changer de modèle ici
export const THINKING_LEVEL = 'low';      // 'low' | 'medium' | 'high'
// ─────────────────────────────────────────────────────────────────────────────

// ─── CATALOGUE ───────────────────────────────────────────────────────────────

/**
 * Charge le catalogue d'avions.
 * Pour l'instant, lit scripts/test-vision/catalogue.json.
 * En semaine 3, remplacer cette fonction par un appel Supabase :
 *   const { data } = await supabase.from('aircraft').select('id, name, manufacturer, description');
 *   return data;
 */
export function loadCatalogue() {
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
    .map(a => `- id: ${a.id}  |  ${a.name} (${a.manufacturer})  |  ${a.description}`)
    .join('\n');

  return `Tu es un expert en identification d'aéronefs.

Examine l'image et procède en deux étapes :

1. INDICES VISUELS : décris en une ou deux phrases les indices observables
   (nombre et position des moteurs, forme des ailes, type de dérive,
   train d'atterrissage, cocardes ou livrée reconnaissable).

2. IDENTIFICATION : choisis UNIQUEMENT parmi les identifiants du catalogue ci-dessous.
   Ne propose pas d'avion hors catalogue.

Catalogue :
${catalogueList}

Réponds en JSON structuré. Remplis suggestions avec les 3 ids les plus probables
(aircraft_id inclus en premier).`;
}

// ─── APPEL À GEMINI ──────────────────────────────────────────────────────────

/**
 * Envoie une image à Gemini et retourne le résultat de la reconnaissance.
 *
 * @param {string} imageBase64  - Image encodée en base64
 * @param {string} mimeType     - Type MIME de l'image ('image/jpeg', 'image/png', etc.)
 * @param {Array}  catalogue    - Liste des avions (id, name, manufacturer, description)
 * @param {string} thinkingLevel - 'low' | 'medium' | 'high' (optionnel, défaut : THINKING_LEVEL)
 * @returns {{ indices, aircraft_id, confidence, suggestions, inputTokens, outputTokens, thinkingTokens }}
 * @throws  Error avec un message en français si l'API échoue
 */
export async function identifyAircraft(
  imageBase64,
  mimeType,
  catalogue,
  thinkingLevel = THINKING_LEVEL
) {
  const apiKey = process.env.VISION_API_KEY;
  if (!apiKey) {
    throw new Error('VISION_API_KEY absent des variables d\'environnement.');
  }

  const ai = new GoogleGenAI({ apiKey });

  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
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
            { text: buildPrompt(catalogue) },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        thinkingConfig: {
          thinkingLevel,
        },
      },
    });
  } catch (err) {
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
    indices: parsed.indices,
    aircraft_id: parsed.aircraft_id,
    confidence: parsed.confidence,
    suggestions: parsed.suggestions ?? [],
    inputTokens,
    outputTokens,
    thinkingTokens,
  };
}
