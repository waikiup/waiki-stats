/**
 * Entité métier : une session de blocage d'apps déclenchée par un scan NFC.
 * Indépendante de toute techno de persistance (Appwrite, etc.).
 */
export interface Session {
  id: string
  userId: string
  wasEmergency: boolean
  /** Début de session, epoch en millisecondes */
  startTime: number
  /** Fin de session, epoch en millisecondes */
  endTime: number
  durationSeconds: number
  dateStart: Date
  createdAt: Date | null
  /** UID de la puce qui a lancé la session, normalisé (cf. normalizeUid). Null pour les sessions antérieures à l'envoi de l'UID par l'app. */
  tagUid: string | null
}
