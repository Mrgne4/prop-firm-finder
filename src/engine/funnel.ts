import type { Dataset } from '../data/schema'
import { RESTRICTION_KEYS, weightOf, type Answers, type CriterionKey } from './answers'
import { criterionLabel, evaluateAll, type Evaluation } from './evaluate'

/**
 * ENTONNOIR
 * UNITÉ DE COMPTAGE : le PROGRAMME (une offre d'une entreprise), jamais la taille de compte ni la variante.
 * Un programme est compté dans une seule catégorie, celle de sa meilleure variante.
 *  - « possibles » = catégorie A (rien d'incompatible confirmé, rien de non respecté).
 *  - « à confirmer » = catégorie A dont le budget indispensable repose sur un prix seulement observé, au-dessus du plafond :
 *    comptés À PART, jamais dans « possibles ».
 *  - « alternatives » = catégorie B, comptées À PART : elles ne gonflent jamais le nombre de programmes possibles.
 *  total = a + u + b + c.
 * Une information inconnue n'écarte jamais un programme.
 */
export type Counts = {
  /** Programmes évalués. */
  total: number
  /** A — correspondances potentielles (hors budget à confirmer). */
  a: number
  /** A — budget indispensable à confirmer : prix observé (non confirmé) au-dessus du plafond. */
  u: number
  idsU: string[]
  /** dont ceux qui comportent encore au moins un point à vérifier. */
  aToVerify: number
  /** B — alternatives proches (comptées séparément de A). */
  b: number
  /** C — incompatibles (échec confirmé sur un critère indispensable). */
  c: number
  /** Nombre d'entreprises distinctes derrière les programmes A. */
  firmsA: number
  idsA: string[]
  idsB: string[]
}

export function countsOf(ds: Dataset, evals: Evaluation[]): Counts {
  const A = evals.filter((e) => e.category === 'A' && !e.uncertainBudget)
  const U = evals.filter((e) => e.category === 'A' && e.uncertainBudget)
  const B = evals.filter((e) => e.category === 'B')
  const firm = new Map(ds.programs.map((p) => [p.id, p.firm_id]))
  return {
    total: evals.length,
    a: A.length,
    u: U.length,
    idsU: U.map((e) => e.programId),
    aToVerify: A.filter((e) => e.status !== 'COMPATIBLE').length,
    b: B.length,
    c: evals.length - A.length - U.length - B.length,
    firmsA: new Set(A.map((e) => firm.get(e.programId))).size,
    idsA: A.map((e) => e.programId),
    idsB: B.map((e) => e.programId),
  }
}

export function funnelCounts(ds: Dataset, a: Answers, now: Date): Counts {
  return countsOf(ds, evaluateAll(ds, a, { now }))
}

/** Compteurs si l'étudiant choisissait cette option (aperçu, sans modifier ses réponses). */
export function previewCounts(ds: Dataset, a: Answers, patch: Partial<Answers>, now: Date): Counts {
  return funnelCounts(ds, { ...a, ...patch }, now)
}

/** Critères actifs (ceux que les réponses mettent réellement en jeu). */
export function activeCriteria(a: Answers): CriterionKey[] {
  const k: CriterionKey[] = []
  if (a.when.includes('news')) k.push('news')
  if (a.when.includes('overnight')) k.push('overnight')
  if (a.when.includes('weekend')) k.push('weekend')
  if (a.when.includes('asian')) k.push('asian_session')
  if (a.style === 'scalping') k.push('scalping')
  if (a.budget && a.budget !== 'none' && a.budget !== 'gt200') k.push('budget')
  if (a.steps && a.steps !== 'any') k.push('steps')
  if (a.drawdown && ['static', 'eod_trailing', 'intraday_trailing'].includes(a.drawdown)) k.push('drawdown')
  if (a.platforms.length > 0) k.push('platform')
  return k
}

