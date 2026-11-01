import { randomUUID } from 'node:crypto'
import type { Client } from '../../domain/entities/Client'
import type { Session } from '../../domain/entities/Session'
import { normalizeUid, type TagGroup } from '../../domain/entities/TagGroup'
import type { ClientRepository } from '../../domain/repositories/ClientRepository'
import type { SessionRepository } from '../../domain/repositories/SessionRepository'
import type { TagGroupInput, TagGroupRepository } from '../../domain/repositories/TagGroupRepository'
import { hashAccessCode } from '../../utils/accessCode'
import { DEMO_CLIENT_CODES, SEED_GROUPS } from './seed'

/**
 * Mode démo : actif quand NUXT_APPWRITE_PROJECT_ID est vide.
 * Données fictives en mémoire (perdues au redémarrage), pour développer l'interface sans toucher à Appwrite.
 */

// Générateur pseudo-aléatoire à graine fixe : la démo affiche les mêmes chiffres à chaque lancement
function seeded(seed: number) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const DAY = 24 * 60 * 60 * 1000

/** Poids d'activation par heure (0-23), heure de Paris approximée */
const HOUR_WEIGHTS = [1, 0.5, 0.2, 0.1, 0.1, 0.2, 0.6, 1.5, 3, 5, 6, 5, 3, 4, 7, 8, 8, 7, 5, 4, 5, 6, 5, 3]

function pickHour(rand: () => number): number {
  const total = HOUR_WEIGHTS.reduce((a, b) => a + b, 0)
  let x = rand() * total
  for (let h = 0; h < 24; h++) {
    x -= HOUR_WEIGHTS[h]!
    if (x <= 0) return h
  }
  return 23
}

function buildSessions(): Session[] {
  const rand = seeded(42)
  const now = Date.now()
  const allUids = Object.values(SEED_GROUPS).flatMap(g => g.uids.map(normalizeUid))
  const unknownUids = ['04A1B2C3D4E5F6', '04112233445566']
  const users = Array.from({ length: 420 }, (_, i) => `demo-user-${i}`)
  const sessions: Session[] = []

  for (let i = 0; i < 5200; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.6) * 200)
    const weekday = new Date(now - daysAgo * DAY).getDay()
    if ((weekday === 0 || weekday === 6) && rand() < 0.4) continue
    // Les puces B2B n'existent que depuis 30 jours (déploiement des BU)
    const tagged = daysAgo < 30 && rand() < 0.45
    const user = tagged ? users[200 + Math.floor(rand() * 220)]! : users[Math.floor(rand() * 260)]!
    let tagUid: string | null = null
    if (tagged) tagUid = rand() < 0.03 ? unknownUids[Math.floor(rand() * 2)]! : allUids[Math.floor(Math.pow(rand(), 1.3) * allUids.length)]!

    const day = new Date(now - daysAgo * DAY)
    day.setHours(pickHour(rand), Math.floor(rand() * 60), 0, 0)
    const start = day.getTime()
    if (start > now) continue
    const durationSeconds = Math.round((tagged ? 1800 + rand() * 9000 : 300 + Math.pow(rand(), 1.8) * 16000))
    const wasEmergency = rand() < 0.045
    sessions.push({
      id: randomUUID(),
      userId: user,
      wasEmergency,
      startTime: start,
      endTime: start + durationSeconds * 1000,
      durationSeconds,
      dateStart: new Date(start),
      createdAt: new Date(start),
      tagUid
    })
  }
  return sessions
}

export class DemoSessionRepository implements SessionRepository {
  private readonly sessions = buildSessions()

  async findAll(options?: { since?: Date }): Promise<Session[]> {
    const since = options?.since?.getTime() ?? 0
    return this.sessions.filter(s => s.startTime >= since)
  }
}

export class DemoClientRepository implements ClientRepository {
  readonly clients: Client[] = Object.entries(DEMO_CLIENT_CODES).map(([name, code], i) => ({
    id: `demo-client-${i}`,
    name,
    codeHash: hashAccessCode(code),
    createdAt: new Date()
  }))

  async list() { return [...this.clients] }
  async findByCodeHash(codeHash: string) { return this.clients.find(c => c.codeHash === codeHash) ?? null }
  async create(input: { name: string, codeHash: string }) {
    const client = { id: randomUUID(), createdAt: new Date(), ...input }
    this.clients.push(client)
    return client
  }

  async update(id: string, input: Partial<{ name: string, codeHash: string }>) {
    const client = this.clients.find(c => c.id === id)
    if (!client) throw createError({ statusCode: 404, statusMessage: 'Client introuvable' })
    Object.assign(client, input)
    return client
  }

  async delete(id: string) {
    const i = this.clients.findIndex(c => c.id === id)
    if (i >= 0) this.clients.splice(i, 1)
  }
}

export class DemoTagGroupRepository implements TagGroupRepository {
  private readonly groups: TagGroup[]

  constructor(clients: Client[]) {
    this.groups = Object.entries(SEED_GROUPS).map(([name, g], i) => ({
      id: `demo-group-${i}`,
      name,
      uids: g.uids.map(normalizeUid),
      clientId: clients.find(c => c.name === g.client)?.id ?? null
    }))
  }

  async list() { return [...this.groups].sort((a, b) => a.name.localeCompare(b.name)) }
  async create(input: TagGroupInput) {
    const group = { id: randomUUID(), ...input }
    this.groups.push(group)
    return group
  }

  async update(id: string, input: Partial<TagGroupInput>) {
    const group = this.groups.find(g => g.id === id)
    if (!group) throw createError({ statusCode: 404, statusMessage: 'Groupe introuvable' })
    Object.assign(group, input)
    return group
  }

  async delete(id: string) {
    const i = this.groups.findIndex(g => g.id === id)
    if (i >= 0) this.groups.splice(i, 1)
  }
}
