import type { Dataset, Program } from '../data/schema'
import type { Answers } from './answers'
import { computeVariantCosts, cheapestVariant, evaluateAll, makeContext, observedFor, type EngineContext } from './evaluate'

/**
 * BUDGET DYNAMIQUE
 * UNITÉ DE COMPTAGE : le PROGRAMME (une offre, ex. « Topstep — Trading Combine »), quel que soit le nombre de tailles de compte.
 * Chaque programme est compté UNE seule fois, à son prix de référence : le coût de départ du plus petit compte connu.
 * Les sommes des fourchettes + « prix inconnu » + « en euros » = le nombre de programmes possibles. Jamais plus.
 */

export type RefPrice = {
  amount: number
  currency: 'USD' | 'EUR'
  /** « confirmed » : prix confirmé par une source officielle. « observed » : relevé sur le site, à vérifier. */
  basis: 'confirmed' | 'observed'
  observedOn?: string
  /** Le prix concerne la plus petite taille de compte pour laquelle un prix est connu, pas toutes. */
  label: string
  /** Au moins une taille de compte n'a aucun prix connu : le vrai prix de départ peut être plus bas. */
  partial: boolean
}

/** Prix de référence d'un programme : confirmé d'abord, sinon observé (hors code promo), sinon inconnu (null). */
export function referencePrice(p: Program, ctx: EngineContext): RefPrice | null {
  const costs = computeVariantCosts(p, ctx)
  const cheapest = cheapestVariant(costs)
  if (cheapest && cheapest.lowerBound !== null) {
    return { amount: cheapest.lowerBound, currency: 'USD', basis: 'confirmed', label: cheapest.label, partial: costs.some((c) => c.lowerBound === null && observedFor(p, c.variantId) === null) }
  }
  const obs = (p.observed_prices ?? []).filter((x) => x.kind !== 'promo')
  const usd = obs.filter((x) => x.currency === 'USD')
  const pool = usd.length > 0 ? usd : obs
  if (pool.length === 0) return null
  const m = pool.reduce((best, x) => (x.amount < best.amount ? x : best))
  const partial = p.variants.some((v) => observedFor(p, v.id) === null)
  return { amount: m.amount, currency: m.currency, basis: 'observed', observedOn: m.observed_on, label: m.label, partial }
}

export type BracketId = 'lt50' | '50_100' | '100_200' | 'gt200' | 'unknown' | 'eur'
export const BRACKET_LABEL: Record<BracketId, string> = {
  lt50: 'Moins de 50 $',
  '50_100': '50 à 100 $',
  '100_200': '100 à 200 $',
  gt200: 'Plus de 200 $',
  unknown: 'Prix inconnu',
  eur: 'Prix en euros (non converti)',
}

export type Bracket = { id: BracketId; label: string; count: number; programs: { id: string; name: string; price: RefPrice | null }[] }

function bracketOf(r: RefPrice | null, caps: Record<string, number | null>): BracketId {
  if (!r) return 'unknown'
  if (r.currency === 'EUR') return 'eur'
  if (r.amount <= (caps.lt50 as number)) return 'lt50'
  if (r.amount <= (caps['50_100'] as number)) return '50_100'
  if (r.amount <= (caps['100_200'] as number)) return '100_200'
  return 'gt200'
}

/**
 * Fourchettes de prix des programmes ENCORE POSSIBLES (catégories A et B, sans tenir compte du budget lui-même).
 * Seules les fourchettes non vides sont retournées.
 */
export function budgetBrackets(ds: Dataset, a: Answers, now: Date): { brackets: Bracket[]; possible: number } {
  const ctx = makeContext(ds, now)
  const evals = evaluateAll(ds, { ...a, budget: null }, { now }).filter((e) => e.category !== 'C')
  const names = new Map(ds.programs.map((p) => [p.id, p]))
  const out = new Map<BracketId, Bracket>()
  for (const e of evals) {
    const p = names.get(e.programId) as Program
    const price = referencePrice(p, ctx)
    const id = bracketOf(price, ds.scoring.budget_caps_usd)
    const b = out.get(id) ?? { id, label: BRACKET_LABEL[id], count: 0, programs: [] }
    b.count++
    b.programs.push({ id: p.id, name: p.name, price })
    out.set(id, b)
  }
  const order: BracketId[] = ['lt50', '50_100', '100_200', 'gt200', 'eur', 'unknown']
  return { brackets: order.filter((k) => out.has(k)).map((k) => out.get(k) as Bracket), possible: evals.length }
}
