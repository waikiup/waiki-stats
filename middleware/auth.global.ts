export default defineNuxtRouteMiddleware((to) => {
  // La clé vit dans localStorage : le contrôle ne peut se faire que côté client
  if (import.meta.server) return

  const { restore } = useDashboardAuth()
  const key = restore()

  if (!key && to.path !== '/login') {
    return navigateTo('/login')
  }
  if (key && to.path === '/login') {
    return navigateTo('/')
  }
})
