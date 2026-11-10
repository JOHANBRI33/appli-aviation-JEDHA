/**
 * components/SkyBackground.js
 *
 * Fond ciel avec nuages de la charte Flight Hunter.
 * À placer une fois en haut d'un écran principal (accueil, Hangar, recherche,
 * calendrier, connexion, récompense). Pas sur les fiches avion ni sur l'écran
 * d'analyse de la photo.
 *
 * Le ciel est en position fixe, derrière le contenu : il ne bouge pas quand on
 * fait défiler la page (cette méthode marche aussi sur iPhone, contrairement à
 * background-attachment: fixed).
 *
 * Utilisation :
 *   <main className="relative min-h-screen">
 *     <SkyBackground />
 *     …contenu de l'écran…
 *   </main>
 */

export default function SkyBackground() {
  return <div aria-hidden="true" className="bg-sky-clouds fixed inset-0 -z-10" />
}
