'use client';

/**
 * components/TopNav.js
 *
 * Barre de navigation du HAUT, pour les grands écrans (ordinateur, à partir
 * de 1024 px : préfixe lg: de Tailwind). Sur téléphone, c'est la barre du bas
 * (components/BottomNav.js) qui s'affiche à la place.
 *
 * Logo et nom de l'appli · Accueil · Hangar · Recherche · Calendrier ·
 * bouton « Importer une photo » (pour les photos d'un appareil photo).
 * Placée une seule fois dans app/layout.js, avant le contenu de la page.
 */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CameraIcon } from '@/components/icons';

const LINKS = [
  { href: '/',           label: 'Accueil' },
  { href: '/hangar',     label: 'Mon Hangar' },
  { href: '/recherche',  label: 'Recherche' },
  { href: '/calendrier', label: 'Calendrier' },
];

// Écrans sans barre (début du chemin)
const HIDDEN_ON = ['/labo', '/connexion', '/inscription'];

function isActive(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export default function TopNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.some(prefix => pathname.startsWith(prefix))) return null;

  return (
    <header className="sticky top-0 z-20 hidden border-b border-line bg-surface-raised lg:block">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-8 px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Flight Hunter, accueil">
          <Image src="/logo-flight-hunter.png" alt="" width={55} height={30} />
          <span className="font-display text-[22px] font-bold text-ink uppercase">Flight Hunter</span>
        </Link>

        <nav aria-label="Navigation principale" className="flex flex-1 items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 items-center rounded-md px-3.5 text-[15px]
                            ${active ? 'bg-brand-blue-soft font-semibold text-brand-blue-strong' : 'font-medium text-ink-muted hover:text-ink'}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/photo"
          className="typo-label flex h-11 items-center gap-2 rounded-md bg-brand-blue px-4 text-on-brand hover:bg-brand-blue-strong"
        >
          <CameraIcon className="h-5 w-5" />
          Importer une photo
        </Link>
      </div>
    </header>
  );
}
