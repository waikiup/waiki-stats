export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours < 48) return remaining > 0 ? `${hours} h ${remaining.toString().padStart(2, '0')}` : `${hours} h`
  return `${Math.round(hours / 24)} j`
}

/** 046C6D32502390 → 04:6C:6D:32:50:23:90 */
export function formatUid(uid: string): string {
  return uid.match(/.{1,2}/g)?.join(':') ?? uid
}

export function formatHours(seconds: number): string {
  const h = seconds / 3600
  return h < 10 ? `${Math.round(h * 10) / 10} h` : `${Math.round(h).toLocaleString('fr-FR')} h`
}
