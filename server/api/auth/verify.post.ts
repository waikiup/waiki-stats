import { resolveAccess } from '../../utils/dashboardAuth'

/**
 * Vérifie une clé saisie sur l'écran de connexion : clé admin ou code client.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)
  const access = await resolveAccess(body?.key?.trim())
  if (!access) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid dashboard key' })
  }
  return { valid: true, role: access.role }
})
