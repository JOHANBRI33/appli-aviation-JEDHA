/**
 * lib/wikidata.js
 *
 * Récupère la fiche d'un avion sur Wikidata et sa photo sur Wikimedia Commons.
 * Utilisé par la route serveur app/api/identifier/ (un avion à la fois) ;
 * prévu pour être réutilisé par le script d'import du catalogue.
 *
 * Fonctionnement :
 *   1. Gemini donne le titre de la page Wikipédia anglaise (« Boeing 747 »).
 *   2. L'API Wikidata trouve l'élément correspondant à ce titre en un seul
 *      appel (wbgetentities), redirections comprises (« Airbus A320 » →
 *      « Airbus A320 family » → Q6475).
 *   3. parseAircraft() transforme la réponse brute en fiche : c'est une
 *      fonction pure (aucun appel réseau), facile à tester.
 *
 * Pas de clé API nécessaire : Wikidata et Commons sont publics.
 * Données Wikidata sous licence CC0 ; photos Commons : auteur et licence
 * à afficher sous chaque image.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// User-Agent obligatoire pour les API Wikimedia. Leur règlement demande un
// moyen de contact : l'URL du dépôt (pas d'email personnel). Sans contact,
// Wikidata bride plus vite les appels (erreur 429).
const USER_AGENT = 'FlightHunter/1.0 (https://github.com/JOHANBRI33/appli-aviation-JEDHA; projet de formation Jedha)';

// Erreur 429 (trop d'appels) : on réessaie une fois seulement si Wikidata
// demande d'attendre au plus ce nombre de secondes, sinon on abandonne.
const MAX_RETRY_WAIT_S = 3;

const WIKIDATA_API = 'https://www.wikidata.org/w/api.php';
const COMMONS_API  = 'https://commons.wikimedia.org/w/api.php';

// Largeur de la miniature demandée à Commons.
const THUMB_WIDTH = 1024;

// Types Wikidata qui désignent un modèle d'avion (propriété P31 « nature de l'élément »).
// Un moteur (Q15057020) ou une entreprise n'en font pas partie.
const AIRCRAFT_TYPES = new Set([
  'Q15056995', // aircraft model (ex. Concorde)
  'Q15056993', // aircraft family (ex. Boeing 747, famille Airbus A320)
]);

// Codes des propriétés Wikidata utilisées.
const P = {
  instanceOf:   'P31',
  manufacturer: 'P176',
  firstFlight:  'P606',
  maxSpeed:     'P2052',
  length:       'P2043',
  wingspan:     'P2050',
  unitsBuilt:   'P1092',
  image:        'P18',
  height:       'P2048',
  range:        'P2073',
  ceiling:      'P2254', // altitude maximale d'utilisation
  serviceEntry: 'P729',
  retirement:   'P730',
  country:      'P495',  // pays d'origine
  engine:       'P516',  // motorisation
  subclassOf:   'P279',  // sous-type (« avion de ligne », « chasseur »…)
  refUrl:       'P854', // dans une référence : URL de la source
  statedIn:     'P248', // dans une référence : ouvrage ou base qui affirme la donnée
};

// ─── RARETÉ ───────────────────────────────────────────────────────────────────
// Basée sur le nombre d'exemplaires construits (voir lib/points.js pour les
// points et badges de chaque niveau).
//
//  5  Légendaire  ≤ 50 exemplaires
//  4  Platine     51 – 500
//  3  Or          501 – 2 000
//  2  Argent      2 001 – 10 000
//  1  Bronze      > 10 000
//
// Nombre inconnu → 3 (Or), décision d'équipe du 16/11/2026 : un avion mal
// renseigné sur Wikidata ne doit pas rapporter le maximum de points.
const RARITY_THRESHOLDS = [
  { min: 10001, rarity: 1 },
  { min: 2001,  rarity: 2 },
  { min: 501,   rarity: 3 },
  { min: 51,    rarity: 4 },
  { min: 1,     rarity: 5 },
];
export const RARITY_UNKNOWN = 3;

export function computeRarity(unitsBuilt) {
  if (!unitsBuilt || unitsBuilt <= 0) return RARITY_UNKNOWN;
  return RARITY_THRESHOLDS.find(t => unitsBuilt >= t.min).rarity;
}

// ─── CONVERSIONS D'UNITÉS ─────────────────────────────────────────────────────
// Chaque valeur Wikidata arrive avec le numéro de son unité (ex. Q128822 = nœud).
// On ne devine jamais : une unité absente de ces tables donne null.
// Unités relevées sur Wikidata le 16/11/2026 pour les vitesses et dimensions d'avions.

const TO_KMH = {
  Q180154: 1,         // kilomètre par heure
  Q128822: 1.852,     // nœud
  Q211256: 1.609344,  // mile par heure
  Q182429: 3.6,       // mètre par seconde
  // Mach (Q160669) ignoré : sa valeur en km/h dépend de l'altitude
};

const TO_KM = {
  Q828224: 1,         // kilomètre
  Q93318:  1.852,     // mille marin
  Q253276: 1.609344,  // mile
};

const TO_METRES = {
  Q11573:  1,         // mètre
  Q3710:   0.3048,    // pied
  Q218593: 0.0254,    // pouce
  Q174728: 0.01,      // centimètre
  Q174789: 0.001,     // millimètre
};

/**
 * Convertit une quantité Wikidata ({ amount: "+470", unit: ".../Q128822" })
 * avec la table donnée. Renvoie null si l'unité est inconnue ou si le
 * résultat sort de [min, max] (valeur sûrement erronée).
 */
