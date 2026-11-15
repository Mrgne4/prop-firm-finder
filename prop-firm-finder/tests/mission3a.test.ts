import { describe, expect, it } from 'vitest'
import { checkInstrument, evaluateProgram } from '../src/engine/evaluate'
import type { Program } from '../src/data/schema'
import { fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const TS = 'topstep-trading-combine'
const AX_EOD = 'apex-eod-trail'
const AX_ID = 'apex-intraday-trail'
const chk = (p: Program, id: string) => checkInstrument(p, id, fullCtx)
const srcType = (id: string) => fullDs.sources.find((s) => s.id === id)?.type

describe('3A · liste officielle ≠ catalogue du comparateur', () => {
  it('un instrument du catalogue absent de la liste mais non vérifié interdit reste « à vérifier », jamais indisponible', () => {
    const p = real(TS)
    p.instruments.value = ['NQ', 'ES']
    expect(p.instruments_scope).toBe('exhaustive')
    expect(chk(p, 'YM').state).toBe('unknown')
    p.instruments_excluded.value = ['YM']
    expect(chk(p, 'YM').state).toBe('unavailable')
    expect(chk(p, 'RTY').state).toBe('unknown')
  })

  it('Topstep : la liste officielle dépasse le catalogue (SI, HG, PL…) et aucun futures du catalogue n’est exclu', () => {
    const p = real(TS)
    expect(p.instruments_excluded.status).toBe('confirmed')
    expect(p.instruments_excluded.value).toEqual([])
    expect(p.instruments_excluded.note).toMatch(/hors de notre catalogue/)
  })

  it('Apex : liste partielle → aucune exclusion déclarée, absent = à vérifier', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const p = real(id)
      expect(p.instruments_scope).toBe('partial')
      expect(p.instruments_excluded.status).toBe('unconfirmed')
      expect(chk(p, 'NQ').state).toBe('unknown')
    }
  })

  it('une exclusion vérifiée sans liste exhaustive est refusée par le validateur', async () => {
    const { validateRaw } = await import('../src/data/validate')
    const { readRawFromDisk } = await import('../scripts/read-raw')
    const raw = readRawFromDisk()
    const ap = (raw.programs as Record<string, Record<string, any>>)['apex-eod-trail.json']
    ap.instruments_excluded = { status: 'confirmed', value: ['NQ'], sources: ['ax-times'], verified_at: '2026-11-15' }
    const r = validateRaw(raw, new Date('2026-11-15T12:00:00Z'))
    expect(r.errors.some((e: { message: string }) => /liste officielle exhaustive/.test(e.message))).toBe(true)
  })

  it('restrictions propres à certains contrats : GC/CL/MGC/MCL limités, ES/NQ limités pendant les annonces Tier 1', () => {
    const p = real(TS)
    for (const id of ['GC', 'MGC', 'CL', 'MCL', 'MBT', 'ES', 'NQ']) {
      const c = chk(p, id)
      expect(c.state, id).toBe('available')
      expect(c.message, id).toMatch(/limite/i)
    }
    expect(chk(p, 'GC').message).toMatch(/3 \/ 6 \/ 9/)
    expect(chk(p, 'MGC').message).toMatch(/30 \/ 60 \/ 90/)
    expect(p.instrument_limits.sources).toContain('ts-risk')
  })

  it('Apex : types non futures indisponibles, métaux jamais déclarés suspendus sans source officielle', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const p = real(id)
      expect(chk(p, 'NAS100').state).toBe('unavailable')
      expect(chk(p, 'EURUSD').state).toBe('unavailable')
      expect(p.instrument_limits.status).toBe('unconfirmed')
      expect(chk(p, 'GC').state).toBe('unknown')
    }
  })
})

