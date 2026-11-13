/**
 * lib/wikidata.js
 *
 * Récupère les informations d'un avion sur Wikidata et sa photo sur
 * Wikimedia Commons. Code repris de scripts/import-catalogue/run.js pour
 * pouvoir aussi l'utiliser depuis la route serveur app/api/identifier/.
 *
 * Pas de clé API nécessaire : Wikidata et Commons sont publics.
 * Données Wikidata sous licence CC0 ; photos Commons : auteur et licence
 * à afficher sous chaque image.
 */

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// User-Agent obligatoire pour les API Wikimedia (pas d'email selon consignes).
const USER_AGENT = 'AppliAviationJedha/1.0 (projet-formation-nextjs)';

// Largeur de la miniature demandée à Commons.
const THUMB_WIDTH = 1024;

// ─── RARETÉ ───────────────────────────────────────────────────────────────────
// Même règle que le catalogue, basée sur le nombre d'exemplaires construits.
//
//  5  très rare     ≤ 50 exemplaires (ou nombre inconnu)
//  4  rare          51 – 500
//  3  peu commun   501 – 2 000
//  2  commun      2 001 – 10 000
//  1  très commun  > 10 000
const RARITY_THRESHOLDS = [
  { min: 10001, rarity: 1 },
  { min: 2001,  rarity: 2 },
  { min: 501,   rarity: 3 },
  { min: 51,    rarity: 4 },
  { min: 0,     rarity: 5 },
];

export function computeRarity(unitsBuilt) {
  if (!unitsBuilt || unitsBuilt <= 0) return 5; // inconnu → très rare par défaut
  for (const { min, rarity } of RARITY_THRESHOLDS) {
    if (unitsBuilt >= min) return rarity;
  }
  return 5;
}

// ─── UTILITAIRES ──────────────────────────────────────────────────────────────

