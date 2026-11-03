/**
 * app/labo/page.js  — Server Component
 *
 * ⚠️  PAGE DE TEST — DÉVELOPPEMENT UNIQUEMENT
 * Cette page consomme notre quota Gemini. En production, elle renvoie 404
 * pour qu'aucun visiteur ne puisse l'atteindre une fois le site en ligne.
 * Supprimer ce guard quand la gestion du quota et l'authentification
 * utilisateur seront en place (semaine 3+).
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
