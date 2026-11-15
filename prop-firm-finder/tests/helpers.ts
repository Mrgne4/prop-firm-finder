import { readRawFromDisk } from '../scripts/read-raw'
import { validateRaw } from '../src/data/validate'
import type { Dataset, Program, Sourced } from '../src/data/schema'
import { emptyAnswers, type Answers } from '../src/engine/answers'
import { makeContext, type EngineContext } from '../src/engine/evaluate'

export const NOW = new Date('2026-11-15T12:00:00Z')

export function loadDataset(): Dataset {
  const { errors, dataset } = validateRaw(readRawFromDisk(), NOW)
  if (!dataset) throw new Error('Données invalides : ' + JSON.stringify(errors, null, 2))
  return dataset
}

/** Jeu complet : démos + données réelles. */
export const fullDs = loadDataset()
/** Jeu de test historique : uniquement les 3 programmes FICTIFS (les tests de moteur/IU n'en dépendent pas des données réelles). */
export const ds: Dataset = {
  ...fullDs,
  programs: fullDs.programs.filter((p) => p.demo),
  firms: fullDs.firms.filter((f) => f.demo),
}
export const ctx: EngineContext = makeContext(ds, NOW)
export const fullCtx: EngineContext = makeContext(fullDs, NOW)
export const demo = (id: string): Program => structuredClone(ds.programs.find((p) => p.id === id) as Program)
export const ALPHA = 'demo-alpha-futures-eod'
export const BETA = 'demo-beta-futures-intraday'
export const GAMMA = 'demo-gamma-cfd-forex'

export const conf = <T>(value: T, verified_at = '2026-11-15'): Sourced<T> => ({ status: 'confirmed', value, sources: ['demo-fiction'], verified_at })
export const unc = <T>(): Sourced<T> => ({ status: 'unconfirmed', value: null, sources: [], verified_at: null })
export const na = <T>(): Sourced<T> => ({ status: 'not_applicable', value: null, sources: [], verified_at: null })

/** Profil de référence : futures sur indices, budget 50–100 $, résident du Québec. */
export function profile(over: Partial<Answers> = {}): Answers {
  return {
    ...emptyAnswers(),
    markets: ['futures_index'],
    style: 'day',
    when: ['regular'],
    drawdown: 'any',
    budget: '50_100',
    steps: 'any',
    priority: 'low_cost',
    residence: { country: 'CA', region: 'QC' },
    ...over,
  }
}
