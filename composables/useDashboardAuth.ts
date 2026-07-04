const STORAGE_KEY = 'waiki-dashboard-key'

/**
 * Gestion de l'accès au dashboard côté client.
 * La clé est conservée indéfiniment dans localStorage.
 * Prévu pour être remplacé plus tard par une vraie authentification :
 * seuls ce composable et le middleware devront changer.
 */
export function useDashboardAuth() {
  const apiKey = useState<string | null>('dashboard-key', () => null)

  function restore(): string | null {
    if (import.meta.client && !apiKey.value) {
      apiKey.value = localStorage.getItem(STORAGE_KEY)
    }
    return apiKey.value
  }

  async function login(key: string): Promise<boolean> {
    try {
      await $fetch('/api/auth/verify', { method: 'POST', body: { key } })
      apiKey.value = key
      if (import.meta.client) localStorage.setItem(STORAGE_KEY, key)
      return true
    } catch {
      return false
    }
  }

  function logout() {
    apiKey.value = null
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
    return navigateTo('/login')
  }

  const isAuthenticated = computed(() => !!apiKey.value)

  return { apiKey, isAuthenticated, restore, login, logout }
}
