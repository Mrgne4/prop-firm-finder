import { describe, expect, it } from 'vitest'
import { computeCoverage } from '../src/engine/coverage'
import { evaluateProgram, resolveEligibility } from '../src/engine/evaluate'
import { validateRaw } from '../src/data/validate'
import { readRawFromDisk } from '../scripts/read-raw'
import { ALPHA, BETA, GAMMA, NOW, conf, ctx, demo, profile, unc } from './helpers'

const el = (over = {}) => ({ eligible: ['FR'], excluded: ['IR'], unconfirmed: ['CN'], unlisted: 'unconfirmed' as const, ...over })

describe('2B-1 · variantes évaluées individuellement', () => {
  it('chaque variante a son statut, son coût et sa couverture', () => {
    const e = evaluateProgram(demo(ALPHA), profile(), ctx)
    expect(e.variants.length).toBe(demo(ALPHA).variants.length)
    for (const v of e.variants) expect(v.cost.variantId).toBe(v.variantId)
  })
  it("le budget d'une variante n'emprunte pas le prix d'une autre", () => {
    const p = demo(ALPHA)
    const e = evaluateProgram(p, profile({ budget: 'lt50' }), ctx)
    const cheapest = e.variants.reduce((a, b) => ((a.cost.lowerBound ?? 1e9) <= (b.cost.lowerBound ?? 1e9) ? a : b))
    const dearest = e.variants.reduce((a, b) => ((a.cost.lowerBound ?? 0) >= (b.cost.lowerBound ?? 0) ? a : b))
    if ((dearest.cost.lowerBound ?? 0) > 49.99) {
      expect(dearest.criteria.find((c) => c.key === 'budget')?.state).toBe('fail')
      expect(dearest.status).toBe('INCOMPATIBLE')
    }
    expect(cheapest.variantId).toBeTruthy()
  })
  it("les frais d'activation d'une variante ne s'appliquent pas aux autres", () => {
    const p = demo(ALPHA)
    p.variants[0].pricing.activation_fee = conf(500)
    const e = evaluateProgram(p, profile({ budget: '100_200' }), ctx)
    expect(e.variants[0].cost.activation.amount).toBe(500)
    expect(e.variants[1].cost.activation.amount).not.toBe(500)
  })
  it('la variante recommandée est la mieux classée, jamais une variante incompatible si une autre est meilleure', () => {
    const p = demo(ALPHA)
    p.variants[0].pricing.one_time = conf(900)
    const e = evaluateProgram(p, profile({ budget: 'lt50' }), ctx)
    const rec = e.variants.find((v) => v.variantId === e.recommendedVariantId)!
    expect(e.variants.every((v) => ['COMPATIBLE', 'A_VERIFIER', 'PARTIEL', 'INCOMPATIBLE'].indexOf(rec.status) <= ['COMPATIBLE', 'A_VERIFIER', 'PARTIEL', 'INCOMPATIBLE'].indexOf(v.status))).toBe(true)
    expect(e.status).toBe(rec.status)
  })
})

describe('2B-2 · admissibilité géographique explicite', () => {
  it('admissible / exclu / non confirmé / autres pays', () => {
    expect(resolveEligibility(el(), { country: 'FR', region: null }).state).toBe('eligible')
    expect(resolveEligibility(el(), { country: 'IR', region: null }).state).toBe('excluded')
    expect(resolveEligibility(el(), { country: 'CN', region: null }).state).toBe('unconfirmed')
    expect(resolveEligibility(el(), { country: 'CA', region: null }).state).toBe('unconfirmed')
  })
  it("l'absence d'exclusion ne confirme jamais l'admissibilité", () => {
    const p = demo(ALPHA)
    p.eligibility = conf(el())
    const e = evaluateProgram(p, profile({ residence: { country: 'CA', region: null } }), ctx)
    expect(e.criteria.find((c) => c.key === 'residence')?.state).toBe('unknown')
    expect(e.status).not.toBe('COMPATIBLE')
  })
  it("« unlisted: eligible » admet les autres pays seulement si la source l'énonce", () => {
    expect(resolveEligibility(el({ unlisted: 'eligible' }), { country: 'CA', region: null }).state).toBe('eligible')
    expect(resolveEligibility(el({ unlisted: 'excluded' }), { country: 'CA', region: null }).state).toBe('excluded')
  })
  it('région : la région prime sur le pays ; région inconnue + sort divergent → ambigu', () => {
    const e = { eligible: ['CA'], excluded: ['CA-QC'], unconfirmed: [], unlisted: 'unconfirmed' as const }
    expect(resolveEligibility(e, { country: 'CA', region: 'QC' }).state).toBe('excluded')
    expect(resolveEligibility(e, { country: 'CA', region: 'ON' }).state).toBe('eligible')
    expect(resolveEligibility(e, { country: 'CA', region: null }).state).toBe('ambiguous')
  })
  it('liste non confirmée ou périmée → jamais ok ni fail', () => {
    const p = demo(ALPHA)
    p.eligibility = unc()
    expect(evaluateProgram(p, profile(), ctx).criteria.find((c) => c.key === 'residence')?.state).toBe('unknown')
    p.eligibility = conf(el({ excluded: ['CA'] }), '2026-01-01')
    expect(evaluateProgram(p, profile({ residence: { country: 'CA', region: null } }), ctx).criteria.find((c) => c.key === 'residence')?.state).toBe('unknown')
  })
  it('le validateur refuse un pays dans deux listes', () => {
    const raw: any = readRawFromDisk()
    const prog = raw.programs[`${ALPHA}.json`] as any
    prog.eligibility.value = el({ eligible: ['FR'], excluded: ['FR'] })
    expect(validateRaw(raw, NOW).errors.some((e) => e.message.includes('à la fois'))).toBe(true)
  })
})