function convertQuantity(quantity, table, { min, max, decimals }) {
  if (!quantity) return null;
  const unitId = quantity.unit?.split('/').pop();
  const factor = table[unitId];
  const amount = parseFloat(quantity.amount);
  if (!factor || isNaN(amount)) return null;

  const value = amount * factor;
  if (value < min || value > max) return null;
  return Number(value.toFixed(decimals));
}

// ─── LECTURE DES DÉCLARATIONS WIKIDATA ────────────────────────────────────────

/**
 * Déclarations retenues pour une propriété : celles de rang « préféré » s'il
 * y en a, sinon celles de rang « normal ». Les rangs « obsolète » sont ignorés.
 */
function bestClaims(entity, property) {
  const claims = (entity.claims?.[property] ?? [])
    .filter(c => c.rank !== 'deprecated' && c.mainsnak?.datavalue);
  const preferred = claims.filter(c => c.rank === 'preferred');
  return preferred.length > 0 ? preferred : claims;
}

/** Liens vers les sources citées dans les références d'une déclaration. */
function claimSources(claim) {
  const urls = [];
  for (const ref of claim?.references ?? []) {
    for (const snak of ref.snaks?.[P.refUrl] ?? []) {
      if (snak.datavalue) urls.push(snak.datavalue.value);
    }
    for (const snak of ref.snaks?.[P.statedIn] ?? []) {
      if (snak.datavalue) urls.push(`https://www.wikidata.org/wiki/${snak.datavalue.value.id}`);
    }
  }
  return urls;
}

/**
 * Date Wikidata ("+1969-02-09T00:00:00Z") → "1969-02-09".
 * Quand seule l'année ou le mois est connu, Wikidata met "00" : on le remplace
 * par "01" pour que la colonne SQL `date` l'accepte.
 */
function toIsoDate(time) {
  const match = /^\+(\d{4})-(\d{2})-(\d{2})/.exec(time ?? '');
  if (!match) return null;
  const [, year, month, day] = match;
  return `${year}-${month === '00' ? '01' : month}-${day === '00' ? '01' : day}`;
}

/**
 * Libellé en français, sinon en anglais, sinon « mul » (libellé commun à
 * toutes les langues, que Wikidata utilise de plus en plus à la place de en/fr).
 */
function label(entity) {
  return entity?.labels?.fr?.value ?? entity?.labels?.en?.value ?? entity?.labels?.mul?.value ?? null;
}

/** Vrai si l'élément Wikidata est un modèle d'avion (et pas un moteur, une entreprise…). */
export function isAircraft(entity) {
  if (!entity?.claims) return false;
  const types = bestClaims(entity, P.instanceOf).map(c => c.mainsnak.datavalue.value.id);
  // Un premier vol (P606) n'existe que pour des aéronefs : bon indice si le type manque
  return types.some(t => AIRCRAFT_TYPES.has(t)) || bestClaims(entity, P.firstFlight).length > 0;
}

