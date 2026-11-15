import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { readRawFromDisk } from '../scripts/read-raw'
import { studentView } from '../src/data/load'
import type { Dataset, Program } from '../src/data/schema'
import { validateRaw } from '../src/data/validate'
import { ADJUSTABLE, emptyAnswers, weightOf, type Answers, type CriterionKey } from '../src/engine/answers'
import { budgetBrackets } from '../src/engine/budget'
import { evaluateAll, evaluateProgram, makeContext } from '../src/engine/evaluate'
import { activeCriteria, bottleneck, funnelCounts, strategySuggestions, withoutCriterion } from '../src/engine/funnel'
import { encodeShare } from '../src/engine/share'
import { NOW, conf, ds as demoDs } from './helpers'

const { dataset: ds } = validateRaw(studentView(readRawFromDisk()), NOW)
if (!ds) throw new Error('données invalides')
const ctx = makeContext(ds, NOW)
const QC = { country: 'CA', region: 'QC' }
const base = (o: Partial<Answers>): Answers => ({ ...emptyAnswers(), style: 'day', when: ['regular'], drawdown: 'any', budget: 'none', steps: 'any', priority: 'none', residence: QC, ...o })
const prog = (id: string) => ds.programs.find((p) => p.id === id) as Program
const ev = (id: string, a: Answers) => evaluateProgram(prog(id), a, ctx)
const crit = (e: ReturnType<typeof ev>, k: string) => e.criteria.find((c) => c.key === k)
const FUT = ['futures_index']

const PROFILES: Record<string, Answers> = {
  debutant: base({ markets: FUT, style: 'unsure', budget: '50_100', priority: 'low_cost' }),
  mnq: base({ markets: FUT, instruments: ['MNQ'] }),
  nas: base({ markets: ['cfd_index'], instruments: ['NAS100'], marketForms: { cfd_index: 'cfd' } }),
  overnight: base({ markets: FUT, when: ['regular', 'overnight'] }),
  news: base({ markets: FUT, when: ['regular', 'news'] }),
  deux: base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'two' }),
  retraits: base({ markets: FUT, priority: 'withdrawals' }),
  libre: base({ markets: FUT, style: 'unsure', when: ['none'] }),
}

