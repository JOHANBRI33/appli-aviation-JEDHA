'use client';

/**
 * app/hangar/carte/[id]/ShareCardButton.js
 *
 * Bouton « Partager ma carte » (écran 13). Ouvre le menu de partage du
 * téléphone (Web Share API). Sur un ordinateur qui ne le propose pas, copie
 * le message et le dit.
 *
 * On partage du TEXTE seulement, sans lien (décision d'équipe) : la carte
 * est privée, un ami qui ouvrirait le lien tomberait sur la page de connexion.
 *
 * Props :
 *   name  {string}  nom de l'avion, repris dans le message partagé
 */

import { useState } from 'react';

export default function ShareCardButton({ name }) {
  const [status, setStatus] = useState(null); // null | 'copied' | 'error'

  async function share() {
    const text = `J’ai vu un ${name} en vrai ! Il est dans mon Hangar Flight Hunter.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Ma carte ${name} — Flight Hunter`, text });
      } else {
        await navigator.clipboard.writeText(text);
        setStatus('copied');
      }
    } catch (error) {
      // Partage annulé par l'utilisateur : rien à signaler
      if (error?.name !== 'AbortError') setStatus('error');
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={share}
        className="typo-label min-h-13.5 w-full rounded-md bg-brand-blue text-on-brand active:bg-brand-blue-strong"
      >
        Partager ma carte
      </button>
      <p aria-live="polite" className="typo-body-sm text-on-brand empty:hidden">
        {status === 'copied' && 'Message copié : colle-le où tu veux.'}
        {status === 'error' && 'Le partage n’a pas marché. Réessaie dans un instant.'}
      </p>
    </div>
  );
}
