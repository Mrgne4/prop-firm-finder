import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkInstrument, evaluateProgram, resolveEligibility } from '../src/engine/evaluate'
import { withdrawalDisclosure } from '../src/engine/withdrawals'
import type { Program } from '../src/data/schema'
import { fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const FT = ['ftmo-2step-standard', 'ftmo-2step-swing', 'ftmo-1step-standard', 'ftmo-1step-swing', 'ftmo-instant']
const T5 = ['the5ers-high-stakes', 'the5ers-hyper-growth', 'the5ers-bootcamp']
const FN = ['fundednext-stellar-1step', 'fundednext-stellar-2step', 'fundednext-stellar-lite', 'fundednext-stellar-instant']
const FP = ['fundingpips-1step-flex', 'fundingpips-1step', 'fundingpips-2step-standard', 'fundingpips-2step-flex', 'fundingpips-2step-pro', 'fundingpips-zero']
const LOT2B = [...FT, ...T5, ...FN, ...FP]
const FIRST5 = ['topstep-trading-combine', 'apex-eod-trail', 'apex-intraday-trail', 'take-profit-trader-test', 'myfundedfutures-rapid', 'myfundedfutures-pro', 'myfundedfutures-builder', 'tradeday-qp-intraday', 'tradeday-qp-eod', 'tradeday-fp-eod']
const fx = (over = {}) => profile({ markets: ['forex'], ...over })
const countries: string[] = JSON.parse(readFileSync('data/countries.json', 'utf8'))

describe('Lot 2B · intégrité des données', () => {
  it('18 programmes réels, 4 entreprises', () => {
    expect(fullDs.programs.filter((p) => LOT2B.includes(p.id) && !p.demo)).toHaveLength(LOT2B.length)
    expect(['ftmo', 'the5ers', 'fundednext', 'fundingpips'].every((f) => fullDs.firms.some((x) => x.id === f && !x.demo))).toBe(true)
  })
  it('toute valeur confirmée cite une source officielle connue', () => {
    const type = (id: string) => fullDs.sources.find((s) => s.id === id)?.type
    for (const id of LOT2B) {
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
  it('les prix ne sont jamais confirmés ; les observations sont datées et non durables', () => {
    for (const id of LOT2B) {
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
    expect(JSON.parse(readFileSync('data/evidence/lot2b-2026-11-15.json', 'utf8')).observations.length).toBeGreaterThanOrEqual(8)
  })
  it('les pays manquants du lot 2A sont ajoutés au catalogue géographique', () => {
    for (const c of ['BS', 'BW', 'KH', 'EC', 'GI', 'GY', 'JM', 'JO', 'KZ', 'KG', 'ME', 'NR', 'PA', 'QA', 'TW', 'TM']) expect(countries).toContain(c)
  })
})

describe('Lot 2B · CFD ≠ futures', () => {
  it('aucun programme CFD n’accepte des futures ; les futures du catalogue ne sont pas disponibles', () => {
    for (const id of LOT2B) {
      const p = real(id)
      expect(p.contract_types.value).not.toContain('futures')
      expect(p.contract_types.value).toContain('cfd')
      for (const sym of ['NQ', 'MNQ', 'ES', 'GC']) expect(checkInstrument(p, sym, fullCtx).state).not.toBe('available')
    }
  })
  it('un profil futures est INCOMPATIBLE avec chaque programme CFD', () => {
    for (const id of LOT2B) {
      const e = evaluateProgram(real(id), profile({ markets: ['futures_index'] }), fullCtx)
      expect(e.status, id).toBe('INCOMPATIBLE')
    }
  })
  it('à l’inverse, les programmes futures du lot 1 / 2A rejettent les indices CFD', () => {
    for (const id of FIRST5) expect(evaluateProgram(real(id), profile({ markets: ['cfd_index'] }), fullCtx).status, id).toBe('INCOMPATIBLE')
  })
  it('le Forex est reconnu (disponible) lorsqu’il est confirmé dans la liste officielle', () => {
    for (const id of LOT2B) expect(checkInstrument(real(id), 'FOREX', fullCtx).state).toBe('available')
  })
  it('instruments CFD non lus : jamais « disponibles » par défaut', () => {
    for (const id of FT) expect(checkInstrument(real(id), 'NAS100', fullCtx).state).not.toBe('available')
    for (const id of FN) expect(checkInstrument(real(id), 'NAS100', fullCtx).state).toBe('available')
  })
})

describe('Lot 2B · programmes à plusieurs étapes', () => {
  it('nombre d’étapes par programme', () => {
    const steps = (id: string) => real(id).evaluation.steps.value
    expect(steps('ftmo-2step-standard')).toBe(2)
    expect(steps('ftmo-1step-standard')).toBe(1)
    expect(steps('ftmo-instant')).toBe(0)
    expect(steps('the5ers-bootcamp')).toBe(3)
    expect(steps('the5ers-high-stakes')).toBe(2)
    expect(steps('fundednext-stellar-lite')).toBe(2)
    expect(steps('fundingpips-zero')).toBe(0)
  })
  it('les objectifs de chaque étape sont séparés', () => {
    const v = (id: string, k: string) => real(id).variants.find((x) => x.id === k)!.evaluation
    expect(v('ftmo-2step-standard', '100k').profit_target_usd.value).toBe(10000)
    expect(v('ftmo-2step-standard', '100k').profit_target_phase2_usd?.value).toBe(5000)
    expect(v('fundednext-stellar-2step', '100k').profit_target_usd.value).toBe(8000)
    expect(v('fundednext-stellar-2step', '100k').profit_target_phase2_usd?.value).toBe(5000)
    expect(v('fundingpips-2step-pro', '100k').profit_target_phase2_usd?.value).toBe(6000)
    // Bootcamp : 3 étapes sur des soldes croissants
    const b = v('the5ers-bootcamp', '20k')
    expect([b.profit_target_usd.value, b.profit_target_phase2_usd?.value, b.profit_target_phase3_usd?.value]).toEqual([300, 600, 900])
    expect(v('ftmo-1step-standard', '100k').profit_target_phase2_usd).toBeUndefined()
  })
  it('le contraste High Stakes : l’objectif de l’étape 1 contradictoire reste non confirmé', () => {
    for (const v of real('the5ers-high-stakes').variants) {
      expect(v.evaluation.profit_target_usd.status).toBe('unconfirmed')
      expect(v.evaluation.profit_target_phase2_usd?.status).toBe('confirmed')
    }
  })
})

describe('Lot 2B · limites quotidiennes et drawdown', () => {
  it('limites quotidiennes en dollars dérivées des pourcentages officiels', () => {
    const d = (id: string, k = '100k') => real(id).variants.find((x) => x.id === k)!.evaluation.daily_loss_limit_usd.value
    expect(d('ftmo-2step-standard')).toBe(5000)
    expect(d('ftmo-1step-standard')).toBe(3000)
    expect(d('fundednext-stellar-1step')).toBe(3000)
    expect(d('fundednext-stellar-2step')).toBe(5000)
    expect(d('fundednext-stellar-lite')).toBe(4000)
    expect(d('fundingpips-2step-pro')).toBe(3000)
    expect(d('the5ers-high-stakes')).toBe(5000)
  })
  it('Hyper Growth : la limite quotidienne est une pause, High Stakes : un échec', () => {
    expect(real('the5ers-hyper-growth').evaluation.daily_loss_behavior?.value).toBe('pause')
    expect(real('the5ers-high-stakes').evaluation.daily_loss_behavior?.value).toBe('breach')
    expect(real('the5ers-bootcamp').funded.daily_loss_behavior?.value).toBe('pause')
  })
  it('type de drawdown : statique, EOD, intraday ou non classé', () => {
    expect(real('ftmo-2step-standard').evaluation.drawdown_type.value).toBe('static')
    expect(real('ftmo-1step-standard').evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(real('ftmo-instant').funded.drawdown_type.value).toBe('intraday_trailing')
    expect(real('fundednext-stellar-1step').evaluation.drawdown_type.value).toBe('static')
    expect(real('fundednext-stellar-instant').funded.drawdown_type.value).toBe('intraday_trailing')
    expect(real('fundingpips-zero').funded.drawdown_type.value).toBe('intraday_trailing')
    expect(real('the5ers-hyper-growth').evaluation.drawdown_type.status).toBe('unconfirmed')
  })
  it('programmes sans challenge : aucune évaluation chiffrée, restrictions d’évaluation non applicables', () => {
    for (const id of ['ftmo-instant', 'fundednext-stellar-instant', 'fundingpips-zero']) {
      const p = real(id)
      for (const v of p.variants) expect(v.evaluation.profit_target_usd.status).toBe('not_applicable')
      for (const k of Object.keys(p.restrictions) as (keyof typeof p.restrictions)[]) expect(p.restrictions[k].evaluation.status).toBe('not_applicable')
    }
  })
})

describe('Lot 2B · restrictions propres au compte funded', () => {
  it('FTMO Standard : week-end interdit seulement sur le compte funded, permis pendant le Challenge', () => {
    const p = real('ftmo-2step-standard')
    expect(p.restrictions.weekend.evaluation.value).toBe('allowed')
    expect(p.restrictions.weekend.funded.value).toBe('forbidden')
    expect(p.restrictions.news.evaluation.value).toBe('allowed')
    expect(p.restrictions.news.funded.value).toBe('conditional')
  })
  it('FTMO Swing : aucune restriction à aucun stade', () => {
    const p = real('ftmo-2step-swing')
    expect(p.restrictions.weekend.funded.value).toBe('allowed')
    expect(p.restrictions.news.funded.value).toBe('allowed')
  })
  it('un profil week-end : Standard échoue, Swing passe', () => {
    const a = fx({ when: ['weekend'] })
    expect(evaluateProgram(real('ftmo-2step-standard'), a, fullCtx).criteria.find((c) => c.key === 'weekend')?.state).toBe('fail')
    expect(evaluateProgram(real('ftmo-2step-swing'), a, fullCtx).criteria.find((c) => c.key === 'weekend')?.state).toBe('ok')
  })
  it('The5ers High Stakes : nouvelles conditionnelles aux deux stades', () => {
    const p = real('the5ers-high-stakes')
    expect(p.restrictions.news.evaluation.value).toBe('conditional')
    expect(p.restrictions.news.funded.value).toBe('conditional')
  })
  it('FundingPips : nouvelles permises en évaluation, conditionnelles sur le Master', () => {
    for (const id of ['fundingpips-1step-flex', 'fundingpips-2step-standard', 'fundingpips-2step-flex']) {
      const p = real(id)
      expect(p.restrictions.news.evaluation.value).toBe('allowed')
      expect(p.restrictions.news.funded.value).toBe('conditional')
    }
  })
  it('FundingPips 1 Step : week-end Master temporairement interdit mais permis en évaluation', () => {
    const p = real('fundingpips-1step')
    expect(p.restrictions.weekend.evaluation.value).toBe('allowed')
    expect(p.restrictions.weekend.funded.value).toBe('forbidden')
  })
})

describe('Lot 2B · informations inconnues et contradictions', () => {
  it('contradictions laissées non confirmées', () => {
    expect(real('fundednext-stellar-lite').variants[0].evaluation.min_trading_days.status).toBe('unconfirmed')
    expect(real('fundingpips-1step-flex').funded.profit_split_pct.status).toBe('unconfirmed')
    expect(real('fundingpips-2step-standard').variants[0].evaluation.min_trading_days.status).toBe('unconfirmed')
    expect(real('fundingpips-1step-flex').restrictions.weekend.funded.status).toBe('unconfirmed')
    expect(real('fundingpips-2step-flex').funded.profit_split_pct.status).toBe('unconfirmed')
  })
  it('les contradictions sont mentionnées dans les points de vigilance', () => {
    for (const id of ['the5ers-high-stakes', 'fundednext-stellar-lite', 'fundingpips-1step-flex', 'fundingpips-2step-standard', 'the5ers-bootcamp']) {
      expect(JSON.stringify(real(id).watch_points.value)).toContain('CONTRADICTION')
    }
  })
  it('FTMO 1-Step : la règle de consistance mentionne le changement du 5 octobre 2026', () => {
    expect(JSON.stringify(real('ftmo-1step-standard').evaluation.consistency_rule.value)).toContain('5 octobre 2026')
  })
  it('un instrument non lu reste « à vérifier », jamais « interdit »', () => {
    for (const id of FT) expect(['unknown', 'unconfirmed', 'available']).toContain(checkInstrument(real(id), 'XAUUSD', fullCtx).state)
  })
  it('divulgation des retraits : lacunes affichées sans bloquer', () => {
    for (const id of LOT2B) {
      const w = withdrawalDisclosure(real(id))
      expect(w.gaps.length).toBeGreaterThan(0)
      expect(evaluateProgram(real(id), fx(), fullCtx).status).not.toBe('INCOMPATIBLE')
    }
  })
  it('le Québec n’est jamais « admis » ni « restreint » sans source nominative', () => {
    for (const id of LOT2B) for (const s of (real(id).quebec_by_stage ?? [])) expect(['a_verifier', 'canada_general']).toContain(s.state)
  })
})

describe('Lot 2B · exclusions géographiques (programmes ET variantes)', () => {
  it('les pays exclus sont refusés par chaque programme concerné', () => {
    const cases: [string[], string][] = [[FT, 'RU'], [FT, 'IR'], [T5, 'IL'], [T5, 'RU'], [FN, 'MY'], [FN, 'VN'], [FP, 'VN'], [FP, 'AE'], [FP, 'IR']]
    for (const [ids, cc] of cases) {
      for (const id of ids) {
        const e = evaluateProgram(real(id), fx({ residence: { country: cc, region: null } }), fullCtx)
        expect(e.criteria.find((c) => c.key === 'residence')?.state, `${id} ${cc}`).toBe('fail')
        expect(e.status).toBe('INCOMPATIBLE')
        for (const v of e.variants) expect(v.status, `${id}/${v.variantId} ${cc}`).toBe('INCOMPATIBLE')
      }
    }
  })
  it('un pays exclu pour un produit n’est pas exclu pour un autre (FundedNext CFD ≠ Futures)', () => {
    expect(resolveEligibility(real('fundednext-stellar-1step').eligibility.value!, { country: 'CA', region: 'ON' }).state).toBe('unconfirmed')
    expect(resolveEligibility(real('fundednext-stellar-1step').eligibility.value!, { country: 'MY', region: null }).state).toBe('excluded')
  })
  it('FTMO : « ouvert à tous sauf » rend les pays absents admissibles ; The5ers : liste non exhaustive donc non confirmé', () => {
    expect(resolveEligibility(real('ftmo-2step-standard').eligibility.value!, { country: 'CA', region: 'QC' }).state).toBe('eligible')
    expect(resolveEligibility(real('the5ers-high-stakes').eligibility.value!, { country: 'CA', region: 'QC' }).state).toBe('unconfirmed')
    expect(resolveEligibility(real('the5ers-high-stakes').eligibility.value!, { country: 'BA', region: null }).state).toBe('unconfirmed')
  })
  it('FundingPips : Canada admissible (Match-Trader), autres pays non listés non confirmés', () => {
    const el = real('fundingpips-2step-pro').eligibility.value!
    expect(resolveEligibility(el, { country: 'CA', region: null }).state).toBe('eligible')
    expect(resolveEligibility(el, { country: 'FR', region: null }).state).toBe('unconfirmed')
  })
  it('les 16 pays ajoutés excluent désormais MyFundedFutures sur ses trois programmes et toutes leurs variantes', () => {
    for (const id of ['myfundedfutures-rapid', 'myfundedfutures-pro', 'myfundedfutures-builder']) {
      const p = real(id)
      for (const c of ['BS', 'KH', 'JM', 'QA', 'TW']) expect(p.eligibility.value!.excluded).toContain(c)
      const e = evaluateProgram(p, profile({ residence: { country: 'JM', region: null } }), fullCtx)
      for (const v of e.variants) expect(v.status).toBe('INCOMPATIBLE')
    }
  })
  it('l’éligibilité à l’évaluation n’est pas confondue avec celle des paiements (note ou phrase d’avertissement)', () => {
    for (const id of LOT2B) expect(real(id).eligibility.note ?? '').toContain('paiements')
  })
})

describe('Lot 2B · TradeDay : conflits préservés', () => {
  it('les jours minimum contradictoires restent non confirmés', () => {
    for (const id of ['tradeday-qp-intraday', 'tradeday-qp-eod', 'tradeday-fp-eod'])
      for (const v of real(id).variants) expect(v.evaluation.min_trading_days.status).toBe('unconfirmed')
  })
  it('les prix TradeDay restent des observations (mensuel ou unique non tranché)', () => {
    for (const id of ['tradeday-qp-intraday', 'tradeday-qp-eod', 'tradeday-fp-eod'])
      for (const v of real(id).variants) {
        expect(v.pricing.one_time.status).not.toBe('confirmed')
        expect(v.pricing.monthly.status).not.toBe('confirmed')
      }
  })
})

describe('Lot 2B · aucune régression sur les cinq premières entreprises', () => {
  it('les dix programmes futures sont toujours présents et évaluables', () => {
    for (const id of FIRST5) {
      const p = real(id)
      expect(p.demo).toBe(false)
      expect(p.contract_types.value).toEqual(['futures'])
      expect(evaluateProgram(p, profile({ markets: ['futures_index'] }), fullCtx).status).not.toBe('INCOMPATIBLE')
    }
  })
  it('un profil futures du Québec reste compatible ou à vérifier chez Topstep et Apex', () => {
    for (const id of ['topstep-trading-combine', 'apex-eod-trail']) expect(['COMPATIBLE', 'A_VERIFIER', 'PARTIEL']).toContain(evaluateProgram(real(id), profile({ markets: ['futures_index'] }), fullCtx).status)
  })
})
