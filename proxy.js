// proxy.js — exécuté par Next.js avant chaque requête qui correspond au matcher.
// Next 16 : ce fichier remplace middleware.js (même rôle, nouveau nom).
// Il rafraîchit la session Supabase et renvoie vers /connexion les visiteurs
// non connectés qui demandent /hangar (voir lib/supabase/proxy.js).

import { updateSession } from '@/lib/supabase/proxy'

export async function proxy(request) {
  return updateSession(request)
}

export const config = {
  // Toutes les pages, sauf les fichiers statiques et les images
  // (inutile de vérifier la session pour un logo ou un fichier CSS).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|badges/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
