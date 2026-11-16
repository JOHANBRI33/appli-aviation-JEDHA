'use client';

/**
 * components/CollectibleCard.js
 *
 * Carte à collectionner d'un avion vu en vrai (composants « Carte à collectionner »
 * et « Carte à collectionner · verso » du Figma « Écrans MVP », écrans 13 et 13b).
 *
 * Recto : nom, valeur en points, photo, badge ailé, constructeur, 3 caractéristiques,
 *         date et lieu de la prise de vue, numéro dans la collection.
 * Verso : logo, histoire de l'avion, prise de vue, étiquette et badge du niveau.
 *
 * Toucher la carte la retourne (rotation 3D de 0,5 s, coupée si l'utilisateur
 * a demandé moins d'animations dans les réglages de son téléphone).
 *
 * Le cadre en métal suit la rareté (Bronze → Légendaire). Platine et Légendaire
 * ont en plus un reflet holographique. Ces dégradés viennent du Figma : ce ne
 * sont pas des couleurs de la charte, ils ne servent que sur la carte.
 *
 * Props :
 *   aircraft  {object}  ligne de la table aircraft (name, manufacturer, category,
 *                       description, first_flight, max_speed_kmh, wingspan_m,
 *                       rarity, image_url, image_author, image_license)
 *   capture   {object}  { created_at, place } : la prise de vue
 *   number    {number}  numéro de la carte dans la collection (1, 2, 3…)
 *   total     {number}  nombre d'avions du catalogue
 */

import { useState } from 'react';
import RarityBadge from '@/components/RarityBadge';
import RarityTag from '@/components/RarityTag';
import { PlaneIcon } from '@/components/icons';
import { RARITY_LEVELS } from '@/lib/points';

// ─── Métal de chaque niveau (Figma : fills du composant, par variante) ───────

const metal = stops => `linear-gradient(135deg, ${stops})`;
const BRONZE  = metal('#dcb48e 0%, #9c6237 30%, #673a1a 55%, #9c6237 78%, #2b1608 100%');
const ARGENT  = metal('#ffffff 0%, #c9d3df 30%, #6b7a8f 55%, #c9d3df 78%, #2b3442 100%');
const OR      = metal('#fff7a8 0%, #ffd000 30%, #d99a00 55%, #ffd000 78%, #5c3d00 100%');
const PLATINE = metal('#e6f7ff 0%, #7fd3ff 30%, #2a9de0 55%, #7fd3ff 78%, #0b3a66 100%');
const VIOLET  = metal('#f4ebff 0%, #b48cff 30%, #7a3fd6 55%, #b48cff 78%, #2a0d57 100%');

const THEMES = {
  1: { frame: BRONZE,  accent: BRONZE,  dark: '#2b1608', number: '#c58a5c', holo: 0 },
  2: { frame: ARGENT,  accent: ARGENT,  dark: '#2b3442', number: '#c9d3df', holo: 0 },
  3: { frame: OR,      accent: OR,      dark: '#5c3d00', number: '#ffd000', holo: 0 },
  4: { frame: PLATINE, accent: PLATINE, dark: '#0b3a66', number: '#7fd3ff', holo: 0.14 },
  // Légendaire : cadre, pastille et contour de photo violets, liseré doré
  5: { frame: VIOLET,  accent: VIOLET,  dark: '#2a0d57', number: '#b48cff', holo: 0.24, lining: '#ffd000' },
};

// Retournement 3D écrit en style direct (et non en classes Tailwind) : c'est la
// forme qui marche partout, y compris sur Safari (préfixe -webkit-).
const SCENE = { perspective: '1200px' };
const FACE_3D = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };

const HOLOGRAM = 'linear-gradient(135deg, rgb(34 200 255 / 0) 0%, #22c8ff 30%, #ffffff 45%, #a678f0 60%, #f2b705 80%, rgb(242 183 5 / 0) 100%)';
const NIGHT = 'linear-gradient(180deg, #13306e 0%, #0a1f4f 55%, #061640 100%)';

// ─── Mise en forme des données ───────────────────────────────────────────────

const numberFr = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const dateFr = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const MACH_KMH = 1235; // vitesse du son au niveau de la mer