/* ------------------------------------------------------------------ */
describe('Correction 1 · budget indispensable : confirmé ≠ observé', () => {
  it('prix CONFIRMÉ au-dessus du plafond : catégorie C si le budget est indispensable, B sinon', () => {
    const locked = ev('topstep-trading-combine', base({ markets: FUT, budget: 'lt50', locks: { budget: 'required' } }))
    expect(locked.category).toBe('C')
    expect(locked.status).toBe('INCOMPATIBLE')
    expect(crit(locked, 'budget')).toMatchObject({ state: 'fail', basis: 'confirmed' })
    const soft = ev('topstep-trading-combine', base({ markets: FUT, budget: 'lt50' }))
    expect(soft.category).toBe('B')
    expect(soft.adjustments.map((x) => x.key)).toEqual(['budget'])
  })

  it('prix seulement OBSERVÉ au-dessus du plafond + budget indispensable : reste incertain (A « à confirmer »), jamais C, jamais compatible', () => {
    const e = ev('myfundedfutures-rapid', base({ markets: FUT, budget: 'lt50', locks: { budget: 'required' } }))
    expect(crit(e, 'budget')).toMatchObject({ state: 'unknown', basis: 'observed', observedOver: true })
    expect(e.category).toBe('A')
    expect(e.uncertainBudget).toBe(true)
    expect(e.status).toBe('A_VERIFIER')
    expect(e.status).not.toBe('COMPATIBLE')
  })

  it('prix seulement OBSERVÉ au-dessus du plafond + budget souhaitable : alternative proche B, jamais incompatible', () => {
    const e = ev('myfundedfutures-rapid', base({ markets: FUT, budget: 'lt50' }))
    expect(e.category).toBe('B')
    expect(e.adjustments.map((x) => x.key)).toEqual(['budget'])
    expect(crit(e, 'budget')?.state).toBe('unknown') // pas un échec confirmé
  })

  it('prix observé DANS le budget : indication seulement, jamais « ok » ni compatible', () => {
    const e = ev('tradeday-qp-intraday', base({ markets: FUT, budget: 'lt50' }))
    const c = crit(e, 'budget')!
    expect(c.state).toBe('unknown')
    expect(c.basis).toBe('observed')
    expect(c.observedOver).toBe(false)
    expect(c.message).toMatch(/indication/)
    expect(e.status).not.toBe('COMPATIBLE')
  })

  it('prix observé en euros : jamais comparé à un budget en dollars', () => {
    const e = ev('ftmo-2step-standard', base({ markets: ['forex'], marketForms: { forex: 'spot' }, budget: 'lt50', residence: { country: 'FR', region: null } }))
    const c = crit(e, 'budget')!
    expect(c.state).toBe('unknown')
    expect(c.message).toMatch(/euros/)
  })

  it('prix inconnu : jamais « sous le budget »', () => {
    const e = ev('myfundedfutures-pro', base({ markets: FUT, budget: 'lt50' }))
    const c = crit(e, 'budget')!
    expect(c.state).toBe('unknown')
    expect(c.message).toMatch(/jamais compté/)
  })

  it('propriété : sans prix confirmé, le budget n’est jamais « ok » ni « fail » ; C pour budget seulement sur prix confirmé', () => {
    for (const budget of ['lt50', '50_100', '100_200'] as const)
      for (const lock of ['required', 'preferred'] as const)
        for (const p of ds.programs) {
          const e = evaluateProgram(p, base({ markets: [p.contract_types.value?.includes('futures') ? 'futures_index' : 'forex'], budget, locks: { budget: lock } }), ctx)
          for (const v of e.variants) {
            const c = v.criteria.find((x) => x.key === 'budget')
            if (!c) continue
            if (c.basis !== 'confirmed') expect(['unknown'], `${p.id}/${v.variantId}`).toContain(c.state)
            if (c.state === 'ok') expect(c.basis, p.id).toBe('confirmed')
          }
          if (e.category === 'C' && !e.missed.some((m) => m.key !== 'budget' && m.weight === 'required'))
            expect(crit(e, 'budget')?.basis, p.id).toBe('confirmed')
        }
  })

  it('les programmes « à confirmer » sont comptés à part, jamais dans les « possibles »', () => {
    const a = base({ markets: FUT, budget: 'lt50', locks: { budget: 'required' } })
    const c = funnelCounts(ds, a, NOW)
    expect(c.u).toBeGreaterThan(0)
    expect(c.idsA.some((id) => c.idsU.includes(id))).toBe(false)
    expect(c.a + c.u + c.b + c.c).toBe(c.total)
  })
})

