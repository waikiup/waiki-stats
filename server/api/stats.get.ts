import { resolveStatsScope } from '../application/usecases/ResolveStatsScope'
import { requireAccess } from '../utils/dashboardAuth'
import { useGetDashboardStats, useRepositories } from '../utils/container'

const ALLOWED_DAYS = [7, 30, 90, 365]

/**
 * GET /api/stats?scope=all|public|client:<id>|group:<id>&days=7|30|90|365|all
 */
export default defineEventHandler(async (event) => {
  const access = await requireAccess(event)
  const query = getQuery(event)
  const { tagGroups, clients } = useRepositories()

  const [groups, clientList] = await Promise.all([
    tagGroups.list(),
    access.role === 'admin' ? clients.list() : Promise.resolve([])
  ])
  const scope = resolveStatsScope(String(query.scope ?? 'all'), groups, clientList, access)
  const requestedDays = Number(query.days)
  const days = ALLOWED_DAYS.includes(requestedDays) ? requestedDays : query.days === 'all' ? null : 30

  return await useGetDashboardStats().execute({ scope, days, audience: access.role })
})