describe('3A · retraits (registre structuré, source officielle par valeur)', () => {
  it('Topstep : deux chemins distincts, plafonds par taille, 90/10, minimum 125 $', () => {
    const p = real(TS)
    const paths = p.funded.payout_paths!.value!
    expect(paths.map((x) => x.id)).toEqual(['standard', 'consistency'])
    expect(paths[0]).toMatchObject({ min_days: 5, min_day_profit_usd: 150, request_limit_pct_of_balance: 50 })
    expect(paths[1]).toMatchObject({ min_days: 3, consistency_max_day_pct: 40 })
    expect(p.funded.profit_split_pct.value).toBe(90)
    expect(p.funded.min_withdrawal_usd.value).toBe(125)
    const cap = (size: number) => p.variants.find((v) => v.account_size_usd === size)!.funded.max_payout_usd.value
    expect([cap(50000), cap(100000), cap(150000)]).toEqual([2000, 3000, 5000])
    for (const v of p.variants) expect(v.funded.max_payout_usd.sources).toContain('ts-payouts')
  })

  it('Topstep : le plafond « 5 000 $ » du programme est le maximum de la taille 150K (pas un conflit)', () => {
    const p = real(TS)
    expect(p.funded.payout_cap.value).toEqual({ has_cap: true, amount_usd: 5000 })
    expect(p.funded.payout_cap.note).toMatch(/150K/)
  })

  it('Topstep : Safety Net, nombre maximal de retraits non énoncés → restent non confirmés ; effet sur le drawdown confirmé', () => {
    const p = real(TS)
    expect(p.funded.safety_net.status).toBe('unconfirmed')
    expect(p.funded.max_payouts!.status).toBe('unconfirmed')
    expect(p.funded.max_payouts!.value).toBeNull()
    expect(p.funded.drawdown_effect_of_payout!.value).toMatch(/0 \$/)
  })

  it('Apex : 6 retraits maximum, 100 % de partage, minimum 500 $, consistance 50 %, Safety Net = drawdown + 100 $', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const p = real(id)
      expect(p.funded.max_payouts!.value).toBe(6)
      expect(p.funded.profit_split_pct.value).toBe(100)
      expect(p.funded.min_withdrawal_usd.value).toBe(500)
      expect(p.funded.payout_paths!.value![0]).toMatchObject({ min_days: 5, consistency_max_day_pct: 50 })
      expect(p.funded.safety_net.value?.detail).toMatch(/\+ 100 \$/)
    }
  })

  it('Apex : plafonds par numéro de retrait et par taille (le 6e reste inconnu, EOD ≠ Intraday)', () => {
    const caps = (id: string, size: number) => real(id).variants.find((v) => v.account_size_usd === size)!.funded.payout_caps_by_number!.value!
    expect(caps(AX_EOD, 50000)).toEqual([1500, 1500, 2000, 2500, 2500, null])
    expect(caps(AX_ID, 50000)).toEqual([1500, 2000, 2500, 2500, 3000, null])
    expect(caps(AX_EOD, 150000)[5]).toBeNull()
    for (const id of [AX_EOD, AX_ID]) for (const v of real(id).variants) expect(v.funded.max_payout_usd.status).toBe('unconfirmed')
  })

  it('chaque valeur de retrait confirmée cite la bonne page officielle (EOD ≠ Intraday)', () => {
    const f = (id: string) => real(id).variants[0].funded.payout_caps_by_number!.sources
    expect(f(AX_EOD)).toEqual(['ax-eod-payouts'])
    expect(f(AX_ID)).toEqual(['ax-intraday-payouts'])
    for (const id of [TS, AX_EOD, AX_ID]) {
      for (const sid of real(id).funded.payout_paths!.sources) expect(srcType(sid)).toBe('official')
    }
  })
})

