'use client';

/**
 * app/calendrier/CalendrierClient.js
 *
 * Filtres par mois et liste des événements de l'écran Calendrier (écran 12).
 * Seul morceau interactif de l'écran : il garde en mémoire le mois choisi.
 * Les filtres proposés sont les mois qui ont au moins un événement.
 *
 * Props :
 *   events  {object[]}  événements de lib/evenements.js, déjà triés par date
 */

import { useState } from 'react';
import { MapPinIcon, ExternalLinkIcon } from '@/components/icons';

const MONTHS = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const MONTHS_SHORT = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const dayOf = date => Number(date.slice(8, 10));
const monthOf = date => Number(date.slice(5, 7));

/** « Du 14 au 20 juin », « 11 et 12 septembre », « 14 juillet » ou « Mai, date à venir ». */
function datesLabel(event) {
  if (!event.start) return `${MONTHS[event.month - 1].replace('.', '')}, date à venir`;
  const start = `${dayOf(event.start)} ${MONTHS_LONG[monthOf(event.start) - 1]}`;
  if (!event.end || event.end === event.start) return start;
  const sameMonth = monthOf(event.start) === monthOf(event.end);
  const end = `${dayOf(event.end)} ${MONTHS_LONG[monthOf(event.end) - 1]}`;
  // Un week-end : « 11 et 12 septembre »
  if (sameMonth && dayOf(event.end) === dayOf(event.start) + 1) return `${dayOf(event.start)} et ${end}`;
  return `Du ${sameMonth ? dayOf(event.start) : start} au ${end}`;
}

export default function CalendrierClient({ events }) {
  const [month, setMonth] = useState(null); // null = tous les mois

  const months = [...new Set(events.map(event => event.month))];
  const filters = [{ id: null, label: 'Tous' }, ...months.map(m => ({ id: m, label: MONTHS[m - 1] }))];
  const shown = month === null ? events : events.filter(event => event.month === month);

  return (
    <div className="flex flex-col gap-3">
      {/* Filtres par mois : défilent horizontalement si l'écran est étroit */}
      <div role="group" aria-label="Filtrer par mois" className="-mx-6 flex gap-2 overflow-x-auto px-6">
        {filters.map(({ id, label }) => {
          const active = month === id;
          return (
            // Bouton de 44 px de haut (cible tactile), pastille dedans
            <button
              key={label}
              type="button"
              aria-pressed={active}
              onClick={() => setMonth(id)}
              className="flex min-h-11 shrink-0 items-center"
            >
              <span
                className={`rounded-full border px-3.5 py-2 text-sm leading-4.5
                            ${active
                              ? 'border-brand-navy bg-brand-navy font-semibold text-on-brand'
                              : 'border-line bg-surface-raised font-medium text-ink'}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Nombre d'événements, annoncé quand le filtre change */}
      <p aria-live="polite" className="sr-only">
        {shown.length} événement{shown.length > 1 ? 's' : ''}
      </p>

      <ul className="flex flex-col gap-3">
        {shown.map(event => (
          <li key={event.id}>
            <EventRow event={event} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Ligne d'un événement (composant « Ligne événement » du Figma). */
function EventRow({ event }) {
  return (
    <article className="flex gap-3.5 rounded-lg border border-line bg-surface-raised p-3">
      {/* Pastille de date : jour et mois, ou mois seul si la date n'est pas connue */}
      <div aria-hidden="true" className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-sm bg-brand-navy text-on-brand">
        {event.start ? (
          <>
            <span className="font-display text-[30px] leading-7.5 font-bold">{dayOf(event.start)}</span>
            <span className="font-mono text-[11px] font-medium uppercase">{MONTHS_SHORT[monthOf(event.start) - 1]}</span>
          </>
        ) : (
          <>
            <span className="font-display text-xl leading-6 font-bold uppercase">{MONTHS_SHORT[event.month - 1]}</span>
            <span className="font-mono text-[9px] font-medium uppercase">à venir</span>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="typo-item-title text-ink">{event.name}</h2>
        <p className="typo-body-sm text-ink">{datesLabel(event)}</p>
        <p className="typo-body-sm flex items-center gap-1 text-ink-muted">
          <MapPinIcon className="h-3.5 w-3.5" />
          <span className="truncate">{event.place}</span>
        </p>
        {event.note && <p className="typo-credit text-ink-muted">{event.note}</p>}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-8 items-center gap-1 self-start text-[13px] font-semibold text-brand-blue"
          >
            Site officiel
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            <span className="sr-only">de {event.name} (nouvel onglet)</span>
          </a>
        )}
      </div>
    </article>
  );
}