/** Supprime les balises HTML et décode les entités HTML courantes. */
function stripHtml(str) {
  if (!str) return str;
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── CONVERSIONS D'UNITÉS ─────────────────────────────────────────────────────
// Les valeurs de Wikidata arrivent avec leur unité (km/h, nœuds, pieds…).
// On convertit tout en km/h et en mètres.

export function toKmh(value, unitUri = '') {
  const v = parseFloat(value);
  if (!value || isNaN(v) || v <= 0) return null;

  if (unitUri.includes('Q180154')) return Math.round(v);         // km/h → rien
  if (unitUri.includes('Q182429')) return Math.round(v * 3.6);   // m/s → km/h
  if (unitUri.includes('Q39369'))  return Math.round(v * 1.852); // nœuds → km/h
  if (unitUri.includes('Q39018'))  return Math.round(v * 1.609); // mph → km/h

  // Unité inconnue : entre 100 et 5000, on suppose que c'est déjà des km/h
  if (v > 100 && v < 5000) return Math.round(v);
  // Sinon on tente une conversion m/s → km/h
  const kmh = v * 3.6;
  if (kmh > 100 && kmh < 5000) return Math.round(kmh);
  return null;
}

export function toMetres(value, unitUri = '') {
  const v = parseFloat(value);
  if (!value || isNaN(v) || v <= 0) return null;

  if (unitUri.includes('Q11573'))  return parseFloat(v.toFixed(2));            // mètre
  if (unitUri.includes('Q3710'))   return parseFloat((v * 0.3048).toFixed(2)); // pied
  if (unitUri.includes('Q218593')) return parseFloat((v * 0.3048).toFixed(2)); // pied (autre code)

  // Unité inconnue : entre 1 et 300 m, c'est plausible pour un avion
  if (v >= 1 && v <= 300) return parseFloat(v.toFixed(2));
  return null;
}

// ─── WIKIDATA ─────────────────────────────────────────────────────────────────

/**
 * Interroge Wikidata (langage de requête SPARQL) pour un avion donné.
 * Retourne ses propriétés techniques, ou null si rien n'est trouvé.
 *
 * Codes des propriétés Wikidata utilisées :
 *   P176 constructeur, P729 / P571 premier vol (ou mise en service),
 *   P2052 vitesse max, P2043 longueur, P2050 envergure,
 *   P1092 nombre d'exemplaires construits, P18 photo principale.
 *
 * @param {string} wikidataId - ex. 'Q6475'
 */
export async function fetchWikidataProperties(wikidataId) {
  const sparql = `
SELECT DISTINCT
  ?manufacturerLabel
  ?firstFlight
  ?maxSpeedVal
  ?lengthVal
  ?wingspanVal
  ?unitsBuilt
  ?image
  ?descFr ?descEn
WHERE {
  BIND(wd:${wikidataId} AS ?item)
  OPTIONAL { ?item wdt:P176 ?manufacturer }
  OPTIONAL {
    { ?item wdt:P729 ?firstFlight }
    UNION
    { ?item wdt:P571 ?firstFlight }
  }
  OPTIONAL { ?item wdt:P2052 ?maxSpeedVal }
  OPTIONAL { ?item wdt:P2043 ?lengthVal }
  OPTIONAL { ?item wdt:P2050 ?wingspanVal }
  OPTIONAL { ?item wdt:P1092 ?unitsBuilt }
  OPTIONAL { ?item wdt:P18   ?image }
  OPTIONAL { ?item schema:description ?descFr . FILTER(LANG(?descFr) = "fr") }
  OPTIONAL { ?item schema:description ?descEn . FILTER(LANG(?descEn) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en" }
}
LIMIT 20`.trim();

  const url = new URL('https://query.wikidata.org/sparql');
  url.searchParams.set('query', sparql);
  url.searchParams.set('format', 'json');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/sparql-results+json' },
  });
  if (!res.ok) throw new Error(`Wikidata SPARQL ${res.status} pour ${wikidataId}`);

  const data = await res.json();
  const rows = data.results?.bindings ?? [];
  if (rows.length === 0) return null;

  // Wikidata peut renvoyer plusieurs lignes (plusieurs valeurs par propriété) :
  // on garde la première valeur valide rencontrée pour chaque champ.
  const r = {};
  for (const row of rows) {
    if (!r.manufacturer && row.manufacturerLabel) {
      r.manufacturer = row.manufacturerLabel.value;
    }

    if (!r.firstFlight && row.firstFlight) {
      // Wikidata renvoie "1988-04-18T00:00:00Z" ou "+1988-04-18T00:00:00Z"
      const raw = row.firstFlight.value.replace(/^\+/, '');
      const datePart = raw.substring(0, 10).replace(/-00/g, '-01');
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) r.firstFlight = datePart;
    }

    // L'unité est dans le champ "datatype" de la réponse
    if (!r.maxSpeed && row.maxSpeedVal) {
      r.maxSpeed     = row.maxSpeedVal.value;
      r.maxSpeedUnit = row.maxSpeedVal.datatype ?? '';
    }
    if (!r.length && row.lengthVal) {
      r.length     = row.lengthVal.value;
      r.lengthUnit = row.lengthVal.datatype ?? '';
    }
    if (!r.wingspan && row.wingspanVal) {
      r.wingspan     = row.wingspanVal.value;
      r.wingspanUnit = row.wingspanVal.datatype ?? '';
    }

    if (!r.unitsBuilt && row.unitsBuilt) {
      r.unitsBuilt = parseInt(row.unitsBuilt.value, 10);
    }

    if (!r.imageFile && row.image) {
      // URL de la forme : http://commons.wikimedia.org/wiki/Special:FilePath/Nom.jpg
      const match = row.image.value.match(/Special:FilePath\/(.+)$/);
      r.imageFile = match ? decodeURIComponent(match[1]) : null;
    }

    if (!r.descFr && row.descFr) r.descFr = row.descFr.value;
    if (!r.descEn && row.descEn) r.descEn = row.descEn.value;
  }
  return r;
}

