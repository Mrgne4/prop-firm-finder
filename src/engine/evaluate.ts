import type {
  ConditionalFee,
  Dataset,
  Eligibility,
  Instrument,
  Program,
  RestrictionKey,
  ScoringConfig,
  Sourced,
  Variant,
} from '../data/schema'
import { daysBetween, isStale } from '../data/sourced'
import { weightOf, type Answers, type CriterionKey, type Residence } from './answers'
import { computeCoverage, type Coverage } from './coverage'
import { withdrawalDisclosure, type WithdrawalDisclosure } from './withdrawals'

/* ------------------------------------------------------------------ */
/* Types publics                                                       */
/* ------------------------------------------------------------------ */

/**
 * COMPATIBLE   : tous les critères bloquants sont satisfaits selon des informations vérifiées et récentes,
 *                et aucune information essentielle ne manque.
 * A_VERIFIER   : aucune incompatibilité confirmée, mais au moins une information manquante, conditionnelle ou périmée.
 * INCOMPATIBLE : au moins une incompatibilité bloquante confirmée (sur une donnée récente).
 * PARTIEL      : alternative proche (catégorie B) : aucune incompatibilité sur un critère indispensable, mais une préférence n'est pas satisfaite.
 */
export type Status = 'COMPATIBLE' | 'A_VERIFIER' | 'INCOMPATIBLE' | 'PARTIEL'

export type CriterionState = 'ok' | 'fail' | 'unknown'

/** Traçabilité : quelle donnée a servi, à quelle date, selon quelle(s) source(s). */
export type Evidence = {
  field: string
  state: 'fresh' | 'stale' | 'unconfirmed' | 'not_applicable'
  verified_at: string | null
  sources: string[]
  daysOld: number | null
}

export type CriterionKeyAll = CriterionKey | 'freshness' | 'essential_info'

const CONTRACT_LABELS: Record<string, string> = { futures: 'contrats à terme (futures)', cfd: 'CFD', spot: 'marché au comptant', perpetual: 'contrats perpétuels', other: 'autre' }

/** Vérification d'UN instrument précis (identifiant du catalogue, avec son type de contrat). */
export type InstrumentCheck = {
  id: string
  label: string
  contract: string
  state: 'available' | 'unavailable' | 'unknown'
  message: string
}

export type CriterionResult = {
  key: CriterionKeyAll
  label: string
  state: CriterionState
  message: string
  /** true si l'échec porte sur une PRÉFÉRENCE (souhaitable) : un ajustement est possible. Jamais vrai pour un critère indispensable. */
  relaxed: boolean
  /** Poids choisi (ou par défaut) : indispensable, souhaitable, ou information (fraîcheur, lacunes). */
  weight?: 'required' | 'preferred' | 'info'
  /** Budget : prix seulement OBSERVÉ (non confirmé) et supérieur au plafond. Jamais un échec confirmé. */
  observedOver?: boolean
  /** Budget : le verdict repose sur un prix confirmé ou sur un prix observé (à vérifier). */
  basis?: 'confirmed' | 'observed'
  evidence: Evidence[]
}

/** A = correspondance potentielle ; B = alternative proche ; C = incompatible. */
export type Category = 'A' | 'B' | 'C'

export type Adjustment = {
  key: CriterionKey
  label: string
  text: string
  /** true si ce critère est indispensable : le changement est une suggestion de stratégie, pas un ajustement. */
  locked: boolean
}

export type VariantCost = {
  variantId: string
  accountSizeUsd: number
  /** Taille + option d'achat (ex. « 50 000 $ — Sans frais d'activation »). */
  label: string
  model: 'one_time' | 'monthly' | 'unknown'
  /** Prix de l'évaluation (paiement unique) ou du 1er mois d'abonnement. */
  basePrice: number | null
  /** Abonnement mensuel récurrent (null si paiement unique ou inconnu). */
  recurringMonthly: number | null
  activation: { state: 'known' | 'none' | 'unknown'; amount: number }
  resetFee: number | null
  /** Coût de départ minimal connu : prix + activation obligatoire connue. */
  lowerBound: number | null
  /** Coût de départ certain (prix ET activation connus), sinon null. */
  exact: number | null
  /** Frais possibles selon conditions : affichés, jamais additionnés. */
  conditionalFees: ConditionalFee[]
}

export type ScorePart = {
  key: 'drawdown' | 'steps' | 'cost' | 'withdrawal' | 'freedom' | 'platform'
  label: string
  weight: number
  knownRatio: number
  score: number | null
  detail: string
}

export type ScoreResult = {
  parts: ScorePart[]
  match: number | null
  criteriaCoverage: number | null
  rank: number
}

/** Évaluation d'UNE variante (taille de compte) : ses frais et ses règles propres, jamais ceux d'une autre. */
export type VariantEvaluation = {
  variantId: string
  accountSizeUsd: number
  status: Status
  category: Category
  criteria: CriterionResult[]
  cost: VariantCost
  score: ScoreResult
  coverage: Coverage
}

export type Evaluation = {
  programId: string
  /** Catégorie de la variante recommandée : A potentielle, B alternative proche, C incompatible. */
  category: Category
  /** Critères respectés / non respectés (confirmés) / non confirmés, pour expliquer la catégorie. */
  met: CriterionResult[]
  missed: CriterionResult[]
  unconfirmed: CriterionResult[]
  /** Préférences non satisfaites : ce que l'étudiant devrait ajuster (catégorie B). */
  adjustments: Adjustment[]
  /** Catégorie A mais budget indispensable avec prix seulement observé, au-dessus du plafond : à confirmer. */
  uncertainBudget: boolean
  /** Statut, critères, score et couverture de la variante RECOMMANDÉE (la mieux placée). */
  status: Status
  criteria: CriterionResult[]
  score: ScoreResult
  coverage: Coverage
  /** Évaluations individuelles de chaque variante. */
  variants: VariantEvaluation[]
  /** Lacunes sur les conditions de retrait (affichées toujours, jamais bloquantes en elles-mêmes). */
  withdrawal: WithdrawalDisclosure
  recommendedVariantId: string
  recommended: VariantCost
  marketsMatched: string[]
  marketsMissing: string[]
  marketsTotal: number
  /** Vérification individuelle des instruments choisis (vide si aucun). */
  instrumentChecks: InstrumentCheck[]
  /** Variante la moins chère connue (indépendante de l'évaluation, utilisée par l'explorateur). */
  cheapest: VariantCost | null
  variantCosts: VariantCost[]
  /** Couverture globale (essentielles + secondaires) de la variante recommandée. */
  infoCoverage: number
  /** Au moins une information ESSENTIELLE périmée. */
  needsReview: boolean
  /** Informations essentielles périmées (variante recommandée). */
  staleCount: number
  /** Informations secondaires périmées : signalées, sans effet sur le statut. */
  secondaryStale: number
  oldestVerified: string | null
  lastVerified: string | null
}

export type EngineContext = {
  instruments: Map<string, Instrument>
  marketLabels: Map<string, string>
  platformLabels: Map<string, string>
  scoring: ScoringConfig
  now: Date
}

export function makeContext(ds: Pick<Dataset, 'instruments' | 'markets' | 'platforms' | 'scoring'>, now: Date = new Date()): EngineContext {
  return {
    instruments: new Map(ds.instruments.map((i) => [i.id, i])),
    marketLabels: new Map(ds.markets.map((m) => [m.id, m.label])),
    platformLabels: new Map(ds.platforms.map((p) => [p.id, p.label])),
    scoring: ds.scoring,
    now,
  }
}

