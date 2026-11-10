---
titre: Une reconnaissance plus rapide et plus fiable
date: 2026-11-09
pr: 4
auteur_github: JOHANBRI33
termes: Modèle d'IA, Modèle de secours, Erreur 503, Gemini, Cache / mise en mémoire, Catalogue, Labo, Script, Terminal, npm
---

## À quoi ça sert pour l'utilisateur

L'utilisateur obtient sa réponse en une à deux secondes, au lieu de risquer d'attendre 40 secondes ou de recevoir une erreur. Et si l'avion photographié n'est pas dans le catalogue, l'application le dit honnêtement au lieu d'inventer une réponse.

## Ce qui a été construit

- **Le problème :** le **modèle d'IA** utilisé jusque-là était débordé chez Google (**erreur 503**). Sur un test de 18 photos, il n'en a reconnu aucune.
- **La comparaison :** Johan a testé 4 modèles sur les mêmes 18 photos (3 vraies photos et 15 photos du catalogue) :

  | Modèle | Bonnes réponses | Temps de réponse habituel |
  |---|---|---|
  | gemini-3.5-flash-lite (retenu) | 17 sur 18 | 1,2 s |
  | gemini-3.1-flash-lite (secours) | 16 sur 18 | 2,1 s |
  | gemini-3.6-flash | 13 sur 18 | 5 s |
  | gemini-3.8-flash (ancien) | 0 sur 18 | — |

- **Le secours en parallèle :** si le modèle principal n'a pas répondu au bout de 5 secondes, un **modèle de secours** est lancé en même temps. Le premier qui répond gagne. L'attente ne peut plus dépasser 20 secondes.
- **La réponse « inconnu »** pour un avion hors catalogue.
- **La mise en mémoire** du catalogue pendant 5 minutes, pour éviter de le redemander à chaque photo.
- Le **script** de test accepte maintenant les photos au format `.avif` et les photos nommées `inconnu-01.jpg`, `inconnu-02.jpg`… pour tester les avions hors catalogue.

**Limite signalée par Johan :** 15 des 18 photos sont celles des fiches du catalogue, ce qui facilite la tâche de l'IA. Il faudra davantage de vraies photos pour mesurer la fiabilité réelle.

## Comment le vérifier ou le montrer en démo

1. Ouvrir le **labo** et déposer une photo d'avion : la réponse arrive en une à deux secondes.
2. Déposer la photo d'un avion absent du catalogue : l'écran affiche « Avion non reconnu (hors catalogue ?) ».
3. Dans un **terminal**, avec des photos dans `scripts/test-vision/photos/`, lancer `npm run test:vision` pour obtenir le score.

## Ce que ça rend possible ensuite

- Une base fiable et rapide pour l'écran « photo » de l'application finale.
- La mesure à grande échelle prévue avec 50 vraies photos de test.
