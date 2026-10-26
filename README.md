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

## Stack

- [Next.js](https://nextjs.org/) — App Router, JavaScript
- [Tailwind CSS](https://tailwindcss.com/) — conception mobile d'abord
- [Supabase](https://supabase.com/) — base de données, authentification, stockage
