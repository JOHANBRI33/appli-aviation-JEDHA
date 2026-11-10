// app/page.js — accueil de Flight Hunter (Server Component)
//
// Maquette : écran « 02 · Accueil » du Figma « Écrans MVP ».
// Un en-tête de bienvenue, puis les 4 entrées de l'appli sous forme de cartes.
// La carte Scanner est la seule en bleu : c'est l'action principale de l'écran.
// La barre de navigation du bas est ajoutée par app/layout.js.
//
// TODO (quand l'authentification existera) :
//   - « Bonjour <prénom> » et la pastille de score (points) dans l'en-tête
//   - les vrais compteurs sous « Mon Hangar » (« 12 avions · 3 badges »)
//   - la section « Derniers ajouts » (vignettes des dernières captures)

import Link from 'next/link';
import SkyBackground from '@/components/SkyBackground';
import {
  CameraIcon, WarehouseIcon, SearchIcon, CalendarIcon, ChevronRightIcon,
} from '@/components/icons';

// Les trois cartes secondaires (blanches)
const ACTIONS = [
  { href: '/hangar',     Icon: WarehouseIcon, title: 'Mon Hangar',            text: 'Ta collection d’avions' },
  { href: '/recherche',  Icon: SearchIcon,    title: 'Rechercher par type',   text: 'Fiches, constructeurs, caractéristiques' },
  { href: '/calendrier', Icon: CalendarIcon,  title: 'Calendrier des shows',  text: 'Meetings et shows aériens à venir' },
];

export default function Home() {
  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-3 pb-8">
      <SkyBackground />

      {/* En-tête de bienvenue */}
      <header className="flex flex-col gap-0.5 pb-5">
        <h1 className="typo-title-lg text-ink">Bonjour</h1>
        <p className="text-sm text-ink-muted">Prêt pour le prochain meeting ?</p>
      </header>

      <nav aria-label="Accès rapides" className="flex flex-col gap-3">
        {/* Carte principale : Scanner un avion */}
        <Link
          href="/photo"
          className="flex items-center gap-3.5 rounded-lg bg-brand-blue px-[18px] py-[22px]
                     text-on-brand active:bg-brand-blue-strong"
        >
          <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-md bg-brand-blue-strong">
            <CameraIcon className="h-[26px] w-[26px]" />
          </span>
          <span className="flex flex-1 flex-col gap-0.5">
            <span className="text-xl font-bold">Scanner un avion</span>
            <span className="typo-body-sm opacity-90">Prends-le en photo, l’appli l’identifie</span>
          </span>
          <ChevronRightIcon className="h-5 w-5" />
        </Link>

        {/* Cartes secondaires */}
        {ACTIONS.map(({ href, Icon, title, text }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3.5 rounded-lg border border-line bg-surface-raised
                       px-[18px] py-4 active:bg-brand-blue-soft"
          >
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-md bg-brand-blue-soft text-brand-blue">
              <Icon className="h-[22px] w-[22px]" />
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[17px] font-bold text-ink">{title}</span>
              <span className="typo-body-sm text-ink-muted">{text}</span>
            </span>
            <ChevronRightIcon className="h-5 w-5 text-ink-muted" />
          </Link>
        ))}
      </nav>
    </main>
  );
}
