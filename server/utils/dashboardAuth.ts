import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * Point unique de contrôle d'accès au dashboard.
 * Aujourd'hui : clé statique partagée (header x-dashboard-key).
 * Demain : remplacer l'implémentation par une vraie authentification
 * (session Appwrite, JWT, …) sans toucher aux routes.
 */
export function isValidDashboardKey(candidate: string | undefined): boolean {
  const expected = useRuntimeConfig().dashboardApiKey
  if (!expected || !candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function requireDashboardAccess(event: H3Event): void {
  const key = getHeader(event, 'x-dashboard-key')
  if (!isValidDashboardKey(key)) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid dashboard key' })
  }
}
