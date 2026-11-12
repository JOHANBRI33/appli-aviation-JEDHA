'use client';

/**
 * components/BottomNav.js
 *
 * Barre de navigation du bas (composant « Navigation » du Figma « Écrans MVP »).
 * Placée une seule fois dans app/layout.js, après le contenu de la page.
 *
 * - Accueil · Hangar · [Scanner] · Recherche · Calendrier
 * - L'onglet de l'écran en cours est en brand-blue (usePathname).
 * - Masquée sur les écrans plein écran (HIDDEN_ON) : scan, fiche avion, labo.
 * - « sticky bottom-0 » : elle reste collée en bas quand la page défile, sans
 *   recouvrir la fin du contenu (pas besoin de marge en bas des pages).
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HouseIcon, WarehouseIcon, CameraIcon, SearchIcon, CalendarIcon } from '@/components/icons';

// Onglets à gauche et à droite du bouton Scanner
const LEFT_TABS = [
  { href: '/',       label: 'Accueil', Icon: HouseIcon },
  { href: '/hangar', label: 'Hangar',  Icon: WarehouseIcon },
];
const RIGHT_TABS = [
  { href: '/recherche',  label: 'Recherche',  Icon: SearchIcon },
  { href: '/calendrier', label: 'Calendrier', Icon: CalendarIcon },
];

// Écrans où la barre n'apparaît pas (début du chemin)
const HIDDEN_ON = ['/photo', '/avions', '/labo'];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

function Tab({ href, label, Icon, active }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 w-16 flex-col items-center gap-1 text-[11px] leading-none
                  ${active ? 'font-semibold text-brand-blue' : 'font-medium text-ink-muted'}`}
    >
      <Icon className="h-[22px] w-[22px]" />
      {label}
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.some(prefix => pathname.startsWith(prefix))) return null;

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky bottom-0 z-10 border-t border-line bg-surface-raised"
    >
      <div
        className="mx-auto flex min-h-[86px] max-w-md items-start justify-between px-3 pt-2.5
                   pb-[env(safe-area-inset-bottom)]"
      >
        {LEFT_TABS.map(tab => (
          <Tab key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}

        {/* Bouton Scanner : rond bleu au centre */}
        <Link
          href="/photo"
          aria-label="Scanner un avion"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue
                     text-on-brand shadow-scan active:bg-brand-blue-strong"
        >
          <CameraIcon className="h-6 w-6" />
        </Link>

        {RIGHT_TABS.map(tab => (
          <Tab key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}
      </div>
    </nav>
  );
}
