#!/usr/bin/env node
/**
 * scripts/import-catalogue/selection.js — ÉTAPE 1 : choisir les appareils
 *
 * 1. Demande à Wikidata (SPARQL) les modèles d'avions et d'hélicoptères les
 *    plus connus, classés par nombre de Wikipédias qui ont un article sur eux.
 * 2. Récupère leurs données complètes (50 par appel) et le nom de leurs
 *    sous-types (« avion de ligne », « chasseur », « hélicoptère d'attaque »…).
 * 3. Écarte ce qui n'est pas importable (drones, dirigeables, planeurs…),
 *    propose un type (avion / hélicoptère), une catégorie et un identifiant court.
 *
 * Génère scripts/import-catalogue/candidats.json, À RELIRE PAR L'ÉQUIPE :
 *   - "include": true/false pour garder ou écarter un appareil ;
 *   - "category" : à corriger si la proposition est fausse.
 * Ces corrections sont conservées si on relance le script.
 *
 * Ensuite : npm run import:catalogue (étape 2, génère le SQL).
 *
 * Usage : npm run import:selection [-- --rafraichir]
 */

import fs from 'fs';
import path from 'path';
import { fetchEntities, fetchLabels, isAircraft, linkedIds, parseAircraft, slugify } from '../../lib/wikidata.js';
import { DIR, PAUSE_MS, fetchCached, readJson, sleep, withRetry } from './outils.js';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// Nombre d'appareils retenus par type (paliers décidés par l'équipe : 200 avions
// le 16/11/2026, puis 100 à 150 hélicoptères). Les suivants sont listés avec
// "include": false : il suffit de passer à true pour les ajouter.
const PALIERS = { avion: 200, helicoptere: 130 };

// Candidats demandés à Wikidata (plus que le palier, car certains seront
// écartés) et notoriété minimale (nombre de Wikipédias qui en parlent).
const RECHERCHES = {
  avion:       { max: 600, sitelinksMin: 15 },
  // Les hélicoptères sont moins connus : on descend le seuil
  helicoptere: { max: 300, sitelinksMin: 10 },
};

// Écartés (description ou sous-type) : ni avion ni hélicoptère pilotés.
const EXCLUS = /drone|sans pilote|unmanned|uav\b|dirigeable|airship|ballon|balloon|planeur|glider|missile/i;

// Voilure tournante : hélicoptères, rotors basculants (V-22 Osprey), autogires.
// (Pas « convertible » : un avion « convertible passagers/cargo » existe.)
const VOILURE_TOURNANTE = /hélicoptère|helicopter|giravion|rotorcraft|autogire|autogyro|tiltrotor|rotors basculants/i;

// Mots qui désignent un appareil militaire, puis un avion de transport civil.
const MILITAIRE = /militaire|military|chasse|chasseur|fighter|bombardier|bomber|attaque|attack|intercept|reconnaissance|combat|torpill|torpedo|embarqué|carrier|furtif|stealth|multirôle|multirole|multi-role|patrouille|patrol|ravitailleur|tanker|airlifter|warplane|aéronavale|early warning|détection|anti-sous-marin|anti-submarine|gunship/i;
const LIGNE = /avion de ligne|airliner|jetliner|avion commercial|commercial aircraft|cargo|transport régional|régional|regional|fuselage étroit|fuselage large|narrow-body|wide-body|gros porteur|double-pont|avion d'affaires|business jet|passenger/i;

// Appareils « collection » (historiques, vus surtout en meeting) : premier vol
// avant 1946, ou avant 1960 s'ils sont retirés du service. Le B-52 (1952),
// toujours en service, reste donc militaire.
const COLLECTION_AVANT          = 1946;
const COLLECTION_RETIRE_AVANT   = 1960;

// Modèle d'avion, famille d'avions (P31). Les hélicoptères ont les mêmes types,
// avec en plus un sous-type (P279) qui descend de « hélicoptère » (Q34486).
const TYPES_WIKIDATA = 'wd:Q15056995 wd:Q15056993';
const HELICOPTERE = 'Q34486';

