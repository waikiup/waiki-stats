# Waiki Stats

Dashboard de statistiques des sessions de blocage d'apps (scan NFC), construit avec **Nuxt 3**, **Tailwind CSS** et **Appwrite**, selon une clean architecture.

## Architecture

```
server/
├── domain/            # Cœur métier, aucune dépendance technique
│   ├── entities/          Session, TagGroup, Client
│   ├── repositories/      ports Session / TagGroup / Client
│   └── valueObjects/      DashboardStats (contrat des stats)
├── application/       # Use cases
│   └── usecases/          GetDashboardStats (calculs), ResolveStatsScope (droits)
├── infrastructure/    # Adaptateurs techniques
│   ├── appwrite/          implémentations Appwrite des ports
│   └── demo/              données fictives (mode démo)
├── api/               # Interface HTTP (Nitro)
│   ├── stats.get.ts       GET /api/stats?scope=&days= (admin ou client)
│   ├── me.get.ts          qui est connecté + périmètres possibles
│   ├── admin/             clients et groupes de puces (admin seul)
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

## v2 : admin + espaces clients B2B

- **Admin** (clé `NUXT_DASHBOARD_API_KEY`) : toutes les stats, filtre par périmètre (tout, hors groupes, un client, un groupe) et par période (7 j, 30 j, 90 j, 1 an, tout). Page `/admin` : en mode démo, créer des clients, des groupes et des codes ; avec Appwrite, simple liste des groupes lus dans `authorized_tags`.
- **Client B2B** (code `WK-XXXX-XXXX-XXXX` donné par l'admin, même écran de connexion) : uniquement les stats des groupes qui lui sont rattachés, jamais une personne en particulier. Sous 5 personnes différentes sur la période, rien ne s'affiche.
- Une puce appartient à un seul groupe ; un groupe à un seul client (ou aucun).
- Le code client n'est montré qu'une fois ; Appwrite n'en garde que l'empreinte SHA-256. Perdu → « nouveau code ».

### Ce que l'app doit envoyer

Chaque session porte une colonne `tagUid` : l'UID de la puce scannée **au démarrage** de la session, en hexadécimal, par exemple `046C6D32502390` (les `:` sont tolérés, la casse aussi). Sans elle, la session compte dans « Hors groupes ». Détail pour les devs iOS/Android : `DEV-TAGUID.md`.

### Appwrite : lecture seule, rien à créer

Avec Appwrite, l'app ne fait que lire. Les groupes viennent de la table existante `authorized_tags` : toutes les puces qui portent le même `name` forment un groupe (« BU Nantes 2 », etc.). Les sessions sont rattachées par leur colonne `tagUid`, déjà présente. La clé API n'a besoin que de `rows.read`. Les clients B2B et leurs codes n'existent qu'en mode démo, faute de table pour les stocker.

### Mode démo

Sans `NUXT_APPWRITE_PROJECT_ID`, l'app tourne sur des données fictives en mémoire : clé admin `DEMO-ADMIN`, codes clients `DEMO-NANTES` et `DEMO-RENNES`.

## Démarrage

```bash
cp .env.example .env   # puis remplir les valeurs
npm install
npm run dev
```

Ouvrir http://localhost:3000 — la clé d'accès demandée est `NUXT_DASHBOARD_API_KEY` (fichier `.env`). Elle est mémorisée dans le localStorage du navigateur.

## Authentification

L'accès passe par une seule clé (header `x-dashboard-key`) : la clé admin (vérification timing-safe) ou le code d'un client (comparé par empreinte). Tout passe par `server/utils/dashboardAuth.ts` et `composables/useDashboardAuth.ts` : pour brancher plus tard une vraie authentification (sessions Appwrite, OAuth…), seuls ces deux fichiers et le middleware sont à remplacer.

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
   - `NUXT_APPWRITE_AUTHORIZED_TAGS_TABLE_ID` = `authorized_tags` (valeur par défaut, facultatif)
   - `NUXT_DASHBOARD_API_KEY` = la clé d'accès admin
4. **Deploy**.

Ou en CLI : `npx vercel`, puis `npx vercel env add` pour chaque variable, et `npx vercel --prod`.
