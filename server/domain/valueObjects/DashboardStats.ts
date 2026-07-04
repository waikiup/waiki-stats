/**
 * Objets de valeur retournés par le use case de statistiques.
 * C'est le contrat partagé avec le front (via les types Nitro).
 */

export interface HourlyActivityPoint {
  hour: number
  activations: number
  deactivations: number
}

export interface DailySessionsPoint {
  /** Date au format YYYY-MM-DD (fuseau du dashboard) */
  date: string
  count: number
}

export interface MonthlySessionsPoint {
  /** Mois au format YYYY-MM (fuseau du dashboard) */
  month: string
  count: number
}

export interface DurationBucket {
  label: string
  count: number
  percentage: number
}

export interface EmergencyStats {
  emergencyCount: number
  normalCount: number
  total: number
  /** 0..1 */
  ratio: number
}

export interface UserStats {
  totalUniqueUsers: number
  activeUsersLast30Days: number
  avgSessionsPerUser: number
}

export interface OverviewStats {
  totalSessions: number
  sessionsToday: number
  totalBlockedSeconds: number
  avgDurationSeconds: number
  medianDurationSeconds: number
  /** Variation du nb de sessions 7 derniers jours vs 7 jours précédents, en % (peut être négatif) */
  weekOverWeekChange: number | null
  /** Heure (0-23) avec le plus d'activations */
  peakHour: number | null
}

export interface DashboardStats {
  overview: OverviewStats
  hourlyActivity: HourlyActivityPoint[]
  sessionsPerDay: DailySessionsPoint[]
  sessionsPerMonth: MonthlySessionsPoint[]
  durationBuckets: DurationBucket[]
  emergency: EmergencyStats
  users: UserStats
  generatedAt: string
}
