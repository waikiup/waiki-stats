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

/** Répartition d'une population de sessions entre groupes de puces */
export interface GroupBreakdownItem {
  /** null = sessions hors de tout groupe (grand public, puces non déclarées) */
  groupId: string | null
  name: string
  sessions: number
  blockedSeconds: number
  users: number
  /** Côté client : groupe sous le seuil de confidentialité, chiffres masqués */
  masked: boolean
}

export interface LoyaltyBucket {
  label: string
  /** Nombre d'utilisateurs de la période dans cette tranche */
  users: number
}

export interface UnknownTag {
  uid: string
  sessions: number
}

/** Ce que l'admin seul reçoit */
export interface AdminExtras {
  /** Sessions de la période portant un UID de puce (suivi du déploiement de la mise à jour de l'app) */
  taggedSessions: number
  /** Puces scannées pendant la période mais déclarées dans aucun groupe */
  unknownTags: UnknownTag[]
  /** Groupes du périmètre sans aucune session pendant la période */
  silentGroups: string[]
}

export interface ScopeInfo {
  /** Libellé du périmètre affiché (« Tout », « BU Nantes », « BU Nantes 2 »…) */
  label: string
  /** Période en jours, null = depuis le début */
  days: number | null
  /** Côté client : moins de MIN_USERS personnes, aucun chiffre n'est affiché */
  insufficientData: boolean
  minUsers: number
}

export interface ScopedDashboardStats extends DashboardStats {
  scope: ScopeInfo
  /** Lundi → dimanche */
  weekday: number[]
  /** [jour lundi→dimanche][heure 0-23] : nombre d'activations */
  heatmap: number[][]
  byGroup: GroupBreakdownItem[]
  loyalty: LoyaltyBucket[]
  admin: AdminExtras | null
}