// Désignations militaires américaines des hélicoptères (UH-1, CH-53K, OH-58…) :
// leur description dit souvent seulement « utility helicopter ».
const DESIGNATION_MILITAIRE_HELICO = /\b(AH|CH|HH|MH|OH|SH|TH|UH)-\d/;

const SORTIE = path.join(DIR, 'candidats.json');

// ─── FONCTIONS ────────────────────────────────────────────────────────────────

/**
 * Numéros Wikidata des appareils les plus connus, du plus au moins connu.
 * @param {'avion' | 'helicoptere'} type
 */
async function topIds(type) {
  const { max, sitelinksMin } = RECHERCHES[type];
  // Hélicoptères : un sous-type (P279) qui descend de « hélicoptère », à n'importe quel niveau
  const filtreHelico = type === 'helicoptere'
    ? `?item wdt:P279/wdt:P279* wd:${HELICOPTERE} .`
    : '';
  const sparql = `
SELECT ?item ?sitelinks WHERE {
  VALUES ?type { ${TYPES_WIKIDATA} }
  ?item wdt:P31 ?type ; wikibase:sitelinks ?sitelinks .
  ${filtreHelico}
  FILTER(?sitelinks >= ${sitelinksMin})
}
ORDER BY DESC(?sitelinks)
LIMIT ${max}`;

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

/**
 * Type et catégorie proposés pour un appareil.
 *   1. Écarté si la description ou un sous-type parle de drone, de dirigeable…
 *   2. Hélicoptère si un sous-type Wikidata ou la description le dit.
 *   3. Appareil ancien → « collection ».
 *   4. Sinon la description décide (« airliner », « avion militaire »…),
 *      puis les sous-types si elle ne suffit pas. Un hélicoptère civil
 *      est classé « autre » (pas d'hélicoptère « de ligne »).
 *
 * @param {object} entity          - élément Wikidata brut
 * @param {string[]} subclassNames - noms des sous-types (P279)
 * @param {object} a               - fiche lue par parseAircraft
 * @param {boolean} fromHelicoSearch - trouvé par la recherche « hélicoptères »
 * @returns {{ type, category, excluded? }} excluded = raison de l'exclusion
 */
function classify(entity, subclassNames, a, fromHelicoSearch) {
  const descriptions = [entity.descriptions?.en?.value, entity.descriptions?.fr?.value]
    .filter(Boolean).join(' | ');
  const subclasses = subclassNames.join(' | ');
  const all = `${descriptions} | ${subclasses}`;

  const type = fromHelicoSearch || VOILURE_TOURNANTE.test(all) ? 'helicoptere' : 'avion';

  const exclu = EXCLUS.exec(all);
  if (exclu) return { type, category: 'autre', excluded: `non piloté ou hors sujet (« ${exclu[0]} »)` };

  const year = a.first_flight ? Number(a.first_flight.slice(0, 4)) : null;
  if (year && (year < COLLECTION_AVANT || (year < COLLECTION_RETIRE_AVANT && a.retirement))) {
    return { type, category: 'collection' };
  }

  let category = 'autre';
  // Description : les mots civils d'abord (« Airliner produced by Airbus and
  // Bombardier » parle d'un constructeur, pas d'un bombardier ; le TriStar
  // est « à usage civil et militaire »).
  if (LIGNE.test(descriptions))          category = 'ligne';
  else if (MILITAIRE.test(descriptions)) category = 'militaire';
  // Sous-types : les mots militaires d'abord (« avion de transport militaire »)
  else if (MILITAIRE.test(subclasses))   category = 'militaire';
  else if (LIGNE.test(subclasses))       category = 'ligne';

  if (type === 'helicoptere') {
    if (category === 'ligne') category = 'autre';
    if (DESIGNATION_MILITAIRE_HELICO.test(a.enwiki_title ?? '')) category = 'militaire';
  }
  return { type, category };
}

// ─── PROGRAMME ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Étape 1 : sélection des appareils (Wikidata) ===\n');

  // Avions imposés (ids courts existants) : toujours inclus
  const imposes = Object.entries(readJson('scripts/import-catalogue/wikidata-ids.json'))
    .filter(([key]) => !key.startsWith('_'))
    .map(([slug, { id }]) => ({ slug, qid: id }));
  const slugParQid = Object.fromEntries(imposes.map(i => [i.qid, i.slug]));

  console.log('→ Listes des appareils les plus connus (SPARQL)');
  const topAvions = await withRetry(() => topIds('avion'));
  await sleep(PAUSE_MS);
  const topHelicos = await withRetry(() => topIds('helicoptere'));
  await sleep(PAUSE_MS);
  console.log(`  ${topAvions.length} avions, ${topHelicos.length} hélicoptères, ${imposes.length} imposés\n`);

  const sitelinks = Object.fromEntries([...topAvions, ...topHelicos].map(t => [t.qid, t.sitelinks]));
  const helicoSearch = new Set(topHelicos.map(t => t.qid));
  const qids = [...new Set([
    ...imposes.map(i => i.qid),
    ...topAvions.map(t => t.qid),
    ...topHelicos.map(t => t.qid),
  ])];

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
  const retenus = { avion: 0, helicoptere: 0 };

  // Ordre : les imposés d'abord, puis par notoriété décroissante dans chaque liste
  for (const qid of qids) {
    const entity = entities[qid];
    const impose = qid in slugParQid;
    const a = entity ? parseAircraft(entity, names) : null;

    let excluded = null;
    if (!entity)               excluded = 'introuvable sur Wikidata';
    else if (!isAircraft(entity)) excluded = 'pas un modèle d\'aéronef';
    else if (!a.enwiki_title)  excluded = 'pas d\'article Wikipédia anglais (Gemini ne pourra pas le nommer)';
    else if (!a.image_file)    excluded = 'pas de photo sur Wikidata';

    const subclassNames = entity ? linkedIds(entity).subclasses.map(id => names[id]).filter(Boolean) : [];
    const classement = entity
      ? classify(entity, subclassNames, a, helicoSearch.has(qid))
      : { type: 'avion', category: 'autre' };
    if (!excluded && classement.excluded && !impose) excluded = classement.excluded;

    if (excluded && impose) console.warn(`  ⚠  avion imposé ${slugParQid[qid]} (${qid}) : ${excluded}`);
    if (excluded && !impose) continue; // on ne liste pas ce qui n'est pas importable

    // Identifiant court : imposé, sinon tiré du titre Wikipédia anglais
    let slug = slugParQid[qid] ?? slugify(a.enwiki_title);
    if (slugsPris.has(slug)) slug = `${slug}-${qid.toLowerCase()}`;
    slugsPris.add(slug);

    const { type } = classement;
    const auPalier = impose || retenus[type] < PALIERS[type];
    if (auPalier) retenus[type]++;

    const avant = precedent[qid];
    avions.push({
      id:           slug,
      wikidata_id:  qid,
      enwiki_title: a?.enwiki_title ?? null,
      name:         a?.name ?? null,
      type,
      category:     avant?.category ?? classement.category,
      include:      avant?.include ?? (auPalier && !excluded),
      sitelinks:    sitelinks[qid] ?? null,
      sous_types:   subclassNames,
      ...(excluded ? { probleme: excluded } : {}),
    });
  }

  const inclus = avions.filter(a => a.include);
  const compte = key => inclus.reduce((acc, a) => ({ ...acc, [a[key]]: (acc[a[key]] ?? 0) + 1 }), {});

  fs.writeFileSync(SORTIE, JSON.stringify({
    _comment: 'Généré par npm run import:selection. Relire : "include" (garder ou non) et "category" (ligne, militaire, collection, autre). Vos corrections sont conservées si on relance. Ensuite : npm run import:catalogue.',
    genere_le: new Date().toISOString().slice(0, 10),
    paliers: PALIERS,
    avions,
  }, null, 2) + '\n', 'utf8');

  console.log(`\n✓ ${path.relative(process.cwd(), SORTIE)} : ${avions.length} appareils listés, ${inclus.length} inclus`);
  console.log('  par type :', compte('type'));
  console.log('  par catégorie :', compte('category'));
}

main().catch(err => {
  console.error('\n✗', err.message);
  process.exit(1);
});
