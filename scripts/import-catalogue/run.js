#!/usr/bin/env node
/**
 * scripts/import-catalogue/run.js
 *
 * Pour chaque avion de scripts/test-vision/catalogue.json :
 *   1. Récupère les données techniques sur Wikidata (SPARQL)
 *   2. Récupère la photo principale et son crédit sur Wikimedia Commons
 *   3. Calcule la rareté à partir du nombre d'exemplaires construits
 *
 * Génère :
 *   - scripts/import-catalogue/apercu.md  : tableau de relecture avant import
 *   - supabase/seed/aircraft.sql          : INSERT ... ON CONFLICT DO UPDATE
 *
 * Usage :
 *   npm run import:catalogue
 *
 * Pas de clé API nécessaire.
 * Données Wikidata sous CC0.
 * Photos Commons : licence stockée avec l'auteur (voir image_license, image_author).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

// ─── CONFIGURATION ────────────────────────────────────────────────────────────

// User-Agent obligatoire pour les API Wikimedia (pas d'email selon consignes).
const USER_AGENT = 'AppliAviationJedha/1.0 (projet-formation-nextjs)';

// Pause entre chaque appel API (1 s, règle de bonne conduite Wikimedia).
const PAUSE_MS = 1000;

// Largeur de la miniature demandée à Commons.
const THUMB_WIDTH = 1024;

// ─── SEUILS DE RARETÉ ────────────────────────────────────────────────────────
// Basés sur le nombre d'exemplaires construits (units_built).
// Modifier ces seuils ici si nécessaire ; ils apparaissent aussi dans apercu.md.
//
//  5 ★★★★★  très rare     ≤ 50 exemplaires (ou nombre inconnu)
//  4 ★★★★☆  rare          51 – 500
//  3 ★★★☆☆  peu commun   501 – 2 000
//  2 ★★☆☆☆  commun      2 001 – 10 000
//  1 ★☆☆☆☆  très commun  > 10 000
const RARITY_THRESHOLDS = [
  { min: 10001, rarity: 1 },
  { min: 2001,  rarity: 2 },
  { min: 501,   rarity: 3 },
  { min: 51,    rarity: 4 },
  { min: 0,     rarity: 5 },
];

function computeRarity(unitsBuilt) {
  if (!unitsBuilt || unitsBuilt <= 0) return 5; // inconnu → très rare par défaut
  for (const { min, rarity } of RARITY_THRESHOLDS) {
    if (unitsBuilt >= min) return rarity;
  }
  return 5;
}

// ─── CATÉGORIES MANUELLES ────────────────────────────────────────────────────
// Wikidata ne fournit pas la catégorie "ligne/militaire/collection/autre"
// dans un format facilement exploitable ; on la définit ici.
const CATEGORIES = {
  'a320':        'ligne',
  'a321':        'ligne',
  'b737':        'ligne',
  'a380':        'ligne',
  'b747':        'ligne',
  'concorde':    'ligne',
  'dc3':         'ligne',
  'a350':        'ligne',
  'rafale':      'militaire',
  'mirage-2000': 'militaire',
  'f16':         'militaire',
  'fa18':        'militaire',
  'spitfire':    'collection',
  'hurricane':   'collection',
  'p51':         'collection',
};

// ─── UTILITAIRES ─────────────────────────────────────────────────────────────

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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

/** Échappe une valeur pour une insertion SQL. */
function sqlVal(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean')          return val ? 'true' : 'false';
  if (typeof val === 'number')           return String(val);
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── CONVERSIONS D'UNITÉS ────────────────────────────────────────────────────
// Les propriétés quantitatives de Wikidata arrivent avec un URI d'unité.

function toKmh(value, unitUri = '') {
  const v = parseFloat(value);
  if (!value || isNaN(v) || v <= 0) return null;

  if (unitUri.includes('Q180154')) return Math.round(v);         // km/h → rien
  if (unitUri.includes('Q182429')) return Math.round(v * 3.6);   // m/s → km/h
  if (unitUri.includes('Q39369'))  return Math.round(v * 1.852); // nœuds → km/h
  if (unitUri.includes('Q39018'))  return Math.round(v * 1.609); // mph → km/h

  // Heuristique si l'unité est inconnue : 100–5000 → déjà en km/h
  if (v > 100 && v < 5000) return Math.round(v);
  // Sinon tente une conversion m/s → km/h
  const kmh = v * 3.6;
  if (kmh > 100 && kmh < 5000) return Math.round(kmh);
  return null;
}

function toMetres(value, unitUri = '') {
  const v = parseFloat(value);
  if (!value || isNaN(v) || v <= 0) return null;

  if (unitUri.includes('Q11573')) return parseFloat(v.toFixed(2));         // mètre
  if (unitUri.includes('Q3710'))  return parseFloat((v * 0.3048).toFixed(2)); // pied
  if (unitUri.includes('Q218593')) return parseFloat((v * 0.3048).toFixed(2)); // pied (alt)

  // Heuristique : 1–300 m → plausible pour un avion
  if (v >= 1 && v <= 300) return parseFloat(v.toFixed(2));
  return null;
}

// ─── WIKIDATA ─────────────────────────────────────────────────────────────────

/**
 * Interroge l'endpoint SPARQL de Wikidata pour l'entité donnée.
 * Retourne les propriétés techniques de l'avion ou null si rien trouvé.
 *
 * On utilise wdt: (valeur directe) au lieu de p:/psv: (nœud de quantité)
 * car de nombreux items Wikidata pour les familles d'avions ne stockent pas
 * le nœud de quantité complet. Avec wdt:, l'unité est dans le champ
 * "datatype" du résultat JSON SPARQL (ex. "http://www.wikidata.org/entity/Q180154").
 *
 * P729 = entrée en service (parfois utilisé comme 1er vol)
 * P571 = inception (souvent la date du 1er vol sur les fiches d'avions)
 */
async function fetchWikidataProperties(wikidataId) {
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

  // Fusionne plusieurs lignes (plusieurs valeurs possibles par propriété) :
  // on prend la première valeur valide rencontrée pour chaque champ.
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

    // Pour wdt:, l'unité est dans le champ "datatype" du binding JSON SPARQL
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

// ─── WIKIMEDIA COMMONS ───────────────────────────────────────────────────────

/**
 * Récupère l'URL de miniature, l'auteur, la licence et le lien Commons
 * pour un fichier donné (ex. "Airbus_A320.jpg").
 */
async function fetchCommonsImageInfo(filename) {
  if (!filename) return null;

  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action',      'query');
  url.searchParams.set('titles',      `File:${filename}`);
  url.searchParams.set('prop',        'imageinfo');
  url.searchParams.set('iiprop',      'url|extmetadata');
  url.searchParams.set('iiurlwidth',  String(THUMB_WIDTH));
  url.searchParams.set('format',      'json');
  url.searchParams.set('formatversion', '2');

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (!res.ok) throw new Error(`Commons API ${res.status} pour ${filename}`);

  const data = await res.json();
  const pages = data.query?.pages ?? [];
  const page  = pages[0];
  if (!page || page.missing) return null;

  const info = page.imageinfo?.[0];
  if (!info) return null;

  const meta   = info.extmetadata ?? {};
  const thumbUrl     = info.thumburl ?? info.url ?? null;
  const sourceUrl    = info.descriptionurl
    ?? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`;
  const rawAuthor    = meta.Artist?.value ?? meta.Credit?.value ?? null;
  const author       = rawAuthor ? stripHtml(rawAuthor) : null;
  const license      = meta.LicenseShortName?.value ?? null;
  const licenseUrl   = meta.LicenseUrl?.value ?? null;

  return { thumbUrl, author, license, licenseUrl, sourceUrl };
}

// ─── IMPORT PRINCIPAL ─────────────────────────────────────────────────────────

async function main() {
  console.log('=== Import catalogue aviation (Wikidata + Wikimedia Commons) ===\n');

  const cataloguePath   = path.join(ROOT, 'scripts/test-vision/catalogue.json');
  const wikidataIdsPath = path.join(__dirname, 'wikidata-ids.json');

  const catalogue   = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  const wikidataIds = JSON.parse(fs.readFileSync(wikidataIdsPath, 'utf8'));

  const results = [];

  for (const aircraft of catalogue) {
    const { id, name, manufacturer: catalogManufacturer, description: recognitionHints } = aircraft;
    console.log(`→ ${id.padEnd(14)} ${name}`);

    const mapping = wikidataIds[id];

    // Vérifications avant d'appeler les API
    if (!mapping) {
      console.warn(`  ⚠  Pas d'ID Wikidata. Ajoutez "${id}" dans wikidata-ids.json.`);
      results.push({ id, name, manufacturer: catalogManufacturer, recognitionHints,
        category: CATEGORIES[id] ?? 'autre', error: 'ID Wikidata manquant' });
      continue;
    }
    if (mapping.ambiguous) {
      console.warn(`  ⚠  ID ambigu : ${mapping.note}`);
      results.push({ id, name, manufacturer: catalogManufacturer, recognitionHints,
        category: CATEGORIES[id] ?? 'autre', error: `Ambigu : ${mapping.note}` });
      continue;
    }

    const wikidataId = mapping.id;
    let wikidata = null;
    let commonsImage = null;

    // 1. Wikidata
    try {
      wikidata = await fetchWikidataProperties(wikidataId);
      await sleep(PAUSE_MS);
    } catch (err) {
      console.error(`  ✗ Wikidata : ${err.message}`);
      await sleep(PAUSE_MS);
    }

    // 2. Wikimedia Commons (seulement si Wikidata a fourni un nom de fichier)
    if (wikidata?.imageFile) {
      try {
        commonsImage = await fetchCommonsImageInfo(wikidata.imageFile);
        await sleep(PAUSE_MS);
      } catch (err) {
        console.error(`  ✗ Commons : ${err.message}`);
        await sleep(PAUSE_MS);
      }
    }

    // Conversions d'unités
    const maxSpeedKmh = toKmh(wikidata?.maxSpeed, wikidata?.maxSpeedUnit);
    const lengthM     = toMetres(wikidata?.length, wikidata?.lengthUnit);
    const wingspanM   = toMetres(wikidata?.wingspan, wikidata?.wingspanUnit);
    const unitsBuilt  = wikidata?.unitsBuilt ?? null;
    const rarity      = computeRarity(unitsBuilt);

    // Description : préférer le français, puis l'anglais de Wikidata
    const description = wikidata?.descFr ?? wikidata?.descEn ?? null;

    const row = {
      id,
      name,
      manufacturer:    wikidata?.manufacturer ?? catalogManufacturer,
      category:        CATEGORIES[id] ?? 'autre',
      description,
      recognitionHints,
      firstFlight:     wikidata?.firstFlight     ?? null,
      maxSpeedKmh,
      lengthM,
      wingspanM,
      unitsBuilt,
      rarity,
      imageUrl:        commonsImage?.thumbUrl    ?? null,
      imageAuthor:     commonsImage?.author      ?? null,
      imageLicense:    commonsImage?.license     ?? null,
      imageLicenseUrl: commonsImage?.licenseUrl  ?? null,
      imageSourceUrl:  commonsImage?.sourceUrl   ?? null,
      wikidataId,
    };

    // Résumé ligne par ligne
    const missing = ['firstFlight','maxSpeedKmh','lengthM','wingspanM','unitsBuilt','imageUrl']
      .filter(k => !row[k]);
    if (missing.length === 0) {
      console.log('  ✓ Toutes les données présentes');
    } else {
      console.log(`  ⚠  Manquant : ${missing.join(', ')}`);
    }

    results.push(row);
  }

  console.log('\n✓ Récupération terminée. Écriture des fichiers…\n');
  writeApercu(results);
  writeSql(results);
  console.log('✓ scripts/import-catalogue/apercu.md');
  console.log('✓ supabase/seed/aircraft.sql');
  console.log('\nRelisez apercu.md, corrigez si nécessaire, puis exécutez aircraft.sql dans Supabase.\n');
}

