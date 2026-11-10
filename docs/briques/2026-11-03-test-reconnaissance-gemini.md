---
titre: Test de la reconnaissance d'avions par l'IA
date: 2026-11-03
pr: 1
auteur_github: JOHANBRI33
termes: Script, IA de vision, Gemini, Catalogue, Dépendance, Terminal, npm
---

## À quoi ça sert pour l'utilisateur

Avant de construire toute l'application autour de la reconnaissance, il fallait vérifier qu'une intelligence artificielle sait vraiment dire quel avion figure sur une photo. Cette brique est invisible pour l'utilisateur, mais elle garantit que la promesse principale de Flight Hunter est tenable.

## Ce qui a été construit

- Un **script** de test : il prend un dossier de photos, les envoie une par une à **Gemini** avec la liste des avions du **catalogue**, puis note si la réponse est juste.
- Un premier catalogue de 15 modèles, choisis exprès avec des « paires pièges » qui se ressemblent beaucoup : Airbus A320 et A321, Rafale et Mirage 2000, Spitfire et Hurricane.
- Un fichier de résultats, pour comparer les essais entre membres de l'équipe.
- Deux **dépendances** : l'une pour parler à Gemini, l'autre pour réduire la taille des photos avant l'envoi.
- Les photos de test restent sur l'ordinateur de chacun et ne sont pas enregistrées dans le projet.

## Comment le vérifier ou le montrer en démo

1. Déposer des photos dans le dossier `scripts/test-vision/photos/`, en les nommant d'après l'avion attendu (par exemple `a380-01.jpg`).
2. Dans un **terminal**, taper `npm run test:vision`.
3. Le script affiche, pour chaque photo, la réponse de l'IA et si elle est juste, puis un score final.

## Ce que ça rend possible ensuite

- Le choix de Gemini pour le cœur de l'application est confirmé.
- Le code qui parle à Gemini est réutilisé par la page de test « labo » (brique suivante).
- Le même script permet de mesurer chaque amélioration de la reconnaissance.
