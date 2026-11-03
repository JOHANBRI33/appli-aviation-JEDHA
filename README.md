    # Appli aviation

Application web mobile (PWA) pour passionnés d'aviation.
Photographiez un avion, identifiez-le et constituez votre hangar virtuel.

Projet de formation Jedha — 3 personnes, MVP en 6 semaines.

## Prérequis

- [Node.js](https://nodejs.org/) v18.17 ou supérieur
- npm (inclus avec Node.js)
- Un compte [Supabase](https://supabase.com/) (gratuit)

## Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/JOHANBRI33/appli-aviation-JEDHA.git
cd appli-aviation-JEDHA

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Ouvrez .env.local et remplissez vos clés Supabase
```

## Lancement en local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Autres commandes

```bash
npm run build   # Vérifie que le projet compile (à faire avant chaque pull request)
npm run lint    # Vérifie le style du code
```

## Tester depuis un téléphone (même Wi-Fi)

Pour essayer la reconnaissance photo directement depuis l'appareil photo de ton téléphone :

```bash
# Lance le serveur en l'exposant sur le réseau local
npm run dev -- -H 0.0.0.0
```

Puis cherche l'adresse IP locale de ton ordinateur :

- **macOS / Linux** : `ip route get 1 | awk '{print $7}'` ou regarder dans les Réglages Wi-Fi
- **Windows** : `ipconfig` → chercher « Adresse IPv4 » (ex. `192.168.1.42`)

Ouvre ensuite sur ton téléphone (connecté au même Wi-Fi) :

```
http://192.168.1.42:3000/labo
```

> La page `/labo` n'est accessible qu'en développement (`NODE_ENV !== 'production'`).

## Stack

- [Next.js](https://nextjs.org/) — App Router, JavaScript
- [Tailwind CSS](https://tailwindcss.com/) — conception mobile d'abord
- [Supabase](https://supabase.com/) — base de données, authentification, stockage
