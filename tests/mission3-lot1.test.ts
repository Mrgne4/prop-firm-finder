import { describe, expect, it } from 'vitest'
import { validateRaw } from '../src/data/validate'
import { readRawFromDisk } from '../scripts/read-raw'
import { collectSourced } from '../src/data/sourced'
import { checkInstrument, evaluateProgram, instrumentTable } from '../src/engine/evaluate'
import { decodeShare, encodeShare } from '../src/engine/share'
import { emptyAnswers } from '../src/engine/answers'
import type { Program } from '../src/data/schema'
import { ALPHA, NOW, ctx, demo, fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const TOPSTEP = 'topstep-trading-combine'
const APEX_EOD = 'apex-eod-trail'
const APEX_ID = 'apex-intraday-trail'
const chk = (p: Program, id: string) => checkInstrument(p, id, fullCtx)

describe('Lot 1 · données réelles Topstep et Apex', () => {
  it('3 programmes réels valides, rattachés à leurs entreprises', () => {
    const lot1 = fullDs.programs.filter((p) => !p.demo && ['topstep', 'apex-trader-funding'].includes(p.firm_id))
    expect(lot1.map((p) => p.id).sort()).toEqual([APEX_EOD, APEX_ID, TOPSTEP].sort())
    expect(fullDs.firms.filter((f) => !f.demo && ['topstep', 'apex-trader-funding'].includes(f.id)).map((f) => f.id).sort()).toEqual(['apex-trader-funding', 'topstep'])
  })

  it("toute valeur confirmée d'un programme réel cite une source OFFICIELLE (jamais un comparateur ni une démo)", () => {
    const type = (id: string) => fullDs.sources.find((s) => s.id === id)?.type
    for (const p of fullDs.programs.filter((x) => !x.demo)) {
      for (const { path, sv } of collectSourced(p)) {
        if (sv.status !== 'confirmed') continue
        expect(sv.sources.length, `${p.id} ${path}`).toBeGreaterThan(0)
        expect(sv.sources.some((s) => type(s) === 'official'), `${p.id} ${path}`).toBe(true)
        expect(sv.sources.every((s) => type(s) !== 'demo'), `${p.id} ${path}`).toBe(true)
      }
    }
  })

  it('toutes les sources officielles ont une URL https', () => {
    for (const s of fullDs.sources.filter((x) => x.type === 'official')) expect(s.url).toMatch(/^https:\/\//)
  })

  it('aucune valeur manquante n’est inventée : les prix Apex (dynamiques) restent non confirmés, les objectifs officiels sont confirmés avec source', () => {
    for (const id of [APEX_EOD, APEX_ID]) {
      const p = real(id)
      for (const v of p.variants) {
        expect(v.pricing.one_time.status).toBe('unconfirmed')
        expect(v.pricing.one_time.value).toBeNull()
        expect(v.evaluation.profit_target_usd.status).toBe('confirmed')
        expect(v.evaluation.profit_target_usd.sources.length).toBeGreaterThan(0)
      }
    }
  })

  it('Topstep : 3 tailles × 2 voies (Standard / Sans frais d’activation), toutes distinctes', () => {
    const p = real(TOPSTEP)
    expect(p.variants).toHaveLength(6)
    const keys = p.variants.map((v) => `${v.account_size_usd}|${v.option ?? ''}`)
    expect(new Set(keys).size).toBe(6)
    const price = (size: number, opt: string | null) => p.variants.find((v) => v.account_size_usd === size && v.option === opt)!
    expect(price(50000, null).pricing.monthly.value).toBe(49)
    expect(price(100000, null).pricing.monthly.value).toBe(99)
    expect(price(150000, null).pricing.monthly.value).toBe(199)
    expect(price(50000, "Sans frais d'activation").pricing.monthly.value).toBe(95)
    expect(price(150000, "Sans frais d'activation").pricing.monthly.value).toBe(229)
    expect(price(50000, null).pricing.activation_fee.value).toBe(149)
    expect(price(50000, "Sans frais d'activation").pricing.activation_fee.status).toBe('not_applicable')
  })

  it('Topstep : la voie Standard et la voie sans activation ont des coûts distincts dans le moteur', () => {
    const e = evaluateProgram(real(TOPSTEP), profile({ budget: 'gt200' }), fullCtx)
    const std = e.variants.find((v) => v.variantId === '50k-standard')!
    const noAct = e.variants.find((v) => v.variantId === '50k-sans-frais-activation')!
    expect(std.cost.basePrice).toBe(49)
    expect(std.cost.activation.amount).toBe(149)
    expect(noAct.cost.basePrice).toBe(95)
    expect(noAct.cost.activation.state).toBe('none')
    expect(std.cost.label).not.toBe(noAct.cost.label)
  })

  it('Topstep : règles clés (EOD trailing, consistance 55 %, 90 % de partage, 125 $ minimum, pas de nuit ni de week-end)', () => {
    const p = real(TOPSTEP)
    expect(p.evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(p.evaluation.consistency_rule.value?.detail).toMatch(/55/)
    expect(p.funded.profit_split_pct.value).toBe(90)
    expect(p.funded.min_withdrawal_usd.value).toBe(125)
    expect(p.restrictions.overnight.funded.value).toBe('forbidden')
    expect(p.restrictions.weekend.evaluation.value).toBe('forbidden')
    expect(p.evaluation.time_limit_days.status).toBe('not_applicable')
  })

  it('Apex : EOD et Intraday distincts, 100 % des retraits, 6 retraits max, automatisation interdite', () => {
    const eod = real(APEX_EOD)
    const intra = real(APEX_ID)
    expect(eod.evaluation.drawdown_type.value).toBe('eod_trailing')
    expect(intra.evaluation.drawdown_type.value).toBe('intraday_trailing')
    for (const p of [eod, intra]) {
      expect(p.variants.map((v) => v.account_size_usd)).toEqual([25000, 50000, 100000, 150000])
      expect(p.funded.profit_split_pct.value).toBe(100)
      expect(p.funded.min_withdrawal_usd.value).toBe(500)
      expect(p.evaluation.time_limit_days.value).toBe(30)
      expect(p.restrictions.automated.funded.value).toBe('forbidden')
      expect(p.restrictions.news.funded.value).toBe('conditional')
    }
    expect(eod.variants[1].funded.max_drawdown_usd.value).toBe(2000)
    expect(intra.variants[3].funded.max_contracts.value).toBe(10)
  })

  it('Québec : Topstep reste « À VÉRIFIER » ; Apex distingue évaluation / funded simulé (Canada en général) et Live (restreint)', () => {
    const ts = real(TOPSTEP)
    expect(ts.eligibility.status).toBe('unconfirmed')
    expect(ts.quebec_by_stage!.every((q) => q.state === 'a_verifier')).toBe(true)
    const e = evaluateProgram(ts, profile({ markets: ['futures_index'] }), fullCtx)
    expect(e.status).not.toBe('COMPATIBLE')
    expect(e.criteria.find((c) => c.key === 'residence')?.state).toBe('unknown')
    for (const id of [APEX_EOD, APEX_ID]) {
      const q = Object.fromEntries(real(id).quebec_by_stage!.map((x) => [x.stage, x.state]))
      expect(q).toEqual({ evaluation: 'canada_general', funded_sim: 'canada_general', live: 'restreint' })
    }
  })
})

describe('Lot 1 · instruments individuels et types de contrats', () => {
  it('Topstep : NQ, MNQ, ES, MES, GC, MGC, CL, MCL, BTC (MBT), ETH (MET) sont disponibles', () => {
    const p = real(TOPSTEP)
    for (const id of ['NQ', 'MNQ', 'ES', 'MES', 'GC', 'MGC', 'CL', 'MCL', 'MBT', 'MET']) expect(chk(p, id).state, id).toBe('available')
  })

  it('Topstep : les contrats à risque élevé (or, pétrole) sont disponibles avec limite, pas interdits', () => {
    const c = chk(real(TOPSTEP), 'GC')
    expect(c.state).toBe('available')
    expect(c.message).toMatch(/limite/i)
  })

  it('Topstep : EUR/USD au comptant est indisponible, mais 6E et M6E (futures) sont disponibles', () => {
    const p = real(TOPSTEP)
    const spot = chk(p, 'EURUSD')
    expect(spot.state).toBe('unavailable')
    expect(spot.message).toMatch(/futures/i)
    expect(chk(p, '6E').state).toBe('available')
    expect(chk(p, 'M6E').state).toBe('available')
  })

  it('NAS100 CFD ≠ NQ futures : indisponible chez Topstep et Apex, avec rappel du sous-jacent proposé en futures', () => {
    for (const id of [TOPSTEP, APEX_EOD, APEX_ID]) {
      const c = chk(real(id), 'NAS100')
      expect(c.state, id).toBe('unavailable')
      expect(c.contract).toBe('cfd')
    }
    expect(chk(real(TOPSTEP), 'NAS100').message).toMatch(/Nasdaq 100/)
  })

  it('Apex : liste partielle → NQ « à vérifier » (jamais « interdit »), RTY et 6E disponibles, CFD et cryptos spot indisponibles', () => {
    const p = real(APEX_EOD)
    expect(p.instruments_scope).toBe('partial')
    expect(chk(p, 'NQ').state).toBe('unknown')
    expect(chk(p, 'RTY').state).toBe('available')
    expect(chk(p, '6E').state).toBe('available')
    expect(chk(p, 'BTCUSD_CFD').state).toBe('unavailable')
    expect(chk(p, 'EURUSD').state).toBe('unavailable')
    expect(chk(p, 'STOCK_CFD').state).toBe('unavailable')
  })

  it('Apex : l’or reste « à vérifier » (la suspension n’est affirmée que par des sources tierces)', () => {
    expect(chk(real(APEX_EOD), 'GC').state).toBe('unknown')
    expect(chk(real(APEX_EOD), 'MGC').state).toBe('unknown')
  })

  it('une suspension officielle rend un instrument indisponible ; une limite non confirmée le rend « à vérifier »', () => {
    const p = demo(ALPHA)
    p.instrument_limits = { status: 'confirmed', value: [{ instrument: 'GC', state: 'suspended', note: 'Suspendu (test).' }, { instrument: 'CL', state: 'unconfirmed', note: 'Contesté (test).' }], sources: ['demo-fiction'], verified_at: '2026-11-15' }
    expect(checkInstrument(p, 'GC', ctx).state).toBe('unavailable')
    expect(checkInstrument(p, 'CL', ctx).state).toBe('unknown')
    expect(checkInstrument(p, 'NQ', ctx).state).toBe('available')
  })

  it('liste exhaustive : un instrument absent est indisponible ; liste partielle : à vérifier', () => {
    const p = demo(ALPHA)
    p.instruments.value = ['NQ']
    p.instruments_scope = 'exhaustive'
    p.instruments_excluded.value = ['ES']
    expect(checkInstrument(p, 'ES', ctx).state).toBe('unavailable')
    expect(checkInstrument(p, 'YM', ctx).state).toBe('unknown') // absent de la liste mais jamais vérifié interdit
    p.instruments_scope = 'partial'
    expect(checkInstrument(p, 'ES', ctx).state).toBe('unknown')
  })

  it('une liste périmée ou non confirmée ne donne jamais « disponible »', () => {
    const p = demo(ALPHA)
    p.instruments.verified_at = '2026-01-01'
    expect(checkInstrument(p, 'NQ', ctx).state).toBe('unknown')
    const q = demo(ALPHA)
    q.instruments = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
    expect(checkInstrument(q, 'NQ', ctx).state).toBe('unknown')
  })

  it('le tableau complet couvre tout le catalogue, avec le type de contrat de chaque instrument', () => {
    const rows = instrumentTable(real(TOPSTEP), fullCtx)
    expect(rows).toHaveLength(fullDs.instruments.length)
    expect(rows.find((r) => r.id === 'MBT')?.contract).toBe('futures')
    expect(rows.find((r) => r.id === 'BTCUSD_CFD')?.contract).toBe('cfd')
    expect(rows.find((r) => r.id === 'BTC_PERP')?.contract).toBe('perpetual')
  })
})

describe('Lot 1 · critère « instruments précis » dans le moteur', () => {
  it('un instrument indisponible rend le programme INCOMPATIBLE ; assoupli → PARTIEL', () => {
    const a = profile({ markets: ['cfd_index'], instruments: ['NAS100'] })
    const e = evaluateProgram(real(TOPSTEP), a, fullCtx)
    expect(e.status).toBe('INCOMPATIBLE')
    expect(e.criteria.find((c) => c.key === 'instruments')?.state).toBe('fail')
    expect(e.instrumentChecks[0].state).toBe('unavailable')
    const relaxed = evaluateProgram(real(TOPSTEP), a, fullCtx, ['markets', 'instruments'])
    expect(relaxed.status).toBe('PARTIEL')
  })

  it('un instrument « à vérifier » donne A_VERIFIER au mieux, jamais COMPATIBLE', () => {
    const e = evaluateProgram(real(APEX_EOD), profile({ instruments: ['NQ'] }), fullCtx)
    expect(e.criteria.find((c) => c.key === 'instruments')?.state).toBe('unknown')
    expect(e.status).not.toBe('COMPATIBLE')
  })

  it('sans instrument choisi, aucun critère « instruments » n’est ajouté', () => {
    const e = evaluateProgram(real(TOPSTEP), profile(), fullCtx)
    expect(e.criteria.find((c) => c.key === 'instruments')).toBeUndefined()
    expect(e.instrumentChecks).toEqual([])
  })

  it('Apex avec le marché or : « à vérifier » plutôt qu’incompatible (liste partielle)', () => {
    const e = evaluateProgram(real(APEX_EOD), profile({ markets: ['metals'], marketForms: { metals: 'futures' } }), fullCtx)
    expect(e.criteria.find((c) => c.key === 'markets')?.state).toBe('unknown')
  })

  it('Apex avec le marché des cryptos : incompatible car les cryptos au comptant/CFD sont exclus et aucun futures crypto n’est confirmé… ou à vérifier si un futures existe au catalogue', () => {
    const e = evaluateProgram(real(APEX_EOD), profile({ markets: ['crypto_major'], marketForms: { crypto_major: 'cfd' } }), fullCtx)
    expect(e.criteria.find((c) => c.key === 'markets')?.state).toBe('fail')
  })

  it('le lien de partage conserve les instruments et n’inclut toujours pas la résidence', () => {
    const a = { ...emptyAnswers(), markets: ['futures_index'], instruments: ['NQ', 'MNQ', 'MBT'], residence: { country: 'CA' as const, region: 'QC' } }
    const token = encodeShare({ answers: a, relaxed: ['instruments'] })
    const back = decodeShare(token)!
    expect(back.answers.instruments).toEqual(['NQ', 'MNQ', 'MBT'])
    expect(back.relaxed).toEqual(['instruments'])
    expect(back.answers.residence.country).toBeNull()
    expect(atob(token.replace(/-/g, '+').replace(/_/g, '/'))).not.toMatch(/QC|CA/)
  })
})

describe('Lot 1 · validation du modèle', () => {
  const raw = () => structuredClone(readRawFromDisk()) as ReturnType<typeof readRawFromDisk>
  const prog = (r: ReturnType<typeof raw>, name: string) => (r.programs as Record<string, Record<string, any>>)[name]

  it('refuse deux variantes de même taille et de même option', () => {
    const r = raw()
    const p = prog(r, 'topstep-trading-combine.json')
    p.variants.push({ ...structuredClone(p.variants[0]), id: 'doublon' })
    const { errors } = validateRaw(r, NOW)
    expect(errors.some((e) => /même taille et de même option/.test(e.message))).toBe(true)
  })

  it('refuse une limite pour un instrument absent de la liste ou inconnu', () => {
    const r = raw()
    const p = prog(r, 'topstep-trading-combine.json')
    p.instrument_limits.value.push({ instrument: 'XAUUSD', state: 'limited', note: 'x' }, { instrument: 'ZZZ', state: 'limited', note: 'x' })
    const msgs = validateRaw(r, NOW).errors.map((e) => e.message).join('|')
    expect(msgs).toMatch(/ne figure pas dans « instruments »/)
    expect(msgs).toMatch(/Instrument inconnu : « ZZZ »/)
  })

  it('refuse une valeur confirmée appuyée sur une démo dans un programme réel', () => {
    const r = raw()
    prog(r, 'topstep-trading-combine.json').funded.profit_split_pct.sources = ['demo-fiction']
    expect(validateRaw(r, NOW).errors.length).toBeGreaterThan(0)
  })

  it('le catalogue distingue futures, CFD, au comptant et perpétuels pour un même sous-jacent', () => {
    const byUnderlying = (u: string) => fullDs.instruments.filter((i) => i.underlying === u).map((i) => i.contract).sort()
    expect(byUnderlying('Nasdaq 100')).toEqual(['cfd', 'futures', 'futures'])
    expect(byUnderlying('Bitcoin')).toEqual(['cfd', 'futures', 'perpetual'])
    expect(byUnderlying('EUR/USD')).toEqual(['futures', 'futures', 'spot'])
  })
})

describe('Lot 1 · fiche détail d’un programme réel', () => {
  it('affiche le tableau instrument par instrument, les 6 variantes Topstep et le Québec comme non confirmé', async () => {
    const { render, screen } = await import('@testing-library/react')
    const { default: App } = await import('../src/App')
    const React = await import('react')
    window.location.hash = '#/programme/topstep-trading-combine'
    render(React.createElement(App, { dataset: fullDs, errors: [], now: NOW }))
    expect(screen.getByRole('heading', { level: 1, name: /Trading Combine \(Topstep\)/ })).toBeInTheDocument()
    expect(screen.getByRole('table', { name: /Disponibilité par instrument/ })).toBeInTheDocument()
    expect(screen.getAllByText(/Sans frais d'activation/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/non confirm/i).length).toBeGreaterThan(0)
  })
})