/** Numéros Wikidata cités par une propriété (ex. constructeurs) : ['Q8793', …]. */
function claimIds(entity, property) {
  return bestClaims(entity, property)
    .map(c => c.mainsnak.datavalue.value?.id)
    .filter(Boolean);
}

/**
 * Numéros des éléments liés dont il faut demander le nom (voir fetchLabels)
 * avant d'appeler parseAircraft : constructeurs, pays, moteurs, sous-types.
 */
export function linkedIds(entity) {
  return {
    manufacturers: claimIds(entity, P.manufacturer).slice(0, 2),
    countries:     claimIds(entity, P.country).slice(0, 2),
    engines:       claimIds(entity, P.engine).slice(0, 2),
    subclasses:    claimIds(entity, P.subclassOf),
  };
}

/** Noms liés aux numéros, sans les inconnus, joints par « / ». */
function joinNames(ids, names) {
  return ids.map(id => names[id]).filter(Boolean).join(' / ') || null;
}

/**
 * Transforme un élément Wikidata brut en fiche d'avion. Fonction pure.
 *
 * @param {object} entity - élément renvoyé par wbgetentities
 * @param {object} names  - noms des éléments liés : { Q8793: 'Boeing', … }
 *                          (voir linkedIds et fetchLabels)
 * @returns {object} champs de la table aircraft + `sources`, `aliases`,
 *                   titres et liens Wikipédia, `image_file`
 */
export function parseAircraft(entity, names = {}) {
  // Valeur unique : on garde la première déclaration retenue (ordre stable sur Wikidata)
  const first = property => bestClaims(entity, property)[0];
  const quantity = claim => claim?.mainsnak.datavalue.value;

  // Dates : la plus ancienne (premier vol du prototype, première mise en service)
  const earliestDate = property => bestClaims(entity, property)
    .map(c => ({ claim: c, date: toIsoDate(c.mainsnak.datavalue.value.time) }))
    .filter(d => d.date)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const firstFlight  = earliestDate(P.firstFlight);
  const serviceEntry = earliestDate(P.serviceEntry);
  const retirement   = earliestDate(P.retirement);

  // Exemplaires construits : la valeur la plus grande (les plus anciennes
  // déclarations datent souvent d'avant la fin de la production)
  const units = bestClaims(entity, P.unitsBuilt)
    .map(c => ({ claim: c, count: parseInt(c.mainsnak.datavalue.value.amount, 10) }))
    .filter(u => u.count > 0)
    .sort((a, b) => b.count - a.count)[0];
  const unitsBuilt = units?.count ?? null;

  const speedClaim    = first(P.maxSpeed);
  const lengthClaim   = first(P.length);
  const wingspanClaim = first(P.wingspan);
  const heightClaim   = first(P.height);
  const rangeClaim    = first(P.range);
  const ceilingClaim  = first(P.ceiling);

  // Sources citées pour chaque donnée (liens vers les références Wikidata)
  const sources = {};
  const addSources = (field, claim) => {
    const urls = claimSources(claim);
    if (urls.length > 0) sources[field] = [...new Set(urls)];
  };
  addSources('first_flight',  firstFlight?.claim);
  addSources('max_speed_kmh', speedClaim);
  addSources('length_m',      lengthClaim);
  addSources('wingspan_m',    wingspanClaim);
  addSources('height_m',      heightClaim);
  addSources('range_km',      rangeClaim);
  addSources('ceiling_m',     ceilingClaim);
  addSources('units_built',   units?.claim);
  addSources('service_entry', serviceEntry?.claim);
  addSources('retirement',    retirement?.claim);

  // Autres noms de l'avion (en minuscules), pour retrouver la fiche à partir
  // du nom donné par Gemini : libellés, alias et titre Wikipédia anglais
  const enwikiTitle = entity.sitelinks?.enwiki?.title ?? null;
  const aliases = [
    entity.labels?.en?.value, entity.labels?.fr?.value, entity.labels?.mul?.value, enwikiTitle,
    ...(entity.aliases?.en ?? []).map(a => a.value),
    ...(entity.aliases?.fr ?? []).map(a => a.value),
    ...(entity.aliases?.mul ?? []).map(a => a.value),
  ].filter(Boolean).map(a => a.toLowerCase());

  const ids = linkedIds(entity);
  const length = { min: 1, max: 150, decimals: 2 };

  return {
    wikidata_id:   entity.id,
    name:          label(entity) ?? enwikiTitle,
    manufacturer:  joinNames(ids.manufacturers, names),
    description:   entity.descriptions?.fr?.value ?? entity.descriptions?.en?.value ?? null,
    first_flight:  firstFlight?.date ?? null,
    max_speed_kmh: convertQuantity(quantity(speedClaim), TO_KMH, { min: 50, max: 8000, decimals: 0 }),
    length_m:      convertQuantity(quantity(lengthClaim), TO_METRES, length),
    wingspan_m:    convertQuantity(quantity(wingspanClaim), TO_METRES, length),
    height_m:      convertQuantity(quantity(heightClaim), TO_METRES, { min: 1, max: 40, decimals: 2 }),
    range_km:      convertQuantity(quantity(rangeClaim), TO_KM, { min: 50, max: 25000, decimals: 0 }),
    ceiling_m:     convertQuantity(quantity(ceilingClaim), TO_METRES, { min: 500, max: 30000, decimals: 0 }),
    service_entry: serviceEntry?.date ?? null,
    retirement:    retirement?.date ?? null,
    country_of_origin: joinNames(ids.countries, names),
    engines:       joinNames(ids.engines, names),
    units_built:   unitsBuilt,
    rarity:        computeRarity(unitsBuilt),
    image_file:    first(P.image)?.mainsnak.datavalue.value ?? null, // nom du fichier Commons
    sources,
    aliases:       [...new Set(aliases)],
    enwiki_title:  enwikiTitle,
    frwiki_title:  entity.sitelinks?.frwiki?.title ?? null,
    wikipedia_en_url: entity.sitelinks?.enwiki?.url ?? null,
    wikipedia_fr_url: entity.sitelinks?.frwiki?.url ?? null,
  };
}

