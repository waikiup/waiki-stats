/**
 * Lit une liste collée telle quelle :
 *
 *   BU NANTES1
 *   04:6C:6D:32:50:23:90
 *   04:93:6D:32:50:23:90
 *
 *   BUNANTES2
 *   ...
 *
 * Une ligne qui ressemble à un UID s'ajoute au groupe en cours ; toute autre ligne ouvre un groupe.
 * La ligne d'en-tête « UID » est ignorée.
 */
const UID_LINE = /^[0-9a-f]{2}([:\s-]?[0-9a-f]{2}){3,9}$/i

export interface ParsedGroup {
  name: string
  uids: string[]
}

export function parseGroupList(text: string): ParsedGroup[] {
  const groups: ParsedGroup[] = []
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line || /^uids?$/i.test(line)) continue
    if (UID_LINE.test(line)) {
      if (!groups.length) groups.push({ name: 'Sans nom', uids: [] })
      groups[groups.length - 1]!.uids.push(line)
    } else {
      groups.push({ name: prettifyName(line), uids: [] })
    }
  }
  return groups.filter(g => g.uids.length > 0)
}

/** « BUNANTES2 » → « BU Nantes 2 », « BU RENNES 3 » → « BU Rennes 3 » */
function prettifyName(raw: string): string {
  return raw
    .replace(/^BU(?=[A-Z])/i, 'BU ')
    .replace(/([A-Za-z])(\d+)$/, '$1 $2')
    .split(/\s+/)
    .map(w => (w.length <= 3 && w === w.toUpperCase()) || /^\d+$/.test(w) ? w : w[0]!.toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
