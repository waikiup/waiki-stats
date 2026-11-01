/**
 * Un groupe de puces NFC posées au même endroit (ex. « BU Nantes 1 »).
 * Un groupe appartient au plus à un client B2B.
 */
export interface TagGroup {
  id: string
  name: string
  /** UID normalisés (cf. normalizeUid) */
  uids: string[]
  clientId: string | null
}

/**
 * Forme canonique d'un UID : hexadécimal majuscule sans séparateur.
 * « 04:6c:6D:32:50:23:90 » et « 046C6D32502390 » donnent la même valeur.
 */
export function normalizeUid(raw: string): string {
  return raw.replace(/[^0-9a-fA-F]/g, '').toUpperCase()
}

/** Affichage lisible : 046C6D32502390 → 04:6C:6D:32:50:23:90 */
export function formatUid(uid: string): string {
  return uid.match(/.{1,2}/g)?.join(':') ?? uid
}