// ─── APPELS À L'API WIKIDATA ──────────────────────────────────────────────────

async function wikidataGet(params, isRetry = false) {
  const url = new URL(WIKIDATA_API);
  for (const [key, value] of Object.entries({ ...params, format: 'json' })) {
    url.searchParams.set(key, value);
  }
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });

  if (res.status === 429) {
    // Wikidata indique combien de secondes attendre (en-tête Retry-After)
    const waitS = parseInt(res.headers.get('retry-after') ?? '', 10);
    if (!isRetry && waitS <= MAX_RETRY_WAIT_S) {
      await new Promise(resolve => setTimeout(resolve, waitS * 1000));
      return wikidataGet(params, true);
    }
    throw new Error(`Wikidata : trop d'appels, réessayer dans ${waitS || '?'} s`);
  }
  if (!res.ok) throw new Error(`Wikidata ${res.status} (${params.action})`);
  return res.json();
}

/**
 * Récupère des éléments Wikidata complets (50 au maximum par appel),
 * soit par numéros (`ids`), soit par titres de pages Wikipédia anglaises
 * (`enwikiTitles`, redirections suivies).
 *
 * @returns {Promise<object[]>} éléments trouvés (les introuvables sont omis)
 */
export async function fetchEntities({ ids, enwikiTitles }) {
  const params = {
    action:     'wbgetentities',
    props:      'labels|descriptions|aliases|claims|sitelinks/urls',
    languages:  'fr|en|mul',
    sitefilter: 'enwiki|frwiki',
  };
  if (ids) {
    params.ids = ids.join('|');
  } else {
    params.sites  = 'enwiki';
    params.titles = enwikiTitles.join('|');
    // Corrige la casse du titre (« boeing 747 » → « Boeing 747 ») ;
    // Wikidata ne l'accepte qu'avec un seul titre
    if (enwikiTitles.length === 1) params.normalize = '1';
  }

  const data = await wikidataGet(params);
  return Object.values(data.entities ?? {}).filter(e => e.missing === undefined && e.claims);
}

