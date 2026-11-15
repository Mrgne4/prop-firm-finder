import type { Dataset, Program, RestrictionKey, Sourced } from '../data/schema'
import { isStale } from '../data/sourced'

export const fmtUsd = (n: number) => `${new Intl.NumberFormat('fr-CA', { maximumFractionDigits: 2 }).format(n)} $`

export const fmtDate = (iso: string | null) => {
  if (!iso) return 'Non vérifié'
  const d = new Date(`${iso}T12:00:00Z`)
  return new Intl.DateTimeFormat('fr-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(d)
}

export const NOT_CONFIRMED = 'Non confirmé'

/** Texte d'une valeur sourcée : « Non confirmé » est toujours explicite. */
export function sv<T>(v: Sourced<T>, fmt: (x: T) => string, opts: { na?: string; now?: Date; staleDays?: number } = {}): string {
  if (v.status === 'not_applicable') return opts.na ?? 'Sans objet'
  if (v.status === 'unconfirmed' || v.value === null) return NOT_CONFIRMED
  const stale = opts.now && opts.staleDays !== undefined && isStale(v, opts.now, opts.staleDays)
  return fmt(v.value) + (stale ? ' (à revérifier)' : '')
}

export const DRAWDOWN_LABEL: Record<string, string> = {
  static: 'Static',
  eod_trailing: 'End-of-Day Trailing',
  intraday_trailing: 'Intraday Trailing',
}
export const DRAWDOWN_GLOSSARY: Record<string, string> = {
  static: 'static_drawdown',
  eod_trailing: 'eod_trailing',
  intraday_trailing: 'intraday_trailing',
}

export const RESTRICTION_TEXT: Record<string, string> = { allowed: 'Autorisé', forbidden: 'Interdit', conditional: 'Sous conditions' }

export const RESTRICTION_NAME: Record<RestrictionKey, string> = {
  news: 'Trading pendant les annonces économiques',
  overnight: 'Positions overnight',
  weekend: 'Positions pendant la fin de semaine',
  asian_session: 'Session asiatique',
  scalping: 'Scalping',
  automated: 'Trading automatisé (EA / bots)',
  copy_trading: 'Copy trading',
}

export const NATURE_TEXT: Record<string, string> = { simulated: 'Compte simulé', real: 'Compte réel' }

export const stepsText = (n: number) => (n === 0 ? 'Sans challenge' : n === 1 ? 'Une étape' : `${n} étapes`)

/** Résume une restriction (évaluation / funded) sans jamais mélanger les deux. */
export function restrictionSummary(p: Program, key: RestrictionKey): { evaluation: string; funded: string } {
  const one = (s: Sourced<'allowed' | 'forbidden' | 'conditional'>) => {
    if (s.status === 'not_applicable') return 'Sans objet'
    if (s.status === 'unconfirmed' || s.value === null) return NOT_CONFIRMED
    return RESTRICTION_TEXT[s.value] + (s.value === 'conditional' && s.note ? ` — ${s.note}` : '')
  }
  return { evaluation: one(p.restrictions[key].evaluation), funded: one(p.restrictions[key].funded) }
}

export function marketLabelsOf(p: Program, ds: Dataset): string[] {
  if (p.instruments.status !== 'confirmed' || !p.instruments.value) return []
  const markets = new Set<string>()
  for (const id of p.instruments.value) {
    const ins = ds.instruments.find((i) => i.id === id)
    if (ins) markets.add(ins.market)
  }
  return ds.markets.filter((m) => markets.has(m.id)).map((m) => m.label)
}

export const CONTRACT_LABEL: Record<string, string> = {
  futures: 'Contrats futures',
  cfd: 'CFD',
  spot: 'Spot / marge',
  perpetual: 'Contrats perpétuels',
  other: 'Autre',
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

const regionName = (code: string): string => {
  const [c, r] = code.split('-')
  return r ? `${countryName(c)} (${r})` : countryName(c)
}

/** Texte lisible de l'admissibilité géographique : admissibles, exclus, non confirmés et sort des autres pays. */
export function eligibilityText(e: { eligible: string[]; excluded: string[]; unconfirmed: string[]; unlisted: 'eligible' | 'excluded' | 'unconfirmed' }): string {
  const parts: string[] = []
  if (e.eligible.length) parts.push(`Admissibles : ${e.eligible.map(regionName).join(', ')}`)
  if (e.excluded.length) parts.push(`Exclus : ${e.excluded.map(regionName).join(', ')}`)
  if (e.unconfirmed.length) parts.push(`Non confirmés : ${e.unconfirmed.map(regionName).join(', ')}`)
  parts.push(
    e.unlisted === 'unconfirmed'
      ? 'Autres pays : non confirmés'
      : e.unlisted === 'eligible'
        ? 'Autres pays : admis (selon la source)'
        : 'Autres pays : exclus (selon la source)',
  )
  return parts.join(' — ')
}

/** Nom lisible d'une variante : taille + option d'achat éventuelle (ex. « 50 000 $ — Sans frais d'activation »). */
export const variantName = (v: { account_size_usd: number; option: string | null }): string =>
  `${fmtUsd(v.account_size_usd)}${v.option ? ` — ${v.option}` : ''}`

/** Règles CONNUES (confirmées) pouvant retarder ou bloquer un retrait ; vide si aucune n'est confirmée. Jamais exhaustif. */
export function withdrawalBlockers(p: import('../data/schema').Program): string[] {
  const out: string[] = []
  const cons = p.evaluation.consistency_rule
  if (cons.status === 'confirmed' && cons.value?.exists) out.push(`Consistance (évaluation) : ${cons.value.detail ?? 'oui'}`)
  const paths = p.funded.payout_paths
  if (paths?.status === 'confirmed' && paths.value) {
    for (const x of paths.value) {
      const bits: string[] = []
      if (x.min_days) bits.push(`${x.min_days} jours avant la demande`)
      if (x.consistency_max_day_pct) bits.push(`consistance de ${x.consistency_max_day_pct} %`)
      if (x.min_day_profit_usd) bits.push(`jours gagnants d’au moins ${x.min_day_profit_usd} $`)
      if (bits.length) out.push(`${x.label} : ${bits.join(', ')}`)
    }
  }
  const sn = p.funded.safety_net
  if (sn.status === 'confirmed' && sn.value?.exists) out.push(`Safety net : ${sn.value.detail ?? 'oui'}`)
  const mw = p.funded.min_withdrawal_usd
  if (mw.status === 'confirmed' && mw.value) out.push(`Retrait minimal : ${mw.value} $`)
  return out
}

export function contractLabel(p: import('../data/schema').Program): string {
  const t = p.contract_types.status === 'confirmed' ? p.contract_types.value ?? [] : null
  if (!t) return NOT_CONFIRMED
  const fut = t.includes('futures')
  const cfd = t.some((x) => x === 'cfd' || x === 'spot')
  return fut && !cfd ? 'Contrats futures (pas de CFD)' : cfd && !fut ? 'CFD / marge, comptes simulés (pas de futures)' : t.join(', ')
}
