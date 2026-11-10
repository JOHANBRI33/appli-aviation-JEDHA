---
titre: Le catalogue des avions et la fiche avion
date: 2026-11-06
pr: 3
auteur_github: JOHANBRI33
termes: Catalogue, Base de données, Supabase, Table, Migration, RLS (sécurité par ligne), Script, Wikidata, Wikimedia Commons, Licence, Seed / données initiales, Fiche avion, Rareté, Composant, Labo
---

## À quoi ça sert pour l'utilisateur

Après la reconnaissance, l'utilisateur ne voit plus seulement un nom : une vraie fiche s'affiche, avec la photo de l'avion (et son crédit), le constructeur, les dimensions, la date du premier vol, le nombre d'exemplaires construits et la rareté en étoiles. Si l'IA hésite, il peut toucher l'une des 3 suggestions pour voir la fiche correspondante.

## Ce qui a été construit

Johan a avancé en 4 étapes :

1. **Le rangement des avions.** Une **table** `aircraft` dans la **base de données** **Supabase**, créée par une **migration**. Ses règles de sécurité (**RLS**) autorisent tout le monde à lire les avions visibles, mais personne ne peut les modifier depuis l'application.
2. **Le remplissage automatique.** Un **script** va chercher dans **Wikidata** les caractéristiques des 15 avions du catalogue, et dans **Wikimedia Commons** une photo libre avec son auteur et sa **licence**. Il produit un aperçu à relire et le fichier de **données initiales** qui remplit la table. Limite connue : la vitesse maximale manque dans Wikidata pour 14 avions sur 15.
3. **Le lien avec la reconnaissance.** La reconnaissance lit désormais la liste des avions dans Supabase. Si Supabase ne répond pas, elle utilise une liste de secours enregistrée dans le projet, pour ne jamais tomber en panne.
4. **La fiche à l'écran.** Un **composant** « fiche avion » s'affiche dans le **labo** sous le résultat, et les 3 suggestions deviennent des boutons cliquables.

Cette pull request a été relue et fusionnée par Alexandra.

## Comment le vérifier ou le montrer en démo

1. Lancer l'application (`npm run dev`) et ouvrir `localhost:3000/labo`.
2. Déposer une photo d'avion : la fiche s'affiche sous le résultat, avec la photo, son auteur et sa licence.
3. Toucher une des suggestions : la fiche change.

## Ce que ça rend possible ensuite

- L'écran « fiche avion » de l'application finale.
- Le calcul des points, qui s'appuie sur la rareté de chaque avion.
- La vérification des fiches, des sources et des crédits photos par la Product Owner.
- L'agrandissement du catalogue au-delà de 15 avions, en relançant le même script.
