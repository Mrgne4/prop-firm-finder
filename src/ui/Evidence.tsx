import type { Dataset } from '../data/schema'
import type { Evidence } from '../engine/evaluate'
import { fmtDate } from './format'

/**
 * Traçabilité d'un critère : sources consultées, date de vérification, et état de fraîcheur.
 * Une donnée périmée est toujours signalée comme telle : elle n'a servi à rien confirmer.
 */
export function EvidenceLine({ evidence, ds }: { evidence: Evidence[]; ds: Dataset }) {
  const used = evidence.filter((e) => e.state !== 'not_applicable')
  if (used.length === 0) return null
  const ids = [...new Set(used.flatMap((e) => e.sources))]
  const labels = ids.map((id) => ds.sources.find((s) => s.id === id)?.label ?? id)
  const dated = used.map((e) => e.verified_at).filter((d): d is string => !!d).sort()
  const stale = used.filter((e) => e.state === 'stale')
  const missing = used.filter((e) => e.state === 'unconfirmed')
  const parts: string[] = []
  if (labels.length) parts.push(`Source${labels.length > 1 ? 's' : ''} : ${labels.join(' ; ')}`)
  if (dated.length) parts.push(`vérifié le ${fmtDate(dated[0])}`)
  if (stale.length) parts.push(`périmé (${Math.max(...stale.map((e) => e.daysOld ?? 0))} jours) : ne confirme rien`)
  if (missing.length) parts.push('information non confirmée')
  return <span className={`evi${stale.length || missing.length ? ' bad' : ''}`}>{parts.join(' · ')}</span>
}
