#!/usr/bin/env node
/**
 * scripts/import-catalogue/run.js — ÉTAPE 2 : générer le SQL du catalogue
 *
 * Pour chaque avion inclus dans candidats.json (étape 1, relue par l'équipe) :
 *   1. Données Wikidata (lib/wikidata.js → parseAircraft) : technique,
 *      rareté, sources citées, alias.
 *   2. Noms des constructeurs, pays et moteurs (50 par appel).
 *   3. Photo Commons avec auteur et licence (50 par appel).
 *   4. Résumé Wikipédia en français (20 par appel), texte sous CC BY-SA 4.0.
 *
 * Génère :
 *   - supabase/seed/aircraft.sql           : à exécuter après la migration 002
 *   - scripts/import-catalogue/apercu.md   : rapport de remplissage, à relire
 *
 * Les réponses des API sont gardées dans scripts/import-catalogue/cache/ :
 * relancer le script ne redemande que ce qui manque.
 *
 * Usage : npm run import:catalogue [-- --rafraichir]
 */

import {
  fetchEntities, fetchLabels, fetchCommonsImagesInfo, fetchWikipediaIntros,
  linkedIds, parseAircraft, toAircraftRow, WIKIPEDIA_TEXT_LICENSE,
} from '../../lib/wikidata.js';
import { fetchCached, readJson, writeText } from './outils.js';
import { RARITY_LEVELS } from '../../lib/points.js';

// Colonnes écrites dans la table aircraft, dans l'ordre du INSERT.
const COLUMNS = [
  'id', 'name', 'manufacturer', 'category', 'description', 'recognition_hints',
  'first_flight', 'max_speed_kmh', 'length_m', 'wingspan_m', 'height_m',
  'range_km', 'ceiling_m', 'service_entry', 'retirement',
  'country_of_origin', 'engines', 'units_built', 'rarity',
  'image_url', 'image_author', 'image_license', 'image_license_url', 'image_source_url',
  'wikidata_id', 'enwiki_title', 'aliases', 'wikipedia_url', 'sources', 'verified',
];

// Nombre d'avions par INSERT (un fichier plus lisible qu'une seule requête géante).
const ROWS_PER_INSERT = 50;

// ─── COLLECTE ─────────────────────────────────────────────────────────────────

async function collect(avions) {
  const qids = avions.map(a => a.wikidata_id);

  console.log('→ Données Wikidata');
  const entities = await fetchCached('entites', qids, 50, async batch =>
    Object.fromEntries((await fetchEntities({ ids: batch })).map(e => [e.id, e]))
  );

  console.log('→ Noms des constructeurs, pays et moteurs');
  const linked = qids.flatMap(q => {
    if (!entities[q]) return [];
    const ids = linkedIds(entities[q]);
    return [...ids.manufacturers, ...ids.countries, ...ids.engines];
  });
  const names = await fetchCached('libelles', linked, 50, fetchLabels);

  const parsed = Object.fromEntries(
    qids.filter(q => entities[q]).map(q => [q, parseAircraft(entities[q], names)])
  );

  console.log('→ Photos Commons');
  const files = Object.values(parsed).map(a => a.image_file).filter(Boolean);
  const images = await fetchCached('commons', files, 50, fetchCommonsImagesInfo);

  console.log('→ Résumés Wikipédia (français)');
  const frTitles = Object.values(parsed).map(a => a.frwiki_title).filter(Boolean);
  const intros = await fetchCached('wikipedia-fr', frTitles, 20, titles => fetchWikipediaIntros(titles, 'fr'));

  return { parsed, images, intros };
}

// ─── SQL ──────────────────────────────────────────────────────────────────────

