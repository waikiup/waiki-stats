import { Client, Query, TablesDB } from 'node-appwrite'
import type { Models } from 'node-appwrite'
import type { Session } from '../../domain/entities/Session'
import { normalizeUid } from '../../domain/entities/TagGroup'
import type { SessionRepository } from '../../domain/repositories/SessionRepository'

export interface AppwriteConfig {
  endpoint: string
  projectId: string
  apiKey: string
  databaseId: string
  sessionsTableId: string
}

type SessionRow = Models.Row & {
  userId: string
  wasEmergency: boolean
  startTime: number
  endTime: number
  durationSeconds: number
  dateStart: string
  /** Colonne ajoutée pour la v2 : absente des sessions envoyées par les anciennes versions de l'app */
  tagUid?: string | null
}

const PAGE_SIZE = 500

/** Les timestamps peuvent être stockés en secondes ou millisecondes ; on normalise en ms. */
function toEpochMs(value: number): number {
  return value > 0 && value < 1e12 ? value * 1000 : value
}

export class AppwriteSessionRepository implements SessionRepository {
  private readonly tables: TablesDB

  constructor(private readonly config: AppwriteConfig) {
    const client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId)
      .setKey(config.apiKey)
    this.tables = new TablesDB(client)
  }

  async findAll(options?: { since?: Date }): Promise<Session[]> {
    const sessions: Session[] = []
    let cursor: string | null = null

    // Pagination par curseur ; le filtre `since` bénéficie d'un index sur dateStart
    while (true) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderAsc('$id')]
      if (options?.since) {
        queries.push(Query.greaterThanEqual('dateStart', options.since.toISOString()))
      }
      if (cursor) {
        queries.push(Query.cursorAfter(cursor))
      }

      const page = await this.tables.listRows<SessionRow>({
        databaseId: this.config.databaseId,
        tableId: this.config.sessionsTableId,
        queries
      })

      sessions.push(...page.rows.map(row => this.toEntity(row)))

      if (page.rows.length < PAGE_SIZE) break
      cursor = page.rows[page.rows.length - 1]!.$id
    }

    return sessions
  }

  private toEntity(row: SessionRow): Session {
    return {
      id: row.$id,
      userId: row.userId,
      wasEmergency: row.wasEmergency,
      startTime: toEpochMs(row.startTime),
      endTime: toEpochMs(row.endTime),
      durationSeconds: row.durationSeconds,
      dateStart: new Date(row.dateStart),
      createdAt: row.$createdAt ? new Date(row.$createdAt) : null,
      tagUid: row.tagUid ? normalizeUid(row.tagUid) || null : null
    }
  }
}
