export default defineNuxtConfig({
  compatibilityDate: '2026-07-03',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // L'accès dépend d'une clé en localStorage : le SSR des pages n'a pas de valeur
  // (les routes /api restent servies par Nitro)
  routeRules: {
    '/': { ssr: false },
    '/login': { ssr: false }
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Server-only secrets (overridable via NUXT_* env vars)
    appwriteEndpoint: 'https://fra.cloud.appwrite.io/v1',
    appwriteProjectId: '',
    appwriteApiKey: '',
    appwriteDatabaseId: 'main',
    appwriteSessionsTableId: 'sessions',
    dashboardApiKey: '',
    public: {
      appName: 'Waiki Stats'
    }
  },
  app: {
    head: {
      title: 'Waiki Stats — Dashboard',
      htmlAttrs: { lang: 'fr' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Dashboard de statistiques des sessions de blocage' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap'
        }
      ]
    }
  }
})