/** Réponses sans un critère donné (utilisé pour mesurer son effet). */
export function withoutCriterion(a: Answers, key: CriterionKey | 'instruments' | 'forms'): Answers {
  switch (key) {
    case 'news':
    case 'overnight':
    case 'weekend':
      return { ...a, when: a.when.filter((w) => w !== key) }
    case 'asian_session':
      return { ...a, when: a.when.filter((w) => w !== 'asian') }
    case 'scalping':
      return { ...a, style: a.style === 'scalping' ? 'day' : a.style }
    case 'budget':
      return { ...a, budget: 'none' }
    case 'steps':
      return { ...a, steps: 'any' }
    case 'drawdown':
      return { ...a, drawdown: 'any' }
    case 'platform':
      return { ...a, platforms: [] }
    case 'instruments':
      return { ...a, instruments: [] }
    case 'forms':
      return { ...a, marketForms: Object.fromEntries(Object.keys(a.marketForms).map((m) => [m, 'any' as const])) }
    default:
      return a
  }
}

export type Bottleneck = { key: CriterionKey; label: string; gain: number }

/** Critère qui restreint le plus : celui dont le retrait ferait gagner le plus de programmes possibles. */
export function bottleneck(ds: Dataset, a: Answers, now: Date, current?: Counts): Bottleneck | null {
  const now0 = current ?? funnelCounts(ds, a, now)
  let best: Bottleneck | null = null
  for (const key of activeCriteria(a)) {
    const gain = funnelCounts(ds, withoutCriterion(a, key), now).a - now0.a
    if (gain > 0 && (!best || gain > best.gain)) best = { key, label: criterionLabel(key), gain }
  }
  return best
}

export type Suggestion = {
  /** Ce qu'il faudrait changer. */
  target: CriterionKey | 'instruments' | 'forms'
  label: string
  /** Programmes qui deviendraient des correspondances si ce changement était fait. */
  programIds: string[]
  /** Texte clair : c'est un changement de stratégie, pas un résultat compatible. */
  text: string
}

/**
 * CHANGEMENTS DE STRATÉGIE possibles. Ne concerne que ce que l'étudiant a déclaré indispensable (ou qui l'est par défaut).
 * Ces programmes ne sont JAMAIS présentés comme compatibles avec les critères actuels : ils sont listés à part.
 */
export function strategySuggestions(ds: Dataset, a: Answers, now: Date, current?: Counts): Suggestion[] {
  const now0 = current ?? funnelCounts(ds, a, now)
  const have = new Set([...now0.idsA, ...now0.idsU, ...now0.idsB])
  const out: Suggestion[] = []
  const ask = (target: Suggestion['target'], label: string, text: string, changed: Answers) => {
    const c = funnelCounts(ds, changed, now)
    const gained = c.idsA.filter((id) => !have.has(id))
    if (gained.length > 0) out.push({ target, label, programIds: gained, text })
  }
  for (const key of activeCriteria(a)) {
    if (weightOf(key, a) !== 'required') continue
    const phrase = RESTRICTION_KEYS.includes(key) ? 'une restriction de trading' : 'un critère'
    ask(
      key,
      criterionLabel(key),
      `Tu as indiqué que « ${criterionLabel(key).toLowerCase()} » est indispensable. Ces programmes ne le respectent pas : les considérer revient à changer de stratégie (${phrase} que tu devrais accepter de modifier).`,
      withoutCriterion(a, key),
    )
  }
  if (Object.values(a.marketForms).some((f) => f !== 'any')) {
    ask('forms', 'Forme des contrats', "Tu as choisi un type de contrat précis (futures ou CFD). D'autres formes du même marché ouvrent d'autres programmes : c'est un changement de stratégie, pas un résultat compatible.", withoutCriterion(a, 'forms'))
  }
  if (a.instruments.length > 0) {
    ask('instruments', 'Instruments précis', "Ces programmes ne proposent pas tous les instruments que tu as choisis. Changer d'instrument est un changement de stratégie.", withoutCriterion(a, 'instruments'))
  }
  return out.sort((x, y) => y.programIds.length - x.programIds.length).slice(0, 4)
}

/** Évolution du nombre de programmes possibles après chaque réponse (ex. 28 → 10 → 1). */
export function trail(ds: Dataset, answers: Answers, stages: Partial<Answers>[], now: Date): number[] {
  const out: number[] = []
  let acc: Answers = { ...answers, markets: [], instruments: [], marketForms: {}, style: null, when: [], drawdown: null, budget: null, steps: null, priority: null, platforms: [], residence: { country: null, region: null } }
  for (const patch of stages) {
    acc = { ...acc, ...patch }
    out.push(funnelCounts(ds, acc, now).a)
  }
  return out
}