export const BASIS_TEXT =
  "Coût de départ = premier paiement (évaluation à paiement unique, ou premier mois d'abonnement) + frais d'activation obligatoires confirmés, pour la taille de compte considérée. " +
  'Les resets, les frais conditionnels et les promotions ne sont pas inclus.'

/* ------------------------------------------------------------------ */
/* Lecture sécurisée d'une valeur sourcée                              */
/* ------------------------------------------------------------------ */

type Read<T> =
  | { kind: 'value'; value: T }
  | { kind: 'na' }
  | { kind: 'unknown'; reason: 'unconfirmed' | 'stale'; verified_at: string | null }

/**
 * Une valeur non confirmée OU périmée est « inconnue » : elle ne peut ni confirmer une compatibilité
 * ni confirmer une incompatibilité, et n'est jamais remplacée par une valeur par défaut.
 */
function read<T>(sv: Sourced<T>, ctx: EngineContext): Read<T> {
  if (sv.status === 'not_applicable') return { kind: 'na' }
  if (sv.status === 'unconfirmed' || sv.value === null) return { kind: 'unknown', reason: 'unconfirmed', verified_at: null }
  if (isStale(sv, ctx.now, ctx.scoring.stale_after_days)) return { kind: 'unknown', reason: 'stale', verified_at: sv.verified_at }
  return { kind: 'value', value: sv.value }
}

function evidence(field: string, sv: Sourced<unknown>, ctx: EngineContext): Evidence {
  const stale = isStale(sv, ctx.now, ctx.scoring.stale_after_days)
  return {
    field,
    state: sv.status === 'not_applicable' ? 'not_applicable' : sv.status === 'unconfirmed' ? 'unconfirmed' : stale ? 'stale' : 'fresh',
    verified_at: sv.verified_at,
    sources: sv.sources,
    daysOld: sv.verified_at ? daysBetween(sv.verified_at, ctx.now) : null,
  }
}

const unknownWhy = (r: { reason: 'unconfirmed' | 'stale'; verified_at: string | null }) =>
  r.reason === 'stale' ? `périmé (donnée du ${r.verified_at}, à revérifier)` : 'non confirmé'

const usd = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(2)} $`
const sizeLabel = (v: { account_size_usd: number; option: string | null }) =>
  `${v.account_size_usd.toLocaleString('fr-FR')} $${v.option ? ` — ${v.option}` : ''}`

/* ------------------------------------------------------------------ */
/* Critères bloquants                                                  */
/* ------------------------------------------------------------------ */

const CRITERION_LABELS: Record<CriterionKeyAll, string> = {
  markets: 'Marchés',
  instruments: 'Instruments précis',
  residence: 'Pays de résidence',
  budget: 'Budget',
  drawdown: 'Type de drawdown',
  platform: 'Plateforme',
  steps: "Type d'évaluation",
  news: 'Annonces économiques',
  overnight: 'Positions overnight',
  weekend: 'Positions pendant la fin de semaine',
  asian_session: 'Session asiatique',
  scalping: 'Scalping',
  freshness: 'Fraîcheur des données',
  essential_info: 'Informations essentielles',
}
export const criterionLabel = (k: CriterionKeyAll) => CRITERION_LABELS[k]

const RESTRICTION_PHRASE: Record<RestrictionKey, string> = {
  news: 'trader pendant les annonces économiques',
  overnight: 'garder des positions pendant la nuit',
  weekend: 'garder des positions pendant la fin de semaine',
  asian_session: 'trader pendant la session asiatique',
  scalping: 'faire du scalping',
  automated: 'utiliser le trading automatisé',
  copy_trading: 'faire du copy trading',
}
export const restrictionPhrase = (k: RestrictionKey) => RESTRICTION_PHRASE[k]

const SCOPE_LABEL = { evaluation: "pendant l'évaluation", funded: 'sur le compte funded' } as const

function checkMarkets(p: Program, a: Answers, ctx: EngineContext) {
  const total = a.markets.length
  const base = { key: 'markets' as const, label: CRITERION_LABELS.markets, relaxed: false, evidence: [evidence('instruments', p.instruments, ctx)] }
  const inst = read(p.instruments, ctx)
  if (inst.kind !== 'value') {
    // Liste de symboles non lue, mais type de contrat CONFIRMÉ (ex. futures seulement) : un marché dont aucune forme
    // n'est permise par ce type (ex. CFD sur un programme « futures seulement ») est certainement indisponible.
    const ct = read(p.contract_types, ctx)
    if (ct.kind === 'value' && total > 0) {
      const imp = a.markets.filter((m) => {
        const form = a.marketForms[m] ?? 'any'
        return ![...ctx.instruments.values()].some((i) => i.market === m && (form === 'any' || i.contract === form) && ct.value.includes(i.contract))
      })
      if (imp.length === total) {
        const lb = imp.map((m) => ctx.marketLabels.get(m) ?? m).join(', ')
        return {
          result: { ...base, state: 'fail' as const, message: `Aucun de tes marchés n'est disponible (${lb}) : le programme n'accepte que ${ct.value.join(', ')}.` },
          matched: [] as string[],
          missing: imp,
        }
      }
    }
    return {
      result: {
        ...base,
        state: 'unknown' as const,
        message: `Instruments proposés ${inst.kind === 'unknown' ? unknownWhy(inst) : 'non confirmés'} : impossible de vérifier tes marchés.`,
      },
      matched: [] as string[],
      missing: [] as string[],
    }
  }
  const offered = inst.value.map((id) => ctx.instruments.get(id)).filter((i): i is Instrument => !!i)
  const matched: string[] = []
  const missing: string[] = []
  const toVerify: string[] = []
  const hints: string[] = []
  const types = read(p.contract_types, ctx)
  for (const m of a.markets) {
    const form = a.marketForms[m] ?? 'any'
    const ok = offered.some((i) => i.market === m && (form === 'any' || i.contract === form))
    if (ok) matched.push(m)
    else {
      // Liste partielle : l'absence n'est pas une preuve, sauf si le type de contrat est exclu par le programme.
      const possible = [...ctx.instruments.values()].some(
        (i) => i.market === m && (form === 'any' || i.contract === form) && (types.kind !== 'value' || types.value.includes(i.contract)),
      )
      const excl = read(p.instruments_excluded, ctx)
      const exclIds = p.instruments_scope === 'exhaustive' && excl.kind === 'value' ? excl.value : []
      const allVerifiedAbsent = [...ctx.instruments.values()]
        .filter((i) => i.market === m && (form === 'any' || i.contract === form) && (types.kind !== 'value' || types.value.includes(i.contract)))
        .every((i) => exclIds.includes(i.id))
      if (possible && !allVerifiedAbsent) {
        toVerify.push(m)
        continue
      }
      missing.push(m)
      const sameMarket = offered.filter((i) => i.market === m)
      if (sameMarket.length > 0 && form !== 'any') {
        hints.push(`${ctx.marketLabels.get(m) ?? m} : le programme ne les propose pas sous la forme demandée.`)
      }
      if (m === 'futures_index' && offered.some((i) => i.market === 'cfd_index'))
        hints.push('Les CFD sur indices (NAS100, US30…) ne remplacent pas les contrats futures (NQ, ES…).')
      if (m === 'cfd_index' && offered.some((i) => i.market === 'futures_index'))
        hints.push('Les contrats futures (NQ, ES…) ne remplacent pas les CFD sur indices (NAS100, US30…).')
    }
  }
  const lbl = (ids: string[]) => ids.map((m) => ctx.marketLabels.get(m) ?? m).join(', ')
  if (missing.length === 0 && toVerify.length > 0) {
    return {
      result: {
        ...base,
        state: 'unknown' as const,
        message: `${matched.length > 0 ? `Disponible : ${lbl(matched)}. ` : ''}À vérifier : ${lbl(toVerify)} (la liste officielle lue est partielle : l'absence ne prouve rien).`,
      },
      matched,
      missing,
    }
  }
  if (missing.length === 0) {
    return {
      result: { ...base, state: 'ok' as const, message: `Propose ${total > 1 ? 'tous tes marchés' : 'ton marché'} : ${lbl(matched)}.` },
      matched,
      missing,
    }
  }
  const head =
    matched.length === 0
      ? `Aucun de tes marchés n'est disponible (${lbl(missing)}).`
      : `Compatible avec ${matched.length} de tes ${total} marchés : ${lbl(matched)}. Non disponible : ${lbl(missing)}.`
  return { result: { ...base, state: 'fail' as const, message: [head, ...new Set(hints)].join(' ') }, matched, missing }
}

