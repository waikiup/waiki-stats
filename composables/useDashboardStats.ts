import type { ScopedDashboardStats } from '~/server/domain/valueObjects/DashboardStats'

export interface MeResponse {
  role: 'admin' | 'client'
  name: string
  demo: boolean
  scopes: Array<{ id: string, label: string }>
}

export function useDashboardStats() {
  const { apiKey, authFetch } = useDashboardAuth()

  const stats = useState<ScopedDashboardStats | null>('dashboard-stats', () => null)
  const me = useState<MeResponse | null>('dashboard-me', () => null)
  const scope = useState<string>('dashboard-scope', () => 'all')
  /** '7' | '30' | '90' | '365' | 'all' */
  const days = useState<string>('dashboard-days', () => '30')
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    if (!apiKey.value) return
    pending.value = true
    error.value = null
    try {
      const [meRes, statsRes] = await Promise.all([
        authFetch<MeResponse>('/api/me'),
        authFetch<ScopedDashboardStats>('/api/stats', { query: { scope: scope.value, days: days.value } })
      ])
      me.value = meRes
      stats.value = statsRes
    } catch (e: unknown) {
      if ((e as { statusCode?: number })?.statusCode === 401) return
      error.value = 'Impossible de charger les statistiques.'
    } finally {
      pending.value = false
    }
  }

  watch([scope, days], refresh)

  return { stats, me, scope, days, pending, error, refresh }
}
