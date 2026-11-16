---
titre: Des fiches avion justes
date: 2026-11-16
pr: 17
auteur_github: JOHANBRI33
codee_par: Johan, avec l'assistant Claude Code
termes: Fiche avion, Wikidata, Unité de mesure, Rareté, Erreur 429, Cache / mise en mémoire, Script
---

## À quoi ça sert pour l'utilisateur

La fiche qui s'affiche après une photo donne enfin les bonnes informations : la vraie date du premier vol, des vitesses et des dimensions dans la bonne unité, et une rareté qui correspond au nombre d'avions réellement construits.

## Ce qui a été construit

En relisant le code qui lit **Wikidata**, Johan a trouvé plusieurs erreurs :

- **La date du premier vol était fausse.** Le code lisait la date de mise en service. Le Boeing 747 affichait 1970 au lieu de 1969, le Rafale 2002 au lieu de 1986.
- **Les unités de mesure n'étaient jamais lues.** Le code devinait si une valeur était en km/h, en nœuds ou en pieds. Le Spitfire affichait 370 km/h, alors que Wikidata indique 370 miles par heure, soit 595 km/h.
- **Un avion mal renseigné rapportait le maximum de points.** Quand le nombre d'exemplaires manquait, la **rareté** valait 5 (Légendaire, 200 points). L'équipe a décidé de mettre 3 (Or) par défaut.
- **La recherche pouvait tomber sur un moteur** ou sur un constructeur au lieu d'un avion.

Le nouveau code cherche l'avion directement à partir du titre de sa page Wikipédia anglaise, celui que donne l'IA. Il vérifie que c'est bien un avion, lit les vraies unités et garde la plus grande valeur du nombre d'exemplaires. Il gère aussi l'**erreur 429**, quand Wikidata demande de ralentir.

## Comment le vérifier ou le montrer en démo

1. Ouvrir `localhost:3000/labo` et déposer une photo de Boeing 747.
2. La fiche indique un premier vol le 9 février 1969.

## Ce que ça rend possible ensuite

- Agrandir le catalogue sans recopier les mêmes erreurs.
- Un barème de points juste.
