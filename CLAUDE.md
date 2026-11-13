# CLAUDE.md — Appli aviation (Projet Jedha)

## Le projet

Application web mobile (PWA) pour passionnés d'aviation.
Boucle du MVP : l'utilisateur photographie un avion → une IA de vision identifie son type → la fiche s'affiche → l'avion s'ajoute à « Mon Hangar » → l'utilisateur gagne des points et le badge de la rareté de l'avion (Bronze, Argent, Or, Platine, Légendaire).

Projet de formation : 3 personnes, MVP livré en 6 semaines, environ 180 h au total.
Priorité absolue : une boucle simple qui marche de bout en bout, plutôt que beaucoup de fonctionnalités.

## Stack

- Next.js 16 (App Router), JavaScript
- Tailwind CSS 4, conception mobile d'abord (configuration dans `app/globals.css`, bloc `@theme` : pas de `tailwind.config.js`)
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
  - `components/SkyBackground.js` : fond ciel avec nuages des écrans principaux
- `public/` : logo (`logo-flight-hunter.png`), icônes de l'appli (`icons/`), nuages du fond ciel (`sky-clouds.svg`)
- `lib/supabase/` : clients Supabase (navigateur et serveur)
- `lib/identification.js` : appel à Gemini + chargement du catalogue depuis Supabase
- `lib/points.js` : barème de la rareté (niveau, points, badge)
- `components/RarityTag.js` et `components/RarityBadge.js` : étiquette et badge ailé de rareté
- `public/badges/` : les 5 badges ailés en SVG (bronze, argent, or, platine, legendaire)
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

Les badges se déduisent de la rareté (`aircraft.rarity`) des avions vus en vrai : pas de table `badges`.

## Conventions

- Code, tables et colonnes en anglais ; textes affichés à l'utilisateur en français.
- Composants en PascalCase (`AircraftCard`), fonctions et variables en camelCase.
- Conception mobile d'abord : tester chaque écran en largeur téléphone.
- Aucune nouvelle dépendance sans accord de l'équipe.
- Code simple et lisible, commenté quand ce n'est pas évident : chaque membre doit pouvoir l'expliquer en soutenance.

## Charte graphique (Flight Hunter)

La référence est la charte « Flight Hunter » et le Figma « Appli aviation — Écrans MVP ». Les jetons sont dans `app/globals.css`. Tout nouveau code utilise ces classes, jamais la palette par défaut (`sky-*`, `gray-*`) ni de couleur en dur.

- **Le bleu agit, l'orange récompense.** `bg-brand-blue text-on-brand` pour le bouton principal (une seule action principale par écran) ; `reward` uniquement pour les points, la nouveauté et les badges, jamais pour une action.
- Couleurs :
  - Fonds : `bg-surface` (écran), `bg-surface-raised` (cartes, champs), bordure `border-line`. Pas d'ombre sur les cartes.
  - Texte : `text-ink` (principal), `text-ink-muted` (secondaire), `text-on-brand` (sur bleu ou bleu nuit).
  - Marque : `brand-navy` (fonds forts : score, date, bouton sombre), `brand-blue` (actions, liens, onglet actif), `brand-blue-strong` (appuyé), `brand-blue-soft` (pastilles d'icône), `brand-cyan` (décor seulement).
  - Récompense : `text-reward` (gros chiffres, 24 px et plus), `text-reward-text` (petit texte « +50 pts »), `bg-reward-soft` (encart « Nouveau »).
  - États : `success`, `success-soft`, `danger`, toujours avec un mot ou une icône.
  - Rareté (colonne `rarity` 1 à 5) : 1 `bronze` (10 pts), 2 `argent` (25), 3 `or` (50), 4 `platine` (100), 5 `legendaire` (200), définis dans `lib/points.js`. Étiquette = `<RarityTag rarity={…} />` (`bg-rarity-<niveau>-soft text-rarity-<niveau>`), le texte écrit toujours le niveau et les points (« Or · 50 pts »). Badge ailé = `<RarityBadge rarity={…} width={…} />`, sur la fiche, les vignettes et le Hangar.
- Styles de texte (une classe qui règle police, taille, interligne et graisse) : `typo-display-xl` (nom de l'avion), `typo-display-reward` (« +50 »), `typo-title-lg` (titre d'écran), `typo-title-md` (titre de bloc), `typo-stat` (valeur technique), `typo-body-lg`, `typo-body`, `typo-body-sm`, `typo-label` (boutons), `typo-item-title` (nom dans une liste), `typo-data` (étiquettes, compteurs), `typo-credit` (crédit photo).
- Polices (chargées par `next/font` dans `app/layout.js`) : `font-display` Barlow Condensed, `font-sans` DM Sans (par défaut), `font-mono` JetBrains Mono.
- Espacements : grille de 4 px de Tailwind. Marges d'écran `px-6`, intérieur des cartes `p-4`, écart entre cartes `gap-3`.
- Rayons : `rounded-sm` 12 px (vignettes, encarts), `rounded-md` 14 px (boutons, champs), `rounded-lg` 20 px (cartes), `rounded-full` (étiquettes, filtres, bouton Scanner).
- Ombres : seulement `shadow-scan` (bouton Scanner de la navigation) et `shadow-tab` (onglet actif).
- Fond ciel : `<SkyBackground />` sur les écrans principaux (pas sur les fiches avion ni l'écran d'analyse).
- Icônes : Lucide (SVG copiés depuis lucide.dev, sans ajouter le paquet `lucide-react` sans accord de l'équipe), trait de 2 px. Cibles tactiles de 44 px minimum. Pas d'emoji dans l'interface.

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