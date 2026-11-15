import { describe, expect, it } from 'vitest'
import type { Program } from '../src/data/schema'
import { emptyAnswers } from '../src/engine/answers'
import { evaluateAll, evaluateProgram, makeContext } from '../src/engine/evaluate'
import { ALPHA, BETA, GAMMA, NOW, conf, ctx, demo, ds, na, profile, unc } from './helpers'

const crit = (e: ReturnType<typeof evaluateProgram>, key: string) => e.criteria.find((c) => c.key === key)

describe('Les trois statuts (programmes de démonstration)', () => {
  const results = evaluateAll(ds, profile(), { now: NOW })
  const by = (id: string) => results.find((r) => r.programId === id)!

  it('Alpha est COMPATIBLE : tout est confirmé et satisfait', () => {
    expect(by(ALPHA).status).toBe('COMPATIBLE')
    expect(by(ALPHA).criteria.every((c) => c.state === 'ok')).toBe(true)
  })

  it('Bêta est À VÉRIFIER : résidence et frais inconnus, aucune incompatibilité confirmée', () => {
    const b = by(BETA)
    expect(b.status).toBe('A_VERIFIER')
    expect(crit(b, 'residence')?.state).toBe('unknown')
    expect(crit(b, 'budget')?.state).toBe('unknown')
    expect(b.criteria.some((c) => c.state === 'fail')).toBe(false)
  })

  it('Gamma est INCOMPATIBLE : pas de futures + résidence exclue (Québec)', () => {
    const g = by(GAMMA)
    expect(g.status).toBe('INCOMPATIBLE')
    expect(crit(g, 'markets')?.state).toBe('fail')
    expect(crit(g, 'residence')?.state).toBe('fail')
  })

  it('le tri place COMPATIBLE, puis À VÉRIFIER, puis INCOMPATIBLE', () => {
    expect(results.map((r) => r.status)).toEqual(['COMPATIBLE', 'A_VERIFIER', 'INCOMPATIBLE'])
  })
})

describe('Marchés (critère bloquant)', () => {
  it('une couverture partielle est INCOMPATIBLE avec message détaillé', () => {
    const e = evaluateProgram(demo(ALPHA), profile({ markets: ['futures_index', 'metals', 'crypto_major'] }), ctx)
    expect(e.status).toBe('INCOMPATIBLE')
    expect(e.marketsMatched).toEqual(['futures_index', 'metals'])
    expect(e.marketsMissing).toEqual(['crypto_major'])
    expect(crit(e, 'markets')?.message).toContain('Compatible avec 2 de tes 3 marchés')
    expect(crit(e, 'markets')?.message).toContain('Bitcoin et Ethereum')
  })

  it("un CFD NAS100 n'équivaut jamais à un contrat NQ", () => {
    const e = evaluateProgram(demo(GAMMA), profile({ markets: ['futures_index'], residence: { country: 'FR', region: null } }), ctx)
    expect(crit(e, 'markets')?.state).toBe('fail')
    expect(crit(e, 'markets')?.message).toContain('ne remplacent pas les contrats futures')
    const inverse = evaluateProgram(demo(ALPHA), profile({ markets: ['cfd_index'] }), ctx)
    expect(crit(inverse, 'markets')?.state).toBe('fail')
  })

  it("distingue futures et CFD pour l'or", () => {
    const a = demo(ALPHA) // or en futures (MGC, GC)
    const g = demo(GAMMA) // or en CFD (XAUUSD)
    const fr = { country: 'FR', region: null }
    expect(crit(evaluateProgram(a, profile({ markets: ['metals'], marketForms: { metals: 'futures' } }), ctx), 'markets')?.state).toBe('ok')
    expect(crit(evaluateProgram(a, profile({ markets: ['metals'], marketForms: { metals: 'cfd' } }), ctx), 'markets')?.state).toBe('fail')
    expect(crit(evaluateProgram(g, profile({ markets: ['metals'], marketForms: { metals: 'cfd' }, residence: fr }), ctx), 'markets')?.state).toBe('ok')
    expect(crit(evaluateProgram(g, profile({ markets: ['metals'], marketForms: { metals: 'futures' }, residence: fr }), ctx), 'markets')?.state).toBe('fail')
    expect(crit(evaluateProgram(a, profile({ markets: ['metals'], marketForms: { metals: 'any' } }), ctx), 'markets')?.state).toBe('ok')
  })

  it('instruments non confirmés → inconnu (jamais incompatible)', () => {
    const p = demo(ALPHA)
    p.instruments = unc()
    const e = evaluateProgram(p, profile(), ctx)
    expect(crit(e, 'markets')?.state).toBe('unknown')
    expect(e.status).toBe('A_VERIFIER')
  })
})