/** « Mach 1,8 » au-delà du mur du son (plus court sur la carte), sinon « 870 km/h ». */
function formatSpeed(kmh) {
  if (!kmh) return null;
  return kmh >= MACH_KMH ? `Mach ${numberFr.format(Math.round((kmh / MACH_KMH) * 10) / 10)}` : `${numberFr.format(kmh)} km/h`;
}

const CATEGORY_LABELS = { ligne: 'Ligne', militaire: 'Militaire', collection: 'Collection' };
const pad = n => String(n).padStart(3, '0');

// ─── Carte ───────────────────────────────────────────────────────────────────

export default function CollectibleCard({ aircraft, capture, number, total }) {
  const [flipped, setFlipped] = useState(false);
  const theme = THEMES[aircraft.rarity] ?? THEMES[1];
  const shared = { aircraft, capture, theme, numberLabel: `N° ${pad(number)}/${pad(total)}` };

  return (
    <div className="flex flex-col items-center gap-4.5">
      <button
        type="button"
        onClick={() => setFlipped(f => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? `Carte ${aircraft.name}, verso. Retourner la carte` : `Carte ${aircraft.name}, recto. Retourner la carte`}
        className="rounded-[22px]"
        style={SCENE}
      >
        <div
          className="relative h-113.75 w-81.25 transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          <Face theme={theme} hidden={flipped}>
            <Front {...shared} />
          </Face>
          <Face theme={theme} back hidden={!flipped}>
            <Back {...shared} />
          </Face>
        </div>
      </button>

      {/* Consigne, annoncée au lecteur d'écran quand elle change */}
      <p aria-live="polite" className="text-[13px] text-on-brand">
        {flipped ? 'Touche la carte pour revenir au recto' : 'Touche la carte pour la retourner'}
      </p>
    </div>
  );
}

/** Une face : cadre en métal, fond bleu nuit, reflet holographique éventuel. */
function Face({ theme, back = false, hidden, children }) {
  return (
    <div
      aria-hidden={hidden}
      className="absolute inset-0 rounded-[22px] p-2.25 text-left"
      style={{
        ...FACE_3D,
        transform: back ? 'rotateY(180deg)' : 'rotateY(0deg)',
        background: theme.frame,
        // Ombre portée, plus le liseré violet de la carte Légendaire
        boxShadow: [theme.lining && `inset 0 0 0 3px ${theme.lining}`, '0 18px 36px rgb(0 0 0 / 0.35)'].filter(Boolean).join(', '),
      }}
    >
      <div
        className="relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[15px] border-[1.5px] p-3.5 text-on-brand"
        style={{ background: NIGHT, borderColor: theme.dark }}
      >
        {children}
      </div>

      {theme.holo > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[22px] mix-blend-screen"
          style={{ background: HOLOGRAM, opacity: theme.holo }}
        />
      )}
    </div>
  );
}

