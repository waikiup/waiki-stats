import { GetDashboardStats } from '../application/usecases/GetDashboardStats'
import { AppwriteClientRepository } from '../infrastructure/appwrite/AppwriteClientRepository'
import { AppwriteSessionRepository } from '../infrastructure/appwrite/AppwriteSessionRepository'
import { AppwriteTagGroupRepository } from '../infrastructure/appwrite/AppwriteTagGroupRepository'
import { DemoClientRepository, DemoSessionRepository, DemoTagGroupRepository } from '../infrastructure/demo/DemoRepositories'
import type { ClientRepository } from '../domain/repositories/ClientRepository'
import type { SessionRepository } from '../domain/repositories/SessionRepository'
import type { TagGroupRepository } from '../domain/repositories/TagGroupRepository'

/**
 * Composition root : c'est le seul endroit où l'infrastructure
 * est câblée sur les ports du domaine.
 * Sans NUXT_APPWRITE_PROJECT_ID, tout bascule sur des données fictives (mode démo).
 */
interface Repositories {
  sessions: SessionRepository
  tagGroups: TagGroupRepository
  clients: ClientRepository
}

let repositories: Repositories | null = null

export function isDemoMode(): boolean {
  return !useRuntimeConfig().appwriteProjectId
}

export function useRepositories(): Repositories {
  if (repositories) return repositories
  if (isDemoMode()) {
    const clients = new DemoClientRepository()
    repositories = {
      sessions: new DemoSessionRepository(),
      clients,
      tagGroups: new DemoTagGroupRepository(clients.clients)
    }
    return repositories
  }
  const config = useRuntimeConfig()
  const base = {
    endpoint: config.appwriteEndpoint,
    projectId: config.appwriteProjectId,
    apiKey: config.appwriteApiKey,
    databaseId: config.appwriteDatabaseId,
    sessionsTableId: config.appwriteSessionsTableId
  }
  repositories = {
    sessions: new AppwriteSessionRepository(base),
    tagGroups: new AppwriteTagGroupRepository({ ...base, tagGroupsTableId: config.appwriteTagGroupsTableId }),
    clients: new AppwriteClientRepository({ ...base, clientsTableId: config.appwriteClientsTableId })
  }
  return repositories
}

export function useGetDashboardStats(): GetDashboardStats {
  return new GetDashboardStats(useRepositories().sessions)
}
