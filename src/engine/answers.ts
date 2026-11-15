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

export const RELAXABLE: CriterionKey[] = ['markets', 'instruments', 'budget', 'steps', 'news', 'overnight', 'weekend', 'asian_session', 'scalping']

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
})