/* ----------------------- instruments individuels ------------------- */

/**
 * Disponibilité d'UN instrument pour un programme.
 *  - présent dans la liste confirmée → disponible (avec sa limite éventuelle)
 *  - absent d'une liste « exhaustive » → indisponible (et on explique la forme proposée à la place)
 *  - absent d'une liste « partielle », liste non confirmée/périmée, ou instrument marqué « unconfirmed » → à vérifier
 *  - instrument marqué « suspended » par une source officielle → indisponible
 */
export function checkInstrument(p: Program, id: string, ctx: EngineContext): InstrumentCheck {
  const inst = ctx.instruments.get(id)
  const label = inst?.label ?? id
  const contract = inst?.contract ?? 'other'
  const out = (state: InstrumentCheck['state'], message: string): InstrumentCheck => ({ id, label, contract, state, message })
  const list = read(p.instruments, ctx)
  if (list.kind !== 'value') return out('unknown', `Liste des instruments ${list.kind === 'unknown' ? unknownWhy(list) : 'non applicable'}.`)
  const types = read(p.contract_types, ctx)
  if (types.kind === 'value' && inst && !types.value.includes(inst.contract)) {
    const same = list.value.map((x) => ctx.instruments.get(x)).filter((i): i is Instrument => !!i && i.underlying === inst.underlying)
    const alt = same.length ? ` Le même sous-jacent (${inst.underlying}) existe ici sous une autre forme : ${same.map((i) => i.label).join(', ')}.` : ''
    return out('unavailable', `Non disponible : ce programme n'accepte que ${types.value.map((t) => CONTRACT_LABELS[t] ?? t).join(', ')} (cet instrument est de type « ${CONTRACT_LABELS[inst.contract] ?? inst.contract} »).${alt}`)
  }
  const limits = read(p.instrument_limits, ctx)
  const limit = limits.kind === 'value' ? limits.value.find((l) => l.instrument === id) : undefined
  if (list.value.includes(id)) {
    if (limit?.state === 'suspended') return out('unavailable', `Suspendu : ${limit.note}`)
    if (limit?.state === 'unconfirmed') return out('unknown', `Disponibilité à vérifier : ${limit.note}`)
    if (limit?.state === 'limited') return out('available', `Disponible, avec limite : ${limit.note}`)
    return out('available', 'Disponible.')
  }
  const offered = list.value.map((x) => ctx.instruments.get(x)).filter((i): i is Instrument => !!i)
  const sameUnderlying = inst ? offered.filter((i) => i.underlying === inst.underlying) : []
  const alt = sameUnderlying.length
    ? ` Ce sous-jacent (${inst?.underlying}) est proposé sous une autre forme : ${sameUnderlying.map((i) => i.label).join(', ')}.`
    : ''
  const excluded = read(p.instruments_excluded, ctx)
  if (p.instruments_scope === 'exhaustive' && excluded.kind === 'value' && excluded.value.includes(id))
    return out('unavailable', `Non disponible : vérifié absent de la liste officielle des produits permis.${alt}`)
  if (p.instruments_scope === 'exhaustive')
    return out('unknown', `Absent des produits de notre catalogue confirmés pour ce programme, mais pas vérifié comme interdit : la liste officielle ne se limite pas à notre catalogue. À vérifier.${alt}`)
  return out('unknown', `Absent de la liste connue, mais seule une partie de la liste officielle a été lue : à vérifier.${alt}`)
}

function checkInstruments(p: Program, a: Answers, ctx: EngineContext): { result: CriterionResult; checks: InstrumentCheck[] } | null {
  if (a.instruments.length === 0) return null
  const checks = a.instruments.map((id) => checkInstrument(p, id, ctx))
  const bad = checks.filter((c) => c.state === 'unavailable')
  const unk = checks.filter((c) => c.state === 'unknown')
  const names = (xs: InstrumentCheck[]) => xs.map((c) => c.label).join(', ')
  const state: CriterionState = bad.length ? 'fail' : unk.length ? 'unknown' : 'ok'
  const message =
    state === 'ok'
      ? `Tous tes instruments sont disponibles : ${names(checks)}.`
      : [
          bad.length ? `Non disponible : ${names(bad)}.` : '',
          unk.length ? `À vérifier : ${names(unk)}.` : '',
          `Disponible : ${names(checks.filter((c) => c.state === 'available')) || 'aucun'}.`,
          ...[...bad, ...unk].map((c) => c.message),
        ]
          .filter(Boolean)
          .join(' ')
  return {
    result: {
      key: 'instruments',
      label: CRITERION_LABELS.instruments,
      state,
      message,
      relaxed: false,
      evidence: [evidence('instruments', p.instruments, ctx), evidence('instrument_limits', p.instrument_limits, ctx)],
    },
    checks,
  }
}

/** Tableau complet du catalogue pour un programme (fiche détail). */
export const instrumentTable = (p: Program, ctx: EngineContext): InstrumentCheck[] => [...ctx.instruments.keys()].map((id) => checkInstrument(p, id, ctx))

/* ----------------------- admissibilité géographique ---------------- */

export type EligibilityResolution = {
  state: 'eligible' | 'excluded' | 'unconfirmed' | 'ambiguous'
  via: 'region' | 'country' | 'unlisted'
}

/**
 * Résout l'admissibilité d'une résidence à partir des listes EXPLICITES.
 * Une absence d'exclusion n'est jamais une admissibilité : un pays absent des trois listes prend
 * le sort `unlisted` (« unconfirmed » par défaut).
 */
