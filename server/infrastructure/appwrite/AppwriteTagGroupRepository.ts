import { Client as AppwriteClient, ID, Query, TablesDB } from 'node-appwrite'
import type { Models } from 'node-appwrite'
import type { TagGroup } from '../../domain/entities/TagGroup'
import type { TagGroupInput, TagGroupRepository } from '../../domain/repositories/TagGroupRepository'
import type { AppwriteConfig } from './AppwriteSessionRepository'

type TagGroupRow = Models.Row & {
  name: string
  uids: string[]
  clientId: string | null
}

export class AppwriteTagGroupRepository implements TagGroupRepository {
  private readonly tables: TablesDB

  constructor(private readonly config: AppwriteConfig & { tagGroupsTableId: string }) {
    this.tables = new TablesDB(
      new AppwriteClient().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
    )
  }

  async list(): Promise<TagGroup[]> {
    const page = await this.tables.listRows<TagGroupRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.tagGroupsTableId,
      queries: [Query.limit(1000), Query.orderAsc('name')]
    })
    return page.rows.map(toEntity)
  }

  async create(input: TagGroupInput): Promise<TagGroup> {
    const row = await this.tables.createRow<TagGroupRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.tagGroupsTableId,
      rowId: ID.unique(),
      data: { name: input.name, uids: input.uids, clientId: input.clientId }
    })
    return toEntity(row)
  }

  async update(id: string, input: Partial<TagGroupInput>): Promise<TagGroup> {
    const row = await this.tables.updateRow<TagGroupRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.tagGroupsTableId,
      rowId: id,
      data: input
    })
    return toEntity(row)
  }

  async delete(id: string): Promise<void> {
    await this.tables.deleteRow({
      databaseId: this.config.databaseId,
      tableId: this.config.tagGroupsTableId,
      rowId: id
    })
  }
}

function toEntity(row: TagGroupRow): TagGroup {
  return { id: row.$id, name: row.name, uids: row.uids ?? [], clientId: row.clientId ?? null }
}
