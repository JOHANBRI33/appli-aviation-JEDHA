# CLAUDE.md — Appli aviation (Projet Jedha)

## Le projet

Application web mobile (PWA) pour passionnés d'aviation.
Boucle du MVP : l'utilisateur photographie un avion → une IA de vision identifie son type → la fiche s'affiche → l'avion s'ajoute à « Mon Hangar » → l'utilisateur gagne des points selon la rareté et débloque des badges.

Projet de formation : 3 personnes, MVP livré en 6 semaines, environ 180 h au total.
Priorité absolue : une boucle simple qui marche de bout en bout, plutôt que beaucoup de fonctionnalités.

## Stack

- Next.js 16 (App Router), JavaScript
- Tailwind CSS, conception mobile d'abord
- Supabase : Postgres, Auth (email), Storage (photos des utilisateurs)
- `@supabase/supabase-js` et `@supabase/ssr`
- IA de vision : Gemini (`@google/genai`), appelée uniquement côté serveur
- Déploiement : Vercel (mise en ligne automatique depuis `main`)

## Commandes

- `npm install` : installer les dépendances
- `npm run dev` : lancer en local
- `npm run build` : vérifier que le projet compile avant chaque pull request
- `npm run lint` : vérifier le style du code
- `npm run test:vision` : lancer le script de test de reconnaissance (photos dans `scripts/test-vision/photos/`)
- `npm run import:catalogue` : importer les données Wikidata + photos Commons dans `supabase/seed/aircraft.sql`

## Structure des dossiers

- `app/` : pages et routes
  - `app/page.js` : accueil
  - `app/labo/` : page de test de reconnaissance (dev uniquement)
  - `app/avions/[id]/` : fiche d'un avion *(à créer)*
  - `app/photo/` : prise de photo et résultat *(à créer)*
  - `app/hangar/` : collection de l'utilisateur *(à créer)*
  - `app/classement/` : classement *(à créer)*
  - `app/api/identifier/` : route serveur de reconnaissance (Gemini)
- `components/` : composants réutilisables
  - `components/AircraftCard.js` : carte fiche avion (photo + données techniques)
- `lib/supabase/` : clients Supabase (navigateur et serveur)
- `lib/identification.js` : appel à Gemini + chargement du catalogue depuis Supabase
- `lib/points` : calcul des points et attribution des badges *(à créer)*
- `supabase/migrations/` : schéma de la base, versionné
  - `001_aircraft.sql` : table aircraft, RLS
- `supabase/seed/` : données initiales
  - `aircraft.sql` : 15 avions générés par `npm run import:catalogue`
- `scripts/test-vision/` : test de reconnaissance en batch
  - `catalogue.json` : catalogue de référence (fallback si Supabase vide)
- `scripts/import-catalogue/` : import Wikidata + Wikimedia Commons
  - `run.js` : script principal
  - `wikidata-ids.json` : correspondance id catalogue → Wikidata (à corriger si besoin)

## Modèle de données

### Table `aircraft` ✅ créée (`supabase/migrations/001_aircraft.sql`)

| Colonne | Type | Notes |
|---|---|---|
| `id` | text PK | identifiant court : `a320`, `rafale`… |
| `name` | text | nom complet affiché |
| `manufacturer` | text | constructeur |
| `category` | enum | `ligne` / `militaire` / `collection` / `autre` |
| `description` | text | texte court en français pour l'utilisateur |
| `recognition_hints` | text | indices visuels pour Gemini (jamais affiché) |
| `first_flight` | date | date du premier vol |
| `max_speed_kmh` | integer | vitesse max en km/h |
| `length_m` | numeric | longueur en mètres |
| `wingspan_m` | numeric | envergure en mètres |
| `units_built` | integer | nombre d'exemplaires construits |
| `rarity` | integer 1–5 | calculé depuis `units_built` |
| `image_url` | text | miniature 1024 px Wikimedia Commons |
| `image_author` | text | auteur de la photo (texte brut) |
| `image_license` | text | ex. `CC BY-SA 4.0` |
| `image_license_url` | text | lien vers la page de la licence |
| `image_source_url` | text | lien vers la fiche Commons (crédit obligatoire) |
| `wikidata_id` | text | ex. `Q5830` |
| `visible` | boolean | `true` par défaut — masque sans supprimer |
| `created_at` / `updated_at` | timestamptz | automatiques |

RLS : lecture publique sur `visible = true` ; aucune écriture depuis l'appli.

### Tables à créer

- `profiles` : id (= auth), username, points
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
- Row Level Security activée sur toutes les tables Supabase : un utilisateur ne lit et n'écrit que ses propres captures. La table `aircraft` est en lecture publique (anon + authenticated).
- Photos des fiches : uniquement Wikimedia Commons, avec auteur et licence affichés sous chaque image. Jamais de photos Planespotters, JetPhotos ou Airliners.net.
- `loadCatalogue()` dans `lib/identification.js` lit d'abord Supabase (`id, name, manufacturer, recognition_hints`) ; si indisponible, bascule sur `scripts/test-vision/catalogue.json` avec un `console.warn`.

## Façon de travailler

- Une tâche = une branche (`feat/fiche-avion`, `fix/upload-photo`) = une pull request relue par un autre membre.
- Faire de petits changements ciblés et expliquer ce qui est modifié.
- Ne pas toucher aux fichiers hors du périmètre de la tâche sans le signaler.
- Pas de refonte globale ni de changement de stack sans décision d'équipe.
- Messages de commit en français, au présent : « ajoute l'écran fiche avion ».

## Hors périmètre du MVP

Ne pas développer : recherche par immatriculation, messagerie, marketplace, pages constructeurs ou organisateurs, fil d'actualité, suivi d'actualité par avion.