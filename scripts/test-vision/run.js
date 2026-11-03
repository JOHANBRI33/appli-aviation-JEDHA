/**
 * scripts/test-vision/run.js
 *
 * Test de reconnaissance d'avions par Gemini.
 * Lance avec : node --env-file=.env.local scripts/test-vision/run.js
 *              ou : npm run test:vision
 *
 * Dépose tes photos dans scripts/test-vision/photos/
 * en les nommant d'après le modèle attendu, ex. a380-01.jpg, rafale-02.jpg.
 */

import { GoogleGenAI, Type } from '@google/genai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ─── CONSTANTES FACILES À MODIFIER ────────────────────────────────────────────
const MODEL = 'gemini-3.8-flash';           // changer de modèle ici
const THINKING_LEVEL = 'low';               // 'low' | 'medium' | 'high'
// ──────────────────────────────────────────────────────────────────────────────

const PAUSE_MS = 5000;          // pause entre les photos (palier gratuit)
const RETRY_WAIT_MS = 30_000;   // attente avant ré-essai sur erreur de quota
const MAX_SIDE_PX = 1024;       // résolution max envoyée à l'API

// Chemin du dossier courant (ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, 'photos');
const CATALOGUE_PATH = path.join(__dirname, 'catalogue.json');

// ─── INITIALISATION ───────────────────────────────────────────────────────────

// La clé est injectée via --env-file=.env.local, jamais dans le code
const apiKey = process.env.VISION_API_KEY;
if (!apiKey) {
  console.error('Erreur : VISION_API_KEY absent. Lance le script avec --env-file=.env.local.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Charge le catalogue
const catalogue = JSON.parse(fs.readFileSync(CATALOGUE_PATH, 'utf8'));
const catalogueIds = new Set(catalogue.map(a => a.id));

// ─── LECTURE DES PHOTOS ───────────────────────────────────────────────────────

const photoFiles = fs
  .readdirSync(PHOTOS_DIR)
  .filter(f => /\.(jpe?g|png|webp|heic|heif)$/i.test(f))
  .sort();

if (photoFiles.length === 0) {
  console.error(`Aucune photo trouvée dans ${PHOTOS_DIR}`);
  console.error('Dépose des photos nommées ex. a380-01.jpg, rafale-02.jpg');
  process.exit(1);
}

// Déduit l'id attendu depuis le nom de fichier :
// mirage-2000-01.jpg → mirage-2000  (retire uniquement le dernier -<chiffres>)
function expectedIdFromFilename(filename) {
  const stem = path.basename(filename, path.extname(filename));
  return stem.replace(/-\d+$/, '');
}

// Vérifie que chaque photo correspond à un id du catalogue
const unknownPhotos = photoFiles.filter(f => !catalogueIds.has(expectedIdFromFilename(f)));
if (unknownPhotos.length > 0) {
  console.error('Erreur : ces photos ne correspondent à aucun id du catalogue :');
  unknownPhotos.forEach(f => console.error(`  ${f}  → id déduit : "${expectedIdFromFilename(f)}"`));
  console.error('\nIds disponibles dans le catalogue :');
  console.error(' ', [...catalogueIds].join(', '));
  process.exit(1);
}

console.log(`Modèle : ${MODEL}  |  Niveau de réflexion : ${THINKING_LEVEL}`);
console.log(`${photoFiles.length} photo(s) à analyser\n`);

// ─── SCHÉMA DE RÉPONSE JSON ───────────────────────────────────────────────────
// Imposé à l'API pour garantir un JSON valide sans parsing fragile

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

// ─── PROMPT ───────────────────────────────────────────────────────────────────

function buildPrompt() {
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

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Redimensionne une image à MAX_SIDE_PX de côté maximum, retourne un Buffer
async function resizeImage(filePath) {
  return sharp(filePath)
    .resize(MAX_SIDE_PX, MAX_SIDE_PX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
}

// Détermine le mimeType à envoyer (toujours jpeg après resize)
const MIME_TYPE = 'image/jpeg';

// ─── APPEL API ────────────────────────────────────────────────────────────────

/**
 * Envoie une image à Gemini et retourne { parsed, rawText, inputTokens, outputTokens, thinkingTokens }.
 * Gère une seule ré-tentative en cas d'erreur de quota (429).
 * Arrête le processus si le modèle n'est pas disponible sur le palier gratuit.
 */
async function analyzeImage(imageBuffer, isRetry = false) {
  const prompt = buildPrompt();

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
                mimeType: MIME_TYPE,
                data: imageBuffer.toString('base64'),
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema,
        thinkingConfig: {
          thinkingLevel: THINKING_LEVEL,
        },
      },
    });
  } catch (err) {
    const message = err?.message ?? String(err);

    // Modèle non disponible sur le palier gratuit → arrêt immédiat
    if (
      message.includes('not available') ||
      message.includes('free tier') ||
      message.includes('403') ||
      err?.status === 403
    ) {
      console.error('\nErreur : ce modèle n\'est pas disponible sur le palier gratuit.');
      console.error('Vérifie ton quota Google AI Studio ou essaie un autre modèle.');
      console.error(`Détail : ${message}`);
      process.exit(1);
    }

    // Quota dépassé (429) → une seule ré-tentative après pause
    if (
      (message.includes('429') || err?.status === 429 || message.toLowerCase().includes('quota')) &&
      !isRetry
    ) {
      console.warn(`  ⚠ Quota atteint, attente ${RETRY_WAIT_MS / 1000} s avant ré-essai…`);
      await sleep(RETRY_WAIT_MS);
      return analyzeImage(imageBuffer, true);
    }

    // Tout autre erreur après ré-essai ou erreur inconnue → la propage
    throw err;
  }

  // Extraction des tokens depuis les métadonnées de la réponse
  const usage = response.usageMetadata ?? {};
  const inputTokens = usage.promptTokenCount ?? null;
  const outputTokens = usage.candidatesTokenCount ?? null;
  const thinkingTokens = usage.thoughtsTokenCount ?? null;

  // Texte brut et tentative de parse JSON
  const rawText = response.text ?? '';
  let parsed = null;
  let parseError = false;

  try {
    parsed = JSON.parse(rawText);
  } catch {
    parseError = true;
  }

  return { parsed, rawText, parseError, inputTokens, outputTokens, thinkingTokens };
}