/* ------------------------------------------------------------------ */
describe('Correction 2 · unité de comptage = le programme', () => {
  it('tous les compteurs comptent des programmes (pas des variantes) et leur somme est le nombre de programmes', () => {
    const nVariants = ds.programs.reduce((n, p) => n + p.variants.length, 0)
    expect(nVariants).toBeGreaterThan(ds.programs.length * 2)
    for (const [name, a] of Object.entries(PROFILES)) {
      const c = funnelCounts(ds, a, NOW)
      expect(c.total, name).toBe(ds.programs.length)
      expect(c.a + c.u + c.b + c.c, name).toBe(ds.programs.length)
      expect(c.firmsA, name).toBeLessThanOrEqual(c.a)
      expect(new Set([...c.idsA, ...c.idsU, ...c.idsB]).size, name).toBe(c.a + c.u + c.b)
    }
  })

  it('un programme à plusieurs tailles de compte n’est compté qu’une fois, dans une seule fourchette de budget', () => {
    const { brackets, possible } = budgetBrackets(ds, PROFILES.debutant, NOW)
    const ids = brackets.flatMap((b) => b.programs.map((p) => p.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.length).toBe(possible)
    expect(brackets.reduce((n, b) => n + b.count, 0)).toBe(possible)
    expect(ds.programs.filter((p) => ids.includes(p.id) && p.variants.length > 1).length).toBeGreaterThan(3)
  })

  it('les fourchettes + « prix inconnu » + « euros » = les programmes encore possibles (A + à confirmer + B, hors budget)', () => {
    for (const a of Object.values(PROFILES)) {
      const { possible } = budgetBrackets(ds, a, NOW)
      const c = funnelCounts(ds, { ...a, budget: null }, NOW)
      expect(possible).toBe(c.a + c.u + c.b)
    }
  })

  it('les prix inconnus forment un groupe séparé ; aucun n’est rangé sous le budget', () => {
    const { brackets } = budgetBrackets(ds, PROFILES.debutant, NOW)
    const unknown = brackets.find((b) => b.id === 'unknown')
    expect(unknown?.programs.every((p) => p.price === null)).toBe(true)
    for (const b of brackets.filter((x) => x.id !== 'unknown')) expect(b.programs.every((p) => p.price !== null), b.id).toBe(true)
  })

  it('ajouter un critère n’augmente jamais le nombre de programmes possibles', () => {
    const start = base({ markets: FUT })
    let prev = funnelCounts(ds, start, NOW).a
    for (const patch of [{ instruments: ['MNQ'] }, { when: ['regular', 'news'] as Answers['when'] }, { when: ['regular', 'news', 'overnight'] as Answers['when'] }, { steps: 'two' as const }]) {
      const a = { ...start, ...patch }
      const n = funnelCounts(ds, a, NOW).a
      expect(n).toBeLessThanOrEqual(prev)
      prev = n
    }
  })

  it('un critère SOUHAITABLE ne fait jamais disparaître un programme : il le déplace de A vers B', () => {
    const without = funnelCounts(ds, base({ markets: FUT }), NOW)
    const withPref = funnelCounts(ds, base({ markets: FUT, steps: 'two', budget: 'lt50', drawdown: 'static' }), NOW)
    expect(withPref.a + withPref.u + withPref.b).toBe(without.a + without.u + without.b)
    expect(withPref.c).toBe(without.c)
  })

  it('bandeau, résultats et budget affichent le même nombre pour les mêmes réponses', async () => {
    const a = PROFILES.overnight
    const expected = funnelCounts(ds, a, NOW)
    window.location.hash = `#/resultats?r=${encodeShare({ answers: a })}`
    render(<App dataset={ds} errors={[]} now={NOW} />)
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    const summary = await screen.findByTestId('results-summary')
    expect(summary).toHaveTextContent(new RegExp(`^${expected.a} programme`))
    expect(summary).toHaveTextContent(`${expected.b} alternative`)
    expect(summary).toHaveTextContent(`${expected.c} incompatible`)
  })
})

/* ------------------------------------------------------------------ */
describe('Correction 3 · contrainte verrouillée jamais violée', () => {
  const combos: Answers[] = [
    ...Object.values(PROFILES),
    base({ markets: FUT, when: ['regular', 'overnight', 'news'], steps: 'two', locks: { steps: 'required' } }),
    base({ markets: FUT, budget: 'lt50', locks: { budget: 'required' } }),
    base({ markets: FUT, when: ['regular', 'overnight'], locks: { overnight: 'preferred' } }),
    base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'one', drawdown: 'static', locks: { steps: 'required', drawdown: 'required' } }),
  ]
  it('propriété : aucune carte A ou B n’a un critère indispensable en échec confirmé', () => {
    for (const a of combos)
      for (const e of evaluateAll(ds, a, { now: NOW })) {
        if (e.category === 'C') {
          expect(e.missed.some((m) => m.weight === 'required'), e.programId).toBe(true)
          continue
        }
        for (const v of e.variants.filter((x) => x.variantId === e.recommendedVariantId)) expect(v.criteria.some((c) => c.state === 'fail' && c.weight === 'required'), e.programId).toBe(false)
        expect(e.missed.every((m) => m.weight === 'preferred'), e.programId).toBe(true)
      }
  })
  it('les ajustements proposés ne touchent jamais un critère indispensable', () => {
    for (const a of combos)
      for (const e of evaluateAll(ds, a, { now: NOW })) for (const adj of e.adjustments) expect(weightOf(adj.key, a), `${e.programId}/${adj.key}`).toBe('preferred')
  })
  it('overnight indispensable : les programmes qui l’interdisent ne sont ni A ni B, mais listés à part comme changement de stratégie', () => {
    const a = PROFILES.overnight
    const c = funnelCounts(ds, a, NOW)
    const sugg = strategySuggestions(ds, a, NOW, c)
    const s = sugg.find((x) => x.target === 'overnight')!
    expect(s).toBeDefined()
    expect(s.programIds.length).toBe(9)
    for (const id of s.programIds) {
      expect([...c.idsA, ...c.idsU, ...c.idsB]).not.toContain(id)
      expect(ev(id, a).category).toBe('C')
    }
    expect(s.text).toMatch(/indispensable/)
    expect(s.text).toMatch(/changer de stratégie|changement de stratégie/)
  })
  it('appliquer la suggestion les rendrait possibles ; ne la pas appliquer ne change rien (fonctions pures)', () => {
    const a = PROFILES.overnight
    const before = JSON.stringify(a)
    const s = strategySuggestions(ds, a, NOW).find((x) => x.target === 'overnight')!
    expect(JSON.stringify(a)).toBe(before)
    const after = funnelCounts(ds, withoutCriterion(a, 'overnight'), NOW)
    for (const id of s.programIds) expect(after.idsA).toContain(id)
  })
  it('seuls les critères indispensables donnent lieu à une suggestion de stratégie', () => {
    const a = base({ markets: FUT, when: ['regular', 'overnight'], locks: { overnight: 'preferred' } })
    expect(strategySuggestions(ds, a, NOW).some((x) => x.target === 'overnight')).toBe(false)
  })
  it('page de résultats : la suggestion est un bloc séparé, ses programmes ne sont pas dans les sections A ou B', async () => {
    window.location.hash = `#/resultats?r=${encodeShare({ answers: PROFILES.overnight })}`
    render(<App dataset={ds} errors={[]} now={NOW} />)
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    const strategy = await screen.findByTestId('strategy')
    expect(strategy).toHaveTextContent(/ne sont pas compatibles/)
    expect(strategy).toHaveTextContent(/Positions overnight/)
    const sectionA = document.querySelector('[data-category="A"]')
    const topstep = prog('topstep-trading-combine').name
    expect(within(sectionA as HTMLElement).queryByText(topstep)).toBeNull()
    expect(document.querySelector('[data-category="B"]')).toBeNull()
  })
  it('le poids d’un critère n’est jamais modifié par l’outil (résidence, marché, instruments : toujours indispensables)', () => {
    const a = base({ markets: FUT, locks: { residence: 'preferred', markets: 'preferred', instruments: 'preferred' } as never })
    for (const k of ['residence', 'markets', 'instruments']) expect(weightOf(k, a)).toBe('required')
    for (const k of ADJUSTABLE) expect(['required', 'preferred']).toContain(weightOf(k, emptyAnswers()))
  })
})

