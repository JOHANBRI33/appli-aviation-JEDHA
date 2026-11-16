/**
 * lib/evenements.js
 *
 * Meetings et salons aériens de la saison 2027 en France, affichés par
 * l'écran Calendrier (app/calendrier).
 *
 * Liste écrite à la main : aucune source de données automatique n'existe pour
 * l'instant (cadrage MVP : calendrier en page statique). À relire avant chaque
 * démo et à compléter quand les organisateurs annoncent leurs dates.
 *
 * Vérifié le 16/11/2026 :
 *   - calendrier MILAVIA des meetings 2027 en France (mis à jour le 11/11/2026)
 *   - sites des organisateurs quand ils donnent déjà les dates
 * Une date encore inconnue a `start: null` et `confirmed: false` : l'écran
 * affiche alors seulement le mois et « date à venir ».
 *
 * Champs :
 *   id         identifiant court
 *   name       nom de l'événement
 *   place      lieu affiché
 *   month      mois (1 à 12), sert au filtre
 *   start/end  dates au format AAAA-MM-JJ (end facultatif), null si inconnues
 *   confirmed  true si les dates viennent de l'organisateur
 *   note       précision affichée sous le lieu (facultatif)
 *   url        site officiel (null si on n'en a pas de sûr)
 */

export const SEASON = 2027;

export const EVENTS = [
  {
    id: 'temps-des-helices',
    name: 'Le Temps des Hélices',
    place: 'Cerny – La Ferté-Alais (91)',
    month: 5,
    start: null,
    end: null,
    confirmed: false,
    note: 'Chaque année à la Pentecôte : dates 2027 pas encore annoncées',
    url: null,
  },
  {
    id: 'fete-air-espace-mureaux',
    name: 'Fête de l’Air et de l’Espace',
    place: 'Les Mureaux – Verneuil (78)',
    month: 5,
    start: null,
    end: null,
    confirmed: false,
    note: 'Tous les deux ans, de retour en mai 2027',
    url: null,
  },
  {
    id: 'france-air-expo',
    name: 'France Air Expo',
    place: 'Lyon – Bron (69)',
    month: 5,
    start: '2027-05-27',
    end: '2027-05-29',
    confirmed: true,
    note: 'Salon de l’aviation générale',
    url: 'https://www.franceairexpo.com/',
  },
  {
    id: 'salon-du-bourget',
    name: 'Salon du Bourget',
    place: 'Le Bourget (93)',
    month: 6,
    start: '2027-06-14',
    end: '2027-06-20',
    confirmed: true,
    note: 'Ouvert au grand public du 18 au 20 juin',
    url: 'https://www.siae.fr/',
  },
  {
    id: 'defile-14-juillet',
    name: 'Défilé aérien du 14 Juillet',
    place: 'Paris, Champs-Élysées (75)',
    month: 7,
    start: '2027-07-14',
    end: null,
    confirmed: true,
    note: 'Passage des avions au-dessus du défilé militaire',
    url: null,
  },
  {
    id: 'meeting-roanne',
    name: 'Meeting aérien de Roanne',
    place: 'Roanne – Renaison (42)',
    month: 9,
    start: '2027-09-11',
    end: '2027-09-12',
    confirmed: true,
    note: null,
    url: 'http://www.meeting-roanne.net/',
  },
  {
    id: 'air-legend',
    name: 'Paris Villaroche Air Legend',
    place: 'Melun – Villaroche (77)',
    month: 9,
    start: '2027-09-11',
    end: '2027-09-12',
    confirmed: true,
    note: null,
    url: 'https://airlegend.fr/',
  },
];
