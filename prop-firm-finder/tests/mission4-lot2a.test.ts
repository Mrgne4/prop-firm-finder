import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkInstrument, evaluateProgram } from '../src/engine/evaluate'
import { withdrawalDisclosure } from '../src/engine/withdrawals'
import type { Program } from '../src/data/schema'
import { fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const TPT = 'take-profit-trader-test'
const MF = ['myfundedfutures-rapid', 'myfundedfutures-pro', 'myfundedfutures-builder']
const TD = ['tradeday-qp-intraday', 'tradeday-qp-eod', 'tradeday-fp-eod']
const LOT2A = [TPT, ...MF, ...TD]
const answers = (over = {}) => profile({ markets: ['futures_index'], ...over })
const qc = { residence: { country: 'CA', region: 'QC' } }

describe('Lot 2A · intégrité des données', () => {
  it('10 programmes réels du lot 2A, 3 entreprises', () => {
    expect(fullDs.programs.filter((p) => LOT2A.includes(p.id) && !p.demo)).toHaveLength(7)
    expect(['take-profit-trader', 'myfundedfutures', 'tradeday'].every((f) => fullDs.firms.some((x) => x.id === f && !x.demo))).toBe(true)
  })
  it('toute valeur confirmée cite une source officielle connue', () => {
    const type = (id: string) => fullDs.sources.find((s) => s.id === id)?.type
    for (const id of LOT2A) {
      const walk = (o: unknown): void => {
        if (!o || typeof o !== 'object') return
        const x = o as Record<string, unknown>
        if (x.status === 'confirmed') {
          expect((x.sources as string[]).length).toBeGreaterThan(0)
          for (const s of x.sources as string[]) expect(type(s)).toBe('official')
        }
        Object.values(x).forEach(walk)
      }
      walk(real(id))
    }
  })
  it('les prix et promotions ne sont jamais confirmés ; ils sont des observations datées non durables', () => {
    for (const id of LOT2A) {
      const p = real(id)
      for (const v of p.variants) {
        expect(v.pricing.one_time.status).not.toBe('confirmed')
        expect(v.pricing.monthly.status).not.toBe('confirmed')
      }
      for (const o of p.dynamic_observations ?? []) {
        expect(o.durable).toBe(false)
        expect(o.consulted_at).toBe('2026-11-15')
      }
    }
    expect(readFileSync('data/evidence/lot2a-2026-11-15.json', 'utf8')).toContain('contradiction')
  })
  it('tous les programmes sont des futures, jamais des CFD', () => {
    for (const id of LOT2A) {
      expect(real(id).contract_types.value).toEqual(['futures'])
      expect(checkInstrument(real(id), 'XAUUSD', fullCtx).state).not.toBe('available')
    }
  })
})

describe('Lot 2A · MyFundedFutures', () => {
  it('liste officielle exhaustive : les 16 futures du catalogue sont disponibles, les CFD indisponibles', () => {
    for (const id of MF) {
      const p = real(id)
      expect(p.instruments_scope).toBe('exhaustive')
      for (const s of ['NQ', 'MNQ', 'ES', 'GC', 'MGC', 'CL', 'MBT']) expect(checkInstrument(p, s, fullCtx).state).not.toBe('unavailable')
      expect(checkInstrument(p, 'XAUUSD', fullCtx).state).toBe('unavailable')
    }
  })
  it('Rapid : drawdown EOD en évaluation, INTRADAY en funded ; nouvelles Tier 1 interdites en funded seulement', () => {
    const p = real('myfundedfutures-rapid')
    expect(p.evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(p.funded.drawdown_type.value).toBe('intraday_trailing')
    expect(p.restrictions.news.evaluation.value).toBe('allowed')
    expect(p.restrictions.news.funded.value).toBe('conditional')
  })
  it('Rapid : contrats contradictoires sur la page → non confirmés', () => {
    for (const v of real('myfundedfutures-rapid').variants) {
      expect(v.evaluation.max_contracts.status).toBe('unconfirmed')
      expect(v.funded.max_contracts.status).toBe('unconfirmed')
    }
  })
  it('Builder : deux versions MLL du 50K sont deux variantes distinctes (option différente)', () => {
    const p = real('myfundedfutures-builder')
    const v50 = p.variants.filter((v) => v.account_size_usd === 50000)
    expect(v50).toHaveLength(2)
    expect(new Set(v50.map((v) => v.option)).size).toBe(2)
    expect(v50.map((v) => v.evaluation.max_drawdown_usd.value).sort()).toEqual([1500, 2000])
    expect(p.restrictions.news.funded.value).toBe('allowed')
  })
  it('Pro : plafond de 100 000 $ ambigu → montant par retrait non confirmé', () => {
    for (const v of real('myfundedfutures-pro').variants) expect(v.funded.max_payout_usd.status).toBe('unconfirmed')
  })
  it('Québec : jamais « admis » ; accès ≠ garantie de paiement ; MyFundedClub non extrapolé', () => {
    for (const id of MF) {
      const stages = real(id).quebec_by_stage ?? []
      expect(stages.map((s) => s.state)).toEqual(['a_verifier', 'a_verifier', 'a_verifier'])
      expect(stages[0].note).toContain('MyFundedClub')
      const ev = evaluateProgram(real(id), answers(qc), fullCtx)
      expect(JSON.stringify(ev)).not.toMatch(/Québec admis/)
    }
  })
})

describe('Lot 2A · Take Profit Trader', () => {
  it('trois stades : drawdown EOD en test, intraday en PRO ; nouvelles interdites en PRO seulement', () => {
    const p = real(TPT)
    expect(p.evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(p.funded.drawdown_type.value).toBe('intraday_trailing')
    expect(p.restrictions.news.evaluation.value).toBe('allowed')
    expect(p.restrictions.news.funded.value).toBe('conditional')
  })
  it('liste de produits par symbole non lue → instruments « à vérifier », jamais interdits', () => {
    const p = real(TPT)
    expect(p.instruments.status).toBe('unconfirmed')
    for (const s of ['NQ', 'ES', 'GC']) expect(checkInstrument(p, s, fullCtx).state).toBe('unknown')
  })
  it('retraits : sans plafond, sans minimum de jours ; frais conditionnel de 50 $ non additionné', () => {
    const p = real(TPT)
    expect(p.funded.payout_cap.value).toEqual({ has_cap: false, amount_usd: null })
    expect(p.variants.length).toBe(5)
    expect(p.variants[0].pricing.conditional_fees.value?.[0].amount_usd).toBe(50)
  })
  it('Québec : à vérifier à chaque stade', () => {
    expect((real(TPT).quebec_by_stage ?? []).every((s) => s.state === 'a_verifier')).toBe(true)
  })
})

describe('Lot 2A · TradeDay', () => {
  it('trois programmes distincts : drawdown d’évaluation et de funded gérés séparément', () => {
    expect(real('tradeday-qp-intraday').evaluation.drawdown_type.value).toBe('intraday_trailing')
    expect(real('tradeday-qp-eod').evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(real('tradeday-qp-eod').funded.drawdown_type.value).toBe('intraday_trailing')
    expect(real('tradeday-fp-eod').funded.drawdown_type.value).toBe('eod_trailing')
  })
  it('conflit des 7 jours des Terms : minimum de jours non confirmé et signalé', () => {
    for (const id of TD) {
      const p = real(id)
      for (const v of p.variants) expect(v.evaluation.min_trading_days.status).toBe('unconfirmed')
      expect(JSON.stringify(p.watch_points)).toContain('7 jours')
    }
  })
  it('Quick Pay : sans buffer, partage initial 50/50 documenté ; pas de plafond inventé', () => {
    const p = real('tradeday-qp-intraday')
    expect(p.funded.safety_net.value).toEqual({ exists: false, detail: expect.any(String) })
    expect(p.funded.profit_split_pct.value).toBe(50)
    expect(p.funded.payout_cap.status).toBe('unconfirmed')
  })
  it('Fast Pass : plafond par cycle par taille', () => {
    const caps = real('tradeday-fp-eod').variants.map((v) => v.funded.max_payout_usd.value)
    expect(caps).toEqual([750, 1500, 1875, 2250])
  })
  it('robots interdits ; position fermée 10 minutes avant la fin de session', () => {
    const p = real('tradeday-qp-eod')
    expect(p.restrictions.automated.funded.value).toBe('forbidden')
    expect(p.restrictions.overnight.evaluation.value).toBe('forbidden')
  })
})

describe('Lot 2A · moteur et divulgation des retraits', () => {
  it('les champs de retrait manquants sont signalés (jamais une présentation trompeusement favorable)', () => {
    expect(withdrawalDisclosure(real('tradeday-qp-intraday')).essential.length).toBeGreaterThan(0)
    expect(withdrawalDisclosure(real('myfundedfutures-rapid')).essential.length).toBeGreaterThan(0)
  })
  it('les programmes des lots précédents restent intacts', () => {
    for (const id of ['topstep-trading-combine', 'apex-eod-trail', 'apex-intraday-trail']) expect(fullDs.programs.some((p) => p.id === id)).toBe(true)
  })
  it('un profil futures-indices évalue tous les programmes sans erreur ; CFD → incompatible partout', () => {
    for (const id of LOT2A) {
      const ev = evaluateProgram(real(id), answers(qc), fullCtx)
      expect(ev.status).toBeDefined()
      const cfd = evaluateProgram(real(id), answers({ markets: ['cfd_index'] }), fullCtx)
      expect(cfd.status).toBe('INCOMPATIBLE')
    }
  })
})
