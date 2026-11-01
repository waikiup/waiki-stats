import type { TagGroup } from '../entities/TagGroup'

export type TagGroupInput = Omit<TagGroup, 'id'>

/** Port de persistance des groupes de puces. */
export interface TagGroupRepository {
  list(): Promise<TagGroup[]>
  create(input: TagGroupInput): Promise<TagGroup>
  update(id: string, input: Partial<TagGroupInput>): Promise<TagGroup>
  delete(id: string): Promise<void>
}
