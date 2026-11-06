'use client';

/**
 * components/AircraftCard.js
 *
 * Carte fiche avion : photo Commons créditée + données techniques.
 * Affiche uniquement les lignes dont la valeur est non nulle.
 * Utilisé dans la page labo après une reconnaissance.
 *
 * Props :
 *   fiche  {object|null}  — ligne de la table aircraft (ou null → rien affiché)
 */

// Libellés des catégories pour l'affichage en français
const CATEGORY_LABELS = {
  ligne:      'Aviation de ligne',
  militaire:  'Aviation militaire',
  collection: 'Collection',
  autre:      'Autre',
};

/** Formate une date ISO "YYYY-MM-DD" en français (ex. "18 avril 1988"). */
function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    // Passage par les composants pour éviter les décalages de fuseau horaire
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric', month: 'long', day: 'numeric',
    }).format(new Date(year, month - 1, day));
  } catch {
    return dateStr;
  }
}

/** Étoiles de rareté (★ pleines + ☆ vides). */
function RarityStars({ rarity }) {
  if (!rarity) return null;
  const full  = rarity;
  const empty = 5 - rarity;
  return (
    <span aria-label={`Rareté : ${rarity} sur 5`}>
      <span className="text-amber-400">{'★'.repeat(full)}</span>
      <span className="text-gray-300">{'★'.repeat(empty)}</span>
    </span>
  );
}

/** Ligne label / valeur dans le corps de la carte. */
function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className="text-xs text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

export default function AircraftCard({ fiche }) {
  if (!fiche) return null;

  const firstFlightFr = formatDate(fiche.first_flight);
  const categoryLabel = CATEGORY_LABELS[fiche.category] ?? fiche.category ?? null;
  const speedLabel    = fiche.max_speed_kmh
    ? `${fiche.max_speed_kmh.toLocaleString('fr-FR')} km/h`
    : null;
  const lengthLabel   = fiche.length_m   ? `${fiche.length_m} m`   : null;
  const wingspanLabel = fiche.wingspan_m ? `${fiche.wingspan_m} m`  : null;
  const unitsLabel    = fiche.units_built
    ? fiche.units_built.toLocaleString('fr-FR')
    : null;

  return (
    <article className="rounded-2xl bg-white border border-sky-100 shadow-sm overflow-hidden">

      {/* ── Photo + crédit obligatoire ───────────────────────────────────────── */}
      {fiche.image_url && (
        <figure className="m-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- URL externe Wikimedia, next/image nécessite un domaine configuré */}
          <img
            src={fiche.image_url}
            alt={fiche.name}
            className="w-full max-h-56 object-cover"
          />
          {/* Crédit obligatoire : auteur + licence + lien vers la page Commons */}
          <figcaption className="px-4 py-1.5 text-xs text-gray-400 bg-gray-50 leading-snug">
            Photo :{' '}
            {fiche.image_source_url ? (
              <a
                href={fiche.image_source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                {fiche.image_author ?? 'auteur inconnu'}
              </a>
            ) : (
              fiche.image_author ?? 'auteur inconnu'
            )}
            {' — '}
            {fiche.image_license_url ? (
              <a
                href={fiche.image_license_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-gray-600"
              >
                {fiche.image_license ?? 'licence'}
              </a>
            ) : (
              fiche.image_license ?? 'licence inconnue'
            )}
          </figcaption>
        </figure>
      )}

      {/* ── Corps de la fiche ────────────────────────────────────────────────── */}
      <div className="p-4">

        {/* Nom + rareté + catégorie */}
        <h3 className="text-lg font-bold text-sky-800 mb-0.5">
          {fiche.name}
        </h3>
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          {fiche.rarity && <RarityStars rarity={fiche.rarity} />}
          {categoryLabel && (
            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700 border border-sky-100">
              {categoryLabel}
            </span>
          )}
        </div>

        {/* Description courte */}
        {fiche.description && (
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {fiche.description}
          </p>
        )}

        {/* Données techniques */}
        <div className="divide-y divide-gray-100">
          <Row label="Constructeur"  value={fiche.manufacturer} />
          <Row label="Premier vol"   value={firstFlightFr} />
          <Row label="Vitesse max"   value={speedLabel} />
          <Row label="Longueur"      value={lengthLabel} />
          <Row label="Envergure"     value={wingspanLabel} />
          <Row label="Exemplaires"   value={unitsLabel} />
        </div>

      </div>
    </article>
  );
}
