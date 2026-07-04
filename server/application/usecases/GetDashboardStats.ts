import type { Session } from '../../domain/entities/Session'
import type { SessionRepository } from '../../domain/repositories/SessionRepository'
import type {
  DashboardStats,
  DailySessionsPoint,
  DurationBucket,
  HourlyActivityPoint,
  MonthlySessionsPoint
} from '../../domain/valueObjects/DashboardStats'

const TIMEZONE = 'Europe/Paris'
const DAYS_OF_HISTORY_FOR_DAILY_CHART = 30

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

  async execute(): Promise<DashboardStats> {
    const all = await this.sessions.findAll()
    const now = Date.now()

    return {
      overview: this.buildOverview(all, now),
      hourlyActivity: this.buildHourlyActivity(all),
      sessionsPerDay: this.buildSessionsPerDay(all, now),
      sessionsPerMonth: this.buildSessionsPerMonth(all, now),
      durationBuckets: this.buildDurationBuckets(all),
      emergency: this.buildEmergency(all),
      users: this.buildUsers(all, now),
      generatedAt: new Date(now).toISOString()
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

  private buildSessionsPerDay(sessions: Session[], now: number): DailySessionsPoint[] {
    const counts = new Map<string, number>()
    for (const s of sessions) {
      const day = dayOf(s.startTime)
      counts.set(day, (counts.get(day) ?? 0) + 1)
    }
    // Série continue sur les 30 derniers jours (les jours sans session comptent 0)
    const points: DailySessionsPoint[] = []
    for (let i = DAYS_OF_HISTORY_FOR_DAILY_CHART - 1; i >= 0; i--) {
      const day = dayOf(now - i * 24 * 60 * 60 * 1000)
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

  private buildUsers(sessions: Session[], now: number) {
    const allUsers = new Set(sessions.map(s => s.userId))
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const activeUsers = new Set(
      sessions.filter(s => s.startTime >= thirtyDaysAgo).map(s => s.userId)
    )
    return {
      totalUniqueUsers: allUsers.size,
      activeUsersLast30Days: activeUsers.size,
      avgSessionsPerUser:
        allUsers.size === 0 ? 0 : Math.round((sessions.length / allUsers.size) * 10) / 10
    }
  }

  private buildOverview(sessions: Session[], now: number) {
    const today = dayOf(now)
    const durations = sessions.map(s => s.durationSeconds).sort((a, b) => a - b)
    const totalBlockedSeconds = durations.reduce((sum, d) => sum + d, 0)

    const sevenDays = 7 * 24 * 60 * 60 * 1000
    const currentWeek = sessions.filter(s => s.startTime >= now - sevenDays).length
    const previousWeek = sessions.filter(
      s => s.startTime >= now - 2 * sevenDays && s.startTime < now - sevenDays
    ).length

    const hourly = this.buildHourlyActivity(sessions)
    const peak = hourly.reduce(
      (best, p) => (p.activations > best.activations ? p : best),
      hourly[0]!
    )

    return {
      totalSessions: sessions.length,
      sessionsToday: sessions.filter(s => dayOf(s.startTime) === today).length,
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
