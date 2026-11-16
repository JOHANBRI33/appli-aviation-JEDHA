#!/usr/bin/env node
/**
 * scripts/import-catalogue/selection.js — ÉTAPE 1 : choisir les avions
 *
 * 1. Demande à Wikidata (SPARQL) les modèles d'avions les plus connus,
 *    classés par nombre de Wikipédias qui ont un article sur eux.
 * 2. Récupère leurs données complètes (50 par appel) et le nom de leurs
 *    sous-types (« avion de ligne », « chasseur », « hélicoptère »…).
 * 3. Écarte ce qui n'est pas un avion (hélicoptères, drones…), propose une
 *    catégorie et un identifiant court.
 *
 * Génère scripts/import-catalogue/candidats.json, À RELIRE PAR L'ÉQUIPE :
 *   - "include": true/false pour garder ou écarter un avion ;
 *   - "category" : à corriger si la proposition est fausse.
 * Ces corrections sont conservées si on relance le script.
 *
 * Ensuite : npm run import:catalogue (étape 2, génère le SQL).
 *
 * Usage : npm run import:selection [-- --rafraichir]
 */

import fs from 'fs';
import path from 'path';
import { fetchEntities, fetchLabels, isAircraft, linkedIds, parseAircraft } from '../../lib/wikidata.js';
import { DIR, PAUSE_MS, fetchCached, readJson, sleep, withRetry } from './outils.js';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// Nombre d'avions retenus (palier décidé le 16/11/2026). Les suivants sont
// listés avec "include": false : il suffit de passer à true pour les ajouter.
const PALIER = 200;

// Nombre de candidats demandés à Wikidata (plus que le palier, car certains
// seront écartés) et notoriété minimale (nombre de Wikipédias).
const CANDIDATS_MAX = 600;
const SITELINKS_MIN = 15;

// Écartés (description ou sous-type) : ce ne sont pas des avions.
const EXCLUS = /hélicoptère|helicopter|giravion|rotorcraft|autogire|autogyro|tiltrotor|convertible|drone|sans pilote|unmanned|dirigeable|airship|ballon|balloon|planeur|glider|missile/i;

// Mots qui désignent un avion militaire, puis un avion de transport civil.
const MILITAIRE = /militaire|military|chasse|chasseur|fighter|bombardier|bomber|attaque|attack|intercept|reconnaissance|combat|torpill|torpedo|embarqué|carrier|furtif|stealth|multirôle|multirole|multi-role|patrouille|patrol|ravitailleur|tanker|airlifter|warplane|aéronavale|early warning|détection/i;
const LIGNE = /avion de ligne|airliner|jetliner|avion commercial|commercial aircraft|cargo|transport régional|régional|regional|fuselage étroit|fuselage large|narrow-body|wide-body|gros porteur|double-pont|avion d'affaires|business jet|passenger/i;

// Avions « collection » (historiques, vus surtout en meeting) : premier vol
// avant 1946, ou avant 1960 s'ils sont retirés du service. Le B-52 (1952),
// toujours en service, reste donc militaire.
const COLLECTION_AVANT          = 1946;
const COLLECTION_RETIRE_AVANT   = 1960;

const SORTIE = path.join(DIR, 'candidats.json');

// ─── FONCTIONS ────────────────────────────────────────────────────────────────

