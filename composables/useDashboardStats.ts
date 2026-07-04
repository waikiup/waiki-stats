import type { DashboardStats } from '~/server/domain/valueObjects/DashboardStats'

export function useDashboardStats() {
  const { apiKey, logout } = useDashboardAuth()

  const stats = useState<DashboardStats | null>('dashboard-stats', () => null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    if (!apiKey.value) return
    pending.value = true
    error.value = null
    try {
      stats.value = await $fetch<DashboardStats>('/api/stats', {
        headers: { 'x-dashboard-key': apiKey.value }
      })
    } catch (e: unknown) {
      const status = (e as { statusCode?: number })?.statusCode
      if (status === 401) {
        await logout()
        return
      }
      error.value = 'Impossible de charger les statistiques.'
    } finally {
      pending.value = false
    }
  }

  return { stats, pending, error, refresh }
}
