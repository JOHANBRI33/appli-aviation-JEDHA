/**
 * lib/redirection.js
 *
 * Gestion du paramètre « suivant » : la page où revenir après la connexion
 * (ex. /connexion?suivant=/hangar/carte/rafale).
 *
 * Utilisé par le proxy, les pages et les Server Actions : pas de 'server-only'.
 */

/**
 * Renvoie le chemin s'il est sûr, sinon `fallback`.
 * Sûr = chemin interne à l'appli : commence par un seul « / ».
 * Refusé : « https://site-pirate.fr », « //site-pirate.fr », « /\site-pirate.fr »
 * (sinon un lien piégé pourrait renvoyer l'utilisateur ailleurs après sa connexion).
 *
 * @param {unknown} path
 * @param {string} [fallback]
 * @returns {string}
 */
export function safeNextPath(path, fallback = '/hangar') {
  if (typeof path !== 'string') return fallback
  if (!path.startsWith('/') || path.startsWith('//') || path.startsWith('/\\')) return fallback
  return path
}

/**
 * Adresse de la page de connexion qui ramène ensuite à `nextPath`.
 * @param {string} nextPath
 */
export function loginUrl(nextPath) {
  return `/connexion?suivant=${encodeURIComponent(safeNextPath(nextPath))}`
}