// ─── BOUCLE PRINCIPALE ────────────────────────────────────────────────────────

const results = [];
let invalidJsonCount = 0;

for (let i = 0; i < photoFiles.length; i++) {
  const filename = photoFiles[i];
  const expectedId = expectedIdFromFilename(filename);
  const filePath = path.join(PHOTOS_DIR, filename);

  process.stdout.write(`[${i + 1}/${photoFiles.length}] ${filename} … `);

  const startMs = Date.now();
  let result;

  try {
    const imageBuffer = await resizeImage(filePath);
    const { parsed, rawText, parseError, inputTokens, outputTokens, thinkingTokens } =
      await analyzeImage(imageBuffer);

    const elapsedMs = Date.now() - startMs;

    if (parseError || !parsed) {
      invalidJsonCount++;
      console.log('JSON invalide');
      results.push({
        filename,
        expectedId,
        aircraftId: null,
        confidence: null,
        indices: null,
        suggestions: [],
        correct: false,
        inSuggestions: false,
        elapsedMs,
        inputTokens,
        outputTokens,
        thinkingTokens,
        error: 'JSON invalide',
        rawText,
      });
    } else {
      const correct = parsed.aircraft_id === expectedId;
      const inSuggestions = Array.isArray(parsed.suggestions) &&
        parsed.suggestions.includes(expectedId);
      const mark = correct ? '✓' : (inSuggestions ? '~' : '✗');
      console.log(
        `${mark}  réponse: ${parsed.aircraft_id}  conf: ${(parsed.confidence ?? 0).toFixed(2)}  ${elapsedMs} ms`
      );
      results.push({
        filename,
        expectedId,
        aircraftId: parsed.aircraft_id,
        confidence: parsed.confidence,
        indices: parsed.indices,
        suggestions: parsed.suggestions ?? [],
        correct,
        inSuggestions: !correct && inSuggestions,
        elapsedMs,
        inputTokens,
        outputTokens,
        thinkingTokens,
        error: null,
        rawText,
      });
    }
  } catch (err) {
    const elapsedMs = Date.now() - startMs;
    console.log(`Erreur : ${err.message}`);
    results.push({
      filename,
      expectedId,
      aircraftId: null,
      confidence: null,
      indices: null,
      suggestions: [],
      correct: false,
      inSuggestions: false,
      elapsedMs,
      inputTokens: null,
      outputTokens: null,
      thinkingTokens: null,
      error: err.message,
      rawText: null,
    });
  }

  // Pause entre les photos, sauf après la dernière
  if (i < photoFiles.length - 1) {
    await sleep(PAUSE_MS);
  }
}

