---
titre: Le journal du projet
date: 2026-11-10
pr: à venir
auteur_github: alexandrarobins8-sys
codee_par: Alexandra, avec l'assistant Claude Code
termes: Pull request (PR), Fusion / fusionner, Main, Markdown, Script, Node.js, GitHub Actions, Workflow, Contrôle automatique, Étiquette, CLAUDE.md, Terminal
---

## À quoi ça sert pour l'utilisateur

Cette brique ne change rien dans l'application : elle sert à l'équipe et au jury. Elle raconte le projet brique par brique, sans jargon, pour que chacun puisse retracer ce qui a été fait, par qui et pourquoi, et pour préparer la soutenance du démo day.

## Ce qui a été construit

- **Une fiche par brique** dans `docs/briques/` : à quoi ça sert, ce qui a été construit, comment le montrer, ce que ça rend possible. Les 4 pull requests déjà fusionnées et la semaine de cadrage ont été rattrapées.
- **Des fichiers sources** dans `docs/sources/` : l'équipe, le pitch, le lexique et les annexes.
- **Un script** qui assemble le tout dans un document unique, `docs/JOURNAL-DU-PROJET.md`, sans ajouter de dépendance (**Node.js** seul).
- **Deux robots GitHub Actions** :
  - après chaque **fusion** sur `main`, le premier relance le script et enregistre le journal à jour ;
  - sur chaque **pull request**, le second fait un **contrôle automatique** qui échoue s'il n'y a pas de nouvelle fiche, sauf si la pull request porte l'**étiquette** « sans-fiche » (pour les corrections mineures).
- **Un modèle de pull request** qui rappelle de créer la fiche.
- **Une nouvelle règle dans CLAUDE.md** : créer la fiche avant d'ouvrir une pull request, et compléter le lexique si un nouveau terme technique apparaît.

## Comment le vérifier ou le montrer en démo

1. Dans un **terminal**, taper `node scripts/journal/build.js` : le message « Journal généré » s'affiche.
2. Ouvrir `docs/JOURNAL-DU-PROJET.md` dans VS Code ou sur GitHub.
3. Ouvrir une pull request sans fiche : une croix rouge apparaît sur le contrôle « Fiche de brique ».

## Ce que ça rend possible ensuite

- Un journal toujours à jour, sans effort de mise en page.
- Une base toute prête pour le support de soutenance : le fil chronologique, le tableau « qui a fait quoi » et le lexique.
