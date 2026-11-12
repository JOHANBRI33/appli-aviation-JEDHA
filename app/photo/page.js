/**
 * app/photo/page.js — Server Component
 *
 * Écran « Scanner » : l'utilisateur prend un avion en photo et voit le résultat.
 *
 * ⚠️  DÉVELOPPEMENT UNIQUEMENT POUR L'INSTANT
 * Cet écran appelle /api/identifier, qui renvoie 404 en production tant que
 * la gestion du quota Gemini et l'authentification ne sont pas en place.
 * Retirer ce guard en même temps que celui de app/api/identifier/route.js.
 */

import { notFound } from 'next/navigation';
import PhotoClient from './PhotoClient';

export const metadata = {
  title: 'Scanner un avion — Flight Hunter',
};

export default function PhotoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <PhotoClient />;
}
