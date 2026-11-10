---
titre: Le labo de reconnaissance
date: 2026-11-03
pr: 2
auteur_github: JOHANBRI33
termes: Labo, Gemini, Route serveur, Serveur, Local, Terminal, npm, Lint, Build
---

## À quoi ça sert pour l'utilisateur

Le labo permet de tester la reconnaissance comme le ferait un utilisateur : on dépose une photo, ou on en prend une avec le téléphone, et l'application dit quel avion c'est. Il est réservé à l'équipe, mais c'est la première version de l'écran « je photographie, l'appli reconnaît » qui est au cœur de Flight Hunter.

## Ce qui a été construit

- Une page `/labo`, pensée d'abord pour le téléphone : on glisse une photo dans la page ou on utilise le bouton « appareil photo ».
- La photo est réduite directement dans le téléphone avant l'envoi, pour aller plus vite et consommer moins de données.
- Une **route serveur** (`/api/identifier`) reçoit la photo et l'envoie à **Gemini**. La clé secrète de Gemini reste ainsi sur le **serveur** et n'est jamais visible dans le téléphone.
- Le résultat s'affiche avec une barre de confiance colorée (à quel point l'IA est sûre d'elle) et, si elle hésite, 3 suggestions.
- Un historique des essais de la session, et des messages d'erreur clairs en français, par exemple pour le format photo des iPhone (HEIC).
- Une protection : une fois l'application en ligne, le labo et sa route répondent « page introuvable ». Le public ne peut donc pas s'en servir.
- Le code qui parle à Gemini est rangé à un seul endroit, partagé entre le labo et le script de test.

## Comment le vérifier ou le montrer en démo

1. Dans un **terminal**, taper `npm run dev` et attendre le mot « Ready ».
2. Ouvrir `localhost:3000/labo` dans le navigateur.
3. Déposer une photo d'avion : le nom de l'avion reconnu et la barre de confiance s'affichent en quelques secondes.
4. Pour tester depuis un téléphone sur le même réseau wifi, suivre la section dédiée du `README`.

## Ce que ça rend possible ensuite

- L'écran « photo » de l'application finale pourra réutiliser la même route serveur.
- La fiche avion pourra s'afficher sous le résultat (brique du 06/11).
