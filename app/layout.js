// app/layout.js — mise en page commune à toutes les pages
//
// Charge les trois polices de la charte Flight Hunter avec next/font :
// elles sont téléchargées au build et servies par l'appli (pas d'appel à Google
// côté utilisateur). Chaque police expose une variable CSS reprise dans
// app/globals.css (bloc @theme inline) pour les classes font-display, font-sans
// et font-mono.

import { Barlow_Condensed, DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// Titres et nom des avions
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-barlow-condensed',
  display: 'swap',
})

// Texte courant, boutons, listes (police variable : toutes les graisses)
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

// Données techniques, étiquettes de rareté, crédits photo
const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata = {
  title: 'Flight Hunter',
  description: 'Repère. Identifie. Collectionne. Prends un avion en photo, découvre son histoire et ajoute-le à ton Hangar.',
}

// Couleur de la barre du navigateur sur téléphone (brand-blue)
export const viewport = {
  themeColor: '#1e5bff',
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      className={`${barlowCondensed.variable} ${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