export function resolveEligibility(el: Eligibility, res: Residence): EligibilityResolution {
  const { country, region, notRegions = [] } = res
  const status = (code: string): 'eligible' | 'excluded' | 'unconfirmed' | null =>
    el.excluded.includes(code) ? 'excluded' : el.eligible.includes(code) ? 'eligible' : el.unconfirmed.includes(code) ? 'unconfirmed' : null
  if (!country) return { state: 'unconfirmed', via: 'unlisted' }
  if (region) {
    const r = status(`${country}-${region}`)
    if (r) return { state: r, via: 'region' }
  }
  const c = status(country)
  const base: 'eligible' | 'excluded' | 'unconfirmed' = c ?? el.unlisted
  // Région inconnue : si une région du pays a un sort différent du reste du pays, on ne peut pas conclure.
  if (!region) {
    const regionEntries = [...el.eligible, ...el.excluded, ...el.unconfirmed].filter(
      (e) => e.startsWith(`${country}-`) && !notRegions.includes(e.slice(country.length + 1)),
    )
    if (regionEntries.some((e) => status(e) !== base)) return { state: 'ambiguous', via: 'region' }
  }
  return { state: base, via: c ? 'country' : 'unlisted' }
}

function checkResidence(p: Program, a: Answers, ctx: EngineContext): CriterionResult {
  const base = { key: 'residence' as const, label: CRITERION_LABELS.residence, relaxed: false, evidence: [evidence('eligibility', p.eligibility, ctx)] }
  if (!a.residence.country) {
    return { ...base, state: 'unknown', message: "Pays de résidence non indiqué : l'admissibilité ne peut pas être vérifiée." }
  }
  const el = read(p.eligibility, ctx)
  if (el.kind !== 'value') {
    return {
      ...base,
      state: 'unknown',
      message: `Admissibilité géographique : information ${el.kind === 'unknown' ? (el.reason === 'stale' ? `périmée (donnée du ${el.verified_at}, à revérifier)` : 'non confirmée') : 'non applicable'}. Vérifie sur le site officiel avant tout achat.`,
    }
  }
  const r = resolveEligibility(el.value, a.residence)
  // Québec : jamais d'admissibilité provinciale déduite d'une simple absence d'exclusion, ni d'une déclaration « Canada »
  // non confirmée pour l'étape évaluation. Accès au challenge, au compte funded et aux paiements sont distincts.
  const isQc = a.residence.country === 'CA' && a.residence.region === 'QC'
  const stageOf = (st: 'evaluation' | 'funded_sim' | 'live') => p.quebec_by_stage?.find((q) => q.stage === st)?.state ?? 'a_verifier'
  const stageText = (st: string) =>
    st === 'admis' ? 'admis (source officielle)' : st === 'canada_general' ? 'Canada admis en général, Québec non précisé' : st === 'restreint' ? 'restreint (source officielle)' : 'non confirmé'
  if (isQc && r.via !== 'region' && r.state === 'eligible' && stageOf('evaluation') !== 'canada_general') {
    const ev = stageOf('evaluation')
    const split = ` Challenge : ${stageText(ev)} ; compte funded : ${stageText(stageOf('funded_sim'))} ; paiements : non confirmés séparément.`
    if (ev === 'restreint') return { ...base, state: 'fail', message: 'Le Québec est explicitement restreint pour le challenge.' + split }
    if (ev === 'admis') return { ...base, state: 'ok', message: "Le Québec est confirmé admissible par une source officielle pour le challenge." + split + " Confirme sur le site officiel." }
    if (r.via === 'unlisted' || ev === 'a_verifier')
      return {
        ...base,
        state: 'unknown',
        message: "Admissibilité du Québec non confirmée : l'absence d'exclusion ne vaut pas admissibilité provinciale. Vérifie sur le site officiel." + split,
      }
  }
  switch (r.state) {
    case 'excluded':
      return { ...base, state: 'fail', message: r.via === 'region' ? 'Les résidents de ta région sont explicitement exclus.' : 'Les résidents de ton pays sont explicitement exclus.' }
    case 'ambiguous':
      return { ...base, state: 'unknown', message: "L'admissibilité varie selon les régions de ton pays : précise ta province ou ton État pour la vérifier." }
    case 'unconfirmed':
      return { ...base, state: 'unknown', message: "Admissibilité non confirmée pour ton pays ou ta région (absence d'exclusion ne vaut pas admissibilité) : vérifie sur le site officiel." }
    case 'eligible':
      return {
        ...base,
        state: 'ok',
        message:
          (r.via === 'unlisted'
            ? "Ton pays n'est pas exclu et la source indique que les autres pays sont admis. Confirme sur le site officiel."
            : 'Ton pays ou ta région figure parmi les admissibles confirmés par la source. Confirme sur le site officiel.') +
          (a.residence.region && r.via !== 'region' ? " La déclaration de la source vise le pays en général : ta province ou ton État n'est pas explicitement confirmé." : '') +
          " L'accès au programme ne garantit pas l'admissibilité aux paiements : vérifie la politique de paiement.",
      }
  }
}

/* ------------------------- restrictions --------------------------- */

function checkRestriction(p: Program, key: RestrictionKey, ctx: EngineContext): CriterionResult | null {
  const phrase = RESTRICTION_PHRASE[key]
  const label = CRITERION_LABELS[key as CriterionKey]
  const scopes = (['evaluation', 'funded'] as const).map((scope) => ({ scope, r: read(p.restrictions[key][scope], ctx), sv: p.restrictions[key][scope] }))
  const active = scopes.filter((s) => s.r.kind !== 'na')
  if (active.length === 0) return null
  const evi = active.map((s) => evidence(`restrictions.${key}.${s.scope}`, s.sv, ctx))

  const forbidden = active.filter((s) => s.r.kind === 'value' && s.r.value === 'forbidden')
  if (forbidden.length > 0) {
    const allowedScopes = active.filter((s) => s.r.kind === 'value' && s.r.value === 'allowed')
    let message: string
    if (forbidden.length === active.length) {
      message = `Il est interdit de ${phrase}${active.length > 1 ? ' (évaluation et compte funded)' : ''}.`
    } else if (allowedScopes.length > 0) {
      message = `Autorisé ${SCOPE_LABEL[allowedScopes[0].scope]}, mais interdit ${SCOPE_LABEL[forbidden[0].scope]} : le programme n'est pas pleinement compatible avec ce besoin.`
    } else {
      message = `Interdit ${SCOPE_LABEL[forbidden[0].scope]} (l'autre étape reste à vérifier).`
    }
    return { key: key as CriterionKey, label, state: 'fail', message, relaxed: false, evidence: evi }
  }

  const notes: string[] = []
  let unknown = false
  for (const s of active) {
    if (s.r.kind === 'unknown') {
      unknown = true
      notes.push(`${SCOPE_LABEL[s.scope]} : ${unknownWhy(s.r)}`)
    } else if (s.r.kind === 'value' && s.r.value === 'conditional') {
      unknown = true
      notes.push(`${SCOPE_LABEL[s.scope]} : sous conditions${s.sv.note ? ` (${s.sv.note})` : ''}`)
    }
  }
  if (unknown) return { key: key as CriterionKey, label, state: 'unknown', message: `À vérifier — ${notes.join(' ; ')}.`, relaxed: false, evidence: evi }
  return {
    key: key as CriterionKey,
    label,
    state: 'ok',
    message: `Autorisé : ${phrase}${active.length > 1 ? ' (évaluation et compte funded)' : ''}.`,
    relaxed: false,
    evidence: evi,
  }
}

/* ---------------------------- coûts ------------------------------- */

