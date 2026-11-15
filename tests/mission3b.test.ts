import { readFileSync, existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { evaluateProgram } from '../src/engine/evaluate'
import { withdrawalDisclosure } from '../src/engine/withdrawals'
import { validateRaw } from '../src/data/validate'
import { readRawFromDisk } from '../scripts/read-raw'
import type { Program } from '../src/data/schema'
import { ALPHA, NOW, conf, demo, fullCtx, fullDs, profile } from './helpers'

const real = (id: string): Program => structuredClone(fullDs.programs.find((p) => p.id === id) as Program)
const TS = 'topstep-trading-combine'
const AX = ['apex-eod-trail', 'apex-intraday-trail']
const answers = (over = {}) => profile({ markets: ['futures_index'], ...over })
const qc = { residence: { country: 'CA', region: 'QC' } }

describe('3B · 1. Admissibilité géographique (Québec)', () => {
  it('Apex : le Canada en général est signalé « province non confirmée », jamais « admis » pour le Québec', () => {
    for (const id of AX) {
      const q = real(id).quebec_by_stage!
      for (const stage of ['evaluation', 'funded_sim'] as const) {
        const e = q.find((x) => x.stage === stage)!
        expect(e.state).toBe('canada_general')
        expect(e.note).toMatch(/Québec n'est pas explicitement confirmée/)
        expect(e.note).toMatch(/ne garantit pas l'admissibilité aux paiements/)
      }
      expect(q.find((x) => x.stage === 'live')!.state).toBe('restreint')
    }
  })

  it('le message du critère de résidence mentionne la province non confirmée et la non-garantie des paiements', () => {
    const e = evaluateProgram(real(AX[0]), answers(qc), fullCtx)
    const r = e.criteria.find((c) => c.key === 'residence')!
    expect(r.state).toBe('ok')
    expect(r.message).toMatch(/province ou ton État n'est pas explicitement confirmé/)
    expect(r.message).toMatch(/ne garantit pas l'admissibilité aux paiements/)
  })

  it('sans province indiquée, pas de fausse précision ; la mention sur les paiements reste présente', () => {
    const r = evaluateProgram(real(AX[0]), answers({ residence: { country: 'CA' } }), fullCtx).criteria.find((c) => c.key === 'residence')!
    expect(r.message).not.toMatch(/province ou ton État/)
    expect(r.message).toMatch(/paiements/)
  })

  it('Topstep : les trois types de comptes restent distincts et « À VÉRIFIER »; les paiements ne sont pas garantis', () => {
    const q = real(TS).quebec_by_stage!
    expect(q.map((x) => x.stage)).toEqual(['evaluation', 'funded_sim', 'live'])
    expect(q.every((x) => x.state === 'a_verifier')).toBe(true)
    expect(q.find((x) => x.stage === 'evaluation')!.note).toMatch(/paiements/)
    expect(q.find((x) => x.stage === 'funded_sim')!.note).toMatch(/Wise/)
  })

  it('un statut « canada_general » sans source officielle est refusé', () => {
    const raw = readRawFromDisk()
    const p = (raw.programs as Record<string, Record<string, any>>)['apex-eod-trail.json']
    p.quebec_by_stage[0].sources = []
    const r = validateRaw(raw, NOW)
    expect(r.errors.some((e) => /exige une source officielle/.test(e.message))).toBe(true)
  })
})

describe('3B · 2. Conditions de retrait incomplètes', () => {
  it('Topstep : Safety Net et nombre maximal de retraits manquants sont signalés (important), sans lacune essentielle', () => {
    const d = withdrawalDisclosure(real(TS), real(TS).variants[0])
    expect(d.essential).toEqual([])
    expect(d.important.map((g) => g.key)).toEqual(expect.arrayContaining(['safety_net', 'max_payouts']))
    expect(d.complete).toBe(false)
    expect(d.summary).toMatch(/incomplètes/)
    expect(d.summary).toMatch(/Ne suppose pas/)
  })

  it('Apex : le plafond du dernier retrait non lu et le plafond par taille sont signalés', () => {
    for (const id of AX) {
      const d = withdrawalDisclosure(real(id), real(id).variants[0])
      expect(d.important.map((g) => g.key)).toContain('payout_caps_partial')
    }
  })

  it('un programme de démonstration complet n’affiche aucune lacune', () => {
    const p = demo(ALPHA)
    expect(withdrawalDisclosure(p, p.variants[0]).important.map((g) => g.key)).toEqual(['max_payout_usd'])
    p.variants[0].funded.max_payout_usd = conf(2000)
    const d = withdrawalDisclosure(p, p.variants[0])
    expect(d.summary).toBeNull()
    expect(d.complete).toBe(true)
  })

  it('les lacunes essentielles (partage, minimum, conditions, plafond) sont classées « essential »', () => {
    const p = demo(ALPHA)
    p.funded.profit_split_pct = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
    p.funded.payout_cap = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
    const d = withdrawalDisclosure(p)
    expect(d.essential.map((g) => g.key)).toEqual(['profit_split_pct', 'payout_cap'])
  })

  it('une lacune « importante » ne bloque pas le statut : Topstep reste évaluable sans être dégradé par ce seul motif', () => {
    const base = real(TS)
    const e = evaluateProgram(base, answers(), fullCtx)
    const complete = structuredClone(base)
    complete.funded.safety_net = { status: 'not_applicable', value: null, sources: [], verified_at: null }
    complete.funded.max_payouts = { status: 'not_applicable', value: null, sources: [], verified_at: null }
    const e2 = evaluateProgram(complete, answers(), fullCtx)
    expect(e.status).toBe(e2.status)
    expect(e.withdrawal.important.length).toBeGreaterThan(e2.withdrawal.important.length)
  })

  it('priorité « retraits » : les lacunes ne comptent jamais comme favorables (couverture du critère réduite)', () => {
    const a = answers({ priority: 'withdrawals' })
    const incomplete = evaluateProgram(real(TS), a, fullCtx).score.parts.find((x) => x.key === 'withdrawal')!
    const full = structuredClone(real(TS))
    full.funded.safety_net = { status: 'not_applicable', value: null, sources: [], verified_at: null }
    full.funded.max_payouts = { status: 'not_applicable', value: null, sources: [], verified_at: null }
    full.funded.payout_paths = { status: 'not_applicable', value: null, sources: [], verified_at: null } as never
    const complete = evaluateProgram(full, a, fullCtx).score.parts.find((x) => x.key === 'withdrawal')!
    expect(incomplete.knownRatio).toBeLessThan(complete.knownRatio)
    expect(incomplete.detail).toMatch(/non confirmé/)
  })

  it('une lacune essentielle de retrait (partage inconnu) bloque COMPATIBLE via la couverture existante', () => {
    const p = real(TS)
    p.funded.profit_split_pct = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
    const e = evaluateProgram(p, answers(), fullCtx)
    expect(e.status).not.toBe('COMPATIBLE')
    expect(e.withdrawal.essential.map((g) => g.key)).toContain('profit_split_pct')
  })
})

describe('3B · 3. Traçabilité Apex (sélecteur dynamique)', () => {
  const evidence = JSON.parse(readFileSync('data/evidence/apex-picker-2026-11-15.json', 'utf8'))

  it('le fichier de preuve existe, est daté et déclaré non durable', () => {
    expect(existsSync('data/evidence/apex-picker-2026-11-15.json')).toBe(true)
    expect(evidence.consulted_at).toBe('2026-11-15')
    expect(evidence.durable).toBe(false)
    expect(evidence.not_captured.length).toBeGreaterThan(0)
  })

  it('la source ax-picker conserve date, paramètres, preuve et statut non durable', () => {
    const s = fullDs.sources.find((x) => x.id === 'ax-picker')!
    expect(s.durable).toBe(false)
    expect(s.consulted_at).toBe('2026-11-15')
    expect(s.evidence_file).toBe('data/evidence/apex-picker-2026-11-15.json')
    expect(Object.keys(s.parameters!).sort()).toEqual(['picker_balance', 'picker_fee', 'picker_type'])
  })

  it('chaque observation conserve les paramètres exacts, la date, la preuve ; jamais durable', () => {
    for (const id of AX) {
      const obs = real(id).dynamic_observations!
      expect(obs.length).toBeGreaterThan(0)
      for (const o of obs) {
        expect(o.source).toBe('ax-picker')
        expect(o.consulted_at).toBe('2026-11-15')
        expect(o.durable).toBe(false)
        expect(o.evidence_file).toBe('data/evidence/apex-picker-2026-11-15.json')
        expect(o.parameters).toHaveProperty('picker_balance')
        expect(o.parameters.picker_fee).toBe('standard')
      }
    }
    expect(real(AX[0]).dynamic_observations!.map((o) => o.parameters.picker_balance)).toEqual(['25k', '50k', '100k', '150k'])
    expect(real(AX[1]).dynamic_observations!.map((o) => o.parameters.picker_balance)).toEqual(['25k'])
  })

  it('les observations correspondent à la preuve (aucun prix inventé)', () => {
    const eod = real(AX[0]).dynamic_observations!.map((o) => o.observed.prix_affiche_usd)
    expect(eod).toEqual(evidence.observations.filter((o: any) => o.parameters.picker_type === 'trail-eod').map((o: any) => o.observed.displayed_price_usd))
    expect(eod).toEqual([490, 590, 1190, 2190])
  })

  it('les prix ne deviennent jamais des valeurs confirmées ; la note renvoie à l’observation datée', () => {
    for (const id of AX) {
      for (const v of real(id).variants) {
        expect(v.pricing.one_time.status).toBe('unconfirmed')
        expect(v.pricing.one_time.value).toBeNull()
      }
    }
    expect(real(AX[0]).variants[0].pricing.one_time.note).toMatch(/2026-11-15.*490/)
    expect(real(AX[1]).variants[1].pricing.one_time.note).toMatch(/non relevé/)
  })

  it('valeurs impossibles à vérifier durablement : combinaisons non relevées listées', () => {
    expect(evidence.not_captured.join(' ')).toMatch(/nofee/)
    expect(real(AX[1]).variants.slice(1).every((v) => v.pricing.one_time.status === 'unconfirmed')).toBe(true)
  })

  it('une observation dynamique déclarée durable est refusée', () => {
    const raw = readRawFromDisk()
    const p = (raw.programs as Record<string, Record<string, any>>)['apex-eod-trail.json']
    p.dynamic_observations[0].durable = true
    expect(validateRaw(raw, NOW).errors.some((e) => /durable/.test(e.message))).toBe(true)
  })
})
