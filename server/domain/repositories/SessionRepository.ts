import type { Session } from '../entities/Session'

/**
 * Port de persistance des sessions (implémenté côté infrastructure).
 */
export interface SessionRepository {
  /** Retourne toutes les sessions, éventuellement à partir d'une date. */
  findAll(options?: { since?: Date }): Promise<Session[]>
}
