/**
 * app/calendrier/page.js — Server Component
 *
 * Écran « Shows & meetings » (écran 12 du Figma « Écrans MVP ») : les
 * meetings et salons aériens de la saison, filtrables par mois.
 *
 * Les événements viennent de lib/evenements.js (liste écrite à la main,
 * vérifiée auprès des organisateurs). Le filtre par mois est dans le
 * composant client CalendrierClient.
 */

import SkyBackground from '@/components/SkyBackground';
import { EVENTS, SEASON } from '@/lib/evenements';
import CalendrierClient from './CalendrierClient';

export const metadata = { title: 'Shows & meetings — Flight Hunter' };

/** Ordre chronologique ; un événement sans date se place en tête de son mois. */
function byDate(a, b) {
  return a.month - b.month || (a.start ?? '').localeCompare(b.start ?? '');
}

export default function CalendrierPage() {
  const events = [...EVENTS].sort(byDate);

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8 lg:max-w-3xl lg:pt-8">
      <SkyBackground />

      <header className="flex flex-col gap-0.5 pb-4.5">
        <h1 className="typo-title-lg text-ink">Shows &amp; meetings</h1>
        <p className="typo-body-sm text-ink-muted">Saison {SEASON}</p>
      </header>

      <CalendrierClient events={events} />

      <p className="typo-credit pt-6 text-ink-muted">
        Dates annoncées par les organisateurs, vérifiées le 16/11/2026. Elles peuvent changer :
        consulte le site officiel avant de partir.
      </p>
    </main>
  );
}