/**
 * Cherche sur Wikidata le numéro (ex. 'Q6475') d'un avion à partir de son nom.
 * Garde le premier résultat dont la description parle d'aviation, pour ne pas
 * tomber sur un homonyme (un film, une chanson…).
 *
 * @param {string} name - ex. 'Airbus A320'
 * @returns {Promise<{ id, label } | null>}
 */
export async function searchAircraft(name) {
  const url = new URL('https://www.wikidata.org/w/api.php');
  url.searchParams.set('action',   'wbsearchentities');
  url.searchParams.set('search',   name);
  url.searchParams.set('language', 'en');
  url.searchParams.set('type',     'item');
  url.searchParams.set('limit',    '7');
  url.searchParams.set('format',   'json');

  const res = await fetch(url.toString(), { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Recherche Wikidata ${res.status} pour ${name}`);

  const data = await res.json();
  const aviationWords = /aircraft|airliner|airplane|aeroplane|fighter|bomber|jet|helicopter|trainer|plane|airship|glider/i;
  const match = (data.search ?? []).find(r => aviationWords.test(r.description ?? ''));
  return match ? { id: match.id, label: match.label } : null;
}

/**
 * Construit la fiche complète d'un avion à partir de son nom :
 * recherche Wikidata → données techniques → photo Commons → rareté.
 * La fiche a les mêmes champs que la table Supabase « aircraft »,
 * pour que components/AircraftCard.js l'affiche sans modification.
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
  const found = await searchAircraft(name);
  if (!found) return null;

  const wd = await fetchWikidataProperties(found.id);
  const image = wd?.imageFile ? await fetchCommonsImageInfo(wd.imageFile) : null;
  const unitsBuilt = wd?.unitsBuilt ?? null;

  return {
    id:                found.id,
    wikidata_id:       found.id,
    name:              found.label,
    manufacturer:      wd?.manufacturer ?? null,
    category,
    description:       wd?.descFr ?? wd?.descEn ?? null,
    first_flight:      wd?.firstFlight ?? null,
    max_speed_kmh:     toKmh(wd?.maxSpeed, wd?.maxSpeedUnit),
    length_m:          toMetres(wd?.length, wd?.lengthUnit),
    wingspan_m:        toMetres(wd?.wingspan, wd?.wingspanUnit),
    units_built:       unitsBuilt,
    rarity:            computeRarity(unitsBuilt),
    image_url:         image?.thumbUrl ?? null,
    image_author:      image?.author ?? null,
    image_license:     image?.license ?? null,
    image_license_url: image?.licenseUrl ?? null,
    image_source_url:  image?.sourceUrl ?? null,
  };
}

// ─── WIKIMEDIA COMMONS ────────────────────────────────────────────────────────

/**
 * Récupère la miniature, l'auteur, la licence et le lien Commons
 * d'un fichier photo (ex. "Airbus_A320.jpg").
 */
export async function fetchCommonsImageInfo(filename) {
  if (!filename) return null;

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action',        'query');
  url.searchParams.set('titles',        `File:${filename}`);
  url.searchParams.set('prop',          'imageinfo');
  url.searchParams.set('iiprop',        'url|extmetadata');
  url.searchParams.set('iiurlwidth',    String(THUMB_WIDTH));
  url.searchParams.set('format',        'json');
  url.searchParams.set('formatversion', '2');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Commons API ${res.status} pour ${filename}`);

  const data  = await res.json();
  const page  = data.query?.pages?.[0];
  if (!page || page.missing) return null;

  const info = page.imageinfo?.[0];
  if (!info) return null;

  const meta       = info.extmetadata ?? {};
  const thumbUrl   = info.thumburl ?? info.url ?? null;
  const sourceUrl  = info.descriptionurl
    ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`;
  const rawAuthor  = meta.Artist?.value ?? meta.Credit?.value ?? null;
  const author     = rawAuthor ? stripHtml(rawAuthor) : null;
  const license    = meta.LicenseShortName?.value ?? null;
  const licenseUrl = meta.LicenseUrl?.value ?? null;

  return { thumbUrl, author, license, licenseUrl, sourceUrl };
}