export function computeVariantCost(v: Variant, ctx: EngineContext): VariantCost {
  const one = read(v.pricing.one_time, ctx)
  const mon = read(v.pricing.monthly, ctx)
  let model: VariantCost['model'] = 'unknown'
  let basePrice: number | null = null
  if (one.kind === 'value') {
    model = 'one_time'
    basePrice = one.value
  } else if (mon.kind === 'value') {
    model = 'monthly'
    basePrice = mon.value
  }
  const act = read(v.pricing.activation_fee, ctx)
  const activation: VariantCost['activation'] =
    act.kind === 'value' ? { state: 'known', amount: act.value } : act.kind === 'na' ? { state: 'none', amount: 0 } : { state: 'unknown', amount: 0 }
  const reset = read(v.pricing.reset_fee, ctx)
  const fees = read(v.pricing.conditional_fees, ctx)
  return {
    variantId: v.id,
    accountSizeUsd: v.account_size_usd,
    label: sizeLabel(v),
    model,
    basePrice,
    recurringMonthly: model === 'monthly' ? basePrice : null,
    activation,
    resetFee: reset.kind === 'value' ? reset.value : null,
    lowerBound: basePrice === null ? null : basePrice + activation.amount,
    exact: basePrice !== null && activation.state !== 'unknown' ? basePrice + activation.amount : null,
    conditionalFees: fees.kind === 'value' ? fees.value : [],
  }
}

export const computeVariantCosts = (p: Program, ctx: EngineContext): VariantCost[] => p.variants.map((v) => computeVariantCost(v, ctx))

export function cheapestVariant(costs: VariantCost[]): VariantCost | null {
  const known = costs.filter((c) => c.lowerBound !== null)
  if (known.length === 0) return null
  return [...known].sort((x, y) => (x.lowerBound as number) - (y.lowerBound as number) || x.accountSizeUsd - y.accountSizeUsd)[0]
}

export type ObservedRef = { amount: number; currency: 'USD' | 'EUR'; observed_on: string; kind: string; label: string }

/**
 * Prix OBSERVÉ de référence (jamais confirmé, jamais un code promo) d'une variante :
 *  1. le plus bas prix observé rattaché à cette variante ;
 *  2. sinon une BORNE BASSE : le plus bas prix observé pour une taille de compte inférieure ou égale (un compte plus grand
 *     ne coûte en général pas moins cher), ou un prix « à partir de » non rattaché à une taille.
 * Ce n'est jamais un prix confirmé.
 */
export function observedFor(p: Program, variantId: string | null): ObservedRef | null {
  const list = (p.observed_prices ?? []).filter((x) => x.kind !== 'promo')
  const pick = (l: typeof list) => (l.length === 0 ? null : l.reduce((m, x) => (x.currency === m.currency ? (x.amount < m.amount ? x : m) : m.currency === 'USD' ? m : x)))
  const v = p.variants.find((x) => x.id === variantId)
  const own = variantId ? pick(list.filter((x) => x.variant_id === variantId)) : null
  const smaller = v
    ? pick(list.filter((x) => x.variant_id !== null && (p.variants.find((y) => y.id === x.variant_id)?.account_size_usd ?? Infinity) <= v.account_size_usd))
    : null
  const unattached = pick(list.filter((x) => x.variant_id === null))
  const found = own ?? pick([smaller, unattached].filter((x): x is NonNullable<typeof x> => !!x))
  return found ? { amount: found.amount, currency: found.currency, observed_on: found.observed_on, kind: found.kind, label: found.label } : null
}

/** Budget d'UNE variante, calculé avec ses propres prix. Un prix seulement observé ne confirme ni n'infirme jamais. */
function checkBudgetVariant(p: Program, a: Answers, v: Variant, c: VariantCost, ctx: EngineContext): CriterionResult | null {
  if (!a.budget) return null
  const cap = ctx.scoring.budget_caps_usd[a.budget]
  if (cap === null) return null
  const size = c.label
  const evi = (['one_time', 'monthly', 'activation_fee'] as const).map((f) => evidence(`variants[${v.id}].pricing.${f}`, v.pricing[f], ctx))
  const base = { key: 'budget' as const, label: CRITERION_LABELS.budget, relaxed: false, evidence: evi }
  if (c.exact !== null) {
    return c.exact <= cap
      ? { ...base, basis: 'confirmed', state: 'ok', message: `Compte de ${size} : ${usd(c.exact)} au départ (prix confirmé), dans ton budget. ${c.model === 'monthly' ? 'Abonnement mensuel : premier mois + frais obligatoires.' : 'Paiement unique + frais obligatoires.'}` }
      : { ...base, basis: 'confirmed', state: 'fail', message: `Compte de ${size} : ${usd(c.exact)} au départ (prix confirmé), au-dessus de ton budget maximal de ${usd(cap)}.` }
  }
  if (c.lowerBound !== null && c.lowerBound > cap) {
    return { ...base, basis: 'confirmed', state: 'fail', message: `Compte de ${size} : au moins ${usd(c.lowerBound)} au départ (prix confirmé), au-dessus de ton budget maximal de ${usd(cap)}.` }
  }
  if (c.basePrice !== null) {
    return {
      ...base,
      basis: 'confirmed',
      state: 'unknown',
      message: `Compte de ${size} : le prix de base confirmé est dans ton budget, mais les frais d'activation ne sont pas confirmés (ou sont périmés) : coût de départ à vérifier.`,
    }
  }
  // Aucun prix confirmé : on regarde le prix OBSERVÉ, uniquement comme indication à vérifier.
  const o = observedFor(p, v.id)
  if (o && o.currency === 'USD') {
    const over = o.amount > cap
    return {
      ...base,
      basis: 'observed',
      state: 'unknown',
      observedOver: over,
      message: over
        ? `Compte de ${size} : prix non confirmé. Le prix observé sur le site officiel (${usd(o.amount)}, relevé le ${o.observed_on}) semble au-dessus de ton budget de ${usd(cap)} : à vérifier, ce n'est pas un prix confirmé.`
        : `Compte de ${size} : prix non confirmé. Le prix observé (${usd(o.amount)}, relevé le ${o.observed_on}) semble dans ton budget : indication seulement, à vérifier sur le site officiel.`,
    }
  }
  if (o) {
    return { ...base, basis: 'observed', state: 'unknown', message: `Compte de ${size} : prix non confirmé, observé en euros (${o.amount} €, relevé le ${o.observed_on}) : non converti, à comparer à ton budget sur le site officiel.` }
  }
  return { ...base, state: 'unknown', message: `Compte de ${size} : prix non confirmé ou périmé : impossible de vérifier ton budget (jamais compté comme sous le budget).` }
}

