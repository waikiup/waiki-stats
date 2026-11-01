import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'
import { assertUidsFree, parseUids } from '../../../utils/groupInput'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string, uids?: unknown, clientId?: string | null }>(event)
  const uids = body.uids === undefined ? undefined : parseUids(body.uids)
  if (uids) await assertUidsFree(uids, id)
  return await useRepositories().tagGroups.update(id, {
    ...(body.name?.trim() ? { name: body.name.trim() } : {}),
    ...(uids ? { uids } : {}),
    ...(body.clientId !== undefined ? { clientId: body.clientId || null } : {})
  })
})
