import { normalizeUid } from '../domain/entities/TagGroup'
import { useRepositories } from './container'

/** UID NFC valides : 4, 7 ou 10 octets */
const VALID_LENGTHS = new Set([8, 14, 20])

export function parseUids(raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw.map(String) : String(raw ?? '').split(/[\n,;]+/)
  const uids = [...new Set(list.map(normalizeUid).filter(Boolean))]
  const invalid = uids.filter(u => !VALID_LENGTHS.has(u.length))
  if (invalid.length) {
    throw createError({ statusCode: 400, statusMessage: `UID invalide : ${invalid.join(', ')}` })
  }
  return uids
}

/** Une puce ne peut appartenir qu'à un groupe, sinon ses sessions compteraient deux fois */
export async function assertUidsFree(uids: string[], exceptGroupId?: string) {
  const groups = await useRepositories().tagGroups.list()
  const taken = groups
    .filter(g => g.id !== exceptGroupId)
    .flatMap(g => g.uids.filter(u => uids.includes(u)).map(u => `${u} (${g.name})`))
  if (taken.length) {
    throw createError({ statusCode: 409, statusMessage: `Puce déjà dans un groupe : ${taken.join(', ')}` })
  }
}