// ─── CALCUL DES STATISTIQUES ──────────────────────────────────────────────────

const total = results.length;
const correctCount = results.filter(r => r.correct).length;
const inSuggestionsCount = results.filter(r => r.correct || r.inSuggestions).length;
const avgMs = Math.round(results.reduce((s, r) => s + r.elapsedMs, 0) / total);

// Corrélation confiance / erreur
const wrongResults = results.filter(r => !r.correct && r.confidence !== null);
const rightResults = results.filter(r => r.correct && r.confidence !== null);
const avgConfWrong = wrongResults.length
  ? (wrongResults.reduce((s, r) => s + r.confidence, 0) / wrongResults.length).toFixed(2)
  : 'N/A';
const avgConfRight = rightResults.length
  ? (rightResults.reduce((s, r) => s + r.confidence, 0) / rightResults.length).toFixed(2)
  : 'N/A';

// Estimation du coût pour 1 000 photos
// Tarifs gemini-3.8-flash (source : aistudio.google.com/docs/pricing)
//   Actuels (jusqu'au 31/12/2026) : $0,75 / 1 M tokens entrée  |  $3,75 / 1 M tokens sortie
//   Standard dès 01/01/2027       : $1,50 / 1 M tokens entrée  |  $7,50 / 1 M tokens sortie
// Les tokens de réflexion (thinking) comptent dans les tokens de sortie.
// Les images sont facturées en tokens d'entrée (≈ 1 032 tokens par image 1024×1024, 4 tuiles de 258 tokens).

const validTokenResults = results.filter(r => r.inputTokens !== null && r.outputTokens !== null);
let costNote = '';
if (validTokenResults.length > 0) {
  const avgIn = validTokenResults.reduce((s, r) => s + r.inputTokens, 0) / validTokenResults.length;
  const avgOut = validTokenResults.reduce((s, r) => s + r.outputTokens, 0) / validTokenResults.length;
  const avgThinking = validTokenResults.reduce((s, r) => s + (r.thinkingTokens ?? 0), 0) / validTokenResults.length;
  const avgOutTotal = avgOut + avgThinking; // thinking compris dans sortie

  const inK = (avgIn * 1000) / 1_000_000;
  const outK = (avgOutTotal * 1000) / 1_000_000;

  const costIntroIn = inK * 0.75;
  const costIntroOut = outK * 3.75;
  const costIntro = costIntroIn + costIntroOut;

  const costStdIn = inK * 1.50;
  const costStdOut = outK * 7.50;
  const costStd = costStdIn + costStdOut;

  costNote = `
### Estimation du coût pour 1 000 photos

> Source tarifs : [aistudio.google.com/docs/pricing](https://aistudio.google.com/docs/pricing) — gemini-3.8-flash

Moyennes observées sur cet échantillon :
- Tokens d'entrée par photo : ~${Math.round(avgIn)} (texte du prompt + catalogue + image)
- Tokens de sortie par photo : ~${Math.round(avgOut)} (réponse JSON)
- Tokens de réflexion par photo : ~${Math.round(avgThinking)} (comptent dans la sortie)

| Tarif | Entrée (1 000 photos) | Sortie + réflexion | **Total** |
|---|---|---|---|
| Actuel jusqu'au 31/12/2026 ($0,75 / $3,75 par 1 M) | $${costIntroIn.toFixed(3)} | $${costIntroOut.toFixed(3)} | **$${costIntro.toFixed(2)}** |
| Standard dès 01/01/2027 ($1,50 / $7,50 par 1 M) | $${costStdIn.toFixed(3)} | $${costStdOut.toFixed(3)} | **$${costStd.toFixed(2)}** |

*Estimation indicative basée sur ${validTokenResults.length} appel(s) réel(s). Varie selon la longueur des réponses.*`;
} else {
  costNote = `
### Estimation du coût pour 1 000 photos

L'API n'a pas retourné de comptage de tokens sur cet échantillon.
Estimation théorique (source : aistudio.google.com/docs/pricing — gemini-3.8-flash) :
- ~1 032 tokens d'entrée pour l'image (4 tuiles 512×512 × 258 tokens) + ~700 tokens de prompt/catalogue
- ~150 tokens de sortie JSON + tokens de réflexion variables selon \`THINKING_LEVEL\`

| Tarif | Total estimé (hypothèse : ~1 750 tokens entrée, ~300 tokens sortie) |
|---|---|
| Actuel jusqu'au 31/12/2026 | ~$1,44 pour 1 000 photos |
| Standard dès 01/01/2027 | ~$2,88 pour 1 000 photos |`;
}

