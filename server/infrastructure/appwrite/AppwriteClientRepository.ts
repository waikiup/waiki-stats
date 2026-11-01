import { Client as AppwriteClient, ID, Query, TablesDB } from 'node-appwrite'
import type { Models } from 'node-appwrite'
import type { Client } from '../../domain/entities/Client'
import type { ClientRepository } from '../../domain/repositories/ClientRepository'
import type { AppwriteConfig } from './AppwriteSessionRepository'

type ClientRow = Models.Row & {
  name: string
  codeHash: string
}

export class AppwriteClientRepository implements ClientRepository {
  private readonly tables: TablesDB

  constructor(private readonly config: AppwriteConfig & { clientsTableId: string }) {
    this.tables = new TablesDB(
      new AppwriteClient().setEndpoint(config.endpoint).setProject(config.projectId).setKey(config.apiKey)
    )
  }

  async list(): Promise<Client[]> {
    const page = await this.tables.listRows<ClientRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.clientsTableId,
      queries: [Query.limit(1000), Query.orderAsc('name')]
    })
    return page.rows.map(toEntity)
  }

  async findByCodeHash(codeHash: string): Promise<Client | null> {
    const page = await this.tables.listRows<ClientRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.clientsTableId,
      queries: [Query.equal('codeHash', codeHash), Query.limit(1)]
    })
    return page.rows[0] ? toEntity(page.rows[0]) : null
  }

  async create(input: { name: string, codeHash: string }): Promise<Client> {
    const row = await this.tables.createRow<ClientRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.clientsTableId,
      rowId: ID.unique(),
      data: input
    })
    return toEntity(row)
  }

  async update(id: string, input: Partial<{ name: string, codeHash: string }>): Promise<Client> {
    const row = await this.tables.updateRow<ClientRow>({
      databaseId: this.config.databaseId,
      tableId: this.config.clientsTableId,
      rowId: id,
      data: input
    })
    return toEntity(row)
  }

  async delete(id: string): Promise<void> {
    await this.tables.deleteRow({
      databaseId: this.config.databaseId,
      tableId: this.config.clientsTableId,
      rowId: id
    })
  }
}

function toEntity(row: ClientRow): Client {
  return {
    id: row.$id,
    name: row.name,
    codeHash: row.codeHash,
    createdAt: row.$createdAt ? new Date(row.$createdAt) : null
  }
}