describe('2B-3 · fraîcheur', () => {
  it('une règle essentielle périmée ne confirme pas une compatibilité', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight = { evaluation: conf('allowed', '2026-01-01'), funded: conf('allowed', '2026-01-01') }
    const e = evaluateProgram(p, profile({ when: ['overnight'] }), ctx)
    expect(e.criteria.find((c) => c.key === 'overnight')?.state).toBe('unknown')
    expect(e.status).not.toBe('COMPATIBLE')
    expect(e.needsReview).toBe(true)
  })
  it('une règle essentielle périmée ne confirme pas une incompatibilité', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight = { evaluation: conf('forbidden', '2026-01-01'), funded: conf('forbidden', '2026-01-01') }
    const e = evaluateProgram(p, profile({ when: ['overnight'] }), ctx)
    expect(e.criteria.find((c) => c.key === 'overnight')?.state).toBe('unknown')
    expect(e.status).toBe('A_VERIFIER')
  })
  it('chaque critère garde sa traçabilité (date, source, état)', () => {
    const e = evaluateProgram(demo(ALPHA), profile(), ctx)
    const r = e.criteria.find((c) => c.key === 'residence')!
    expect(r.evidence[0].verified_at).toBeTruthy()
    expect(r.evidence[0].sources.length).toBeGreaterThan(0)
  })
  it('une information secondaire périmée est signalée sans changer le statut', () => {
    const p = demo(ALPHA)
    const before = evaluateProgram(p, profile(), ctx).status
    p.summary = p.summary
    ;(p.evaluation as any).description = conf('Texte ancien', '2026-01-01')
    const e = evaluateProgram(p, profile(), ctx)
    expect(e.status).toBe(before)
    expect(e.secondaryStale).toBeGreaterThanOrEqual(1)
  })
})

describe('2B-4 · couverture essentielle / secondaire', () => {
  it('une information essentielle manquante est signalée même si la couverture globale est élevée', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight.funded = unc()
    const e = evaluateProgram(p, profile(), ctx)
    expect(e.coverage.gaps.length).toBeGreaterThan(0)
    expect(e.criteria.some((c) => c.key === 'essential_info')).toBe(true)
    expect(e.status).not.toBe('COMPATIBLE')
    expect(e.coverage.overall.pct).toBeGreaterThan(90)
    expect(e.coverage.essential.pct).toBeLessThan(100)
  })
  it('une information secondaire manquante ne bloque pas « Compatible »', () => {
    const p = demo(ALPHA)
    ;(p.evaluation as any).description = unc()
    const c = computeCoverage(p, 0, ctx.scoring, NOW)
    expect(c.gaps.length).toBe(0)
  })
  it('Bêta : profit_split essentiel périmé → signalé comme à revérifier', () => {
    const e = evaluateProgram(demo(BETA), profile(), ctx)
    expect(e.coverage.staleEssential.length).toBeGreaterThan(0)
  })
  it('les champs essentiels d’une variante ne mélangent pas ceux des autres', () => {
    const p = demo(GAMMA)
    p.variants[0].pricing.one_time = unc()
    const c0 = computeCoverage(p, 0, ctx.scoring, NOW)
    const c1 = computeCoverage(p, 1, ctx.scoring, NOW)
    expect(c0.gaps.length).toBeGreaterThan(c1.gaps.length)
  })
})
