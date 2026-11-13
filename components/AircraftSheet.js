/**
 * components/AircraftSheet.js
 *
 * Fiche d'un avion (composant « Fiche avion · contenu » du Figma « Écrans MVP »,
 * repris par les écrans 05, 09 et 11) : photo Commons créditée, rareté (étiquette
 * et badge ailé), nom, constructeur, caractéristiques, histoire et sources.
 *
 * Les actions du bas changent selon l'écran (après un scan, depuis le Hangar,
 * depuis la recherche) : elles sont passées en `children` et affichées dans
 * le panneau blanc du bas de fiche.
 *
 * Aucun hook ici : le composant marche dans un Server Component (page
 * app/avions/[id]) comme dans un Client Component (parcours photo).
 *
 * Props :
 *   fiche     {object}     ligne de la table aircraft
 *   backHref  {string}     lien du bouton retour (page serveur)
 *   onBack    {function}   action du bouton retour (Client Component) — l'un ou l'autre
 *   children  {ReactNode}  actions du bas de fiche (facultatif)
 */

import Link from 'next/link';
import RarityTag from '@/components/RarityTag';
import RarityBadge from '@/components/RarityBadge';

// Libellés des catégories (colonne aircraft.category)
const CATEGORY_LABELS = {
  ligne:      'Ligne',
  militaire:  'Militaire',
  collection: 'Collection',
  autre:      'Autre',
};

// ─── Mise en forme des données ───────────────────────────────────────────────

const numberFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });

/** "1986-07-04" → "1986" (l'année suffit sur la fiche, comme dans le Figma). */
function yearOf(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : null;
}

/** Cases « Caractéristiques » : seulement celles dont la valeur est connue. */
function statsOf(fiche) {
  return [
    { label: 'Premier vol', value: yearOf(fiche.first_flight) },
    { label: 'Vitesse max', value: fiche.max_speed_kmh ? `${numberFr.format(fiche.max_speed_kmh)} km/h` : null },
    // Le Figma montre « Rôle » ; la base n'a que la catégorie (ligne, militaire…)
    { label: 'Catégorie',   value: CATEGORY_LABELS[fiche.category] ?? null },
    { label: 'Envergure',   value: fiche.wingspan_m ? `${numberFr.format(fiche.wingspan_m)} m` : null },
  ].filter(stat => stat.value);
}

// ─── Icônes Lucide (SVG copiés depuis lucide.dev, trait de 2 px) ─────────────

function PlaneIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

// ─── Fiche ───────────────────────────────────────────────────────────────────

export default function AircraftSheet({ fiche, backHref, onBack, children }) {
  const stats = statsOf(fiche);

  return (
    <article className="relative flex flex-1 flex-col bg-surface">
      <SheetPhoto fiche={fiche} />

      <div className="flex flex-col gap-4.5 px-6 pt-5 pb-2">
        {/* En-tête : rareté, nom, constructeur, et badge de rareté à droite */}
        <header className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {fiche.rarity && (
              <div>
                <RarityTag rarity={fiche.rarity} />
              </div>
            )}
            <h1 className="typo-display-xl text-ink">{fiche.name}</h1>
            {fiche.manufacturer && (
              <p className="text-[15px] text-ink-muted">{fiche.manufacturer}</p>
            )}
          </div>
          {/* Le niveau est déjà écrit dans l'étiquette : badge décoratif */}
          <RarityBadge rarity={fiche.rarity} width={104} decorative className="-mt-2" />
        </header>

        {/* Caractéristiques : grille de 2 colonnes */}
        {stats.length > 0 && (
          <dl className="grid grid-cols-2 gap-2.5">
            {stats.map(stat => (
              <div key={stat.label} className="flex flex-col gap-1 rounded-md border border-line bg-surface-raised px-3.5 py-3">
                <dt className="typo-data text-ink-muted">{stat.label}</dt>
                <dd className="typo-stat text-ink">{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Histoire */}
        {fiche.description && (
          <section className="flex flex-col gap-2 text-ink">
            <h2 className="typo-title-md">Son histoire</h2>
            <p className="typo-body">{fiche.description}</p>
          </section>
        )}

        {/* Sources des données (crédit obligatoire) */}
        <p className="typo-credit pt-1 text-ink-muted">
          Données : Wikidata (CC0) · Photo : Wikimedia Commons
        </p>
      </div>

      {/* Actions propres à chaque écran, dans le panneau blanc du bas */}
      {children && (
        <div className="mt-auto flex flex-col items-center gap-3 rounded-t-3xl border-t border-line bg-surface-raised px-6 pt-4.5 pb-9">
          {children}
        </div>
      )}

      <BackButton backHref={backHref} onBack={onBack} />
    </article>
  );
}

/** Photo Commons de l'avion, avec le crédit obligatoire posé dessus. */
function SheetPhoto({ fiche }) {
  return (
    <figure className="relative m-0 h-62.5 overflow-hidden bg-linear-to-b from-brand-blue to-brand-blue-soft">
      {fiche.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL externe Wikimedia, next/image nécessite un domaine configuré
        <img src={fiche.image_url} alt={fiche.name} className="h-full w-full object-cover" />
      ) : (
        // Pas de photo dans le catalogue : avion dessiné, comme dans le Figma
        <div className="flex h-full items-center justify-center text-on-brand">
          <PlaneIcon className="h-30 w-30" />
        </div>
      )}

      {fiche.image_url && (
        <figcaption className="typo-credit absolute bottom-2.5 left-3 max-w-[calc(100%-24px)] truncate rounded-full bg-brand-navy px-2.5 py-1.25 text-on-brand">
          Photo :{' '}
          <CreditLink href={fiche.image_source_url}>{fiche.image_author ?? 'auteur inconnu'}</CreditLink>
          {' · '}
          <CreditLink href={fiche.image_license_url}>{fiche.image_license ?? 'licence inconnue'}</CreditLink>
          {' · '}Wikimedia Commons
        </figcaption>
      )}
    </figure>
  );
}

function CreditLink({ href, children }) {
  if (!href) return children;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
      {children}
    </a>
  );
}

/** Bouton rond « Retour » posé sur la photo (44 px : cible tactile minimum). */
function BackButton({ backHref, onBack }) {
  const className =
    'absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised/90 text-ink';
  const icon = <ChevronLeftIcon className="h-5.5 w-5.5" />;

  if (onBack) {
    return (
      <button type="button" onClick={onBack} aria-label="Retour" className={className}>
        {icon}
      </button>
    );
  }
  return (
    <Link href={backHref ?? '/'} aria-label="Retour" className={className}>
      {icon}
    </Link>
  );
}