/** Numéros Wikidata des avions les plus connus, du plus au moins connu. */
async function topAircraftIds() {
  const sparql = `
SELECT ?item ?sitelinks WHERE {
  VALUES ?type { wd:Q15056995 wd:Q15056993 }   # modèle d'avion, famille d'avions
  ?item wdt:P31 ?type ; wikibase:sitelinks ?sitelinks .
  FILTER(?sitelinks >= ${SITELINKS_MIN})
}
ORDER BY DESC(?sitelinks)
LIMIT ${CANDIDATS_MAX}`;

  const url = new URL('https://query.wikidata.org/sparql');
  url.searchParams.set('query', sparql);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'FlightHunter/1.0 (https://github.com/JOHANBRI33/appli-aviation-JEDHA; projet de formation Jedha)',
      'Accept': 'application/sparql-results+json',
    },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status}`);
  const data = await res.json();
  return data.results.bindings.map(b => ({
    qid: b.item.value.split('/').pop(),
    sitelinks: Number(b.sitelinks.value),
  }));
}

/** "Boeing 777X" → "boeing-777x" (minuscules, sans accents ni espaces). */
function slugify(text) {
  return text
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')      // retire les précisions entre parenthèses
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Catégorie proposée pour un avion.
 *   1. Écarté si la description ou un sous-type parle d'hélicoptère, de drone…
 *   2. Avion ancien → « collection ».
 *   3. Sinon la description décide (« airliner », « avion militaire »…),
 *      puis les sous-types si elle ne suffit pas.
 *
 * @param {object} entity        - élément Wikidata brut
 * @param {string[]} subclassNames - noms des sous-types (P279)
 * @param {object} a             - fiche lue par parseAircraft
 * @returns {{ category, excluded? }} excluded = raison de l'exclusion
 */
function classify(entity, subclassNames, a) {
  const descriptions = [entity.descriptions?.en?.value, entity.descriptions?.fr?.value]
    .filter(Boolean).join(' | ');
  const subclasses = subclassNames.join(' | ');

  const exclu = EXCLUS.exec(`${descriptions} | ${subclasses}`);
  if (exclu) return { category: 'autre', excluded: `pas un avion (« ${exclu[0]} »)` };

  const year = a.first_flight ? Number(a.first_flight.slice(0, 4)) : null;
  if (year && (year < COLLECTION_AVANT || (year < COLLECTION_RETIRE_AVANT && a.retirement))) {
    return { category: 'collection' };
  }

  // Description : les mots civils d'abord (« Airliner produced by Airbus and
  // Bombardier » parle d'un constructeur, pas d'un bombardier ; le TriStar
  // est « à usage civil et militaire »).
  if (LIGNE.test(descriptions))     return { category: 'ligne' };
  if (MILITAIRE.test(descriptions)) return { category: 'militaire' };
  // Sous-types : les mots militaires d'abord (« avion de transport militaire »)
  if (MILITAIRE.test(subclasses))   return { category: 'militaire' };
  if (LIGNE.test(subclasses))       return { category: 'ligne' };
  return { category: 'autre' };
}

// ─── PROGRAMME ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Étape 1 : sélection des avions (Wikidata) ===\n');

  // Avions imposés (ids courts existants) : toujours inclus
  const imposes = Object.entries(readJson('scripts/import-catalogue/wikidata-ids.json'))
    .filter(([key]) => !key.startsWith('_'))
    .map(([slug, { id }]) => ({ slug, qid: id }));
  const slugParQid = Object.fromEntries(imposes.map(i => [i.qid, i.slug]));

  console.log('→ Liste des avions les plus connus (SPARQL)');
  const top = await withRetry(topAircraftIds);
  await sleep(PAUSE_MS);
  const sitelinks = Object.fromEntries(top.map(t => [t.qid, t.sitelinks]));
  const qids = [...new Set([...imposes.map(i => i.qid), ...top.map(t => t.qid)])];
  console.log(`  ${top.length} candidats + ${imposes.length} avions imposés\n`);

  console.log('→ Données complètes des candidats');
  const entities = await fetchCached('entites', qids, 50, async batch =>
    Object.fromEntries((await fetchEntities({ ids: batch })).map(e => [e.id, e]))
  );

  console.log('\n→ Noms des sous-types');
  const subclassIds = qids.flatMap(q => entities[q] ? linkedIds(entities[q]).subclasses : []);
  const names = await fetchCached('libelles', subclassIds, 50, fetchLabels);

  // Corrections de l'équipe dans un candidats.json précédent : elles gagnent
  const precedent = fs.existsSync(SORTIE)
    ? Object.fromEntries(JSON.parse(fs.readFileSync(SORTIE, 'utf8')).avions.map(a => [a.wikidata_id, a]))
    : {};

  const avions = [];
  const slugsPris = new Set();
  let retenus = 0;

  // Ordre : les imposés d'abord, puis par notoriété décroissante
  for (const qid of qids) {
    const entity = entities[qid];
    const impose = qid in slugParQid;
    const a = entity ? parseAircraft(entity, names) : null;

    let excluded = null;
    if (!entity)               excluded = 'introuvable sur Wikidata';
    else if (!isAircraft(entity)) excluded = 'pas un modèle d\'avion';
    else if (!a.enwiki_title)  excluded = 'pas d\'article Wikipédia anglais (Gemini ne pourra pas le nommer)';
    else if (!a.image_file)    excluded = 'pas de photo sur Wikidata';

    const subclassNames = entity ? linkedIds(entity).subclasses.map(id => names[id]).filter(Boolean) : [];
    const classement = entity ? classify(entity, subclassNames, a) : { category: 'autre' };
    if (!excluded && classement.excluded && !impose) excluded = classement.excluded;

    if (excluded && impose) console.warn(`  ⚠  avion imposé ${slugParQid[qid]} (${qid}) : ${excluded}`);
    if (excluded && !impose) continue; // on ne liste pas ce qui n'est pas importable

    // Identifiant court : imposé, sinon tiré du titre Wikipédia anglais
    let slug = slugParQid[qid] ?? slugify(a.enwiki_title);
    if (slugsPris.has(slug)) slug = `${slug}-${qid.toLowerCase()}`;
    slugsPris.add(slug);

    const auPalier = impose || retenus < PALIER;
    if (auPalier) retenus++;

    const avant = precedent[qid];
    avions.push({
      id:           slug,
      wikidata_id:  qid,
      enwiki_title: a?.enwiki_title ?? null,
      name:         a?.name ?? null,
      category:     avant?.category ?? classement.category,
      include:      avant?.include ?? (auPalier && !excluded),
      sitelinks:    sitelinks[qid] ?? null,
      sous_types:   subclassNames,
      ...(excluded ? { probleme: excluded } : {}),
    });
  }

  const inclus = avions.filter(a => a.include);
  const parCategorie = {};
  for (const a of inclus) parCategorie[a.category] = (parCategorie[a.category] ?? 0) + 1;

  fs.writeFileSync(SORTIE, JSON.stringify({
    _comment: 'Généré par npm run import:selection. Relire : "include" (garder ou non) et "category" (ligne, militaire, collection, autre). Vos corrections sont conservées si on relance. Ensuite : npm run import:catalogue.',
    genere_le: new Date().toISOString().slice(0, 10),
    palier: PALIER,
    avions,
  }, null, 2) + '\n', 'utf8');

  console.log(`\n✓ ${path.relative(process.cwd(), SORTIE)} : ${avions.length} avions listés, ${inclus.length} inclus`);
  console.log('  par catégorie :', parCategorie);
}

main().catch(err => {
  console.error('\n✗', err.message);
  process.exit(1);
});
