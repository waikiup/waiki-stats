import { Client as AppwriteClient, Query, TablesDB } from 'node-appwrite'
import type { Models } from 'node-appwrite'
import { GROUPES_FIXES, nomDeGroupe } from '../../config/groupesFixes'
import type { Client } from '../../domain/entities/Client'
import { normalizeUid } from '../../domain/entities/TagGroup'
import type { TagGroup } from '../../domain/entities/TagGroup'
import type { ClientRepository } from '../../domain/repositories/ClientRepository'
import type { TagGroupRepository } from '../../domain/repositories/TagGroupRepository'
import type { AppwriteConfig } from './AppwriteSessionRepository'

type AuthorizedTagRow = Models.Row & { uid: string, name: string, active: boolean }

const PAGE_SIZE = 500

const readOnly = () => createError({
  statusCode: 405,
  statusMessage: 'Lecture seule : les groupes viennent de la table authorized_tags d\'Appwrite'
})

/**
 * Groupes de puces calculés à partir de la table existante `authorized_tags` :
 * toutes les puces qui portent le même `name` forment un groupe. Rien n'est écrit dans Appwrite.
 */
export class AuthorizedTagsGroupRepository implements TagGroupRepository {
  private readonly tables: TablesDB

  constructor(private readonly config: AppwriteConfig & { authorizedTagsTableId: string }) {
    this.tables = new TablesDB(
      new AppwriteClient().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
    )
  }

  async list(): Promise<TagGroup[]> {
    const rows: AuthorizedTagRow[] = []
    let cursor: string | null = null
    while (true) {
      const queries = [Query.limit(PAGE_SIZE), Query.orderAsc('$id')]
      if (cursor) queries.push(Query.cursorAfter(cursor))
      const page = await this.tables.listRows<AuthorizedTagRow>({
        databaseId: this.config.databaseId,
        tableId: this.config.authorizedTagsTableId,
        queries
      })
      rows.push(...page.rows)
      if (page.rows.length < PAGE_SIZE) break
      cursor = page.rows[page.rows.length - 1]!.$id
    }

    // Même nom, même groupe (les variantes de « prévente » sont rassemblées par nomDeGroupe)
    const fixes = GROUPES_FIXES.map(g => ({ ...g, uids: g.uids.map(normalizeUid) }))
    const fixedUids = new Set(fixes.flatMap(g => g.uids))
    const byName = new Map<string, TagGroup>()
    const add = (rawName: string, uid: string) => {
      const name = nomDeGroupe(rawName)
      const key = name.toLowerCase().replace(/\s+/g, ' ')
      const group = byName.get(key) ?? { id: key, name, uids: [], clientId: null }
      if (!group.uids.includes(uid)) group.uids.push(uid)
      byName.set(key, group)
    }
    for (const row of rows) {
      const uid = normalizeUid(row.uid ?? '')
      if (!row.name?.trim() || !uid || fixedUids.has(uid)) continue
      add(row.name, uid)
    }
    for (const g of fixes) for (const uid of g.uids) add(g.name, uid)
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }))
  }

  async create(): Promise<TagGroup> { throw readOnly() }
  async update(): Promise<TagGroup> { throw readOnly() }
  async delete(): Promise<void> { throw readOnly() }
}

/** Pas de table de clients dans Appwrite : personne ne se connecte avec un code client. */
export class NoClientRepository implements ClientRepository {
  async list(): Promise<Client[]> { return [] }
  async findByCodeHash(): Promise<Client | null> { return null }
  async create(): Promise<Client> { throw readOnly() }
  async update(): Promise<Client> { throw readOnly() }
  async delete(): Promise<void> { throw readOnly() }
}
