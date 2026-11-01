import type { Client } from '../entities/Client'

/** Port de persistance des clients B2B. */
export interface ClientRepository {
  list(): Promise<Client[]>
  findByCodeHash(codeHash: string): Promise<Client | null>
  create(input: { name: string, codeHash: string }): Promise<Client>
  update(id: string, input: Partial<{ name: string, codeHash: string }>): Promise<Client>
  delete(id: string): Promise<void>
}
