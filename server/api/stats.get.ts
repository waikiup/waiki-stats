import { requireDashboardAccess } from '../utils/dashboardAuth'
import { useGetDashboardStats } from '../utils/container'

export default defineEventHandler(async (event) => {
  requireDashboardAccess(event)
  return await useGetDashboardStats().execute()
})
