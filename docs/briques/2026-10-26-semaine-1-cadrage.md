---
titre: Semaine 1 : le cadrage
date: 2026-10-26
pr: aucune
auteur_github: JOHANBRI33
concue_par: Toute l'équipe
codee_par: Johan (initialisation du projet)
termes: MVP, Persona, MoSCoW, Benchmark, Catalogue, Rareté, IA de vision, Maquette, Base de données, GitHub, Supabase, Vercel, Déploiement, Next.js, CLAUDE.md
---

## À quoi ça sert pour l'utilisateur

Avant d'écrire la moindre ligne de code, l'équipe a décidé quoi construire, pour qui et dans quel ordre. C'est ce travail qui fait que l'utilisateur reçoit une application simple et cohérente, centrée sur une seule boucle : photographier un avion, le reconnaître, le collectionner.

## Ce qui a été construit

Tout le cadrage a été conçu par l'équipe entière (Johan, Fred et Alexandra) :

| Élément | Conçu par | Ce que c'est |
|---|---|---|
| Réunion de lancement et rôles | Toute l'équipe | Répartition des rôles : Johan au back-end, Fred au design et au front, Alexandra Product Owner |
| Atelier pitch et persona | Toute l'équipe | La promesse de Flight Hunter et l'utilisateur type à qui elle s'adresse |
| Priorités **MoSCoW** | Toute l'équipe | Le tri des fonctionnalités, pour définir le **MVP** |
| **Benchmark** | Toute l'équipe | L'étude des applications existantes autour de l'aviation |
| Liste des modèles du **catalogue** et barème de **rareté** | Toute l'équipe | Les avions que l'application saura reconnaître, et la note de 1 à 5 selon le nombre d'exemplaires construits |
| Test de reconnaissance sur 20 photos | Toute l'équipe | La vérification qu'une **IA de vision** sait reconnaître un avion. *Résultat chiffré non archivé, à demander à Johan.* Dernière mesure connue : 17 photos sur 18 reconnues le 09/11, avec le modèle actuel (voir la brique du 09/11). |
| **Maquettes** des 5 écrans | Toute l'équipe | Le dessin des écrans principaux avant de les coder |
| Format des données | Toute l'équipe | Ce que la **base de données** doit contenir : avions, utilisateurs, captures, badges |
| Initialisation | Toute l'équipe, mise en place par Johan | Création du dépôt **GitHub** et du projet **Next.js** (26/10), du projet **Supabase**, préparation du **déploiement** sur **Vercel** (l'application n'est pas encore en ligne au 10/11), rédaction du fichier de règles **CLAUDE.md** |

## Comment le vérifier ou le montrer en démo

- Montrer le tableau des priorités MoSCoW et les user stories dans l'espace Notion de l'équipe.
- Montrer les maquettes des 5 écrans.
- Ouvrir le fichier `CLAUDE.md` à la racine du projet : il résume les décisions prises (stack, données, règles de sécurité, périmètre du MVP).

## Ce que ça rend possible ensuite

Toutes les briques suivantes : chaque pull request s'appuie sur les rôles, les priorités et les règles fixées pendant cette semaine.
