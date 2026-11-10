/**
 * components/icons.js
 *
 * Icônes Lucide (SVG copiés depuis lucide.dev, sans le paquet lucide-react),
 * trait de 2 px. Elles prennent la couleur du texte (currentColor).
 * Ce sont les mêmes icônes que dans le Figma « Écrans MVP ».
 *
 * Utilisation : <HouseIcon className="h-6 w-6" />
 * Pour ajouter une icône : copier le contenu du <svg> depuis lucide.dev.
 */

function Icon({ children, className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

export const HouseIcon = (props) => (
  <Icon {...props}>
    <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
    <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </Icon>
);

// « Hangar » dans le Figma
export const WarehouseIcon = (props) => (
  <Icon {...props}>
    <path d="M18 21V10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v11" />
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 1.06-1.76l8-4.4a2 2 0 0 1 1.88 0l8 4.4A2 2 0 0 1 22 8z" />
    <path d="M6 13h12" />
    <path d="M6 17h12" />
  </Icon>
);

export const CameraIcon = (props) => (
  <Icon {...props}>
    <path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z" />
    <circle cx="12" cy="13" r="3" />
  </Icon>
);

export const SearchIcon = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.34-4.34" />
  </Icon>
);

export const CalendarIcon = (props) => (
  <Icon {...props}>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </Icon>
);

export const ChevronRightIcon = (props) => (
  <Icon {...props}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);
