import { createHash, randomInt } from 'node:crypto'

// Sans 0/O, 1/I/L : un code se dicte au téléphone sans ambiguïté
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/** Code client du type WK-7QH4-M2XP-9KDT (~64 bits d'entropie) */
export function generateAccessCode(): string {
  const block = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('')
  return `WK-${block()}-${block()}-${block()}`
}

/** Le code est tapé à la main : casse et espaces ne comptent pas */
export function hashAccessCode(code: string): string {
  return createHash('sha256').update(code.trim().toUpperCase().replace(/\s+/g, '')).digest('hex')
}