/** Valeur JavaScript → littéral SQL. */
function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    return value.length === 0 ? `'{}'` : `ARRAY[${value.map(sqlValue).join(', ')}]`;
  }
  if (typeof value === 'object') return `${sqlValue(JSON.stringify(value))}::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function writeSql(rows) {
  const updates = COLUMNS
    .filter(c => c !== 'id')
    .map(c => c === 'recognition_hints'
      // Ne pas effacer les indices déjà saisis (utilisés par npm run test:vision)
      ? `  ${c} = COALESCE(EXCLUDED.${c}, aircraft.${c})`
      : `  ${c} = EXCLUDED.${c}`)
    .join(',\n');

  const lines = [
    '-- supabase/seed/aircraft.sql',
    '-- Généré par npm run import:catalogue — NE PAS MODIFIER À LA MAIN',
    '-- (corriger candidats.json ou wikidata-ids.json, puis relancer)',
    `-- ${new Date().toISOString().slice(0, 10)} : ${rows.length} avions`,
    '--',
    '-- À exécuter APRÈS supabase/migrations/002_aircraft_details.sql.',
    '-- INSERT ... ON CONFLICT : peut être relancé sans créer de doublons.',
    '-- Sources : Wikidata (CC0), Wikimedia Commons (licence par photo),',
    `-- Wikipédia en français (résumés, ${WIKIPEDIA_TEXT_LICENSE}, lien dans wikipedia_url).`,
    '',
    'BEGIN;',
    '',
  ];

  for (let i = 0; i < rows.length; i += ROWS_PER_INSERT) {
    const batch = rows.slice(i, i + ROWS_PER_INSERT);
    lines.push(`INSERT INTO public.aircraft (\n  ${COLUMNS.join(', ')}\n) VALUES`);
    lines.push(batch.map(r =>
      `  -- ${r.name} (${r.wikidata_id})\n  (${COLUMNS.map(c => sqlValue(r[c])).join(', ')})`
    ).join(',\n'));
    lines.push(`ON CONFLICT (id) DO UPDATE SET\n${updates};\n`);
  }

  lines.push('COMMIT;', '');
  writeText('supabase/seed/aircraft.sql', lines.join('\n'));
}

// ─── RAPPORT ──────────────────────────────────────────────────────────────────

function percent(n, total) {
  return `${Math.round((100 * n) / total)} %`;
}

function writeApercu(rows, missing) {
  const total = rows.length;
  const filled = c => rows.filter(r => r[c] !== null && !(Array.isArray(r[c]) && r[c].length === 0)).length;

  const countBy = key => rows.reduce((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {});
  const byCategory = countBy('category');
  const byRarity   = countBy('rarity');
  const withSources = rows.filter(r => Object.keys(r.sources).length > 0).length;

  const fields = [
    ['description', 'Résumé (Wikipédia FR)'], ['manufacturer', 'Constructeur'],
    ['first_flight', 'Premier vol'], ['max_speed_kmh', 'Vitesse max'],
    ['length_m', 'Longueur'], ['wingspan_m', 'Envergure'], ['height_m', 'Hauteur'],
    ['range_km', 'Autonomie'], ['ceiling_m', 'Plafond'],
    ['service_entry', 'Mise en service'], ['country_of_origin', "Pays d'origine"],
    ['engines', 'Motorisation'], ['units_built', 'Exemplaires construits'],
    ['image_url', 'Photo'], ['image_author', 'Auteur de la photo'],
    ['recognition_hints', 'Indices Gemini (test:vision)'],
  ];

  const md = [
    '# Aperçu import catalogue — à relire avant import SQL',
    '',
    `Généré le ${new Date().toISOString().slice(0, 10)} par \`npm run import:catalogue\` : **${total} avions**.`,
    '',
    'Ordre d\'import dans Supabase : `supabase/migrations/002_aircraft_details.sql`, puis `supabase/seed/aircraft.sql`.',
    '',
    '## Remplissage des colonnes',
    '',
    '| Donnée | Remplie | |',
    '|---|---|---|',
    ...fields.map(([c, label]) => `| ${label} | ${filled(c)} / ${total} | ${percent(filled(c), total)} |`),
    `| Au moins une source citée | ${withSources} / ${total} | ${percent(withSources, total)} |`,
    '',
    'La vitesse max est rarement renseignée sur Wikidata : c\'est un manque de la source, pas du script.',
    '',
    '## Répartition',
    '',
    '| Catégorie | Avions |', '|---|---|',
    ...Object.entries(byCategory).map(([c, n]) => `| ${c} | ${n} |`),
    '',
    '| Rareté | Avions |', '|---|---|',
    ...[1, 2, 3, 4, 5].map(r => `| ${r} — ${RARITY_LEVELS[r].label} | ${byRarity[r] ?? 0} |`),
    '',
    `Rareté 3 par défaut quand le nombre d'exemplaires est inconnu : ${total - filled('units_built')} avions.`,
    '',
  ];

  if (missing.length > 0) {
    md.push('## ⚠ Avions non importés', '', ...missing.map(m => `- ${m}`), '');
  }

  md.push(
    '## Avions',
    '',
    '| id | Nom | Catégorie | 1er vol | Exempl. | Rareté | Photo | Résumé | Sources |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map(r => [
      r.id, r.name, r.category, r.first_flight ?? '⚠',
      r.units_built?.toLocaleString('fr-FR') ?? '⚠', r.rarity,
      r.image_url ? `[oui](${r.image_source_url})` : '⚠',
      r.wikipedia_url && r.description ? `[oui](${r.wikipedia_url})` : '⚠',
      Object.keys(r.sources).length || '—',
    ].join(' | ')).map(l => `| ${l} |`),
    '',
  );

  writeText('scripts/import-catalogue/apercu.md', md.join('\n'));
}

// ─── PROGRAMME ────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Étape 2 : génération du SQL du catalogue ===\n');

  const { avions: candidats } = readJson('scripts/import-catalogue/candidats.json');
  const avions = candidats.filter(a => a.include);
  console.log(`${avions.length} avions inclus dans candidats.json\n`);

  // Indices visuels saisis à la main pour npm run test:vision (15 avions)
  const hintsById = Object.fromEntries(
    readJson('scripts/test-vision/catalogue.json').map(c => [c.id, c.description])
  );

  const { parsed, images, intros } = await collect(avions);

  const rows = [];
  const missing = [];
  for (const avion of avions) {
    const a = parsed[avion.wikidata_id];
    if (!a) {
      missing.push(`${avion.id} (${avion.wikidata_id}) : introuvable sur Wikidata`);
      continue;
    }
    rows.push(toAircraftRow({
      id: avion.id, category: avion.category, parsed: a,
      image: images[a.image_file], intro: intros[a.frwiki_title],
      hints: hintsById[avion.id], verified: true,
    }));
  }

  writeSql(rows);
  writeApercu(rows, missing);

  console.log(`\n✓ supabase/seed/aircraft.sql : ${rows.length} avions`);
  console.log('✓ scripts/import-catalogue/apercu.md : rapport à relire');
  if (missing.length > 0) console.warn(`⚠ ${missing.length} avion(s) non importé(s), voir apercu.md`);
}

main().catch(err => {
  console.error('\n✗', err.message);
  process.exit(1);
});