describe('Résidence (critère d’admissibilité)', () => {
  const res = (id: string, residence: ReturnType<typeof profile>['residence']) => crit(evaluateProgram(demo(id), profile({ markets: ['forex'], residence }), ctx), 'residence')!

  it('pays exclu → échec', () => {
    expect(res(GAMMA, { country: 'US', region: null }).state).toBe('fail')
    expect(res(ALPHA, { country: 'IR', region: null }).state).toBe('fail')
  })
  it('région exclue → échec ; autre région → ok', () => {
    expect(res(GAMMA, { country: 'CA', region: 'QC' }).state).toBe('fail')
    expect(res(GAMMA, { country: 'CA', region: 'ON' }).state).toBe('ok')
  })
  it('région non précisée alors que des régions sont exclues → inconnu', () => {
    expect(res(GAMMA, { country: 'CA', region: null }).state).toBe('unknown')
  })
  it('« autres provinces » (Québec écarté) → ok', () => {
    expect(res(GAMMA, { country: 'CA', region: null, notRegions: ['QC'] }).state).toBe('ok')
  })
  it('pays non indiqué → inconnu', () => {
    expect(res(ALPHA, { country: null, region: null }).state).toBe('unknown')
  })
  it('admissibilité non confirmée → jamais « compatible »', () => {
    const e = evaluateProgram(demo(BETA), profile(), ctx)
    expect(crit(e, 'residence')?.state).toBe('unknown')
    expect(e.status).not.toBe('COMPATIBLE')
  })
  it('liste explicite : admissible confirmé → ok, exclu → fail, absent → inconnu', () => {
    const p = demo(ALPHA)
    p.eligibility = conf({ eligible: ['FR', 'BE'], excluded: ['IR'], unconfirmed: [], unlisted: 'unconfirmed' })
    const r = (country: string) => crit(evaluateProgram(p, profile({ residence: { country, region: null } }), ctx), 'residence')?.state
    expect(r('FR')).toBe('ok')
    expect(r('IR')).toBe('fail')
    expect(r('CA')).toBe('unknown') // absence d'exclusion ≠ admissibilité confirmée
  })
  it("la résidence n'est jamais assouplissable", () => {
    const e = evaluateProgram(demo(GAMMA), profile({ markets: ['forex'], residence: { country: 'US', region: null }, locks: { residence: 'preferred' } as never }), ctx)
    expect(e.status).toBe('INCOMPATIBLE')
    expect(e.category).toBe('C')
  })
})

