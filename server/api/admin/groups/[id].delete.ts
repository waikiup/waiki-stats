import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

/** Supprime le groupe ; les sessions de ses puces repassent dans « Hors groupes ». */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await useRepositories().tagGroups.delete(getRouterParam(event, 'id')!)
  return { ok: true }
})
