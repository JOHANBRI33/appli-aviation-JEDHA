/**
 * scripts/test-vision/run.js
 *
 * Test de reconnaissance d'avions par Gemini.
 * Lance avec : node --env-file=.env.local scripts/test-vision/run.js
 *              ou : npm run test:vision
 *
 * Dépose tes photos dans scripts/test-vision/photos/
 * en les nommant d'après le modèle attendu, ex. a380-01.jpg, rafale-02.jpg.
 *
 * La logique Gemini (prompt, schéma JSON, constantes MODEL / THINKING_LEVEL)
 * est dans lib/identification.js, partagée avec la route API de l'appli.
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Importe la logique partagée depuis lib/identification.js
import {
  MODEL,
  THINKING_LEVEL,
  loadCatalogue,
  identifyAircraft,
} from '../../lib/identification.js';

const PAUSE_MS = 5000;        // pause entre les photos (palier gratuit)
const RETRY_WAIT_MS = 30_000; // attente avant ré-essai sur erreur de quota
const MAX_SIDE_PX = 1024;     // résolution max envoyée à l'API
const MIME_TYPE = 'image/jpeg'; // toujours jpeg après redimensionnement sharp

// Chemin du dossier courant (ES modules)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTOS_DIR = path.join(__dirname, 'photos');

// ─── VÉRIFICATION DE LA CLÉ ──────────────────────────────────────────────────

if (!process.env.VISION_API_KEY) {
  console.error('Erreur : VISION_API_KEY absent. Lance le script avec --env-file=.env.local.');
  process.exit(1);
}

// ─── CHARGEMENT DU CATALOGUE ──────────────────────────────────────────────────

const catalogue = loadCatalogue();
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
  unknownPhotos.forEach(f =>
    console.error(`  ${f}  → id déduit : "${expectedIdFromFilename(f)}"`)
  );
  console.error('\nIds disponibles dans le catalogue :');
  console.error(' ', [...catalogueIds].join(', '));
  process.exit(1);
}

console.log(`Modèle : ${MODEL}  |  Niveau de réflexion : ${THINKING_LEVEL}`);
console.log(`${photoFiles.length} photo(s) à analyser\n`);

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

// Appelle identifyAircraft avec une seule ré-tentative sur erreur de quota
async function analyzeWithRetry(imageBase64, isRetry = false) {
  try {
    return await identifyAircraft(imageBase64, MIME_TYPE, catalogue);
  } catch (err) {
    const msg = err?.message ?? '';

    // Modèle indisponible sur le palier gratuit → arrêt immédiat, pas de ré-essai
    if (msg.includes('palier gratuit')) {
      console.error(`\n${msg}`);
      process.exit(1);
    }

    // Quota dépassé → une seule ré-tentative après pause
    if (msg.includes('Quota') && !isRetry) {
      console.warn(`  ⚠ ${msg} Attente ${RETRY_WAIT_MS / 1000} s…`);
      await sleep(RETRY_WAIT_MS);
      return analyzeWithRetry(imageBase64, true);
    }

    throw err;
  }
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

  try {
    const imageBuffer = await resizeImage(filePath);
    const { indices, aircraft_id, confidence, suggestions, inputTokens, outputTokens, thinkingTokens } =
      await analyzeWithRetry(imageBuffer.toString('base64'));

    const elapsedMs = Date.now() - startMs;
    const correct = aircraft_id === expectedId;
    const inSuggestions = Array.isArray(suggestions) && suggestions.includes(expectedId);
    const mark = correct ? '✓' : (inSuggestions ? '~' : '✗');

    console.log(
      `${mark}  réponse: ${aircraft_id}  conf: ${(confidence ?? 0).toFixed(2)}  ${elapsedMs} ms`
    );
    results.push({
      filename, expectedId, aircraftId: aircraft_id, confidence, indices,
      suggestions: suggestions ?? [], correct, inSuggestions: !correct && inSuggestions,
      elapsedMs, inputTokens, outputTokens, thinkingTokens, error: null,
    });
  } catch (err) {
    const elapsedMs = Date.now() - startMs;
    // Le message d'erreur vient de lib/identification.js, il est en français
    // et ne contient pas la clé API
    const errorMsg = err.message ?? 'Erreur inconnue';
    console.log(`Erreur : ${errorMsg}`);
    // Comptabilise les JSON invalides séparément
    if (errorMsg.includes('JSON')) invalidJsonCount++;
    results.push({
      filename, expectedId, aircraftId: null, confidence: null, indices: null,
      suggestions: [], correct: false, inSuggestions: false,
      elapsedMs, inputTokens: null, outputTokens: null, thinkingTokens: null,
      error: errorMsg,
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

const wrongResults = results.filter(r => !r.correct && r.confidence !== null);
const rightResults = results.filter(r => r.correct && r.confidence !== null);
const avgConfWrong = wrongResults.length
  ? (wrongResults.reduce((s, r) => s + r.confidence, 0) / wrongResults.length).toFixed(2)
  : 'N/A';
const avgConfRight = rightResults.length
  ? (rightResults.reduce((s, r) => s + r.confidence, 0) / rightResults.length).toFixed(2)
  : 'N/A';

// ─── ESTIMATION DU COÛT ───────────────────────────────────────────────────────
// Tarifs gemini-3.8-flash (source : aistudio.google.com/docs/pricing)
//   Actuels (jusqu'au 31/12/2026) : $0,75 / 1 M tokens entrée  |  $3,75 / 1 M tokens sortie
//   Standard dès 01/01/2027       : $1,50 / 1 M tokens entrée  |  $7,50 / 1 M tokens sortie
// Les tokens de réflexion comptent dans les tokens de sortie.

const validTokenResults = results.filter(r => r.inputTokens !== null && r.outputTokens !== null);
let costNote = '';
if (validTokenResults.length > 0) {
  const avgIn = validTokenResults.reduce((s, r) => s + r.inputTokens, 0) / validTokenResults.length;
  const avgOut = validTokenResults.reduce((s, r) => s + r.outputTokens, 0) / validTokenResults.length;
  const avgThinking = validTokenResults.reduce((s, r) => s + (r.thinkingTokens ?? 0), 0) / validTokenResults.length;
  const avgOutTotal = avgOut + avgThinking;

  const inK = (avgIn * 1000) / 1_000_000;
  const outK = (avgOutTotal * 1000) / 1_000_000;

  const costIntro = inK * 0.75 + outK * 3.75;
  const costStd   = inK * 1.50 + outK * 7.50;

  costNote = `
### Estimation du coût pour 1 000 photos

> Source tarifs : [aistudio.google.com/docs/pricing](https://aistudio.google.com/docs/pricing) — gemini-3.8-flash

Moyennes observées sur cet échantillon :
- Tokens d'entrée : ~${Math.round(avgIn)} / photo  (prompt + catalogue + image)
- Tokens de sortie : ~${Math.round(avgOut)} / photo  (JSON)
- Tokens de réflexion : ~${Math.round(avgThinking)} / photo  (comptent dans la sortie)

| Tarif | **Total estimé pour 1 000 photos** |
|---|---|
| Actuel jusqu'au 31/12/2026 ($0,75 / $3,75 par 1 M) | **$${costIntro.toFixed(2)}** |
| Standard dès 01/01/2027 ($1,50 / $7,50 par 1 M) | **$${costStd.toFixed(2)}** |

*Basé sur ${validTokenResults.length} appel(s) réel(s). Varie selon la longueur des réponses.*`;
} else {
  costNote = `
### Estimation du coût pour 1 000 photos

L'API n'a pas retourné de comptage de tokens sur cet échantillon.
Estimation théorique (source : aistudio.google.com/docs/pricing — gemini-3.8-flash) :
- ~1 032 tokens d'entrée pour l'image (4 tuiles 512×512 × 258 tokens) + ~700 tokens de prompt
- ~150 tokens de sortie JSON + tokens de réflexion variables

| Tarif | Total estimé (~1 750 tokens entrée, ~300 tokens sortie) |
|---|---|
| Actuel jusqu'au 31/12/2026 | ~$1,44 pour 1 000 photos |
| Standard dès 01/01/2027 | ~$2,88 pour 1 000 photos |`;
}

// ─── ÉCRITURE DE resultats-<model>-<level>.md ─────────────────────────────────

const outputFilename = `resultats-${MODEL}-${THINKING_LEVEL}.md`;
const outputPath = path.join(__dirname, outputFilename);

const tableRows = results.map(r => {
  const conf = r.confidence !== null ? r.confidence.toFixed(2) : '—';
  const indices = r.indices ? r.indices.replace(/\|/g, '‖').replace(/\n/g, ' ') : r.error ?? '—';
  const inSugg = r.correct ? '—' : (r.inSuggestions ? 'Oui' : 'Non');
  return `| ${r.filename} | ${r.expectedId} | ${r.aircraftId ?? '—'} | ${conf} | ${indices} | ${r.correct ? 'Oui' : 'Non'} | ${inSugg} | ${r.elapsedMs} |`;
});

const md = `# Résultats du test de reconnaissance d'avions

**Modèle** : \`${MODEL}\`
**Niveau de réflexion** : \`${THINKING_LEVEL}\`
**Date** : ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
**Photos analysées** : ${total}

---

## Tableau des résultats

| Photo | Attendu | Réponse | Conf. | Indices | ✓ 1er choix | Dans suggestions | Temps (ms) |
|---|---|---|---|---|---|---|---|
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