describe('Restrictions de trading', () => {
  it('overnight interdit → INCOMPATIBLE quand l’étudiant en a besoin', () => {
    const e = evaluateProgram(demo(ALPHA), profile({ when: ['overnight'] }), ctx)
    expect(crit(e, 'overnight')?.state).toBe('fail')
    expect(e.status).toBe('INCOMPATIBLE')
  })
  it("ne bloque pas si l'étudiant n'en a pas besoin", () => {
    const e = evaluateProgram(demo(ALPHA), profile({ when: ['regular'] }), ctx)
    expect(crit(e, 'overnight')).toBeUndefined()
    expect(e.status).toBe('COMPATIBLE')
  })
  it('annonces : bloquant uniquement si cochées', () => {
    const p = demo(ALPHA)
    p.restrictions.news.evaluation = conf('forbidden')
    expect(crit(evaluateProgram(p, profile({ when: ['regular'] }), ctx), 'news')).toBeUndefined()
    expect(evaluateProgram(p, profile({ when: ['news'] }), ctx).status).toBe('INCOMPATIBLE')
  })
  it('autorisé en évaluation mais interdit en funded → pas pleinement compatible', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight = { evaluation: conf('allowed'), funded: conf('forbidden') }
    const e = evaluateProgram(p, profile({ when: ['overnight'] }), ctx)
    expect(crit(e, 'overnight')?.state).toBe('fail')
    expect(crit(e, 'overnight')?.message).toMatch(/Autorisé pendant l'évaluation, mais interdit sur le compte funded/)
    expect(e.status).toBe('INCOMPATIBLE')
  })
  it('autorisé en funded mais interdit pendant l’évaluation → échec', () => {
    const p = demo(ALPHA)
    p.restrictions.weekend = { evaluation: conf('forbidden'), funded: conf('allowed') }
    expect(crit(evaluateProgram(p, profile({ when: ['weekend'] }), ctx), 'weekend')?.state).toBe('fail')
  })
  it('une règle « conditional » n’est jamais traitée comme « allowed »', () => {
    const e = evaluateProgram(demo(BETA), profile({ when: ['news'], budget: 'none', residence: { country: 'FR', region: null } }), ctx)
    expect(crit(e, 'news')?.state).toBe('unknown')
    expect(crit(e, 'news')?.message).toContain('sous conditions')
    expect(e.status).toBe('A_VERIFIER')
  })
  it('conditional côté funded seulement → À VÉRIFIER (pas ok)', () => {
    const e = evaluateProgram(demo(BETA), profile({ when: ['overnight'] }), ctx)
    expect(crit(e, 'overnight')?.state).toBe('unknown')
  })
  it('restriction non confirmée → inconnu', () => {
    const e = evaluateProgram(demo(BETA), profile({ style: 'scalping' }), ctx)
    expect(crit(e, 'scalping')?.state).toBe('unknown')
  })
  it('un interdit confirmé l’emporte sur un inconnu', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight = { evaluation: unc(), funded: conf('forbidden') }
    expect(crit(evaluateProgram(p, profile({ when: ['overnight'] }), ctx), 'overnight')?.state).toBe('fail')
  })
  it('programme sans challenge : l’évaluation est ignorée', () => {
    const p = demo(ALPHA)
    p.evaluation.steps = conf(0)
    p.evaluation.drawdown_type = na()
    p.restrictions.overnight = { evaluation: na(), funded: conf('allowed') }
    const e = evaluateProgram(p, profile({ when: ['overnight'] }), ctx)
    expect(crit(e, 'overnight')?.state).toBe('ok')
  })
  it('session asiatique et scalping sont évalués à la demande', () => {
    const e = evaluateProgram(demo(ALPHA), profile({ when: ['asian'], style: 'scalping' }), ctx)
    expect(crit(e, 'asian_session')?.state).toBe('ok')
    expect(crit(e, 'scalping')?.state).toBe('ok')
  })
})

