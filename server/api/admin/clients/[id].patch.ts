import { generateAccessCode, hashAccessCode } from '../../../utils/accessCode'
import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

/**
 * Renomme un client, ou lui donne un nouveau code ({ regenerateCode: true }) :
 * l'ancien code cesse de fonctionner immédiatement.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<{ name?: string, regenerateCode?: boolean }>(event)
  const code = body.regenerateCode ? generateAccessCode() : null
  const client = await useRepositories().clients.update(id, {
    ...(body.name?.trim() ? { name: body.name.trim() } : {}),
    ...(code ? { codeHash: hashAccessCode(code) } : {})
  })
  return { id: client.id, name: client.name, code }
})
