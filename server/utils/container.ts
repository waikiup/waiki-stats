import { GetDashboardStats } from '../application/usecases/GetDashboardStats'
import { AppwriteSessionRepository } from '../infrastructure/appwrite/AppwriteSessionRepository'
import type { SessionRepository } from '../domain/repositories/SessionRepository'

/**
 * Composition root : c'est le seul endroit où l'infrastructure
 * est câblée sur les ports du domaine.
 */
let sessionRepository: SessionRepository | null = null

export function useSessionRepository(): SessionRepository {
  if (!sessionRepository) {
    const config = useRuntimeConfig()
    sessionRepository = new AppwriteSessionRepository({
      endpoint: config.appwriteEndpoint,
      projectId: config.appwriteProjectId,
      apiKey: config.appwriteApiKey,
      databaseId: config.appwriteDatabaseId,
      sessionsTableId: config.appwriteSessionsTableId
    })
  }
  return sessionRepository
}

export function useGetDashboardStats(): GetDashboardStats {
  return new GetDashboardStats(useSessionRepository())
}
