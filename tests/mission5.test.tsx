import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { readRawFromDisk } from '../scripts/read-raw'
import { studentView } from '../src/data/load'
import { validateRaw } from '../src/data/validate'
import { evaluateProgram, resolveEligibility } from '../src/engine/evaluate'
import { collectSourced } from '../src/data/sourced'
import type { Program } from '../src/data/schema'
import { NOW, fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const realIds = fullDs.programs.filter((p) => !p.demo).map((p) => p.id)
const crit = (e: ReturnType<typeof evaluateProgram>, k: string) => e.criteria.find((c) => c.key === k)
const ANY_MARKET = (p: Program) => (p.contract_types.value?.includes('futures') ? 'futures_index' : 'forex')

describe('Mission 5 · 1. Filtre des challenges', () => {
  const want = { one: 1, two: 2, none: 0 } as const
  for (const choice of ['one', 'two', 'none'] as const) {
    it(`choix explicite « ${choice} » : bloquant pour tous les programmes réels`, () => {
      for (const id of realIds) {
        const p = real(id)
        const a = profile({ markets: [ANY_MARKET(p)], steps: choice, residence: { country: 'FR', region: null } })
        const e = evaluateProgram(p, a, fullCtx)
        const c = crit(e, 'steps')
        expect(c, id).toBeDefined()
        const n = p.evaluation.steps.value
        if (p.evaluation.steps.status !== 'confirmed') expect(c!.state, id).toBe('unknown')
        else if (n === want[choice]) expect(c!.state, id).toBe('ok')
        else {
          expect(c!.state, id).toBe('fail')
          // préférence par défaut → alternative proche ; jamais « compatible »
          expect(e.status, id).toBe('PARTIEL')
          const locked = evaluateProgram(p, { ...a, locks: { steps: 'required' } }, fullCtx)
          expect(locked.status, id).toBe('INCOMPATIBLE')
        }
      }
    })
  }
  it('« Peu importe » : aucun critère d’étapes, aucune exclusion', () => {
    for (const id of realIds) {
      const p = real(id)
      const e = evaluateProgram(p, profile({ markets: [ANY_MARKET(p)], steps: 'any', residence: { country: 'FR', region: null } }), fullCtx)
      expect(crit(e, 'steps'), id).toBeUndefined()
    }
  })
  it('exemples concrets', () => {
    const f = (id: string, steps: 'one' | 'two' | 'none') => evaluateProgram(real(id), profile({ markets: ['forex'], steps, locks: { steps: 'required' } }), fullCtx).status
    expect(f('ftmo-2step-standard', 'one')).toBe('INCOMPATIBLE')
    expect(f('ftmo-1step-standard', 'one')).not.toBe('INCOMPATIBLE')
    expect(f('ftmo-instant', 'none')).not.toBe('INCOMPATIBLE')
    expect(f('ftmo-instant', 'two')).toBe('INCOMPATIBLE')
    expect(f('the5ers-bootcamp', 'two')).toBe('INCOMPATIBLE') // 3 étapes
  })
  it('le choix peut être assoupli explicitement (statut partiel), jamais silencieusement', () => {
    const a = profile({ markets: ['forex'], steps: 'one' })
    const e = evaluateProgram(real('ftmo-2step-standard'), a, fullCtx)
    expect(e.status).toBe('PARTIEL')
    expect(e.adjustments.map((x) => x.key)).toContain('steps')
  })
})

describe('Mission 5 · 2. Prix observés', () => {
  it('toute observation de prix est datée, officielle et jamais confirmée', () => {
    let n = 0
    for (const id of realIds) {
      const p = real(id)
      for (const o of p.observed_prices ?? []) {
        n++
        expect(o.observed_on).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(fullDs.sources.find((s) => s.id === o.source)?.type).toBe('official')
        expect(o.amount).toBeGreaterThan(0)
      }
      if (id.startsWith('ftmo') || id.startsWith('the5ers') || id.startsWith('fundednext') || id.startsWith('fundingpips'))
        for (const v of p.variants) {
          expect(v.pricing.one_time.status, id).not.toBe('confirmed')
          expect(v.pricing.monthly.status, id).not.toBe('confirmed')
        }
    }
    expect(n).toBeGreaterThan(60)
  })
  it('budget : un coût obligatoire inconnu reste « À VÉRIFIER » (jamais compatible ni incompatible)', () => {
    const noPrice = (p: Program) => p.variants.every((v) => v.pricing.one_time.status !== 'confirmed' && v.pricing.monthly.status !== 'confirmed')
    for (const id of realIds.filter((i) => noPrice(real(i)))) {
      const p = real(id)
      const e = evaluateProgram(p, profile({ markets: [ANY_MARKET(p)], budget: 'lt50', residence: { country: 'FR', region: null } }), fullCtx)
      const c = crit(e, 'budget')
      expect(c, id).toBeDefined()
      expect(c!.state, id).not.toBe('ok')
      expect(c!.state, id).not.toBe('fail') // un prix seulement observé ne confirme ni n'infirme jamais le budget
      expect(['A_VERIFIER', 'INCOMPATIBLE', 'PARTIEL']).toContain(e.status)
      expect(e.status === 'COMPATIBLE').toBe(false)
    }
  })
  it('la page de détail affiche montant, date, « Prix à vérifier » et un lien officiel', () => {
    window.location.hash = '#/programme/ftmo-2step-standard'
    render(<App dataset={fullDs} errors={[]} now={NOW} />)
    expect(screen.getAllByText(/Prix à vérifier/).length).toBeGreaterThan(0)
    const table = screen.getByText(/Prix observés sur le site officiel/).closest('div')!
    expect(within(table).getByText(/540/)).toBeInTheDocument()
    expect(within(table).getAllByText(/15 novembre 2026|2026-11-15/).length).toBeGreaterThan(0)
    const links = within(table).getAllByRole('link', { name: /Site officiel/ })
    expect(links[0].getAttribute('href')).toMatch(/^https:\/\/(promo\.)?ftmo\.com|^https:\/\/ftmo\.com/)
    expect(screen.queryByText(/prix garanti/i, { selector: 'strong' })).toBeNull()
  })
  it('un programme sans prix relevé affiche « non confirmé »', () => {
    window.location.hash = '#/programme/the5ers-hyper-growth'
    render(<App dataset={fullDs} errors={[]} now={NOW} />)
    expect(screen.getByText(/Aucun prix n'a pu être relevé/)).toBeInTheDocument()
  })
})

describe('Mission 5 · 3. Restrictions géographiques', () => {
  const qc = { country: 'CA', region: 'QC' }
  it('trois états : admissible, exclu, non confirmé', () => {
    const el = real('ftmo-2step-standard').eligibility.value!
    expect(resolveEligibility(el, { country: 'FR', region: null }).state).toBe('eligible')
    expect(resolveEligibility(el, { country: 'RU', region: null }).state).toBe('excluded')
    const t5 = real('the5ers-high-stakes').eligibility.value!
    expect(resolveEligibility(t5, { country: 'FR', region: null }).state).toBe('unconfirmed')
  })
  it('Québec : l’absence d’exclusion (FTMO) ne donne jamais une admissibilité provinciale', () => {
    for (const id of ['ftmo-2step-standard', 'ftmo-1step-swing', 'ftmo-instant']) {
      const r = crit(evaluateProgram(real(id), profile({ markets: ['forex'], residence: qc }), fullCtx), 'residence')!
      expect(r.state, id).toBe('unknown')
      expect(r.message).toMatch(/absence d'exclusion ne vaut pas admissibilité provinciale/)
    }
  })
  it('Québec : FundedNext, The5ers et MFFU restent « non confirmé »', () => {
    for (const id of ['fundednext-stellar-1step', 'the5ers-high-stakes', 'myfundedfutures-rapid']) {
      const p = real(id)
      const r = crit(evaluateProgram(p, profile({ markets: [ANY_MARKET(p)], residence: qc }), fullCtx), 'residence')!
      expect(r.state, id).toBe('unknown')
    }
  })
  it('Québec : le message distingue challenge, compte funded et paiements', () => {
    const r = crit(evaluateProgram(real('ftmo-2step-standard'), profile({ markets: ['forex'], residence: qc }), fullCtx), 'residence')!
    expect(r.message).toMatch(/Challenge/)
    expect(r.message).toMatch(/compte funded/)
    expect(r.message).toMatch(/paiements/)
  })
  it('Québec : une restriction officielle du challenge exclut, un statut « admis » confirme', () => {
    const p = real('ftmo-2step-standard')
    p.quebec_by_stage = p.quebec_by_stage!.map((q) => (q.stage === 'evaluation' ? { ...q, state: 'restreint' as const } : q))
    expect(crit(evaluateProgram(p, profile({ markets: ['forex'], residence: qc }), fullCtx), 'residence')!.state).toBe('fail')
    p.quebec_by_stage = p.quebec_by_stage.map((q) => (q.stage === 'evaluation' ? { ...q, state: 'admis' as const } : q))
    expect(crit(evaluateProgram(p, profile({ markets: ['forex'], residence: qc }), fullCtx), 'residence')!.state).toBe('ok')
  })
  it('hors Québec, le comportement par pays est inchangé', () => {
    const r = crit(evaluateProgram(real('ftmo-2step-standard'), profile({ markets: ['forex'], residence: { country: 'FR', region: null } }), fullCtx), 'residence')!
    expect(r.state).toBe('ok')
    expect(r.message).toMatch(/paiements/)
  })
  it('l’exclusion d’un pays s’applique à toutes les variantes de chaque programme', () => {
    for (const id of realIds) {
      const p = real(id)
      const ex = p.eligibility.value?.excluded.find((c) => !c.includes('-'))
      if (!ex) continue
      const e = evaluateProgram(p, profile({ markets: [ANY_MARKET(p)], residence: { country: ex, region: null } }), fullCtx)
      for (const v of e.variants) expect(v.status, `${id}/${v.variantId}/${ex}`).toBe('INCOMPATIBLE')
    }
  })
})

describe('Mission 5 · 4. Audit des règles critiques (données)', () => {
  it('les limites en dollars sont positives et la limite quotidienne ne dépasse pas la perte maximale', () => {
    for (const id of realIds) {
      for (const v of real(id).variants) {
        for (const part of [v.evaluation, v.funded] as const) {
          const d = part.daily_loss_limit_usd, m = part.max_drawdown_usd
          for (const x of [d, m]) if (x.status === 'confirmed') expect(x.value, `${id}/${v.id}`).toBeGreaterThan(0)
          if (d.status === 'confirmed' && m.status === 'confirmed') expect(d.value!, `${id}/${v.id}`).toBeLessThanOrEqual(m.value!)
        }
      }
    }
  })
  it('toute valeur confirmée d’un programme réel cite une source officielle', () => {
    for (const id of realIds) {
      for (const f of collectSourced(real(id))) {
        if (f.sv.status !== 'confirmed') continue
        expect(f.sv.sources.length, `${id} ${f.path}`).toBeGreaterThan(0)
        expect(f.sv.sources.some((s) => fullDs.sources.find((x) => x.id === s)?.type === 'official'), `${id} ${f.path}`).toBe(true)
      }
    }
  })
  it('aucune valeur confirmée n’est périmée (60 jours) à la date de la version candidate', () => {
    const limit = 60 * 86400000
    for (const id of realIds) {
      for (const f of collectSourced(real(id))) {
        if (f.sv.status === 'confirmed' && f.sv.verified_at) expect(NOW.getTime() - new Date(f.sv.verified_at).getTime(), `${id} ${f.path}`).toBeLessThan(limit)
      }
    }
  })
  it('un conflit non résolu reste « non confirmé » (contradictions connues)', () => {
    expect(real('the5ers-high-stakes').variants[0].evaluation.profit_target_usd.status).toBe('unconfirmed')
    expect(real('fundednext-stellar-lite').variants[0].evaluation.min_trading_days.status).toBe('unconfirmed')
    expect(real('fundingpips-1step-flex').funded.profit_split_pct.status).toBe('unconfirmed')
    for (const id of ['tradeday-qp-intraday', 'tradeday-qp-eod', 'tradeday-fp-eod']) expect(real(id).variants[0].evaluation.min_trading_days.status).toBe('unconfirmed')
  })
  it('séparation évaluation / funded : restrictions et drawdown portent les deux étapes', () => {
    for (const id of realIds) {
      const p = real(id)
      for (const k of ['news', 'overnight', 'weekend'] as const) {
        expect(p.restrictions[k]).toHaveProperty('evaluation')
        expect(p.restrictions[k]).toHaveProperty('funded')
      }
      expect(p.funded).toHaveProperty('drawdown_type')
      expect(p.evaluation).toHaveProperty('drawdown_type')
    }
  })
  it('futures et CFD ne sont jamais confondus', () => {
    for (const id of realIds) {
      const t = real(id).contract_types.value
      if (!t) continue
      const fut = t.includes('futures')
      const cfd = t.includes('cfd')
      expect(fut && cfd, id).toBe(false)
    }
  })
})

describe('Mission 5 · 5. Version étudiante : aucune démonstration', () => {
  const raw = readRawFromDisk()
  it('studentView retire programmes, entreprises et sources de démonstration', () => {
    const { dataset, errors } = validateRaw(studentView(raw), NOW)
    expect(errors).toEqual([])
    expect(dataset!.programs.some((p) => p.demo)).toBe(false)
    expect(dataset!.firms.some((f) => f.demo)).toBe(false)
    expect(dataset!.sources.some((s) => s.type === 'demo')).toBe(false)
    expect(dataset!.programs.length).toBe(realIds.length)
  })
  it('l’interface étudiante n’affiche ni bannière ni badge de démo', () => {
    const { dataset } = validateRaw(studentView(raw), NOW)
    window.location.hash = '#/explorer'
    render(<App dataset={dataset!} errors={[]} now={NOW} />)
    expect(screen.queryByText(/démonstrations? fictives?/i)).toBeNull()
    expect(screen.queryByText(/DÉMO/)).toBeNull()
    expect(screen.queryByText(/Alpha|Beta|Gamma/)).toBeNull()
  })
})
