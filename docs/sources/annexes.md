### Stack technique

La « stack », ce sont les outils avec lesquels l'application est construite.

<!-- Colonne « Pourquoi ce choix » : proposition à valider par l'équipe. -->

| Outil | Rôle dans le projet | Pourquoi ce choix |
|---|---|---|
| Next.js 16 | Construit les pages de l'application et son serveur | Un seul outil pour l'écran et le serveur, ce qui permet de garder les clés secrètes côté serveur |
| JavaScript | Le langage de programmation du projet | Le langage du web, connu de toute l'équipe |
| Tailwind CSS | Met en forme les écrans (couleurs, tailles, espacements) | Rapide pour concevoir des écrans pensés d'abord pour le téléphone |
| Supabase | Base de données, comptes utilisateurs, stockage des photos | Trois services en un, avec des règles de sécurité intégrées (RLS) |
| Gemini (Google) | Reconnaît le modèle d'avion sur une photo | Validé par le test de reconnaissance avant de démarrer le code |
| Wikidata et Wikimedia Commons | Fournissent les caractéristiques des avions et des photos libres de droits | Données publiques et photos dont la licence autorise la réutilisation avec crédit |
| Vercel | Met l'application en ligne automatiquement | Conçu pour Next.js, mise en ligne à chaque fusion sur `main` |
| GitHub | Stocke le code, permet la relecture des pull requests | Outil standard du travail en équipe sur du code |
| Notion | Tableau des tâches, user stories, points quotidiens | Espace d'organisation partagé de l'équipe |

### Structure des dossiers

| Dossier | Ce qu'il contient |
|---|---|
| `app/` | Les pages et les routes serveur de l'application |
| `app/labo/` | La page de test de la reconnaissance (réservée à l'équipe) |
| `app/api/identifier/` | La route serveur qui envoie la photo à Gemini |
| `components/` | Les morceaux d'écran réutilisables (par exemple la fiche avion) |
| `lib/` | Le code partagé : connexion à Supabase, appel à Gemini |
| `supabase/migrations/` | La structure de la base de données, version par version |
| `supabase/seed/` | Les données de départ (les fiches des avions) |
| `scripts/test-vision/` | Le script de test de la reconnaissance sur un lot de photos |
| `scripts/import-catalogue/` | Le script qui récupère les données Wikidata et les photos Commons |
| `scripts/journal/` | Le script qui fabrique ce journal |
| `docs/briques/` | Une fiche par brique du projet |
| `docs/sources/` | Les ingrédients du journal : équipe, pitch, lexique, annexes |
| `.github/` | Les robots GitHub Actions et le modèle de pull request |

### Liens utiles

- Dépôt GitHub : https://github.com/JOHANBRI33/appli-aviation-JEDHA
- Pull requests : https://github.com/JOHANBRI33/appli-aviation-JEDHA/pulls?q=is%3Apr
- Application en ligne : pas encore déployée