/* ------------------------------------------------------------------ */
describe('Scénarios obligatoires', () => {
  it('1 · aucun programme ne satisfait tout : le questionnaire ne mène jamais à un écran vide', async () => {
    const a = base({ markets: FUT, when: ['regular', 'overnight', 'news'], steps: 'two', budget: 'lt50', locks: { steps: 'required', budget: 'required' } })
    const c = funnelCounts(ds, a, NOW)
    expect(c.a).toBe(0)
    window.location.hash = `#/resultats?r=${encodeShare({ answers: a })}`
    render(<App dataset={ds} errors={[]} now={NOW} />)
    const user = userEvent.setup()
    await user.click(within(await screen.findByRole('region', { name: 'Résidence manquante' })).getByRole('radio', { name: 'Canada — Québec' }))
    const panel = await screen.findByRole('region', { name: 'Aucune correspondance' })
    expect(panel).toHaveTextContent(/Aucun programme ne remplit tous tes critères/)
    expect(panel).toHaveTextContent(/restreint le plus/) // goulot nommé
    expect(screen.getByTestId('incompatibles')).toBeInTheDocument() // les raisons restent visibles
    expect(screen.getByTestId('strategy')).toBeInTheDocument() // et une piste de changement, séparée
  })

  it('2 · le budget élimine tout : tous incompatibles si le budget est indispensable et les prix confirmés', () => {
    const d: Dataset = structuredClone(demoDs)
    for (const p of d.programs) for (const v of p.variants) {
      v.pricing.one_time = conf(900)
      v.pricing.monthly = { status: 'not_applicable', value: null, sources: ['demo-fiction'], verified_at: '2026-11-15' }
      v.pricing.activation_fee = conf(0)
    }
    const a = { ...emptyAnswers(), markets: ['futures_index'], style: 'day' as const, when: ['regular' as const], budget: 'lt50' as const, residence: { country: 'FR', region: null }, locks: { budget: 'required' as const } }
    const c = funnelCounts(d, a, NOW)
    expect(c.a).toBe(0)
    expect(c.u).toBe(0)
    // les programmes qui proposent le marché sont écartés pour le budget (confirmé), les autres pour le marché
    const withMarket = evaluateAll(d, a, { now: NOW }).filter((e) => !e.missed.some((m) => m.key === 'markets'))
    expect(withMarket.length).toBeGreaterThan(0)
    expect(withMarket.every((e) => e.category === 'C' && e.missed.some((m) => m.key === 'budget'))).toBe(true)
    // même budget, mais souhaitable : alternatives proches, avec l’ajustement nommé
    const soft = evaluateAll(d, { ...a, locks: {} }, { now: NOW }).filter((e) => !e.missed.some((m) => m.key === 'markets'))
    expect(soft.every((e) => e.category === 'B' && e.adjustments.some((x) => x.key === 'budget'))).toBe(true)
  })

  it('3 · plusieurs prix inconnus : ils restent « à vérifier », groupés, jamais sous le budget', () => {
    const d: Dataset = structuredClone(demoDs)
    for (const p of d.programs) {
      p.observed_prices = []
      for (const v of p.variants) {
        v.pricing.one_time = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
        v.pricing.monthly = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
      }
    }
    const a = { ...emptyAnswers(), markets: ['futures_index'], style: 'day' as const, when: ['regular' as const], budget: 'lt50' as const, residence: { country: 'FR', region: null } }
    const evals = evaluateAll(d, a, { now: NOW }).filter((e) => !e.missed.length)
    expect(evals.length).toBeGreaterThan(0)
    for (const e of evals) {
      expect(e.criteria.find((c) => c.key === 'budget')?.state).toBe('unknown')
      expect(e.category).toBe('A')
      expect(e.status).not.toBe('COMPATIBLE')
    }
    const { brackets } = budgetBrackets(d, a, NOW)
    expect(brackets.map((b) => b.id)).toEqual(['unknown'])
  })

  it('4 · une seule contrainte empêche la correspondance : elle est nommée, avec le gain', () => {
    const a = PROFILES.overnight
    const neck = bottleneck(ds, a, NOW)!
    expect(neck.key).toBe('overnight')
    expect(neck.gain).toBe(9)
  })

  it('5 · une préférence peut être assouplie : le programme passe en alternative proche, sans condition cachée', () => {
    const e = ev('ftmo-1step-standard', base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'two', residence: { country: 'FR', region: null } }))
    expect(e.category).toBe('B')
    expect(e.adjustments[0]).toMatchObject({ key: 'steps', locked: false })
    expect(e.status).toBe('PARTIEL')
  })

  it('6 · une contrainte indispensable ne peut pas être assouplie : même programme, même réponses, cadenas actif → incompatible', () => {
    const e = ev('ftmo-1step-standard', base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'two', locks: { steps: 'required' }, residence: { country: 'FR', region: null } }))
    expect(e.category).toBe('C')
    expect(e.adjustments).toEqual([])
  })
})

