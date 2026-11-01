import type { Session } from '../../domain/entities/Session'
import type { SessionRepository } from '../../domain/repositories/SessionRepository'
import type { TagGroup } from '../../domain/entities/TagGroup'
import type {
  AdminExtras,
  DailySessionsPoint,
  GroupBreakdownItem,
  LoyaltyBucket,
  ScopedDashboardStats,
  DurationBucket,
  HourlyActivityPoint,
  MonthlySessionsPoint
} from '../../domain/valueObjects/DashboardStats'

const TIMEZONE = 'Europe/Paris'
const MAX_DAYS_FOR_DAILY_CHART = 90
const DAY_MS = 24 * 60 * 60 * 1000
/** Seuil de confidentialité côté client : en dessous, aucun chiffre ne sort */
export const MIN_USERS_FOR_CLIENT = 5

/** Périmètre déjà résolu et autorisé (cf. ResolveStatsScope) */
export interface StatsScope {
  label: string
  matches: (session: Session) => boolean
  /** Groupes à comparer dans la répartition */
  breakdownGroups: TagGroup[]
  /** Ajoute une part « Hors groupes » à la répartition */
  includeOutsideBucket: boolean
  /** Tous les groupes déclarés (pour repérer les puces inconnues) */
  allGroups: TagGroup[]
}

export interface GetDashboardStatsParams {
  scope: StatsScope
  /** null = depuis le début */
  days: number | null
  audience: 'admin' | 'client'
}

const weekdayFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: TIMEZONE, weekday: 'short' })
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** 0 = lundi … 6 = dimanche, dans le fuseau du dashboard */
function weekdayOf(epochMs: number): number {
  return WEEKDAYS.indexOf(weekdayFormatter.format(new Date(epochMs)))
}

const hourFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIMEZONE,
  hour: '2-digit',
  hourCycle: 'h23'
})

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

function hourOf(epochMs: number): number {
  const hour = hourFormatter.formatToParts(new Date(epochMs))
    .find(part => part.type === 'hour')?.value ?? '0'
  return Number(hour) % 24
}

function dayOf(epochMs: number): string {
  return dayFormatter.format(new Date(epochMs))
}

/** Mois au format YYYY-MM dans le fuseau du dashboard */
function monthOf(epochMs: number): string {
  return dayOf(epochMs).slice(0, 7)
}

const DURATION_BUCKETS: Array<{ label: string, maxSeconds: number }> = [
  { label: '< 15 min', maxSeconds: 15 * 60 },
  { label: '15 min – 1 h', maxSeconds: 60 * 60 },
  { label: '1 h – 2 h', maxSeconds: 2 * 60 * 60 },
  { label: '2 h – 3 h', maxSeconds: 3 * 60 * 60 },
  { label: '3 h – 4 h', maxSeconds: 4 * 60 * 60 },
  { label: '> 4 h', maxSeconds: Number.POSITIVE_INFINITY }
]

export class GetDashboardStats {
  constructor(private readonly sessions: SessionRepository) {}

  async execute({ scope, days, audience }: GetDashboardStatsParams): Promise<ScopedDashboardStats> {
    const now = Date.now()
    const scoped = (await this.sessions.findAll()).filter(scope.matches)
    const periodStart = days === null ? 0 : now - days * DAY_MS
    let period = scoped.filter(s => s.startTime >= periodStart)

    const insufficientData = audience === 'client'
      && new Set(period.map(s => s.userId)).size < MIN_USERS_FOR_CLIENT
    // Sous le seuil, le client ne reçoit que des zéros : aucune donnée ne peut désigner quelqu'un
    const history = insufficientData ? [] : scoped
    if (insufficientData) period = []

    return {
      overview: this.buildOverview(period, history, now),
      hourlyActivity: this.buildHourlyActivity(period),
      sessionsPerDay: this.buildSessionsPerDay(period, now, Math.min(days ?? MAX_DAYS_FOR_DAILY_CHART, MAX_DAYS_FOR_DAILY_CHART)),
      sessionsPerMonth: this.buildSessionsPerMonth(history, now),
      durationBuckets: this.buildDurationBuckets(period),
      emergency: this.buildEmergency(period),
      users: this.buildUsers(period, history, now),
      weekday: this.buildWeekday(period),
      heatmap: this.buildHeatmap(period),
      byGroup: this.buildByGroup(period, scope, audience),
      loyalty: this.buildLoyalty(period),
      admin: audience === 'admin' ? this.buildAdminExtras(period, scope) : null,
      scope: { label: scope.label, days, insufficientData, minUsers: MIN_USERS_FOR_CLIENT },
      generatedAt: new Date(now).toISOString()
    }
  }

