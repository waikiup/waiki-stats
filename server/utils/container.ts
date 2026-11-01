import { GetDashboardStats } from '../application/usecases/GetDashboardStats'
import { AuthorizedTagsGroupRepository, NoClientRepository } from '../infrastructure/appwrite/AppwriteAuthorizedTagsRepository'
import { AppwriteSessionRepository } from '../infrastructure/appwrite/AppwriteSessionRepository'
import { DemoClientRepository, DemoSessionRepository, DemoTagGroupRepository } from '../infrastructure/demo/DemoRepositories'
import type { ClientRepository } from '../domain/repositories/ClientRepository'
import type { SessionRepository } from '../domain/repositories/SessionRepository'
import type { TagGroupRepository } from '../domain/repositories/TagGroupRepository'

/**
 * Composition root : c'est le seul endroit où l'infrastructure
 * est câblée sur les ports du domaine.
 * Sans NUXT_APPWRITE_PROJECT_ID, tout bascule sur des données fictives (mode démo).
 * Avec Appwrite, l'app ne fait que lire : les groupes viennent de `authorized_tags` (même nom = même groupe).
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
    tagGroups: new AuthorizedTagsGroupRepository({ ...base, authorizedTagsTableId: config.appwriteAuthorizedTagsTableId }),
    clients: new NoClientRepository()
  }
  return repositories
}

export function useGetDashboardStats(): GetDashboardStats {
  return new GetDashboardStats(useRepositories().sessions)
}
