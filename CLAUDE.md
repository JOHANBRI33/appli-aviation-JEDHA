# CLAUDE.md — Appli aviation (Projet Jedha)

## Le projet

Application web mobile (PWA) pour passionnés d'aviation.
Boucle du MVP : l'utilisateur photographie un avion → une IA de vision identifie son type → la fiche s'affiche → l'avion s'ajoute à « Mon Hangar » → l'utilisateur gagne des points selon la rareté et débloque des badges.

Projet de formation : 3 personnes, MVP livré en 6 semaines, environ 180 h au total.
Priorité absolue : une boucle simple qui marche de bout en bout, plutôt que beaucoup de fonctionnalités.

## Stack

- Next.js (App Router), [JavaScript ou TypeScript : à fixer]
- Tailwind CSS, conception mobile d'abord
- Supabase : Postgres, Auth (email), Storage (photos des utilisateurs)
- `@supabase/supabase-js` et `@supabase/ssr`
- IA de vision : [fournisseur choisi après le test de la semaine 1], appelée uniquement côté serveur
- Déploiement : Vercel (mise en ligne automatique depuis `main`)

## Commandes

- `npm install` : installer les dépendances
- `npm run dev` : lancer en local
- `npm run build` : vérifier que le projet compile avant chaque pull request
- `npm run lint` : vérifier le style du code

## Structure des dossiers

- `app/` : pages et routes
  - `app/page` : accueil
  - `app/avions/[id]/` : fiche d'un avion
  - `app/photo/` : prise de photo et résultat
  - `app/hangar/` : collection de l'utilisateur
  - `app/classement/` : classement
  - `app/api/identifier/` : route serveur de reconnaissance
- `components/` : composants réutilisables
- `lib/supabase/` : clients Supabase (navigateur et serveur)
- `lib/identification` : appel à l'IA de vision
- `lib/points` : calcul des points et attribution des badges
- `supabase/migrations/` : schéma de la base, versionné
- `scripts/` : scripts ponctuels (import du catalogue depuis Wikidata et Commons)

## Modèle de données [à valider en semaine 1]

- `aircraft` : id, name, manufacturer, category (ligne, militaire, collection…), first_flight, max_speed_kmh, description, image_url, image_author, image_license, source, rarity (1 à 5)
- `profiles` : id (= id de l'utilisateur Supabase Auth), username, points
- `captures` : id, user_id, aircraft_id, photo_path, confidence, created_at
- `badges` : id, code, name, description, rule
- `user_badges` : user_id, badge_id, earned_at

## Conventions

- Code, tables et colonnes en anglais ; textes affichés à l'utilisateur en français.
- Composants en PascalCase (`AircraftCard`), fonctions et variables en camelCase.
- Conception mobile d'abord : tester chaque écran en largeur téléphone.
- Aucune nouvelle dépendance sans accord de l'équipe.
- Code simple et lisible, commenté quand ce n'est pas évident : chaque membre doit pouvoir l'expliquer en soutenance.

## Règles importantes

- Aucune clé dans le code. Les secrets sont dans `.env.local`, jamais commité :
  - `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publiques)
  - `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement)
  - `VISION_API_KEY` (serveur uniquement)
- L'IA de vision n'est appelée que depuis `app/api/`, jamais depuis le navigateur.
- Chaque photo est réduite (environ 1024 px de côté) avant envoi.
- Reconnaissance : envoyer la photo et la liste des noms du catalogue ; demander une réponse JSON du type `{ aircraft_id, confidence, suggestions }`. Si la confiance est faible, proposer 3 suggestions au lieu d'une réponse.
- Row Level Security activée sur toutes les tables Supabase : un utilisateur ne lit et n'écrit que ses propres captures.
- Photos des fiches : uniquement Wikimedia Commons, avec auteur et licence affichés sous chaque image. Jamais de photos Planespotters, JetPhotos ou Airliners.net.

## Façon de travailler

- Une tâche = une branche (`feat/fiche-avion`, `fix/upload-photo`) = une pull request relue par un autre membre.
- Faire de petits changements ciblés et expliquer ce qui est modifié.
- Ne pas toucher aux fichiers hors du périmètre de la tâche sans le signaler.
- Pas de refonte globale ni de changement de stack sans décision d'équipe.
- Messages de commit en français, au présent : « ajoute l'écran fiche avion ».

## Hors périmètre du MVP

Ne pas développer : recherche par immatriculation, messagerie, marketplace, pages constructeurs ou organisateurs, fil d'actualité, suivi d'actualité par avion.