describe('Budget et coûts', () => {
  it('coût de départ dans le budget (abonnement : base explicitée)', () => {
    const e = evaluateProgram(demo(ALPHA), profile(), ctx)
    expect(crit(e, 'budget')?.state).toBe('ok')
    expect(crit(e, 'budget')?.message).toContain('Abonnement mensuel')
    expect(e.cheapest?.exact).toBe(49)
    expect(e.cheapest?.recurringMonthly).toBe(49)
  })
  it('« Moins de 50 $ » est strict', () => {
    const p = demo(ALPHA)
    p.variants = p.variants.map((v) => ({ ...v, pricing: { ...v.pricing, monthly: conf(50) } }))
    expect(crit(evaluateProgram(p, profile({ budget: 'lt50' }), ctx), 'budget')?.state).toBe('fail')
    expect(crit(evaluateProgram(p, profile({ budget: '50_100' }), ctx), 'budget')?.state).toBe('ok')
  })
  it("les frais d'activation obligatoires s'ajoutent au coût de départ", () => {
    const p = demo(ALPHA)
    p.variants = [{ ...p.variants[0], pricing: { ...p.variants[0].pricing, monthly: conf(90), activation_fee: conf(20) } }]
    const e = evaluateProgram(p, profile(), ctx)
    expect(e.cheapest?.exact).toBe(110)
    expect(crit(e, 'budget')?.state).toBe('fail')
  })
  it("frais d'activation inconnus mais prix dans le budget → À VÉRIFIER", () => {
    const e = evaluateProgram(demo(BETA), profile({ residence: { country: 'FR', region: null } }), ctx)
    expect(crit(e, 'budget')?.state).toBe('unknown')
    expect(crit(e, 'budget')?.message).toContain("frais d'activation")
  })
  it("frais d'activation inconnus mais prix déjà au-dessus du budget → échec confirmé", () => {
    const p = demo(BETA)
    const e = evaluateProgram(p, profile({ budget: 'lt50', residence: { country: 'FR', region: null } }), ctx)
    expect(crit(e, 'budget')?.state).toBe('fail')
  })
  it('prix non confirmé → inconnu', () => {
    const p = demo(ALPHA)
    p.variants = p.variants.map((v) => ({ ...v, pricing: { ...v.pricing, monthly: unc() } }))
    expect(crit(evaluateProgram(p, profile(), ctx), 'budget')?.state).toBe('unknown')
  })
  it('les frais conditionnels et les promotions ne sont jamais additionnés', () => {
    const p = demo(ALPHA)
    p.variants[0].pricing.conditional_fees = conf([{ label: 'Frais éventuel', amount_usd: 500, condition: 'selon cas' }])
    const e = evaluateProgram(p, profile(), ctx)
    expect(e.cheapest?.exact).toBe(49)
    expect(e.cheapest?.conditionalFees).toHaveLength(1)
    expect(p.promos.length).toBeGreaterThan(0)
  })
  it('« Aucun budget » ne crée aucun critère', () => {
    expect(crit(evaluateProgram(demo(GAMMA), profile({ budget: 'none' }), ctx), 'budget')).toBeUndefined()
  })
  it('plusieurs variantes : une seule suffit à être dans le budget', () => {
    const e = evaluateProgram(demo(GAMMA), profile({ markets: ['forex'], budget: '100_200', residence: { country: 'FR', region: null } }), ctx)
    expect(crit(e, 'budget')?.state).toBe('ok') // 155 $
  })
})

describe('Type d’évaluation', () => {
  it('choix explicite : critère bloquant', () => {
    // Mission 7 : le type d'évaluation est une PRÉFÉRENCE par défaut (alternative proche) ; il devient bloquant avec le cadenas.
    const soft = evaluateProgram(demo(ALPHA), profile({ steps: 'two' }), ctx)
    expect(crit(soft, 'steps')?.state).toBe('fail')
    expect(soft.category).toBe('B')
    expect(soft.status).toBe('PARTIEL')
    const hard = evaluateProgram(demo(ALPHA), profile({ steps: 'two', locks: { steps: 'required' } }), ctx)
    expect(hard.category).toBe('C')
    expect(hard.status).toBe('INCOMPATIBLE')
  })
  it('« Peu importe » : aucune exclusion', () => {
    const e = evaluateProgram(demo(ALPHA), profile({ steps: 'any' }), ctx)
    expect(crit(e, 'steps')).toBeUndefined()
    expect(e.status).toBe('COMPATIBLE')
  })
})

describe('Données anciennes', () => {
  it('une donnée confirmée trop ancienne impose « Vérification nécessaire »', () => {
    const p = demo(ALPHA)
    p.funded.profit_split_pct = conf(80, '2026-08-01')
    const e = evaluateProgram(p, profile(), ctx)
    expect(e.needsReview).toBe(true)
    expect(e.status).toBe('A_VERIFIER')
    expect(crit(e, 'freshness')?.message).toContain('indicateur de maintenance')
  })
  it('une donnée ancienne utilisée par un critère devient inconnue', () => {
    const p = demo(ALPHA)
    p.restrictions.overnight = { evaluation: conf('allowed', '2026-08-01'), funded: conf('allowed', '2026-08-01') }
    expect(crit(evaluateProgram(p, profile({ when: ['overnight'] }), ctx), 'overnight')?.state).toBe('unknown')
  })
  it('le seuil est configurable', () => {
    const long = makeContext({ ...ds, scoring: { ...ds.scoring, stale_after_days: 200 } }, NOW)
    const e = evaluateProgram(demo(BETA), profile(), long)
    expect(e.needsReview).toBe(false)
  })
  it('Alpha deviendrait À VÉRIFIER si les dates de démo vieillissent', () => {
    const later = makeContext(ds, new Date('2027-02-01T00:00:00Z'))
    expect(evaluateProgram(demo(ALPHA), profile(), later).status).toBe('A_VERIFIER')
  })
})