/* ------------------------------------------------------------------ */
describe('Huit profils de la Mission 6 avec la nouvelle logique', () => {
  const counts = Object.fromEntries(Object.entries(PROFILES).map(([k, a]) => [k, funnelCounts(ds, a, NOW)]))
  it('chaque profil : catégories cohérentes, aucune compatibilité confirmée pour un résident du Québec', () => {
    for (const [name, a] of Object.entries(PROFILES)) {
      for (const e of evaluateAll(ds, a, { now: NOW })) {
        expect(e.status, `${name}/${e.programId}`).not.toBe('COMPATIBLE')
        if (e.category === 'A') expect(e.missed, `${name}/${e.programId}`).toEqual([])
        if (e.category === 'B') expect(e.adjustments.length, `${name}/${e.programId}`).toBeGreaterThan(0)
      }
    }
  })
  it('chiffres de référence du rapport (28 programmes, résident du Québec)', () => {
    expect(counts.mnq.a).toBe(10)
    expect(counts.libre.a).toBe(10)
    expect(counts.overnight).toMatchObject({ a: 1, c: 27 })
    expect(counts.nas.a).toBe(18)
    expect(counts.deux).toMatchObject({ a: 8, b: 10 })
    expect(counts.debutant.b).toBeGreaterThan(0) // budget ≤ 100 $ : les prix au-dessus passent en alternatives
  })
  it('le critère « Annonces » seul n’écarte aucun programme futures (restrictions inconnues → à vérifier)', () => {
    expect(counts.news.a).toBe(counts.libre.a)
  })
})