function checkDrawdown(p: Program, a: Answers, ctx: EngineContext): CriterionResult | null {
  if (!a.drawdown || !['static', 'eod_trailing', 'intraday_trailing'].includes(a.drawdown)) return null
  const want = a.drawdown
  const scopes = ([['évaluation', p.evaluation.drawdown_type], ['compte funded', p.funded.drawdown_type]] as const)
    .map(([name, sv]) => ({ name, sv, r: read(sv, ctx) }))
    .filter((x) => x.r.kind !== 'na')
  const evi = scopes.map((x) => evidence(x.name === 'évaluation' ? 'evaluation.drawdown_type' : 'funded.drawdown_type', x.sv, ctx))
  const base = { key: 'drawdown' as const, label: CRITERION_LABELS.drawdown, relaxed: false, evidence: evi }
  if (scopes.length === 0) return null
  const diff = scopes.filter((x) => x.r.kind === 'value' && x.r.value !== want)
  if (diff.length > 0) {
    const d = diff[0]
    return { ...base, state: 'fail', message: `Drawdown ${d.name} : ${DD_LABEL[(d.r as { value: string }).value]} (tu préfères ${DD_LABEL[want]}).` }
  }
  const unk = scopes.filter((x) => x.r.kind === 'unknown')
  if (unk.length > 0) return { ...base, state: 'unknown', message: `Type de drawdown ${unk.map((x) => `(${x.name} : ${unknownWhy(x.r as { reason: 'unconfirmed' | 'stale'; verified_at: string | null })})`).join(' ')} : à vérifier.` }
  return { ...base, state: 'ok', message: `Drawdown ${DD_LABEL[want]}, comme souhaité.` }
}

function checkPlatform(p: Program, a: Answers, ctx: EngineContext): CriterionResult | null {
  if (a.platforms.length === 0) return null
  const r = read(p.platforms, ctx)
  const base = { key: 'platform' as const, label: CRITERION_LABELS.platform, relaxed: false, evidence: [evidence('platforms', p.platforms, ctx)] }
  const labels = a.platforms.map((id) => ctx.platformLabels.get(id) ?? id).join(', ')
  if (r.kind !== 'value') return { ...base, state: 'unknown', message: `Plateformes ${r.kind === 'unknown' ? unknownWhy(r) : 'non applicables'} : à vérifier.` }
  return a.platforms.some((id) => (r.value as string[]).includes(id))
    ? { ...base, state: 'ok', message: `Compatible avec ${labels}.` }
    : { ...base, state: 'fail', message: `Ne propose pas ${labels}.` }
}

function checkSteps(p: Program, a: Answers, ctx: EngineContext): CriterionResult | null {
  if (!a.steps || a.steps === 'any') return null
  const want = a.steps === 'one' ? 1 : a.steps === 'two' ? 2 : 0
  const base = { key: 'steps' as const, label: CRITERION_LABELS.steps, relaxed: false, evidence: [evidence('evaluation.steps', p.evaluation.steps, ctx)] }
  const r = read(p.evaluation.steps, ctx)
  if (r.kind !== 'value') return { ...base, state: 'unknown', message: `Nombre d'étapes ${r.kind === 'unknown' ? unknownWhy(r) : 'non applicable'}.` }
  const name = (n: number) => (n === 0 ? 'sans challenge' : n === 1 ? 'une étape' : `${n} étapes`)
  return r.value === want
    ? { ...base, state: 'ok', message: `Évaluation : ${name(r.value)}, comme souhaité.` }
    : { ...base, state: 'fail', message: `Évaluation : ${name(r.value)} (tu souhaites : ${name(want)}).` }
}

/* ------------------------------------------------------------------ */
/* Score                                                               */
/* ------------------------------------------------------------------ */

const PART_LABELS: Record<ScorePart['key'], string> = {
  drawdown: 'Type de drawdown',
  steps: "Nombre d'étapes",
  cost: 'Coût',
  withdrawal: 'Conditions de retrait',
  freedom: 'Liberté de trading',
  platform: 'Plateforme',
}
export const partLabel = (k: ScorePart['key']) => PART_LABELS[k]

const PRIORITY_TO_PART: Record<string, ScorePart['key'] | undefined> = {
  simple_drawdown: 'drawdown',
  low_cost: 'cost',
  withdrawals: 'withdrawal',
  freedom: 'freedom',
  platform: 'platform',
}

type Piece = { known: boolean; score: number; text: string }

function aggregate(pieces: Piece[]): { knownRatio: number; score: number | null; detail: string } {
  if (pieces.length === 0) return { knownRatio: 0, score: null, detail: 'Aucune information applicable.' }
  const known = pieces.filter((x) => x.known)
  return {
    knownRatio: known.length / pieces.length,
    score: known.length === 0 ? null : known.reduce((s, x) => s + x.score, 0) / known.length,
    detail: pieces.map((x) => x.text).join(' · '),
  }
}

const DD_LABEL: Record<string, string> = { static: 'Static', eod_trailing: 'End-of-Day Trailing', intraday_trailing: 'Intraday Trailing' }