describe('Assouplissement des critères', () => {
  const answers = profile({ when: ['overnight'] })
  it('une restriction passée en « souhaitable » donne PARTIEL (alternative), jamais COMPATIBLE', () => {
    const e = evaluateProgram(demo(ALPHA), { ...answers, locks: { overnight: 'preferred' } }, ctx)
    expect(e.status).toBe('PARTIEL')
    expect(e.category).toBe('B')
    expect(crit(e, 'overnight')?.relaxed).toBe(true)
    expect(e.adjustments.map((x) => x.key)).toEqual(['overnight'])
  })
  it('par défaut la restriction est indispensable : INCOMPATIBLE', () => {
    const e = evaluateProgram(demo(ALPHA), answers, ctx)
    expect(e.status).toBe('INCOMPATIBLE')
    expect(e.category).toBe('C')
  })
  it('un marché non proposé reste bloquant, même si l’étudiant a assoupli autre chose', () => {
    const e = evaluateProgram(demo(ALPHA), profile({ markets: ['stocks'], marketForms: { stocks: 'spot' }, when: ['overnight'], locks: { overnight: 'preferred' } }), ctx)
    expect(e.category).toBe('C')
  })
  it('sans aucun cadenas modifié, aucune alternative B n’apparaît pour des critères déjà indispensables', () => {
    const all = evaluateAll(ds, answers, { now: NOW })
    expect(all.some((r) => r.category === 'B')).toBe(false)
  })
})

describe('Aucun résultat compatible', () => {
  it('les critères responsables sont listés', () => {
    const all = evaluateAll(ds, profile({ markets: ['stocks'], marketForms: { stocks: 'spot' } }), { now: NOW })
    expect(all.every((r) => r.status === 'INCOMPATIBLE')).toBe(true)
    expect(all.every((r) => r.criteria.some((c) => c.key === 'markets' && c.state === 'fail'))).toBe(true)
  })
})

