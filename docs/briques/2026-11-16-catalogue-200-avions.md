---
titre: Un catalogue de 200 avions, avec ses sources
date: 2026-11-16
pr: 18
auteur_github: JOHANBRI33
codee_par: Johan, avec l'assistant Claude Code
termes: Catalogue, Migration, Seed / données initiales, Script, Wikidata, Wikipédia, Wikimedia Commons, Licence, SPARQL, Palier, Alias, Identifiant court, Cache / mise en mémoire
---

## À quoi ça sert pour l'utilisateur

Le **catalogue** passe de 15 à 200 avions : avions de ligne, chasseurs, avions de collection. Chaque fiche a une photo libre de droits, un résumé en français tiré de Wikipédia, et des données techniques plus complètes : hauteur, autonomie, plafond, pays d'origine, motorisation. Sous le résumé, un lien mène à l'article Wikipédia d'origine.

## Ce qui a été construit

1. **De nouvelles colonnes dans la table des avions**, ajoutées par une **migration**. On y range les données en plus, les sources citées par Wikidata pour chaque donnée, les **alias** de l'avion (ses autres noms) et le titre de sa page Wikipédia anglaise.
2. **Un import en deux étapes**, pour que l'équipe garde la main :
   - le premier **script** demande à Wikidata, par une requête **SPARQL**, les avions les plus connus, c'est-à-dire ceux qui ont un article dans le plus de Wikipédias. Il propose une catégorie et un **identifiant court** (`boeing-777`), puis écrit une liste à relire ;
   - le second script récupère les données, les photos Commons et les résumés Wikipédia, puis produit le fichier de **données initiales** et un rapport de remplissage.
3. **Un premier palier de 200 avions.** Les 299 suivants sont déjà listés : il suffit de les cocher pour un prochain **palier**.
4. **Le crédit Wikipédia** sous chaque résumé, obligatoire car ces textes sont sous **licence** CC BY-SA.

Les 15 avions du départ gardent leur identifiant (`a320`, `rafale`…). Le fichier a été testé sur une vraie base de données : on peut le relancer sans créer de doublons.

Limite connue : Wikidata renseigne rarement la vitesse maximale (9 % des avions).

## Comment le vérifier ou le montrer en démo

1. Ouvrir `scripts/import-catalogue/apercu.md` : le tableau de remplissage et la liste des 200 avions.
2. Ouvrir la fiche d'un avion, par exemple `localhost:3000/avions/b747` : le résumé, puis le lien « Wikipédia · CC BY-SA 4.0 ».

## Ce que ça rend possible ensuite

- Reconnaître et collectionner beaucoup plus d'avions.
- Agrandir encore le catalogue en relançant les deux scripts.
- Vérifier chaque donnée grâce aux sources enregistrées.
