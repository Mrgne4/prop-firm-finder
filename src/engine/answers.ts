import type { Contract, DrawdownType } from '../data/schema'

export type WhenKey = 'regular' | 'asian' | 'news' | 'overnight' | 'weekend' | 'none'
export type StyleKey = 'scalping' | 'day' | 'swing' | 'unsure'
export type DrawdownPref = DrawdownType | 'any' | 'unknown'
export type BudgetKey = 'lt50' | '50_100' | '100_200' | 'gt200' | 'none'
export type StepsPref = 'one' | 'two' | 'none' | 'any'
export type PriorityKey = 'simple_drawdown' | 'low_cost' | 'withdrawals' | 'freedom' | 'platform' | 'none'

/** Critères bloquants. « residence » n'est jamais assouplissable. */
export type CriterionKey =
  | 'markets'
  | 'instruments'
  | 'residence'
  | 'budget'
  | 'steps'
  | 'news'
  | 'overnight'
  | 'weekend'
  | 'asian_session'
  | 'scalping'
  | 'drawdown'
  | 'platform'

/** Poids d'un critère : « required » = indispensable (jamais assoupli par l'outil), « preferred » = souhaitable. */
export type Weight = 'required' | 'preferred'

/** Critères dont le poids ne peut pas être modifié : marché, instruments, résidence. */
export const FIXED_REQUIRED: CriterionKey[] = ['markets', 'instruments', 'residence']
/** Restrictions de trading : indispensables par défaut, passables en « souhaitable ». */
export const RESTRICTION_KEYS: CriterionKey[] = ['news', 'overnight', 'weekend', 'asian_session', 'scalping']
/** Préférences : souhaitables par défaut, passables en « indispensable » (cadenas). */
export const PREFERENCE_KEYS: CriterionKey[] = ['budget', 'steps', 'drawdown', 'platform']
/** Critères dont le poids est modifiable par l'étudiant. */
export const ADJUSTABLE: CriterionKey[] = [...RESTRICTION_KEYS, ...PREFERENCE_KEYS]

/** Poids effectif d'un critère : choix explicite de l'étudiant, sinon valeur par défaut. */
export function weightOf(key: string, a: Pick<Answers, 'locks'>): Weight {
  if (FIXED_REQUIRED.includes(key as CriterionKey)) return 'required'
  const set = a.locks?.[key as CriterionKey]
  if (set) return set
  return RESTRICTION_KEYS.includes(key as CriterionKey) ? 'required' : 'preferred'
}

export type Residence = {
  country: string | null
  /** Province / État (« QC », « NY »). Facultatif. */
  region: string | null
  /** Régions que l'on sait écartées (ex. « Canada — autres provinces » ⇒ ['QC']). */
  notRegions?: string[]
}

export type Answers = {
  markets: string[]
  /** Instruments précis à vérifier un par un (identifiants du catalogue : NQ, MNQ, MBT, EURUSD…). Facultatif. */
  instruments: string[]
  /** Forme d'instrument souhaitée par marché : « any » ou un type de contrat. */
  marketForms: Record<string, 'any' | Contract>
  style: StyleKey | null
  when: WhenKey[]
  drawdown: DrawdownPref | null
  budget: BudgetKey | null
  steps: StepsPref | null
  priority: PriorityKey | null
  platforms: string[]
  residence: Residence
  /** Poids choisis par l'étudiant (cadenas). Absent = valeur par défaut. */
  locks: Partial<Record<CriterionKey, Weight>>
}

export const emptyAnswers = (): Answers => ({
  markets: [],
  instruments: [],
  marketForms: {},
  style: null,
  when: [],
  drawdown: null,
  budget: null,
  steps: null,
  priority: null,
  platforms: [],
  residence: { country: null, region: null },
  locks: {},
})