// ─── ÉCRITURE apercu.md ───────────────────────────────────────────────────────

function writeApercu(results) {
  const today = new Date().toISOString().substring(0, 10);
  const lines = [
    '# Aperçu import catalogue — à relire avant import SQL',
    '',
    `Généré le ${today} par \`scripts/import-catalogue/run.js\`.`,
    'Corrigez les valeurs manquantes dans `wikidata-ids.json` ou directement dans `aircraft.sql`, puis relancez.',
    '',
    '## Seuils de rareté',
    '',
    '| Rareté | Critère (units_built) |',
    '|--------|----------------------|',
    '| ★★★★★ 5 — très rare    | ≤ 50 ou inconnu |',
    '| ★★★★☆ 4 — rare         | 51 – 500 |',
    '| ★★★☆☆ 3 — peu commun   | 501 – 2 000 |',
    '| ★★☆☆☆ 2 — commun       | 2 001 – 10 000 |',
    '| ★☆☆☆☆ 1 — très commun  | > 10 000 |',
    '',
    '## Données importées',
    '',
    '| id | Nom | Constructeur | Catégorie | 1er vol | Vit. km/h | Long. m | Enverg. m | Nb const. | Rareté | Photo | Auteur | Licence | Note |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
  ];

  for (const r of results) {
    const cells = [
      r.id,
      r.name,
      r.manufacturer   ?? '⚠',
      r.category       ?? '⚠',
      r.firstFlight    ?? '⚠',
      r.maxSpeedKmh    ?? '⚠',
      r.lengthM        ?? '⚠',
      r.wingspanM      ?? '⚠',
      r.unitsBuilt     != null ? r.unitsBuilt.toLocaleString('fr-FR') : '⚠',
      r.rarity         != null ? '★'.repeat(r.rarity) + '☆'.repeat(5 - r.rarity) : '⚠',
      r.imageUrl       ? `[oui](${r.imageUrl})` : '⚠',
      r.imageAuthor    ?? '⚠',
      r.imageLicense   ?? '⚠',
      r.error          ?? '',
    ];
    lines.push('| ' + cells.map(c => String(c).replace(/\|/g, '\\|')).join(' | ') + ' |');
  }

  lines.push('');
  fs.writeFileSync(path.join(__dirname, 'apercu.md'), lines.join('\n'), 'utf8');
}