  private buildWeekday(sessions: Session[]): number[] {
    const counts = Array.from({ length: 7 }, () => 0)
    for (const s of sessions) counts[weekdayOf(s.startTime)]!++
    return counts
  }

  private buildHeatmap(sessions: Session[]): number[][] {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
    for (const s of sessions) grid[weekdayOf(s.startTime)]![hourOf(s.startTime)]!++
    return grid
  }

  private buildByGroup(sessions: Session[], scope: StatsScope, audience: 'admin' | 'client'): GroupBreakdownItem[] {
    const uidToGroup = new Map<string, string>()
    for (const g of scope.breakdownGroups) for (const uid of g.uids) uidToGroup.set(uid, g.id)

    const acc = new Map<string | null, { sessions: number, seconds: number, users: Set<string> }>()
    const bucket = (key: string | null) => {
      if (!acc.has(key)) acc.set(key, { sessions: 0, seconds: 0, users: new Set() })
      return acc.get(key)!
    }
    for (const s of sessions) {
      const groupId = (s.tagUid && uidToGroup.get(s.tagUid)) ?? null
      if (groupId === null && !scope.includeOutsideBucket) continue
      const b = bucket(groupId)
      b.sessions++
      b.seconds += s.durationSeconds
      b.users.add(s.userId)
    }

    const items: GroupBreakdownItem[] = scope.breakdownGroups.map((g) => {
      const b = acc.get(g.id)
      const users = b?.users.size ?? 0
      const masked = audience === 'client' && users > 0 && users < MIN_USERS_FOR_CLIENT
      return {
        groupId: g.id,
        name: g.name,
        sessions: masked ? 0 : b?.sessions ?? 0,
        blockedSeconds: masked ? 0 : b?.seconds ?? 0,
        users: masked ? 0 : users,
        masked
      }
    })
    if (scope.includeOutsideBucket) {
      const b = acc.get(null)
      items.push({
        groupId: null,
        name: 'Hors groupes',
        sessions: b?.sessions ?? 0,
        blockedSeconds: b?.seconds ?? 0,
        users: b?.users.size ?? 0,
        masked: false
      })
    }
    return items.sort((a, b) => b.blockedSeconds - a.blockedSeconds)
  }

  private buildLoyalty(sessions: Session[]): LoyaltyBucket[] {
    const perUser = new Map<string, number>()
    for (const s of sessions) perUser.set(s.userId, (perUser.get(s.userId) ?? 0) + 1)
    const buckets: LoyaltyBucket[] = [
      { label: '1 session', users: 0 },
      { label: '2 à 5 sessions', users: 0 },
      { label: '6 sessions et +', users: 0 }
    ]
    for (const n of perUser.values()) buckets[n === 1 ? 0 : n <= 5 ? 1 : 2]!.users++
    return buckets
  }

  private buildAdminExtras(sessions: Session[], scope: StatsScope): AdminExtras {
    const known = new Set(scope.allGroups.flatMap(g => g.uids))
    const unknown = new Map<string, number>()
    const seen = new Set<string>()
    let taggedSessions = 0
    for (const s of sessions) {
      if (!s.tagUid) continue
      taggedSessions++
      seen.add(s.tagUid)
      if (!known.has(s.tagUid)) unknown.set(s.tagUid, (unknown.get(s.tagUid) ?? 0) + 1)
    }
    return {
      taggedSessions,
      unknownTags: [...unknown.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([uid, n]) => ({ uid, sessions: n })),
      silentGroups: scope.breakdownGroups
        .filter(g => !g.uids.some(uid => seen.has(uid)))
        .map(g => g.name)
    }
  }

