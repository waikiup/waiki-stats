import { generateAccessCode, hashAccessCode } from '../../../utils/accessCode'
import { requireAdmin } from '../../../utils/dashboardAuth'
import { useRepositories } from '../../../utils/container'

/** Crée un client ; son code d'accès n'est renvoyé qu'ici, une seule fois. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const { name } = await readBody<{ name?: string }>(event)
  if (!name?.trim()) throw createError({ statusCode: 400, statusMessage: 'Nom requis' })
  const code = generateAccessCode()
  const client = await useRepositories().clients.create({ name: name.trim(), codeHash: hashAccessCode(code) })
  return { id: client.id, name: client.name, code }
})
