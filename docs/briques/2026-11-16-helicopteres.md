---
titre: Les hélicoptères entrent dans le catalogue
date: 2026-11-16
pr: 20
auteur_github: JOHANBRI33
codee_par: Johan, avec l'assistant Claude Code
termes: Catalogue, Palier, Script, SPARQL, Seed / données initiales, Wikidata
---

## À quoi ça sert pour l'utilisateur

En meeting aérien, on croise autant d'hélicoptères que d'avions. Le **catalogue** compte maintenant 130 hélicoptères en plus des 200 avions : Apache, Tigre, Black Hawk, Écureuil, Chinook, le V-22 Osprey et des modèles historiques comme le Sikorsky R-4.

## Ce qui a été construit

- **Une deuxième recherche dans Wikidata**, consacrée aux hélicoptères, avec son propre **palier** de 130. Les 200 avions n'ont pas changé.
- **Un classement adapté aux hélicoptères** :
  - « militaire » d'après leur description ou leur désignation américaine (UH-1, CH-47…) ;
  - « collection » pour les plus anciens ;
  - « autre » pour les hélicoptères civils.

  Les drones, dirigeables et planeurs restent écartés.
- **Une protection contre les doublons.** Si un hélicoptère a déjà été ajouté automatiquement après une photo, le **script** reprend son identifiant au lieu d'en créer un second.

Répartition des hélicoptères : 58 militaires, 17 de collection, 55 civils. Le fichier de **données initiales** a été testé sur une copie de la base actuelle, puis importé dans Supabase.

## Comment le vérifier ou le montrer en démo

1. Ouvrir `scripts/import-catalogue/apercu.md` : « 330 appareils (200 avions, 130 hélicoptères) ».
2. Sur `localhost:3000/labo`, déposer une photo d'hélicoptère Apache : la fiche « Boeing AH-64 Apache » s'affiche.

## Ce que ça rend possible ensuite

- Adapter les textes de l'application (« avion » → « appareil ») et la fiche (diamètre du rotor plutôt qu'envergure).
- Ajouter d'autres hélicoptères en cochant les candidats suivants.
