---
titre: Le catalogue d'abord, et un catalogue qui grandit tout seul
date: 2026-11-16
pr: 19
auteur_github: JOHANBRI33
codee_par: Johan, avec l'assistant Claude Code
termes: Catalogue, Route serveur, Alias, Identifiant court, Clé administrateur (service_role), Variable d'environnement, Vérifié / non vérifié, Wikidata
---

## À quoi ça sert pour l'utilisateur

Quand l'IA reconnaît un avion déjà connu, la fiche s'affiche plus vite (environ 0,3 seconde au lieu de 2), et l'utilisateur peut ouvrir sa page `/avions/…`. Si l'avion n'est pas encore dans le catalogue, sa fiche s'affiche quand même, et l'avion y est ajouté pour la prochaine fois.

## Ce qui a été construit

La **route serveur** de reconnaissance suit maintenant cet ordre :

1. **Elle cherche dans le catalogue**, grâce aux **alias** de chaque avion. Elle le fait pour l'avion reconnu et pour les 3 suggestions, en une seule fois et sans interroger **Wikidata**.
2. **Sinon, elle construit la fiche en direct** depuis Wikidata.
3. **Puis elle ajoute l'avion au catalogue**, marqué **non vérifié**, mais seulement si l'IA est sûre d'elle à au moins 70 %. Le nom donné par l'IA devient un alias : la photo suivante du même avion le trouve directement.

Pour écrire dans le catalogue, le serveur utilise la **clé administrateur** de Supabase, rangée dans une **variable d'environnement** et jamais envoyée au téléphone. C'est une décision d'équipe du 16/11/2026 : jusqu'ici, l'application n'avait pas le droit d'écrire dans le catalogue.

L'avion reconnu est désormais désigné par son **identifiant court** (`b747`) au lieu de son numéro Wikidata (`Q179`). La fiche, le Hangar et la carte de collection peuvent donc l'ouvrir.

Testé avec un Cirrus SR22, absent des 200 avions : ajouté à la première photo, puis retrouvé directement dans le catalogue à la deuxième.

## Comment le vérifier ou le montrer en démo

1. Sur `localhost:3000/labo`, déposer une photo de Concorde : la fiche vient du catalogue.
2. Déposer une photo d'un avion absent du catalogue : la fiche s'affiche, et l'avion apparaît ensuite dans la table Supabase avec la mention « non vérifié ».

## Ce que ça rend possible ensuite

- Enregistrer les captures dans « Mon Hangar », puisque chaque avion reconnu a maintenant un identifiant du catalogue.
- Relire de temps en temps les avions « non vérifiés » ajoutés par les utilisateurs.
