# Lexique

<!--
Une ligne par terme, toujours au format :
- **Terme** : une phrase simple qui l'explique.
L'ordre n'a pas d'importance : le script trie les termes par ordre alphabétique.
Un terme peut avoir des variantes, séparées par « / » : - **Commit / commits** : ...
-->

- **API** : une « porte d'entrée » qu'un programme ouvre à d'autres programmes pour qu'ils puissent lui envoyer des demandes et recevoir des réponses.
- **Back-end** : la partie invisible de l'application (serveur, base de données, appels à l'IA), par opposition à ce que l'utilisateur voit à l'écran.
- **Badge** : une récompense que l'utilisateur débloque en atteignant un objectif (par exemple capturer son premier avion de chasse).
- **Base de données** : un grand classeur organisé où l'application range ses informations (avions, utilisateurs, captures) pour les retrouver rapidement.
- **Benchmark** : l'étude des applications existantes qui ressemblent à la nôtre, pour s'en inspirer et s'en démarquer.
- **Branche** : une copie de travail du projet où l'on fait ses changements sans toucher à la version officielle (`main`), comme le brouillon d'un document partagé.
- **Build** : l'étape qui transforme le code en application prête à être mise en ligne ; si le build échoue, l'application ne peut pas être publiée.
- **Cache / mise en mémoire** : garder une information à portée de main pendant un moment pour ne pas aller la rechercher à chaque fois.
- **Catalogue** : la liste des modèles d'avions que l'application sait reconnaître, avec leur fiche.
- **CLAUDE.md** : le fichier de règles du projet (stack, conventions, sécurité) que l'équipe et l'assistant de programmation Claude Code lisent avant de travailler.
- **Composant** : un morceau d'écran réutilisable, comme une brique de Lego qu'on place sur plusieurs pages.
- **Commit** : une « photo » datée du travail, enregistrée dans l'historique du projet avec un message qui explique ce qui a changé.
- **Contrôle automatique** : une vérification que GitHub lance tout seul sur chaque pull request ; il affiche une coche verte si tout va bien, une croix rouge sinon.
- **Déploiement / mise en ligne** : l'action de publier l'application sur Internet pour que tout le monde puisse l'utiliser.
- **Dépendance** : un morceau de code écrit par d'autres développeurs que le projet réutilise, comme une brique toute faite.
- **Erreur 503** : la réponse d'un service en ligne qui dit « je suis débordé, réessayez plus tard ».
- **Étiquette** : un petit mot-clé coloré qu'on colle sur une pull request sur GitHub pour la classer (par exemple « sans-fiche »).
- **Fiche avion** : l'écran qui présente un modèle d'avion : photo créditée, constructeur, dimensions, vitesse, rareté.
- **Fusion / fusionner** : intégrer le travail d'une branche dans la version officielle `main`, une fois la pull request relue et acceptée.
- **Gemini** : l'intelligence artificielle de Google que nous utilisons pour reconnaître un avion sur une photo.
- **Git** : l'outil qui garde l'historique de toutes les modifications du code et permet de travailler à plusieurs sans s'écraser.
- **GitHub** : le site web où est stocké le code du projet et où l'équipe relit et fusionne les pull requests.
- **GitHub Actions** : des robots fournis par GitHub qui exécutent des tâches automatiquement quand quelque chose se passe sur le dépôt (par exemple une fusion).
- **IA de vision** : une intelligence artificielle capable de comprendre le contenu d'une image.
- **JSON** : un format de fichier texte très simple pour ranger des informations, lisible à la fois par un humain et par un programme.
- **Labo** : la page de test de la reconnaissance, réservée à l'équipe sur son ordinateur, invisible pour les vrais utilisateurs.
- **Licence** : les conditions d'utilisation d'une photo ; les licences Creative Commons (CC BY-SA par exemple) autorisent la réutilisation à condition de citer l'auteur.
- **Lint** : une vérification automatique du style du code, comme un correcteur d'orthographe pour programmeurs.
- **Local / en local** : sur l'ordinateur du développeur uniquement, pas encore en ligne.
- **Main** : la branche officielle du projet, celle qui est mise en ligne ; on n'y travaille jamais directement.
- **Maquette** : un dessin des écrans de l'application avant de les coder, pour valider l'apparence et l'enchaînement.
- **Markdown** : un format de texte simple (`#` pour un titre, `**mot**` pour du gras) que GitHub affiche joliment mis en page.
- **Migration** : un fichier qui décrit une modification de la structure de la base de données, enregistré dans le code pour que tout le monde ait la même structure.
- **Modèle d'IA** : une version précise d'une intelligence artificielle ; Google en propose plusieurs, plus ou moins rapides et précises.
- **Modèle de secours** : un deuxième modèle d'IA qu'on appelle automatiquement si le premier ne répond pas à temps.
- **MoSCoW** : une méthode de tri des fonctionnalités en quatre groupes : indispensable (Must), important (Should), bonus (Could), pas cette fois (Won't).
- **MVP** : « produit minimum viable », la première version de l'application avec seulement l'essentiel, mais qui fonctionne de bout en bout.
- **Next.js** : l'outil (framework) avec lequel nous construisons les pages et le serveur de l'application.
- **npm** : l'outil livré avec Node.js qui installe les dépendances du projet et lance ses commandes (par exemple `npm run dev`).
- **Node.js** : le moteur qui fait tourner du code JavaScript sur un ordinateur ou un serveur, en dehors du navigateur.
- **Persona** : un utilisateur type imaginaire, avec un prénom et des habitudes, qui aide l'équipe à se mettre à sa place.
- **Prompt** : le texte d'instructions qu'on envoie à une IA pour lui dire ce qu'on attend d'elle.
- **Pull request (PR)** : une demande de fusion : on propose les changements d'une branche, un coéquipier les relit, puis on les intègre à `main`.
- **PWA** : une application web qui s'utilise sur téléphone comme une vraie application, sans passer par un magasin d'applications.
- **Rareté** : une note de 1 à 5 qui indique si un avion est courant ou rare, calculée à partir du nombre d'exemplaires construits.
- **RLS (sécurité par ligne)** : des règles dans la base de données qui décident qui a le droit de lire ou modifier chaque ligne.
- **Route serveur** : une adresse de l'application qui n'affiche pas de page mais exécute un traitement sur le serveur (par exemple envoyer une photo à l'IA).
- **Script** : un petit programme qu'on lance à la main pour faire une tâche précise (tester, importer des données, générer un document).
- **Seed / données initiales** : le fichier qui remplit la base de données avec ses premières informations (ici, les fiches des avions).
- **Serveur** : un ordinateur qui fait tourner l'application et répond aux demandes des utilisateurs ; les clés secrètes y restent cachées.
- **Supabase** : le service en ligne qui héberge notre base de données, les comptes utilisateurs et les photos.
- **Table** : un tableau dans la base de données, avec une ligne par élément (par exemple une ligne par avion).
- **Terminal** : une fenêtre où l'on tape des commandes au clavier au lieu de cliquer ; dans VS Code, menu Terminal → Nouveau terminal.
- **Vercel** : le service qui met notre application en ligne automatiquement à chaque changement sur `main`.
- **Wikidata** : une immense base de données libre et publique (de la famille de Wikipédia) d'où viennent les caractéristiques techniques des avions.
- **Wikimedia Commons** : la photothèque libre de Wikipédia, seule source autorisée pour les photos des fiches avions.
- **Workflow** : la « recette » d'un robot GitHub Actions : un fichier qui dit quand se déclencher et quelles étapes exécuter.