/** Libellés français (sinon anglais) d'une liste de numéros : { Q8793: 'Boeing' }. */
export async function fetchLabels(ids) {
  if (ids.length === 0) return {};
  const data = await wikidataGet({
    action: 'wbgetentities', ids: ids.join('|'), props: 'labels', languages: 'fr|en|mul',
  });
  return Object.fromEntries(
    Object.values(data.entities ?? {}).map(e => [e.id, label(e)])
  );
}

/**
 * Trouve l'élément Wikidata d'un avion à partir du nom donné par Gemini.
 *   1. Titre exact de la page Wikipédia anglaise (cas normal : un seul appel).
 *   2. Sinon, recherche par nom et on garde le premier résultat qui est
 *      vraiment un avion (vérifié sur son type, pas sur sa description).
 *
 * @returns {Promise<object | null>} élément Wikidata brut, ou null
 */
export async function findAircraftEntity(name) {
  const [byTitle] = await fetchEntities({ enwikiTitles: [name] });
  if (isAircraft(byTitle)) return byTitle;

  const search = await wikidataGet({
    action: 'wbsearchentities', search: name, language: 'en', type: 'item', limit: '7',
  });
  const ids = (search.search ?? []).map(r => r.id);
  if (ids.length === 0) return null;

  // fetchEntities renvoie les éléments dans l'ordre de la recherche
  const candidates = await fetchEntities({ ids });
  return candidates.find(isAircraft) ?? null;
}

// ─── LIGNE DE LA TABLE aircraft ───────────────────────────────────────────────