describe('3A · Apex : évaluation et funded ne sont jamais mélangés', () => {
  it('contrats d’évaluation 4/6/8/12 ≠ contrats du Performance Account 2/4/6/10 (correction du 25K Intraday)', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const vs = real(id).variants
      expect(vs.map((v) => v.evaluation.max_contracts.value)).toEqual([4, 6, 8, 12])
      expect(vs.map((v) => v.funded.max_contracts.value)).toEqual([2, 4, 6, 10])
    }
  })

  it('objectifs, drawdowns et limites quotidiennes d’évaluation par taille', () => {
    const eod = real(AX_EOD).variants
    expect(eod.map((v) => v.evaluation.profit_target_usd.value)).toEqual([1500, 3000, 6000, 9000])
    expect(eod.map((v) => v.evaluation.max_drawdown_usd.value)).toEqual([1000, 2000, 3000, 4000])
    expect(eod.map((v) => v.evaluation.daily_loss_limit_usd.value)).toEqual([500, 1000, 1500, 2000])
    const intra = real(AX_ID).variants
    for (const v of intra) expect(v.evaluation.daily_loss_limit_usd.status).toBe('not_applicable')
  })

  it('prix : dynamiques, documentés comme tels, jamais d’un site tiers ; frais d’activation 79 $ lu seulement pour le 25K Intraday', () => {
    for (const id of [AX_EOD, AX_ID]) {
      for (const v of real(id).variants) {
        expect(v.pricing.one_time.status).toBe('unconfirmed')
        expect(v.pricing.one_time.note).toMatch(/DYNAMIQUE/)
      }
    }
    const act = (id: string, size: number) => real(id).variants.find((v) => v.account_size_usd === size)!.pricing.activation_fee
    expect(act(AX_ID, 25000).value).toBe(79)
    expect(act(AX_ID, 50000).status).toBe('unconfirmed')
    expect(act(AX_EOD, 25000).status).toBe('unconfirmed')
  })

  it('plateformes Apex : Tradovate, Rithmic, WealthCharts avec source officielle', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const p = real(id)
      expect(p.platforms.value).toEqual(['tradovate', 'rithmic', 'wealthcharts'])
      expect(p.platforms.sources.every((s) => srcType(s) === 'official')).toBe(true)
    }
  })
})

describe('3A · Québec par type de compte', () => {
  it('Topstep : évaluation, funded simulé et Live restent « À VÉRIFIER » (aucune extrapolation)', () => {
    const q = real(TS).quebec_by_stage!
    expect(q.map((x) => x.stage)).toEqual(['evaluation', 'funded_sim', 'live'])
    expect(q.every((x) => x.state === 'a_verifier')).toBe(true)
    const e = evaluateProgram(real(TS), profile({ markets: ['futures_index'] }), fullCtx)
    expect(e.criteria.find((c) => c.key === 'residence')?.state).toBe('unknown')
  })

  it('Apex : Live restreint pour le Canada (hors Ontario) sans contaminer l’évaluation ni le PA simulé', () => {
    for (const id of [AX_EOD, AX_ID]) {
      const q = Object.fromEntries(real(id).quebec_by_stage!.map((x) => [x.stage, x]))
      expect(q.evaluation.state).toBe('canada_general')
      expect(q.funded_sim.state).toBe('canada_general')
      expect(q.live.state).toBe('restreint')
      expect(q.live.sources).toEqual(['ax-live-faq'])
      expect(q.evaluation.sources).toEqual(['ax-restricted'])
    }
  })

  it('un statut Québec « admis » ou « restreint » sans source officielle est refusé', async () => {
    const { validateRaw } = await import('../src/data/validate')
    const { readRawFromDisk } = await import('../scripts/read-raw')
    const raw = readRawFromDisk()
    const t = (raw.programs as Record<string, Record<string, any>>)['topstep-trading-combine.json']
    t.quebec_by_stage[0] = { stage: 'evaluation', state: 'admis', note: 'x', sources: [] }
    const r = validateRaw(raw, new Date('2026-11-15T12:00:00Z'))
    expect(r.errors.some((e: { message: string }) => /exige une source officielle/.test(e.message))).toBe(true)
  })
})
