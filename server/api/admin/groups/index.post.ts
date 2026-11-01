import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'
import { assertUidsFree, parseUids } from '../../../utils/groupInput'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const body = await readBody<{ name?: string, uids?: unknown, clientId?: string | null }>(event)
  if (!body.name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  const uids = parseUids(body.uids)
  await assertUidsFree(uids)
  return await useRepositories().tagGroups.create({ name: body.name.trim(), uids, clientId: body.clientId || null })
})

