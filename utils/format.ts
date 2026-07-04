export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours < 48) return remaining > 0 ? `${hours} h ${remaining.toString().padStart(2, '0')}` : `${hours} h`
  return `${Math.round(hours / 24)} j`
}
