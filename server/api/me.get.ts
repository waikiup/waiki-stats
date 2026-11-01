import { requireAccess } from '../utils/dashboardAuth'
import { isDemoMode, useRepositories } from '../utils/container'

/**
 * Qui est connecté, et les périmètres qu'il peut choisir.
 */
export default defineEventHandler(async (event) => {
  const access = await requireAccess(event)
  const { tagGroups, clients } = useRepositories()
  const groups = await tagGroups.list()

  if (access.role === 'client') {
    return {
      role: 'client' as const,
      name: access.client.name,
      demo: isDemoMode(),
      scopes: [
        { id: 'all', label: 'Tous mes postes' },
        ...groups.filter(g => g.clientId === access.client.id).map(g => ({ id: `group:${g.id}`, label: g.name }))
      ]
    }
  }

  const clientList = await clients.list()
  return {
    role: 'admin' as const,
    name: 'Admin',
    demo: isDemoMode(),
    scopes: [
      { id: 'all', label: 'Tout' },
      { id: 'public', label: 'Hors groupes' },
      ...clientList.map(c => ({ id: `client:${c.id}`, label: c.name })),
      ...groups.map(g => ({ id: `group:${g.id}`, label: g.name }))
    ]
  }
})
