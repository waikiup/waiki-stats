# Waiki Stats

Dashboard de statistiques des sessions de blocage d'apps (scan NFC), construit avec **Nuxt 3**, **Tailwind CSS** et **Appwrite**, selon une clean architecture.

## Architecture

```
server/
├── domain/            # Cœur métier, aucune dépendance technique
│   ├── entities/          Session
│   ├── repositories/      SessionRepository (port)
│   └── valueObjects/      DashboardStats (contrat des stats)
├── application/       # Use cases
│   └── usecases/          GetDashboardStats (tous les calculs de stats)
├── infrastructure/    # Adaptateurs techniques
│   └── appwrite/          AppwriteSessionRepository (implémente le port)
├── api/               # Interface HTTP (Nitro)
│   ├── stats.get.ts       GET /api/stats (protégé)
│   └── auth/verify.post.ts
└── utils/
    ├── container.ts       Composition root (câblage des dépendances)
    └── dashboardAuth.ts   Point unique de contrôle d'accès

components/
├── dashboard/         # Un composant par visualisation
│   ├── StatCard, HourlyActivityChart, SessionsPerDayChart,
│   ├── DurationBucketsChart, EmergencyGauge, UsersPanel
└── ui/                # AnimatedNumber

composables/           # useDashboardAuth, useDashboardStats
middleware/            # auth.global.ts (redirection /login)
pages/                 # index (dashboard), login
```

La clé API Appwrite ne quitte **jamais** le serveur : le front appelle `/api/stats`, qui interroge Appwrite côté Nitro.

## Démarrage

```bash
cp .env.example .env   # puis remplir les valeurs
npm install
npm run dev
```

Ouvrir http://localhost:3000 — la clé d'accès demandée est `NUXT_DASHBOARD_API_KEY` (fichier `.env`). Elle est mémorisée dans le localStorage du navigateur.

## Authentification

L'accès est protégé par une clé partagée (header `x-dashboard-key`, vérification timing-safe). Tout passe par `server/utils/dashboardAuth.ts` et `composables/useDashboardAuth.ts` : pour brancher plus tard une vraie authentification (sessions Appwrite, OAuth…), seuls ces deux fichiers et le middleware sont à remplacer.

## Index Appwrite recommandés

À créer sur la table `sessions` (console Appwrite → Database → sessions → Indexes) :

| Index | Attributs | Type | Pourquoi |
|---|---|---|---|
| `idx_dateStart` | `dateStart` (DESC) | key | Filtrer/ordonner par date (utilisé si on limite l'historique) |
| `idx_userId` | `userId` (ASC) | key | Futures stats par utilisateur |
| `idx_user_date` | `userId` + `dateStart` | key | Requêtes combinées (sessions d'un utilisateur sur une période) |

Aujourd'hui le dashboard charge toutes les sessions par pagination (500/page) et calcule tout en mémoire — parfait jusqu'à quelques dizaines de milliers de sessions. Au-delà, limiter `findAll({ since })` aux 90 derniers jours et l'index `idx_dateStart` deviendra indispensable.

## Déploiement sur Vercel

Nitro détecte Vercel automatiquement, aucune configuration de build n'est nécessaire.

1. Pousser le repo sur GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → importer le repo (framework **Nuxt** détecté automatiquement).
3. Dans *Settings → Environment Variables*, ajouter :
   - `NUXT_APPWRITE_ENDPOINT` = `https://fra.cloud.appwrite.io/v1`
   - `NUXT_APPWRITE_PROJECT_ID`
   - `NUXT_APPWRITE_API_KEY` *(sensible — ne jamais la préfixer `NUXT_PUBLIC_`)*
   - `NUXT_APPWRITE_DATABASE_ID` = `main`
   - `NUXT_APPWRITE_SESSIONS_TABLE_ID` = `sessions`
   - `NUXT_DASHBOARD_API_KEY` = la clé d'accès au dashboard
4. **Deploy**.

Ou en CLI : `npx vercel`, puis `npx vercel env add` pour chaque variable, et `npx vercel --prod`.