// ─── ÉCRITURE aircraft.sql ────────────────────────────────────────────────────

function writeSql(results) {
  const seedDir = path.join(ROOT, 'supabase/seed');
  if (!fs.existsSync(seedDir)) fs.mkdirSync(seedDir, { recursive: true });

  const ts = new Date().toISOString();
  const lines = [
    '-- supabase/seed/aircraft.sql',
    '-- Généré par scripts/import-catalogue/run.js — NE PAS MODIFIER À LA MAIN',
    `-- ${ts}`,
    '--',
    '-- INSERT ... ON CONFLICT : peut être relancé sans créer de doublons.',
    '-- Exécuter dans l\'éditeur SQL du projet Supabase (interface web ou CLI).',
    '',
  ];

  for (const r of results) {
    if (r.error) {
      lines.push(`-- IGNORÉ (${r.error}) : ${r.id} — ${r.name}`);
      lines.push('');
      continue;
    }

    lines.push(`-- ${r.name} (${r.wikidataId})`);
    lines.push(`INSERT INTO public.aircraft (`);
    lines.push(`  id, name, manufacturer, category,`);
    lines.push(`  description, recognition_hints,`);
    lines.push(`  first_flight, max_speed_kmh, length_m, wingspan_m, units_built, rarity,`);
    lines.push(`  image_url, image_author, image_license, image_license_url, image_source_url,`);
    lines.push(`  wikidata_id, visible`);
    lines.push(`) VALUES (`);
    lines.push(`  ${sqlVal(r.id)}, ${sqlVal(r.name)}, ${sqlVal(r.manufacturer)}, ${sqlVal(r.category)},`);
    lines.push(`  ${sqlVal(r.description)}, ${sqlVal(r.recognitionHints)},`);
    lines.push(`  ${sqlVal(r.firstFlight)}, ${sqlVal(r.maxSpeedKmh)}, ${sqlVal(r.lengthM)}, ${sqlVal(r.wingspanM)}, ${sqlVal(r.unitsBuilt)}, ${sqlVal(r.rarity)},`);
    lines.push(`  ${sqlVal(r.imageUrl)}, ${sqlVal(r.imageAuthor)}, ${sqlVal(r.imageLicense)}, ${sqlVal(r.imageLicenseUrl)}, ${sqlVal(r.imageSourceUrl)},`);
    lines.push(`  ${sqlVal(r.wikidataId)}, true`);
    lines.push(`) ON CONFLICT (id) DO UPDATE SET`);
    lines.push(`  name              = EXCLUDED.name,`);
    lines.push(`  manufacturer      = EXCLUDED.manufacturer,`);
    lines.push(`  category          = EXCLUDED.category,`);
    lines.push(`  description       = EXCLUDED.description,`);
    lines.push(`  recognition_hints = EXCLUDED.recognition_hints,`);
    lines.push(`  first_flight      = EXCLUDED.first_flight,`);
    lines.push(`  max_speed_kmh     = EXCLUDED.max_speed_kmh,`);
    lines.push(`  length_m          = EXCLUDED.length_m,`);
    lines.push(`  wingspan_m        = EXCLUDED.wingspan_m,`);
    lines.push(`  units_built       = EXCLUDED.units_built,`);
    lines.push(`  rarity            = EXCLUDED.rarity,`);
    lines.push(`  image_url         = EXCLUDED.image_url,`);
    lines.push(`  image_author      = EXCLUDED.image_author,`);
    lines.push(`  image_license     = EXCLUDED.image_license,`);
    lines.push(`  image_license_url = EXCLUDED.image_license_url,`);
    lines.push(`  image_source_url  = EXCLUDED.image_source_url,`);
    lines.push(`  wikidata_id       = EXCLUDED.wikidata_id,`);
    lines.push(`  updated_at        = now();`);
    lines.push('');
  }

  fs.writeFileSync(path.join(seedDir, 'aircraft.sql'), lines.join('\n'), 'utf8');
}

// ─── LANCEMENT ────────────────────────────────────────────────────────────────
main().catch(err => {
  console.error('\n✗ Erreur fatale :', err.message);
  process.exit(1);
});
