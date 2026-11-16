/**
 * scripts/import-catalogue/outils.js
 *
 * Petites fonctions partagées par selection.js et run.js :
 * pauses entre les appels, nouvelles tentatives, cache disque, découpage en lots.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const DIR   = path.dirname(fileURLToPath(import.meta.url));
export const ROOT  = path.join(DIR, '..', '..');
const CACHE_DIR    = path.join(DIR, 'cache');

// Pause entre deux appels aux API Wikimedia (règle de bonne conduite :
// Wikidata renvoie une erreur 429 si on enchaîne les appels trop vite).
export const PAUSE_MS = 1500;

// `--rafraichir` sur la ligne de commande : on ignore le cache et on
// redemande tout aux API.
export const REFRESH = process.argv.includes('--rafraichir');

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/** Découpe une liste en lots de `size` éléments. */
export function chunk(list, size) {
  const chunks = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

/**
 * Appelle fn() ; si Wikidata répond « trop d'appels », attend le délai
 * demandé puis réessaie (3 fois au maximum).
 */
export async function withRetry(fn) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const wait = /réessayer dans (\d+)/.exec(err.message)?.[1];
      if (!wait || attempt >= 3) throw err;
      console.log(`  … Wikidata demande d'attendre ${wait} s (essai ${attempt}/3)`);
      await sleep((Number(wait) + 1) * 1000);
    }
  }
}

/**
 * Cache disque (scripts/import-catalogue/cache/<nom>.json, non versionné) :
 * permet de relancer le script sans redemander aux API ce qu'on a déjà.
 */
export function readCache(name) {
  const file = path.join(CACHE_DIR, `${name}.json`);
  if (REFRESH || !fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeCache(name, data) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(path.join(CACHE_DIR, `${name}.json`), JSON.stringify(data));
}

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

export function writeText(relativePath, text) {
  fs.writeFileSync(path.join(ROOT, relativePath), text, 'utf8');
}

/**
 * Récupère des éléments par lots en passant par le cache.
 *
 * @param {string}   cacheName - nom du fichier de cache
 * @param {string[]} keys      - clés voulues (numéros Wikidata, noms de fichiers…)
 * @param {number}   size      - taille d'un lot (limite de l'API)
 * @param {Function} fetchBatch - (lot) => Promise<{ clé: valeur }>
 * @returns {Promise<object>} { clé: valeur } pour toutes les clés trouvées
 */
export async function fetchCached(cacheName, keys, size, fetchBatch) {
  const cache   = readCache(cacheName);
  const missing = [...new Set(keys)].filter(k => !(k in cache));
  const batches = chunk(missing, size);

  for (const [i, batch] of batches.entries()) {
    console.log(`  ${cacheName} : lot ${i + 1}/${batches.length} (${batch.length})`);
    const found = await withRetry(() => fetchBatch(batch));
    // null = demandé mais introuvable : on le note pour ne pas redemander
    for (const key of batch) cache[key] = found[key] ?? null;
    writeCache(cacheName, cache);
    await sleep(PAUSE_MS);
  }
  return cache;
}