/** Recto (écran 13). */
function Front({ aircraft, capture, theme, numberLabel }) {
  const level = RARITY_LEVELS[aircraft.rarity];
  const year = aircraft.first_flight?.slice(0, 4);
  const stats = [
    { label: '1er vol',   value: year },
    { label: 'Vitesse',   value: formatSpeed(aircraft.max_speed_kmh) },
    { label: 'Envergure', value: aircraft.wingspan_m ? `${numberFr.format(aircraft.wingspan_m)} m` : null },
  ].filter(stat => stat.value);
  const subtitle = [aircraft.manufacturer, CATEGORY_LABELS[aircraft.category]].filter(Boolean).join(' · ');

  return (
    <>
      {/* Nom et valeur en points */}
      <div className="flex items-center gap-2">
        <h2 className="min-w-0 flex-1 truncate font-display text-[26px] leading-7.5 font-bold uppercase">{aircraft.name}</h2>
        {level && (
          <span
            className="shrink-0 rounded-full border px-3 py-1 font-mono text-[13px] font-medium uppercase"
            style={{ background: theme.accent, borderColor: theme.dark, color: theme.dark }}
          >
            {level.points} pts
          </span>
        )}
      </div>

      {/* Photo dans son contour en métal, badge ailé à cheval sur le bas */}
      <div className="relative mb-10">
        <div className="rounded-[11px] p-0.75" style={{ background: theme.accent }}>
          <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-[8px] bg-linear-to-b from-brand-blue to-brand-blue-soft text-on-brand">
            {aircraft.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- photo Wikimedia Commons, comme sur la fiche
              <img src={aircraft.image_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <PlaneIcon className="h-22.5 w-22.5" strokeWidth={1.4} />
            )}
            {aircraft.image_url && (
              // Crédit obligatoire de la photo Commons
              <p className="typo-credit absolute top-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-brand-navy/65 px-2 py-0.5 text-on-brand">
                Photo : {aircraft.image_author ?? 'auteur inconnu'} · {aircraft.image_license ?? 'licence inconnue'}
              </p>
            )}
          </div>
        </div>
        <RarityBadge rarity={aircraft.rarity} width={150} decorative className="absolute -bottom-13 left-1/2 -translate-x-1/2" />
      </div>

      {subtitle && <p className="text-center text-sm font-medium">{subtitle}</p>}

      {/* Trois caractéristiques */}
      {stats.length > 0 && (
        <dl className="flex gap-2">
          {stats.map(stat => (
            <div key={stat.label} className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-[10px] border border-white/16 bg-white/8 px-2.5 py-2">
              <dt className="truncate font-mono text-[10px] font-medium text-on-brand/65 uppercase">{stat.label}</dt>
              <dd className="truncate font-display text-xl leading-6 font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {/* Prise de vue et numéro */}
      <div className="mt-auto flex items-end justify-between gap-2 font-mono text-[11px]">
        <span className="min-w-0 truncate text-on-brand/70">
          Vu le {dateFr.format(new Date(capture.created_at))} · {capture.place}
        </span>
        <span className="shrink-0 font-medium" style={{ color: theme.number }}>{numberLabel}</span>
      </div>
    </>
  );
}

/** Verso (écran 13b). */
function Back({ aircraft, capture, theme, numberLabel }) {
  return (
    <>
      {/* Logo (sur une pastille blanche : règle de la charte sur fond bleu nuit) et numéro */}
      <div className="flex items-center gap-2">
        <span className="flex rounded-[9px] bg-surface-raised px-1 py-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo local, petite taille */}
          <img src="/logo-flight-hunter.png" alt="" width={45} height={30} className="h-7.5 w-11.25 object-contain" />
        </span>
        <span className="flex-1 font-display text-[21px] leading-6 font-bold uppercase">Flight Hunter</span>
        <span className="font-mono text-[12px] font-medium" style={{ color: theme.number }}>{numberLabel}</span>
      </div>
      <hr className="border-white/20" />

      <h2 className="font-display text-[27px] leading-7.5 font-bold uppercase">{aircraft.name}</h2>

      <section className="flex flex-col gap-1">
        <h3 className="font-mono text-[11px] font-medium tracking-[0.06em] text-on-brand/65 uppercase">Son histoire</h3>
        <p className="line-clamp-5 text-[13px] leading-[19px] text-on-brand/90">
          {aircraft.description || 'Son histoire arrive bientôt dans le catalogue.'}
        </p>
      </section>

      <section className="flex flex-col gap-1 rounded-[10px] border border-white/20 bg-white/8 px-3 py-2.5">
        <h3 className="font-mono text-[11px] font-medium tracking-[0.06em] text-on-brand/65 uppercase">Ma prise de vue</h3>
        <p className="text-[13.5px] font-medium">
          Vu le {dateFr.format(new Date(capture.created_at))} · {capture.place}
        </p>
        <p className="font-mono text-[10.5px] text-on-brand/65">Photo privée · visible par toi seul</p>
      </section>

      {/* Niveau : écrit dans l'étiquette, illustré par le badge */}
      <div className="mt-auto flex items-center justify-between">
        <RarityTag rarity={aircraft.rarity} />
        <RarityBadge rarity={aircraft.rarity} width={64} decorative />
      </div>

      <p className="text-center font-mono text-[10px] font-medium tracking-[0.08em] text-on-brand/60 uppercase">
        Repère. Identifie. Collectionne.
      </p>
    </>
  );
}
