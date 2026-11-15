import type { Sourced } from './schema'

export type FoundSourced = { path: string; sv: Sourced<unknown> }

export function isSourced(x: unknown): x is Sourced<unknown> {
  if (typeof x !== 'object' || x === null) return false
  const o = x as Record<string, unknown>
  return (
    typeof o.status === 'string' &&
    ['confirmed', 'unconfirmed', 'not_applicable'].includes(o.status) &&
    'value' in o &&
    Array.isArray(o.sources) &&
    'verified_at' in o
  )
}

/** Parcourt un objet et renvoie toutes les valeurs sourcées avec leur chemin. */
export function collectSourced(obj: unknown, path = ''): FoundSourced[] {
  if (isSourced(obj)) return [{ path, sv: obj }]
  const out: FoundSourced[] = []
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => out.push(...collectSourced(v, `${path}[${i}]`)))
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [k, v] of Object.entries(obj)) out.push(...collectSourced(v, path ? `${path}.${k}` : k))
  }
  return out
}

const DAY = 24 * 60 * 60 * 1000

export function daysBetween(isoDate: string, now: Date): number {
  const d = Date.parse(`${isoDate}T00:00:00Z`)
  const n = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.floor((n - d) / DAY)
}

export function isStale(sv: Sourced<unknown>, now: Date, staleAfterDays: number): boolean {
  return sv.status === 'confirmed' && sv.verified_at !== null && daysBetween(sv.verified_at, now) > staleAfterDays
}
