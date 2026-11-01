const STORAGE_KEY = 'waiki-dashboard-key'
const ROLE_KEY = 'waiki-dashboard-role'

export type DashboardRole = 'admin' | 'client'

/**
 * Gestion de l'accès au dashboard côté client.
 * La clé (clé admin ou code client) est conservée dans localStorage ;
 * le rôle n'y sert qu'à l'affichage : le serveur revérifie tout à chaque appel.
 */
export function useDashboardAuth() {
  const apiKey = useState<string | null>('dashboard-key', () => null)
  const role = useState<DashboardRole | null>('dashboard-role', () => null)

  function restore(): string | null {
    if (import.meta.client && !apiKey.value) {
      apiKey.value = localStorage.getItem(STORAGE_KEY)
      role.value = localStorage.getItem(ROLE_KEY) as DashboardRole | null
    }
    return apiKey.value
  }

  async function login(key: string): Promise<boolean> {
    try {
      const res = await $fetch<{ role: DashboardRole }>('/api/auth/verify', { method: 'POST', body: { key } })
      apiKey.value = key
      role.value = res.role
      if (import.meta.client) {
        localStorage.setItem(STORAGE_KEY, key)
        localStorage.setItem(ROLE_KEY, res.role)
      }
      return true
    } catch {
      return false
    }
  }

  function logout() {
    apiKey.value = null
    role.value = null
    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(ROLE_KEY)
    }
    return navigateTo('/login')
  }

  /** $fetch authentifié ; une clé refusée renvoie à l'écran de connexion */
  async function authFetch<T>(url: string, opts: Parameters<typeof $fetch>[1] = {}): Promise<T> {
    try {
      return await $fetch(url, { ...opts, headers: { ...(opts.headers as object), 'x-dashboard-key': apiKey.value ?? '' } } as never) as T
    } catch (e: unknown) {
      if ((e as { statusCode?: number })?.statusCode === 401) await logout()
      throw e
    }
  }

  const isAuthenticated = computed(() => !!apiKey.value)
  const isAdmin = computed(() => role.value === 'admin')

  return { apiKey, role, isAuthenticated, isAdmin, restore, login, logout, authFetch }
}
