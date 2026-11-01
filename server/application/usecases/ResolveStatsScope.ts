import type { Client } from '../../domain/entities/Client'
import type { TagGroup } from '../../domain/entities/TagGroup'
import type { StatsScope } from './GetDashboardStats'

/**
 * Traduit le périmètre demandé (« all », « public », « client:<id> », « group:<id> »)
 * en filtre de sessions, en appliquant les droits : un client ne sort jamais de ses groupes.
 */
export function resolveStatsScope(
  requested: string,
  groups: TagGroup[],
  clients: Client[],
  viewer: { role: 'admin' } | { role: 'client', client: Client }
): StatsScope {
  const forbidden = () => createError({ statusCode: 403, statusMessage: 'Périmètre non autorisé' })
  const notFound = () => createError({ statusCode: 404, statusMessage: 'Périmètre inconnu' })
  const [kind, id] = requested.split(':') as [string, string | undefined]

  const byUids = (label: string, scopeGroups: TagGroup[], breakdown: TagGroup[]): StatsScope => {
    const uids = new Set(scopeGroups.flatMap(g => g.uids))
    return {
      label,
      matches: s => s.tagUid !== null && uids.has(s.tagUid),
      breakdownGroups: breakdown,
      includeOutsideBucket: false,
      allGroups: groups
    }
  }

  if (viewer.role === 'client') {
    const own = groups.filter(g => g.clientId === viewer.client.id)
    if (kind === 'all') return byUids(viewer.client.name, own, own)
    if (kind === 'group') {
      const group = own.find(g => g.id === id)
      if (!group) throw forbidden()
      return byUids(group.name, [group], [group])
    }
    throw forbidden()
  }

  switch (kind) {
    case 'all':
      return { label: 'Tout', matches: () => true, breakdownGroups: groups, includeOutsideBucket: true, allGroups: groups }
    case 'public': {
      const known = new Set(groups.flatMap(g => g.uids))
      return {
        label: 'Hors groupes',
        matches: s => s.tagUid === null || !known.has(s.tagUid),
        breakdownGroups: [],
        includeOutsideBucket: false,
        allGroups: groups
      }
    }
    case 'client': {
      const client = clients.find(c => c.id === id)
      if (!client) throw notFound()
      const own = groups.filter(g => g.clientId === client.id)
      return byUids(client.name, own, own)
    }
    case 'group': {
      const group = groups.find(g => g.id === id)
      if (!group) throw notFound()
      return byUids(group.name, [group], [group])
    }
    default:
      throw notFound()
  }
}