/* ------------------------------------------------------------------ */
describe('Questionnaire · guider plutôt que multiplier les réglages', () => {
  const open = (hash = '#/questionnaire') => {
    window.location.hash = hash
    return render(<App dataset={ds} errors={[]} now={NOW} />)
  }
  it('le bandeau affiche le nombre de programmes possibles et l’unité', async () => {
    open()
    const initial = funnelCounts(ds, emptyAnswers(), NOW).a
    expect(screen.getByTestId('funnel-count')).toHaveTextContent(String(initial))
    expect(screen.getByTestId('funnel')).toHaveTextContent(/Un programme = une offre/)
    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
    expect(screen.getByTestId('funnel-count')).toHaveTextContent(String(funnelCounts(ds, { ...emptyAnswers(), markets: FUT }, NOW).a))
  })
  it('chaque option du marché affiche le nombre de programmes qui resteraient', () => {
    open()
    const opt = screen.getByRole('checkbox', { name: /Futures sur indices/ }).closest('.opt') as HTMLElement
    const n = funnelCounts(ds, { ...emptyAnswers(), markets: FUT }, NOW).a
    expect(within(opt).getByText(new RegExp(`^${n} programmes?$`))).toBeInTheDocument()
  })
  it('l’ordre est : marché → résidence → … ; la résidence est en 3ᵉ position quand une forme est demandée', async () => {
    open()
    const user = userEvent.setup()
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ }))
    await user.click(screen.getByRole('button', { name: /Suivant/ }))
    expect(screen.getByRole('heading', { name: /Où résides-tu/ })).toBeInTheDocument()
    expect(screen.getByText(/Question 2 sur/)).toBeInTheDocument()
  })
  it('les cadenas restent discrets : aucun n’est affiché tant qu’aucune préférence précise n’est choisie, et on peut avancer sans y toucher', async () => {
    open()
    const user = userEvent.setup()
    const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ })); await next()
    await user.click(screen.getByRole('radio', { name: 'Canada — Québec' })); await next()
    await next()
    await user.click(screen.getByRole('radio', { name: /Day trading/ })); await next()
    await user.click(screen.getByRole('checkbox', { name: /heures normales/ })); await next()
    expect(screen.queryByRole('checkbox', { name: /Indispensable pour moi/ })).toBeNull()
    await user.click(screen.getByRole('radio', { name: "Jusqu'à 50 $" }))
    const lock = screen.getByRole('checkbox', { name: /Indispensable pour moi/ })
    expect(lock).not.toBeChecked() // préférence par défaut
    await next() // on avance sans l'avoir touché
    expect(screen.getByRole('heading', { name: /type d'évaluation/i })).toBeInTheDocument()
  })
  it('le budget montre combien de programmes par fourchette, les prix inconnus à part, et rappelle « Prix à vérifier »', async () => {
    open()
    const user = userEvent.setup()
    const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ })); await next()
    await user.click(screen.getByRole('radio', { name: 'Canada — Québec' })); await next()
    await next()
    await user.click(screen.getByRole('radio', { name: /Day trading/ })); await next()
    await user.click(screen.getByRole('checkbox', { name: /heures normales/ })); await next()
    const view = screen.getByTestId('budget-view')
    expect(view).toHaveTextContent(/Prix inconnu/)
    expect(view).toHaveTextContent(/Prix à vérifier/)
    expect(view).toHaveTextContent(/compté une seule fois/)
    const { brackets, possible } = budgetBrackets(ds, { ...emptyAnswers(), markets: FUT, style: 'day', when: ['regular'], residence: QC }, NOW)
    expect(view).toHaveTextContent(`Où se situent les ${possible} programmes`)
    for (const b of brackets) expect(view).toHaveTextContent(b.label)
  })
  it('une option qui ne laisserait aucun programme reste cliquable et affiche un avertissement', async () => {
    open()
    const user = userEvent.setup()
    const next = () => user.click(screen.getByRole('button', { name: /Suivant/ }))
    await user.click(screen.getByRole('checkbox', { name: /Futures sur indices/ })); await next()
    await user.click(screen.getByRole('radio', { name: 'Canada — Québec' })); await next()
    await next()
    await user.click(screen.getByRole('radio', { name: /Day trading/ })); await next()
    const overnight = screen.getByRole('checkbox', { name: /conserver mes positions pendant la nuit/ })
    expect(overnight).toBeEnabled()
    const n = funnelCounts(ds, { ...emptyAnswers(), markets: FUT, residence: QC, style: 'day', when: ['overnight'] }, NOW).a
    expect(within(overnight.closest('.opt') as HTMLElement).getByText(new RegExp(`^${n} programmes?$`))).toBeInTheDocument()
    await user.click(overnight)
    expect(screen.getByTestId('funnel')).toHaveTextContent(/restreint le plus/)
  })
})

describe('Critères actifs', () => {
  it('seuls les critères réellement choisis sont actifs', () => {
    expect(activeCriteria(base({ markets: FUT }))).toEqual([])
    expect(activeCriteria(base({ markets: FUT, when: ['overnight'], steps: 'one', budget: 'lt50', drawdown: 'static' }) as Answers).sort()).toEqual(['budget', 'drawdown', 'overnight', 'steps'] satisfies CriterionKey[])
  })
})
