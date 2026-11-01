import { timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Client } from '../domain/entities/Client'
import { hashAccessCode } from './accessCode'
import { isDemoMode, useRepositories } from './container'

/** Clé admin du mode démo, quand aucune clé n'est configurée */
export const DEMO_ADMIN_KEY = 'DEMO-ADMIN'

/**
 * Point unique de contrôle d'accès.
 * Une seule clé circule (header x-dashboard-key) :
 *  - la clé admin (NUXT_DASHBOARD_API_KEY) → tout voir, tout gérer ;
 *  - le code d'un client B2B → uniquement les stats de ses groupes de puces.
 */
export type Access =
  | { role: 'admin' }
  | { role: 'client', client: Client }

function isAdminKey(candidate: string): boolean {
  const expected = useRuntimeConfig().dashboardApiKey || (isDemoMode() ? DEMO_ADMIN_KEY : '')
  if (!expected) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function resolveAccess(candidate: string | undefined): Promise<Access | null> {
  if (!candidate) return null
  if (isAdminKey(candidate)) return { role: 'admin' }
  const client = await useRepositories().clients.findByCodeHash(hashAccessCode(candidate))
  return client ? { role: 'client', client } : null
}

export async function requireAccess(event: H3Event): Promise<Access> {
  const access = await resolveAccess(getHeader(event, 'x-dashboard-key'))
  if (!access) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid dashboard key' })
  }
  return access
}

export async function requireAdmin(event: H3Event): Promise<void> {
  const access = await requireAccess(event)
  if (access.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Admin only' })
  }
}
