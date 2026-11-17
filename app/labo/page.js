/**
 * app/labo/page.js  — Server Component
 *
 * ⚠️  PAGE DE TEST — DÉVELOPPEMENT UNIQUEMENT
 * Cette page consomme notre quota Gemini. En production, elle renvoie 404
 * pour qu'aucun visiteur ne puisse l'atteindre une fois le site en ligne.
 * En développement aussi, il faut être connecté : /api/identifier renvoie
 * 401 sans session (se connecter d'abord sur /connexion).
 */

import { notFound } from 'next/navigation';
import LaboClient from './LaboClient';

export const metadata = {
  title: 'Labo vision — Appli aviation',
};

export default function LaboPage() {
  // Guard production : voir commentaire en haut de fichier
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  // En développement : affiche le composant client
  return <LaboClient />;
}