describe('Score de correspondance', () => {
  const pref = profile({ drawdown: 'eod_trailing', priority: 'withdrawals' })

  it('programme complet : correspondance parfaite', () => {
    const s = evaluateProgram(demo(ALPHA), pref, ctx).score
    expect(s.match).toBeCloseTo(100)
    expect(s.criteriaCoverage).toBeCloseTo(100)
    expect(s.rank).toBeCloseTo(100)
  })

  it('les critères inconnus ne reçoivent aucune note favorable', () => {
    const p = demo(ALPHA)
    p.evaluation.drawdown_type = unc()
    p.funded.drawdown_type = unc()
    const s = evaluateProgram(p, pref, ctx).score
    const dd = s.parts.find((x) => x.key === 'drawdown')!
    expect(dd.score).toBeNull()
    expect(dd.knownRatio).toBe(0)
    expect(s.rank).toBeLessThan(100)
  })

  it('un programme peu documenté ne dépasse pas un programme complet grâce à la normalisation', () => {
    const sparse = demo(ALPHA)
    sparse.evaluation.drawdown_type = unc()
    sparse.funded.drawdown_type = unc()
    sparse.funded.profit_split_pct = unc()
    sparse.funded.min_withdrawal_usd = unc()
    const full = evaluateProgram(demo(ALPHA), pref, ctx)
    const sp = evaluateProgram(sparse, pref, ctx)
    expect(sp.score.match).toBeCloseTo(100) // sur les critères évaluables seulement…
    expect(sp.score.criteriaCoverage).toBeLessThan(40) // …mais très peu évalués
    expect(sp.score.rank).toBeLessThan(full.score.rank)
    expect(sp.infoCoverage).toBeLessThan(full.infoCoverage)
  })

  it('le classement tient compte de l’incertitude, à statut égal', () => {
    const sparse = demo(ALPHA)
    sparse.id = 'demo-sparse'
    sparse.funded.profit_split_pct = unc()
    sparse.funded.min_withdrawal_usd = unc()
    const d2 = { ...ds, programs: [sparse, demo(ALPHA)] }
    const out = evaluateAll(d2, pref, { now: NOW })
    expect(out[0].programId).toBe(ALPHA)
  })

  it('sans préférence exprimée : aucune note de correspondance', () => {
    const s = evaluateProgram(demo(ALPHA), profile({ drawdown: 'any', budget: 'none', steps: 'any', priority: 'none' }), ctx).score
    expect(s.parts).toHaveLength(0)
    expect(s.match).toBeNull()
  })

  it('« règles de drawdown simples » favorise le static (barème configurable)', () => {
    const q = profile({ drawdown: 'any', budget: 'none', priority: 'simple_drawdown', markets: ['forex'], residence: { country: 'FR', region: null } })
    const stat = evaluateProgram(demo(GAMMA), q, ctx).score.rank
    const eod = evaluateProgram(demo(ALPHA), q, ctx).score.rank
    expect(stat).toBeGreaterThan(eod)
  })

  it('la priorité multiplie le poids du critère concerné', () => {
    const s = evaluateProgram(demo(ALPHA), profile({ priority: 'low_cost' }), ctx).score
    expect(s.parts.find((x) => x.key === 'cost')?.weight).toBe(ds.scoring.weights.cost * ds.scoring.priority_multiplier)
  })

  it('les pondérations sont modifiables sans toucher au code', () => {
    const c2 = makeContext({ ...ds, scoring: { ...ds.scoring, weights: { ...ds.scoring.weights, cost: 40 } } }, NOW)
    const s = evaluateProgram(demo(ALPHA), profile({ priority: 'none' }), c2).score
    expect(s.parts.find((x) => x.key === 'cost')?.weight).toBe(40)
  })

  it('la plateforme compte seulement si l’étudiant en a choisi une', () => {
    const none = evaluateProgram(demo(ALPHA), profile({ priority: 'none', budget: 'none' }), ctx).score
    expect(none.parts.some((p) => p.key === 'platform')).toBe(false)
    const ok = evaluateProgram(demo(ALPHA), profile({ priority: 'platform', platforms: ['tradovate'], budget: 'none' }), ctx).score
    expect(ok.parts.find((p) => p.key === 'platform')?.score).toBe(1)
    const ko = evaluateProgram(demo(ALPHA), profile({ priority: 'platform', platforms: ['metatrader5'], budget: 'none' }), ctx).score
    expect(ko.parts.find((p) => p.key === 'platform')?.score).toBe(0)
  })

  it('la liberté de trading reflète les restrictions réelles', () => {
    const a = evaluateProgram(demo(ALPHA), profile({ priority: 'freedom', budget: 'none' }), ctx).score.parts.find((p) => p.key === 'freedom')!
    const g = evaluateProgram(demo(GAMMA), profile({ priority: 'freedom', budget: 'none', markets: ['forex'] }), ctx).score.parts.find((p) => p.key === 'freedom')!
    expect(g.score!).toBeGreaterThan(a.score!)
  })

  it("le score ignore l'affiliation et ne mesure aucune performance (champs absents)", () => {
    const s = evaluateProgram(demo(ALPHA), profile(), ctx)
    expect(Object.keys(s.score)).toEqual(['parts', 'match', 'criteriaCoverage', 'rank'])
  })
})

describe('Questionnaire vide', () => {
  it('ne plante pas et signale la résidence manquante', () => {
    const e = evaluateProgram(demo(ALPHA), emptyAnswers(), ctx)
    expect(e.status).toBe('A_VERIFIER')
  })
})

describe('Types sans challenge', () => {
  it('programme à 0 étape : drawdown d’évaluation ignoré dans le score', () => {
    const p: Program = demo(ALPHA)
    p.evaluation.steps = conf(0)
    p.evaluation.drawdown_type = na()
    const s = evaluateProgram(p, profile({ drawdown: 'eod_trailing', budget: 'none', priority: 'none' }), ctx).score
    expect(s.parts.find((x) => x.key === 'drawdown')?.detail).not.toContain('évaluation')
  })
})