// ─── GÉNÉRATION DE resultats-<model>-<level>.md ───────────────────────────────

const outputFilename = `resultats-${MODEL}-${THINKING_LEVEL}.md`;
const outputPath = path.join(__dirname, outputFilename);

// Tableau des résultats photo par photo
const tableHeader =
  '| Photo | Attendu | Réponse | Conf. | Indices | ✓ 1er choix | Dans suggestions | Temps (ms) |';
const tableSep =
  '|---|---|---|---|---|---|---|---|';

const tableRows = results.map(r => {
  const conf = r.confidence !== null ? r.confidence.toFixed(2) : '—';
  const indices = r.indices ? r.indices.replace(/\|/g, '‖').replace(/\n/g, ' ') : r.error ?? '—';
  const correct = r.correct ? 'Oui' : 'Non';
  const inSugg = r.correct ? '—' : (r.inSuggestions ? 'Oui' : 'Non');
  return `| ${r.filename} | ${r.expectedId} | ${r.aircraftId ?? '—'} | ${conf} | ${indices} | ${correct} | ${inSugg} | ${r.elapsedMs} |`;
});

const md = `# Résultats du test de reconnaissance d'avions

**Modèle** : \`${MODEL}\`
**Niveau de réflexion** : \`${THINKING_LEVEL}\`
**Date** : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
**Photos analysées** : ${total}

---

## Tableau des résultats

${tableHeader}
${tableSep}
${tableRows.join('\n')}

---

## Synthèse

| Indicateur | Valeur |
|---|---|
| Bonnes réponses (1er choix) | ${correctCount} / ${total} (${Math.round((correctCount / total) * 100)} %) |
| Attendu dans les 3 suggestions | ${inSuggestionsCount} / ${total} (${Math.round((inSuggestionsCount / total) * 100)} %) |
| Temps de réponse moyen | ${avgMs} ms |
| Réponses JSON invalides | ${invalidJsonCount} |

---

## Lien entre confiance et erreurs

| Groupe | Confiance moyenne |
|---|---|
| Bonnes réponses | ${avgConfRight} |
| Mauvaises réponses | ${avgConfWrong} |

${
  avgConfRight !== 'N/A' && avgConfWrong !== 'N/A'
    ? parseFloat(avgConfRight) > parseFloat(avgConfWrong)
      ? '> La confiance est en moyenne **plus élevée sur les bonnes réponses**, ce qui suggère qu\'elle est un indicateur fiable pour détecter les erreurs.'
      : '> La confiance ne discrimine pas clairement les erreurs des bonnes réponses sur cet échantillon.'
    : '> Pas assez de données pour conclure.'
}

---
${costNote}

---

*Clé API non présente dans ce fichier ni dans les logs.*
`;

fs.writeFileSync(outputPath, md, 'utf8');

console.log(`\n─────────────────────────────────────────`);
console.log(`Résultats : ${correctCount}/${total} (${Math.round((correctCount / total) * 100)} %) en 1er choix`);
console.log(`           ${inSuggestionsCount}/${total} (${Math.round((inSuggestionsCount / total) * 100)} %) dans les 3 suggestions`);
console.log(`Temps moyen : ${avgMs} ms`);
console.log(`JSON invalides : ${invalidJsonCount}`);
console.log(`Fichier écrit : ${outputFilename}`);