/** Score d'UNE variante : le coût pris en compte est celui de cette variante. */
export function computeScore(p: Program, a: Answers, cost: VariantCost | null, ctx: EngineContext): ScoreResult {
  const cfg = ctx.scoring
  const priorityPart = a.priority ? PRIORITY_TO_PART[a.priority] : undefined
  const w = (k: ScorePart['key']) => cfg.weights[k] * (priorityPart === k ? cfg.priority_multiplier : 1)
  const parts: ScorePart[] = []
  const push = (key: ScorePart['key'], pieces: Piece[]) => {
    const agg = aggregate(pieces)
    parts.push({ key, label: PART_LABELS[key], weight: w(key), ...agg })
  }

  const ddPref = a.drawdown && ['static', 'eod_trailing', 'intraday_trailing'].includes(a.drawdown) ? a.drawdown : null
  if (ddPref || priorityPart === 'drawdown') {
    const pieces: Piece[] = []
    for (const [scope, sv] of [
      ['évaluation', p.evaluation.drawdown_type],
      ['compte funded', p.funded.drawdown_type],
    ] as const) {
      const r = read(sv, ctx)
      if (r.kind === 'na') continue
      if (r.kind === 'unknown') pieces.push({ known: false, score: 0, text: `${scope} : ${unknownWhy(r)}` })
      else {
        const score = ddPref ? (r.value === ddPref ? 1 : 0) : cfg.drawdown_simplicity[r.value]
        pieces.push({ known: true, score, text: `${scope} : ${DD_LABEL[r.value]}` })
      }
    }
    push('drawdown', pieces)
  }

  if (a.steps && a.steps !== 'any') {
    const want = a.steps === 'one' ? 1 : a.steps === 'two' ? 2 : 0
    const r = read(p.evaluation.steps, ctx)
    push('steps', [
      r.kind === 'value'
        ? { known: true, score: r.value === want ? 1 : 0, text: r.value === 0 ? 'Sans challenge' : `${r.value} étape(s)` }
        : { known: false, score: 0, text: `Nombre d'étapes ${r.kind === 'unknown' ? unknownWhy(r) : 'non applicable'}` },
    ])
  }

  if ((a.budget && a.budget !== 'none') || priorityPart === 'cost') {
    if (!cost || cost.lowerBound === null) push('cost', [{ known: false, score: 0, text: 'Prix non confirmé' }])
    else {
      const tier = cfg.cost_scale.find((t) => t.up_to_usd === null || (cost.lowerBound as number) <= t.up_to_usd) ?? cfg.cost_scale[cfg.cost_scale.length - 1]
      const actKnown = cost.activation.state !== 'unknown'
      parts.push({
        key: 'cost',
        label: PART_LABELS.cost,
        weight: w('cost'),
        knownRatio: actKnown ? 1 : 0.5,
        score: tier.score,
        detail: `Compte de ${cost.label} : dès ${usd(cost.lowerBound)}${actKnown ? '' : " (frais d'activation non confirmés)"}`,
      })
    }
  }

  if (priorityPart === 'withdrawal') {
    const pieces: Piece[] = []
    const split = read(p.funded.profit_split_pct, ctx)
    if (split.kind === 'value') {
      const tier = cfg.profit_split_scale.find((t) => split.value >= t.at_least_pct) ?? cfg.profit_split_scale[cfg.profit_split_scale.length - 1]
      pieces.push({ known: true, score: tier.score, text: `Partage ${split.value} %` })
    } else pieces.push({ known: false, score: 0, text: `Partage des profits : ${split.kind === 'unknown' ? unknownWhy(split) : 'non applicable'}` })
    const minW = read(p.funded.min_withdrawal_usd, ctx)
    if (minW.kind === 'value') {
      const tier = cfg.min_withdrawal_scale.find((t) => t.up_to_usd === null || minW.value <= t.up_to_usd) ?? cfg.min_withdrawal_scale[cfg.min_withdrawal_scale.length - 1]
      pieces.push({ known: true, score: tier.score, text: `Retrait minimal ${usd(minW.value)}` })
    } else if (minW.kind === 'na') pieces.push({ known: true, score: 1, text: 'Pas de retrait minimal' })
    else pieces.push({ known: false, score: 0, text: `Retrait minimal : ${unknownWhy(minW)}` })
    // Les conditions de retrait incomplètes (plafond, Safety Net, nombre de retraits…) ne comptent jamais comme favorables.
    for (const g of withdrawalDisclosure(p).gaps.filter((x) => x.key !== 'profit_split_pct' && x.key !== 'min_withdrawal_usd'))
      pieces.push({ known: false, score: 0, text: `${g.label} : non confirmé` })
    push('withdrawal', pieces)
  }

  if (priorityPart === 'freedom') {
    const pieces: Piece[] = []
    for (const key of ['news', 'overnight', 'weekend', 'scalping', 'automated', 'copy_trading'] as const) {
      for (const scope of ['evaluation', 'funded'] as const) {
        const r = read(p.restrictions[key][scope], ctx)
        if (r.kind === 'na') continue
        if (r.kind === 'unknown') pieces.push({ known: false, score: 0, text: `${key}/${scope}: ?` })
        else pieces.push({ known: true, score: cfg.restriction_scores[r.value], text: `${key}/${scope}` })
      }
    }
    const agg = aggregate(pieces)
    const allowed = pieces.filter((x) => x.known && x.score === cfg.restriction_scores.allowed).length
    parts.push({
      key: 'freedom',
      label: PART_LABELS.freedom,
      weight: w('freedom'),
      knownRatio: agg.knownRatio,
      score: agg.score,
      detail: `${allowed} règle(s) autorisée(s) sur ${pieces.length} évaluées (annonces, overnight, week-end, scalping, automatisation, copy trading)`,
    })
  }

  if (a.platforms.length > 0) {
    const r = read(p.platforms, ctx)
    const labels = a.platforms.map((id) => ctx.platformLabels.get(id) ?? id).join(', ')
    push('platform', [
      r.kind === 'value'
        ? { known: true, score: a.platforms.some((id) => (r.value as string[]).includes(id)) ? 1 : 0, text: r.value.some((id) => a.platforms.includes(id)) ? `Compatible avec ${labels}` : `Ne propose pas ${labels}` }
        : { known: false, score: 0, text: `Plateformes ${r.kind === 'unknown' ? unknownWhy(r) : 'non applicables'}` },
    ])
  }

  const totalW = parts.reduce((s, x) => s + x.weight, 0)
  if (totalW === 0) return { parts, match: null, criteriaCoverage: null, rank: 0 }
  const knownW = parts.reduce((s, x) => s + x.weight * x.knownRatio, 0)
  const points = parts.reduce((s, x) => s + x.weight * x.knownRatio * (x.score ?? 0), 0)
  return {
    parts,
    match: knownW === 0 ? null : (points / knownW) * 100,
    criteriaCoverage: (knownW / totalW) * 100,
    rank: (points / totalW) * 100,
  }
}

/* ------------------------------------------------------------------ */
/* Évaluation                                                          */
/* ------------------------------------------------------------------ */

const STATUS_ORDER: Record<Status, number> = { COMPATIBLE: 0, A_VERIFIER: 1, PARTIEL: 2, INCOMPATIBLE: 3 }
const CATEGORY_ORDER: Record<Category, number> = { A: 0, B: 1, C: 2 }

const ADJUST_TEXT: Partial<Record<CriterionKey, string>> = {
  budget: 'Prévoir un budget plus élevé.',
  steps: "Accepter un autre type d'évaluation.",
  drawdown: 'Accepter un autre type de drawdown.',
  platform: 'Utiliser une autre plateforme.',
  news: `Renoncer à ${RESTRICTION_PHRASE.news}.`,
  overnight: `Renoncer à ${RESTRICTION_PHRASE.overnight}.`,
  weekend: `Renoncer à ${RESTRICTION_PHRASE.weekend}.`,
  asian_session: `Renoncer à ${RESTRICTION_PHRASE.asian_session}.`,
  scalping: `Renoncer à ${RESTRICTION_PHRASE.scalping}.`,
}

/** Catégorie d'une liste de critères. Un échec CONFIRMÉ sur un critère indispensable donne toujours C. */
export function categorize(criteria: CriterionResult[]): { category: Category; uncertainBudget: boolean } {
  const requiredFail = criteria.some((c) => c.state === 'fail' && c.weight === 'required')
  if (requiredFail) return { category: 'C', uncertainBudget: false }
  const preferredMiss = criteria.some((c) => (c.state === 'fail' || c.observedOver) && c.weight === 'preferred')
  if (preferredMiss) return { category: 'B', uncertainBudget: false }
  // Budget indispensable avec prix seulement observé au-dessus du plafond : reste incertain, jamais « confirmé ».
  const uncertainBudget = criteria.some((c) => c.key === 'budget' && c.observedOver && c.weight === 'required')
  return { category: 'A', uncertainBudget }
}

function statusOf(category: Category, criteria: CriterionResult[], uncertainBudget: boolean): Status {
  if (category === 'C') return 'INCOMPATIBLE'
  if (category === 'B') return 'PARTIEL'
  return criteria.some((c) => c.state === 'unknown') || uncertainBudget ? 'A_VERIFIER' : 'COMPATIBLE'
}

