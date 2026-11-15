import type { Program, ScoringConfig } from '../data/schema'
import { collectSourced, daysBetween, isStale } from '../data/sourced'

/**
 * COUVERTURE DES INFORMATIONS
 * Les champs « essentiels » (liste dans data/scoring.json › essential_fields) conditionnent une décision :
 * admissibilité, marchés, drawdown, restrictions clés, prix, retraits. Le reste est « secondaire ».
 * Les deux couvertures sont calculées séparément : une couverture globale élevée ne masque jamais
 * une lacune essentielle.
 */

export const normPath = (path: string) => path.replace(/\[\d+\]/g, '[]')

export const FIELD_LABELS: Record<string, string> = {
  instruments: 'Instruments proposés',
  eligibility: 'Admissibilité géographique',
  'evaluation.steps': "Nombre d'étapes",
  'evaluation.drawdown_type': "Type de drawdown de l'évaluation",
  'funded.drawdown_type': 'Type de drawdown du compte funded',
  'funded.account_nature': 'Compte funded simulé ou réel',
  'funded.profit_split_pct': 'Partage des profits',
  'funded.min_withdrawal_usd': 'Montant minimal de retrait',
  'funded.withdrawal_conditions': 'Conditions de retrait',
  'restrictions.news.evaluation': 'Annonces économiques (évaluation)',
  'restrictions.news.funded': 'Annonces économiques (compte funded)',
  'restrictions.overnight.evaluation': 'Positions overnight (évaluation)',
  'restrictions.overnight.funded': 'Positions overnight (compte funded)',
  'restrictions.weekend.evaluation': 'Positions fin de semaine (évaluation)',
  'restrictions.weekend.funded': 'Positions fin de semaine (compte funded)',
  'variants[].pricing.one_time': "Prix de l'évaluation (paiement unique)",
  'variants[].pricing.monthly': 'Abonnement mensuel',
  'variants[].pricing.activation_fee': "Frais d'activation",
  'variants[].evaluation.profit_target_usd': 'Objectif de profit',
  'variants[].evaluation.max_drawdown_usd': "Drawdown maximal de l'évaluation",
  'variants[].evaluation.daily_loss_limit_usd': "Limite quotidienne de l'évaluation",
  'variants[].funded.max_drawdown_usd': 'Drawdown maximal du compte funded',
  'variants[].funded.daily_loss_limit_usd': 'Limite quotidienne du compte funded',
}

export type CoverageItem = {
  path: string
  label: string
  /** missing = non confirmé ; stale = confirmé mais périmé. */
  problem: 'missing' | 'stale'
  verified_at: string | null
  sources: string[]
  daysOld: number | null
}

export type CoverageBlock = { total: number; ok: number; pct: number }

export type Coverage = {
  essential: CoverageBlock & { problems: CoverageItem[] }
  secondary: CoverageBlock & { staleCount: number }
  overall: CoverageBlock
  /** Essentiels non confirmés. */
  gaps: CoverageItem[]
  /** Essentiels confirmés mais périmés. */
  staleEssential: CoverageItem[]
}

const pct = (ok: number, total: number) => (total === 0 ? 100 : (ok / total) * 100)

/**
 * Couverture d'UNE variante : champs communs du programme + champs de cette variante uniquement.
 */
export function computeCoverage(p: Program, variantIndex: number, cfg: ScoringConfig, now: Date): Coverage {
  const essentialSet = new Set(cfg.essential_fields)
  const size = p.variants[variantIndex]?.account_size_usd
  const prefix = `variants[${variantIndex}].`
  const fields = collectSourced(p).filter((x) => !x.path.startsWith('variants[') || x.path.startsWith(prefix))

  const problems: CoverageItem[] = []
  let eTotal = 0, eOk = 0, sTotal = 0, sOk = 0, sStale = 0
  for (const { path, sv } of fields) {
    const n = normPath(path)
    const essential = essentialSet.has(n)
    const stale = isStale(sv, now, cfg.stale_after_days)
    const ok = (sv.status === 'confirmed' && !stale) || sv.status === 'not_applicable'
    if (essential) {
      eTotal++
      if (ok) eOk++
      else {
        const base = FIELD_LABELS[n] ?? n
        problems.push({
          path,
          label: path.startsWith('variants[') && size ? `${base} (compte de ${new Intl.NumberFormat('fr-CA').format(size)} $)` : base,
          problem: stale ? 'stale' : 'missing',
          verified_at: sv.verified_at,
          sources: sv.sources,
          daysOld: sv.verified_at ? daysBetween(sv.verified_at, now) : null,
        })
      }
    } else {
      sTotal++
      if (ok) sOk++
      else if (stale) sStale++
    }
  }
  return {
    essential: { total: eTotal, ok: eOk, pct: pct(eOk, eTotal), problems },
    secondary: { total: sTotal, ok: sOk, pct: pct(sOk, sTotal), staleCount: sStale },
    overall: { total: eTotal + sTotal, ok: eOk + sOk, pct: pct(eOk + sOk, eTotal + sTotal) },
    gaps: problems.filter((x) => x.problem === 'missing'),
    staleEssential: problems.filter((x) => x.problem === 'stale'),
  }
}