  private buildHourlyActivity(sessions: Session[]): HourlyActivityPoint[] {
    const points: HourlyActivityPoint[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      activations: 0,
      deactivations: 0
    }))
    for (const s of sessions) {
      points[hourOf(s.startTime)]!.activations++
      if (s.endTime > 0) points[hourOf(s.endTime)]!.deactivations++
    }
    return points
  }

  private buildSessionsPerDay(sessions: Session[], now: number, length: number): DailySessionsPoint[] {
    const counts = new Map<string, number>()
    for (const s of sessions) {
      const day = dayOf(s.startTime)
      counts.set(day, (counts.get(day) ?? 0) + 1)
    }
    // Série continue sur la période (90 jours au plus ; les jours sans session comptent 0)
    const points: DailySessionsPoint[] = []
    for (let i = length - 1; i >= 0; i--) {
      const day = dayOf(now - i * DAY_MS)
      points.push({ date: day, count: counts.get(day) ?? 0 })
    }
    return points
  }

  private buildSessionsPerMonth(sessions: Session[], now: number): MonthlySessionsPoint[] {
    const counts = new Map<string, number>()
    for (const s of sessions) {
      const month = monthOf(s.startTime)
      counts.set(month, (counts.get(month) ?? 0) + 1)
    }
    // Série continue sur les 12 derniers mois, mois courant inclus
    const [currentYear, currentMonth] = monthOf(now).split('-').map(Number) as [number, number]
    const points: MonthlySessionsPoint[] = []
    for (let i = 11; i >= 0; i--) {
      const totalMonths = currentYear * 12 + (currentMonth - 1) - i
      const year = Math.floor(totalMonths / 12)
      const month = (totalMonths % 12) + 1
      const key = `${year}-${String(month).padStart(2, '0')}`
      points.push({ month: key, count: counts.get(key) ?? 0 })
    }
    return points
  }

  private buildDurationBuckets(sessions: Session[]): DurationBucket[] {
    const total = sessions.length
    let previousMax = 0
    return DURATION_BUCKETS.map(({ label, maxSeconds }) => {
      const count = sessions.filter(
        s => s.durationSeconds >= previousMax && s.durationSeconds < maxSeconds
      ).length
      previousMax = maxSeconds
      return {
        label,
        count,
        percentage: total === 0 ? 0 : Math.round((count / total) * 1000) / 10
      }
    })
  }

  private buildEmergency(sessions: Session[]) {
    const emergencyCount = sessions.filter(s => s.wasEmergency).length
    const total = sessions.length
    return {
      emergencyCount,
      normalCount: total - emergencyCount,
      total,
      ratio: total === 0 ? 0 : emergencyCount / total
    }
  }

  /** Utilisateurs de la période ; « actifs 30 j » se calcule sur tout l'historique du périmètre */
  private buildUsers(sessions: Session[], history: Session[], now: number) {
    const allUsers = new Set(sessions.map(s => s.userId))
    const thirtyDaysAgo = now - 30 * DAY_MS
    const activeUsers = new Set(
      history.filter(s => s.startTime >= thirtyDaysAgo).map(s => s.userId)
    )
    return {
      totalUniqueUsers: allUsers.size,
      activeUsersLast30Days: activeUsers.size,
      avgSessionsPerUser:
        allUsers.size === 0 ? 0 : Math.round((sessions.length / allUsers.size) * 10) / 10
    }
  }

  /** Totaux sur la période ; aujourd'hui et la tendance hebdo sur tout l'historique du périmètre */
  private buildOverview(sessions: Session[], history: Session[], now: number) {
    const today = dayOf(now)
    const durations = sessions.map(s => s.durationSeconds).sort((a, b) => a - b)
    const totalBlockedSeconds = durations.reduce((sum, d) => sum + d, 0)

    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const currentWeek = history.filter(s => s.startTime >= now - sevenDays).length
    const previousWeek = history.filter(
      s => s.startTime >= now - 2 * sevenDays && s.startTime < now - sevenDays
    ).length

    const hourly = this.buildHourlyActivity(sessions)
    const peak = hourly.reduce(
      (best, p) => (p.activations > best.activations ? p : best),
      hourly[0]!
    )

    return {
      totalSessions: sessions.length,
      sessionsToday: history.filter(s => dayOf(s.startTime) === today).length,
      totalBlockedSeconds,
      avgDurationSeconds:
        durations.length === 0 ? 0 : Math.round(totalBlockedSeconds / durations.length),
      medianDurationSeconds:
        durations.length === 0 ? 0 : durations[Math.floor(durations.length / 2)]!,
      weekOverWeekChange:
        previousWeek === 0
          ? null
          : Math.round(((currentWeek - previousWeek) / previousWeek) * 1000) / 10,
      peakHour: peak.activations > 0 ? peak.hour : null
    }
  }
}