function evaluateVariant(
  p: Program,
  v: Variant,
  index: number,
  a: Answers,
  ctx: EngineContext,
  shared: CriterionResult[],
  stepsCrit: CriterionResult | null,
): VariantEvaluation {
  const cost = computeVariantCost(v, ctx)
  const criteria: CriterionResult[] = shared.map((c) => ({ ...c }))
  const b = checkBudgetVariant(p, a, v, cost, ctx)
  if (b) criteria.push(b)
  if (stepsCrit) criteria.push({ ...stepsCrit })

  // Poids : indispensable (jamais assoupli par l'outil) ou souhaitable (ajustable). La résidence est toujours indispensable.
  for (const c of criteria) {
    c.weight = weightOf(c.key, a)
    c.relaxed = c.state === 'fail' && c.weight === 'preferred'
  }

  const coverage = computeCoverage(p, index, ctx.scoring, ctx.now)

  // Fraîcheur : une information ESSENTIELLE périmée ne peut confirmer ni compatibilité ni incompatibilité.
  if (coverage.staleEssential.length > 0) {
    const oldest = Math.max(...coverage.staleEssential.map((x) => x.daysOld ?? 0))
    criteria.push({
      key: 'freshness',
      label: CRITERION_LABELS.freshness,
      state: 'unknown',
      relaxed: false,
      weight: 'info',
      message:
        `Vérification nécessaire : ${coverage.staleEssential.length} information(s) essentielle(s) datent de plus de ${ctx.scoring.stale_after_days} jours ` +
        `(la plus ancienne : ${oldest} jours) : ${coverage.staleEssential.slice(0, 4).map((x) => `${x.label} (vérifié le ${x.verified_at})`).join(', ')}${coverage.staleEssential.length > 4 ? '…' : ''}. ` +
        'Ce seuil est un indicateur de maintenance, pas une garantie de validité.',
      evidence: coverage.staleEssential.map((x) => ({ field: x.path, state: 'stale', verified_at: x.verified_at, sources: x.sources, daysOld: x.daysOld })),
    })
  }
  // Lacunes critiques : informations essentielles non confirmées.
  if (ctx.scoring.critical_gaps_block_compatible && coverage.gaps.length > 0) {
    criteria.push({
      key: 'essential_info',
      label: CRITERION_LABELS.essential_info,
      state: 'unknown',
      relaxed: false,
      weight: 'info',
      message: `Informations critiques manquantes (${coverage.gaps.length}) : ${coverage.gaps.slice(0, 5).map((x) => x.label).join(', ')}${coverage.gaps.length > 5 ? '…' : ''}.`,
      evidence: [],
    })
  }

  const { category, uncertainBudget } = categorize(criteria)
  const status = statusOf(category, criteria, uncertainBudget)
  return { variantId: v.id, accountSizeUsd: v.account_size_usd, status, category, criteria, cost, score: computeScore(p, a, cost, ctx), coverage }
}

export function evaluateProgram(p: Program, a: Answers, ctx: EngineContext): Evaluation {
  // Critères propres au programme (communs à toutes les tailles de compte).
  const shared: CriterionResult[] = []
  let marketsMatched: string[] = []
  let marketsMissing: string[] = []
  if (a.markets.length > 0) {
    const m = checkMarkets(p, a, ctx)
    shared.push(m.result)
    marketsMatched = m.matched
    marketsMissing = m.missing
  }
  let instrumentChecks: InstrumentCheck[] = []
  const ic = checkInstruments(p, a, ctx)
  if (ic) {
    shared.push(ic.result)
    instrumentChecks = ic.checks
  }
  shared.push(checkResidence(p, a, ctx))
  const checks: (RestrictionKey | null)[] = [
    a.when.includes('news') ? 'news' : null,
    a.when.includes('overnight') ? 'overnight' : null,
    a.when.includes('weekend') ? 'weekend' : null,
    a.when.includes('asian') ? 'asian_session' : null,
    a.style === 'scalping' ? 'scalping' : null,
  ]
  for (const key of checks) {
    if (!key) continue
    const r = checkRestriction(p, key, ctx)
    if (r) shared.push(r)
  }
  const dd = checkDrawdown(p, a, ctx)
  if (dd) shared.push(dd)
  const pf = checkPlatform(p, a, ctx)
  if (pf) shared.push(pf)
  const stepsCrit = checkSteps(p, a, ctx)

  // Chaque variante est évaluée individuellement, avec ses propres frais et règles.
  const variants = p.variants.map((v, i) => evaluateVariant(p, v, i, a, ctx, shared, stepsCrit))

  // Variante recommandée : meilleure catégorie, meilleur statut, meilleur score, moins chère (de SES propres frais), plus petite.
  const rec = [...variants].sort(
    (x, y) =>
      CATEGORY_ORDER[x.category] - CATEGORY_ORDER[y.category] ||
      STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
      y.score.rank - x.score.rank ||
      (x.cost.lowerBound ?? Infinity) - (y.cost.lowerBound ?? Infinity) ||
      x.accountSizeUsd - y.accountSizeUsd,
  )[0]

  const costs = variants.map((x) => x.cost)
  // Dates de vérification de tout le programme (traçabilité).
  const allDates = collectDates(p)

  const active = rec.criteria.filter((c) => c.weight !== 'info')
  const adjustments: Adjustment[] = active
    .filter((c) => c.weight === 'preferred' && (c.state === 'fail' || c.observedOver))
    .map((c) => ({ key: c.key as CriterionKey, label: c.label, text: ADJUST_TEXT[c.key as CriterionKey] ?? 'Ajuster ce critère.', locked: false }))
  const { uncertainBudget } = categorize(rec.criteria)

  return {
    programId: p.id,
    category: rec.category,
    met: active.filter((c) => c.state === 'ok'),
    missed: active.filter((c) => c.state === 'fail'),
    unconfirmed: rec.criteria.filter((c) => c.state === 'unknown'),
    adjustments,
    uncertainBudget,
    status: rec.status,
    criteria: rec.criteria,
    score: rec.score,
    coverage: rec.coverage,
    variants,
    withdrawal: withdrawalDisclosure(p, p.variants.find((x) => x.id === rec.variantId)),
    recommendedVariantId: rec.variantId,
    recommended: rec.cost,
    marketsMatched,
    marketsMissing,
    marketsTotal: a.markets.length,
    instrumentChecks,
    cheapest: cheapestVariant(costs),
    variantCosts: costs,
    infoCoverage: rec.coverage.overall.pct,
    needsReview: rec.coverage.staleEssential.length > 0,
    staleCount: rec.coverage.staleEssential.length,
    secondaryStale: rec.coverage.secondary.staleCount,
    oldestVerified: allDates[0] ?? null,
    lastVerified: allDates.at(-1) ?? null,
  }
}

function collectDates(p: Program): string[] {
  const out: string[] = []
  const walk = (o: unknown) => {
    if (Array.isArray(o)) o.forEach(walk)
    else if (o && typeof o === 'object') {
      const r = o as Record<string, unknown>
      if (typeof r.verified_at === 'string' && 'status' in r) out.push(r.verified_at)
      Object.values(r).forEach(walk)
    }
  }
  walk(p)
  return out.sort()
}

/** Tri : catégorie, puis nombre d'écarts, puis budget incertain en dernier, puis statut, score, couverture, nom. */
export function compareEvaluations(x: Evaluation, y: Evaluation, nameOf: (id: string) => string): number {
  return (
    CATEGORY_ORDER[x.category] - CATEGORY_ORDER[y.category] ||
    x.adjustments.length - y.adjustments.length ||
    Number(x.uncertainBudget) - Number(y.uncertainBudget) ||
    STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
    y.score.rank - x.score.rank ||
    y.coverage.essential.pct - x.coverage.essential.pct ||
    y.infoCoverage - x.infoCoverage ||
    nameOf(x.programId).localeCompare(nameOf(y.programId), 'fr')
  )
}

export function evaluateAll(ds: Dataset, a: Answers, opts: { now?: Date } = {}): Evaluation[] {
  const ctx = makeContext(ds, opts.now ?? new Date())
  const names = new Map(ds.programs.map((p) => [p.id, p.name]))
  return ds.programs
    .map((p) => evaluateProgram(p, a, ctx))
    .sort((x, y) => compareEvaluations(x, y, (id) => names.get(id) ?? id))
}
