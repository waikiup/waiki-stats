import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return await useRepositories().tagGroups.list()
})
