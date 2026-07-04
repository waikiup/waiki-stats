import { isValidDashboardKey } from '../../utils/dashboardAuth'

/**
 * Vérifie une clé d'accès saisie sur l'écran de connexion.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ key?: string }>(event)
  if (!isValidDashboardKey(body?.key)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid dashboard key' })
  }
  return { valid: true }
})
