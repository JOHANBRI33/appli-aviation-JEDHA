// Manifest PWA généré automatiquement par Next.js à l'URL /manifest.webmanifest
// Permet d'installer l'appli sur l'écran d'accueil d'un téléphone.
// Couleurs et icônes : charte graphique Flight Hunter.

export default function manifest() {
  return {
    name: 'Flight Hunter',
    short_name: 'Flight Hunter',
    description: 'Repère. Identifie. Collectionne. Identifie les avions et constitue ton Hangar.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f7fc', // surface
    theme_color: '#1e5bff',      // brand-blue
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Version avec marge pour les icônes rondes ou découpées d'Android
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
