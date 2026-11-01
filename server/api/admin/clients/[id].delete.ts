import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

/** Supprime un client ; ses groupes restent, détachés (les sessions ne sont jamais touchées). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const { clients, tagGroups } = useRepositories()
  const groups = await tagGroups.list()
  await Promise.all(groups.filter(g => g.clientId === id).map(g => tagGroups.update(g.id, { clientId: null })))
  await clients.delete(id)
  return { ok: true }
})
