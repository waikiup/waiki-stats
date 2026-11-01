import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const clients = await useRepositories().clients.list()
  // Le hash du code ne sort jamais du serveur
  return clients.map(({ id, name, createdAt }) => ({ id, name, createdAt }))
})