/** "Boeing 777X" → "boeing-777x" (minuscules, sans accents ni espaces). */
export function slugify(text) {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')      // retire les précisions entre parenthèses
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Assemble une ligne de la table aircraft à partir des données collectées.
 * Partagé par le script d'import (scripts/import-catalogue/run.js) et la
 * route /api/identifier, pour que les deux remplissent la table de la même façon.
 *
 * @param {object} p
 * @param {string} p.id        - identifiant court (ex. 'b747')
 * @param {string} p.category  - 'ligne' | 'militaire' | 'collection' | 'autre'
 * @param {object} p.parsed    - résultat de parseAircraft
 * @param {object} [p.image]   - résultat de fetchCommonsImageInfo
 * @param {string} [p.intro]   - introduction de l'article Wikipédia français
 * @param {string} [p.hints]   - indices visuels pour npm run test:vision
 * @param {boolean} p.verified - true si importé et relu par l'équipe
 */
export function toAircraftRow({ id, category, parsed: a, image = null, intro = null, hints = null, verified }) {
  const summary = shortSummary(intro);
  return {
    id,
    name:              a.name,
    manufacturer:      a.manufacturer ?? 'Inconnu',   // colonne NOT NULL
    category,
    // Résumé Wikipédia ; sinon la description courte de Wikidata (CC0)
    description:       summary ?? a.description,
    recognition_hints: hints,
    first_flight:      a.first_flight,
    max_speed_kmh:     a.max_speed_kmh,
    length_m:          a.length_m,
    wingspan_m:        a.wingspan_m,
    height_m:          a.height_m,
    range_km:          a.range_km,
    ceiling_m:         a.ceiling_m,
    service_entry:     a.service_entry,
    retirement:        a.retirement,
    country_of_origin: a.country_of_origin,
    engines:           a.engines,
    units_built:       a.units_built,
    rarity:            a.rarity,
    image_url:         image?.thumbUrl ?? null,
    image_author:      image?.author ?? null,
    image_license:     image?.license ?? null,
    image_license_url: image?.licenseUrl ?? null,
    image_source_url:  image?.sourceUrl ?? null,
    wikidata_id:       a.wikidata_id,
    enwiki_title:      a.enwiki_title,
    aliases:           a.aliases,
    // Lien vers l'article : obligatoire quand le résumé vient de Wikipédia (CC BY-SA)
    wikipedia_url:     summary ? a.wikipedia_fr_url : (a.wikipedia_fr_url ?? a.wikipedia_en_url),
    sources:           a.sources,
    verified,
  };
}

// ─── FICHE EN DIRECT POUR LA ROUTE /api/identifier ────────────────────────────

/**
 * Construit la fiche complète d'un avion à partir de son nom, en direct :
 * élément Wikidata → noms liés → photo Commons → résumé Wikipédia.
 * Utilisé quand l'avion n'est pas encore dans la table aircraft.
 *
 * La fiche a les colonnes de la table aircraft (voir toAircraftRow), avec
 * pour id provisoire le numéro Wikidata et verified = false.
 *
 * @param {string} name     - nom donné par Gemini, ex. 'Airbus A320'
 * @param {string} category - 'ligne' | 'militaire' | 'collection' | 'autre'
 * @returns {Promise<object | null>} null si l'avion est introuvable
 */
export async function fetchAircraftFiche(name, category = 'autre') {
  // Fiche déjà trouvée récemment : on la réutilise sans redemander à Wikidata
  const key = name.trim().toLowerCase();
  const cached = ficheCache.get(key);
  if (cached && Date.now() - cached.loadedAt < FICHE_CACHE_MS) return cached.fiche;

  const fiche = await buildFiche(name, category);
  ficheCache.set(key, { fiche, loadedAt: Date.now() });
  return fiche;
}

// Mémoire des fiches déjà construites : Wikidata bloque les appels trop
// nombreux (« too many requests »), on évite donc de redemander le même avion.
const FICHE_CACHE_MS = 24 * 60 * 60_000; // 24 heures
const ficheCache = new Map();             // nom en minuscules → { fiche, loadedAt }

async function buildFiche(name, category) {
  const entity = await findAircraftEntity(name.trim());
  if (!entity) return null;

  // Constructeurs, pays et moteurs sont d'autres éléments Wikidata : il faut demander leur nom
  const ids = linkedIds(entity);
  const imageFile = bestClaims(entity, P.image)[0]?.mainsnak.datavalue.value;
  const frTitle = entity.sitelinks?.frwiki?.title;

  const [names, image, intros] = await Promise.all([
    fetchLabels([...ids.manufacturers, ...ids.countries, ...ids.engines]),
    // Commons ou Wikipédia indisponible : la fiche s'affiche quand même
    fetchCommonsImageInfo(imageFile).catch(err => {
      console.warn(`[wikidata] photo Commons indisponible pour ${imageFile} :`, err.message);
      return null;
    }),
    frTitle
      ? fetchWikipediaIntros([frTitle]).catch(err => {
          console.warn(`[wikidata] résumé Wikipédia indisponible pour ${frTitle} :`, err.message);
          return {};
        })
      : {},
  ]);

  const parsed = parseAircraft(entity, names);
  return toAircraftRow({
    id: parsed.wikidata_id, category, parsed, image, intro: intros[frTitle], verified: false,
  });
}

// ─── WIKIMEDIA COMMONS ────────────────────────────────────────────────────────

/** Supprime les balises HTML et décode les entités HTML courantes. */
function stripHtml(str) {
  if (!str) return str;
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Retire les paramètres de suivi (utm_*) ajoutés par Commons aux URL d'images. */
function withoutTracking(rawUrl) {
  if (!rawUrl) return null;
  const url = new URL(rawUrl);
  for (const key of [...url.searchParams.keys()]) {
    if (key.startsWith('utm_')) url.searchParams.delete(key);
  }
  return url.toString();
}

/**
 * Clé commune pour comparer des titres MediaWiki : les API remplacent « _ »
 * par une espace et mettent la première lettre en majuscule.
 */
function titleKey(title) {
  const t = title.replace(/^File:/, '').replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Pour chaque titre demandé, le titre final de la page, après les
 * normalisations et redirections signalées par l'API.
 */
function resolveTitles(query, titles) {
  const renamed = {};
  for (const step of [...(query?.normalized ?? []), ...(query?.redirects ?? [])]) {
    renamed[titleKey(step.from)] = titleKey(step.to);
  }
  return Object.fromEntries(titles.map(t => {
    let key = titleKey(t);
    while (renamed[key] && renamed[key] !== key) key = renamed[key];
    return [t, key];
  }));
}

/**
 * Récupère la miniature, l'auteur, la licence et le lien Commons de
 * plusieurs photos (50 au maximum par appel).
 *
 * @param {string[]} filenames - ex. ["Airbus A320.jpg", …] (valeurs de P18)
 * @returns {Promise<object>} { "Airbus A320.jpg": { thumbUrl, author, … } }
 */
export async function fetchCommonsImagesInfo(filenames) {
  if (filenames.length === 0) return {};

  const url = new URL(COMMONS_API);
  url.searchParams.set('action',        'query');
  url.searchParams.set('titles',        filenames.map(f => `File:${f}`).join('|'));
  url.searchParams.set('prop',          'imageinfo');
  url.searchParams.set('iiprop',        'url|extmetadata');
  url.searchParams.set('iiurlwidth',    String(THUMB_WIDTH));
  url.searchParams.set('format',        'json');
  url.searchParams.set('formatversion', '2');

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Commons API ${res.status}`);
  const data = await res.json();

  const pages = Object.fromEntries(
    (data.query?.pages ?? []).map(p => [titleKey(p.title), p])
  );
  const finalTitles = resolveTitles(data.query, filenames);

  const result = {};
  for (const filename of filenames) {
    const page = pages[finalTitles[filename]];
    const info = page?.imageinfo?.[0];
    if (!info) continue;

    const meta      = info.extmetadata ?? {};
    const rawAuthor = meta.Artist?.value ?? meta.Credit?.value ?? null;
    result[filename] = {
      thumbUrl:   withoutTracking(info.thumburl ?? info.url),
      author:     rawAuthor ? stripHtml(rawAuthor) : null,
      license:    meta.LicenseShortName?.value ?? null,
      licenseUrl: meta.LicenseUrl?.value ?? null,
      sourceUrl:  info.descriptionurl
        ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
    };
  }
  return result;
}

/** Même chose pour une seule photo (utilisé par la route /api/identifier). */
export async function fetchCommonsImageInfo(filename) {
  if (!filename) return null;
  const infos = await fetchCommonsImagesInfo([filename]);
  return infos[filename] ?? null;
}

// ─── WIKIPÉDIA ────────────────────────────────────────────────────────────────

// Texte Wikipédia sous licence CC BY-SA 4.0 : le lien vers l'article est
// obligatoire partout où le résumé est affiché.
export const WIKIPEDIA_TEXT_LICENSE = 'CC BY-SA 4.0';

/**
 * Raccourcit un texte à des phrases entières, sans dépasser maxChars
 * (au moins la première phrase est gardée).
 */
export function shortSummary(text, maxChars = 500) {
  if (!text) return null;
  const sentences = text.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+(\s|$)/g) ?? [text];
  let summary = '';
  for (const sentence of sentences) {
    if (summary && (summary + sentence).length > maxChars) break;
    summary += sentence;
  }
  return summary.trim();
}

/**
 * Récupère l'introduction (texte brut) de plusieurs articles Wikipédia,
 * 20 au maximum par appel (limite de l'API).
 *
 * @param {string[]} titles - titres des articles, ex. ["Boeing 747"]
 * @param {string}   lang   - 'fr' ou 'en'
 * @returns {Promise<object>} { "Boeing 747": "Le Boeing 747 est …" }
 */
export async function fetchWikipediaIntros(titles, lang = 'fr') {
  if (titles.length === 0) return {};

  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set('action',        'query');
  url.searchParams.set('titles',        titles.join('|'));
  url.searchParams.set('prop',          'extracts');
  url.searchParams.set('exintro',       '1');
  url.searchParams.set('explaintext',   '1');
  url.searchParams.set('exlimit',       'max');
  url.searchParams.set('redirects',     '1');
  url.searchParams.set('format',        'json');
  url.searchParams.set('formatversion', '2');

  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Wikipédia ${lang} ${res.status}`);
  const data = await res.json();

  const pages = Object.fromEntries(
    (data.query?.pages ?? []).map(p => [titleKey(p.title), p])
  );
  const finalTitles = resolveTitles(data.query, titles);

  const result = {};
  for (const title of titles) {
    const extract = pages[finalTitles[title]]?.extract;
    if (extract) result[title] = extract;
  }
  return result;
}
