import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'
import { readRawFromDisk } from '../scripts/read-raw'
import { studentView } from '../src/data/load'
import { validateRaw } from '../src/data/validate'
import { emptyAnswers, type Answers } from '../src/engine/answers'
import { evaluateProgram, makeContext } from '../src/engine/evaluate'
import { OFFICIAL_WARNING } from '../src/ui/OfficialWarning'
import { NOW } from './helpers'

const { dataset: ds } = validateRaw(studentView(readRawFromDisk()), NOW)
if (!ds) throw new Error('données invalides')
const ctx = makeContext(ds, NOW)
const QC = { country: 'CA', region: 'QC' }
const base = (o: Partial<Answers>): Answers => ({ ...emptyAnswers(), style: 'day', when: ['regular'], drawdown: 'any', budget: 'none', steps: 'any', priority: 'none', residence: QC, ...o })
const P = {
  debutant: base({ markets: ['futures_index'], style: 'unsure', budget: '50_100', priority: 'low_cost' }),
  mnq: base({ markets: ['futures_index'], instruments: ['MNQ'] }),
  nas: base({ markets: ['cfd_index'], instruments: ['NAS100'], marketForms: { cfd_index: 'cfd' } }),
  overnight: base({ markets: ['futures_index'], when: ['regular', 'overnight'] }),
  news: base({ markets: ['futures_index'], when: ['regular', 'news'] }),
  deux: base({ markets: ['forex'], steps: 'two' }),
  retraits: base({ markets: ['futures_index'], priority: 'withdrawals' }),
  libre: base({ markets: ['futures_index'], style: 'unsure', when: ['none'] }),
}
const run = (a: Answers) => ds.programs.map((p) => ({ p, e: evaluateProgram(p, a, ctx) }))
const isCfd = (p: (typeof ds.programs)[number]) => !p.contract_types.value?.includes('futures')
const crit = (e: ReturnType<typeof evaluateProgram>, k: string) => e.criteria.find((c) => c.key === k)

describe('Mission 6 · invariants communs aux huit profils', () => {
  for (const [name, a] of Object.entries(P)) {
    it(`${name} : COMPATIBLE ⇒ tout est ok et complet ; INCOMPATIBLE ⇒ un échec expliqué ; À VÉRIFIER ⇒ une inconnue visible`, () => {
      for (const { p, e } of run(a)) {
        if (e.status === 'COMPATIBLE') {
          expect(e.criteria.every((c) => c.state === 'ok' || c.key === 'freshness' || c.key === 'essential_info'), p.id).toBe(true)
          expect(crit(e, 'essential_info')?.state ?? 'ok', p.id).toBe('ok')
        }
        if (e.status === 'INCOMPATIBLE') {
          const fails = e.criteria.filter((c) => c.state === 'fail')
          expect(fails.length, p.id).toBeGreaterThan(0)
          for (const f of fails) expect(f.message.length, p.id).toBeGreaterThan(10)
        }
        if (e.status === 'A_VERIFIER') expect(e.criteria.some((c) => c.state === 'unknown'), p.id).toBe(true)
      }
    })
    it(`${name} : un résident du Québec n’obtient jamais « COMPATIBLE » sans confirmation d’admissibilité`, () => {
      for (const { p, e } of run(a)) {
        if (e.status === 'COMPATIBLE') expect(crit(e, 'residence')?.state, p.id).toBe('ok')
      }
    })
  }
})

describe('Mission 6 · profil 1 — débutant québécois, budget < 100 $', () => {
  it('un prix inconnu n’est jamais jugé dans le budget', () => {
    for (const b of ['lt50', '50_100'] as const) {
      for (const mk of [['futures_index'], ['forex']]) {
        for (const { p, e } of run({ ...P.debutant, markets: mk, budget: b })) {
          const c = crit(e, 'budget')
          const known = p.variants.some((v) => v.pricing.one_time.status === 'confirmed' || v.pricing.monthly.status === 'confirmed')
          if (!known && c) expect(c.state, `${p.id}/${b}`).toBe('unknown')
          if (c?.state === 'ok') expect(known, p.id).toBe(true)
        }
      }
    }
  })
  it('un prix confirmé au-dessus du budget exclut ; un prix confirmé dans le budget ne suffit pas à rendre « compatible » le Québec', () => {
    const e = run({ ...P.debutant, budget: 'lt50' }).find((r) => r.p.id === 'topstep-trading-combine')!.e
    expect(e.category).toBe('B') // préférence : alternative proche
    const locked = run({ ...P.debutant, budget: 'lt50', locks: { budget: 'required' } }).find((r) => r.p.id === 'topstep-trading-combine')!.e
    expect(locked.category).toBe('C')
    expect(locked.status).toBe('INCOMPATIBLE')
    const e2 = run(P.debutant).find((r) => r.p.id === 'topstep-trading-combine')!.e
    expect(crit(e2, 'budget')?.state).toBe('ok')
    expect(e2.status).toBe('A_VERIFIER')
  })
  it('les programmes CFD sont écartés avec une raison lisible pour un profil futures', () => {
    const r = run(P.debutant).filter((x) => isCfd(x.p))
    expect(r.length).toBeGreaterThan(10)
    for (const { e } of r) expect(crit(e, 'markets')?.message).toMatch(/Aucun de tes marchés/)
  })
})

describe('Mission 6 · profils 2 et 3 — MNQ seulement, NAS100 CFD seulement', () => {
  it('MNQ : aucun CFD ; Topstep reste possible ; instrument absent d’une liste partielle = à vérifier, pas exclu', () => {
    const r = run(P.mnq)
    for (const x of r.filter((y) => isCfd(y.p))) expect(x.e.status, x.p.id).toBe('INCOMPATIBLE')
    expect(r.find((x) => x.p.id === 'topstep-trading-combine')!.e.status).not.toBe('INCOMPATIBLE')
    expect(crit(r.find((x) => x.p.id === 'apex-eod-trail')!.e, 'instruments')?.state).toBe('unknown')
  })
  it('NAS100 CFD : aucun futures ; FundedNext (NAS100 listé) et FTMO (liste partielle) ne sont pas exclus', () => {
    const r = run(P.nas)
    for (const x of r.filter((y) => !isCfd(y.p))) expect(x.e.status, x.p.id).toBe('INCOMPATIBLE')
    for (const x of r.filter((y) => isCfd(y.p))) expect(x.e.status, x.p.id).not.toBe('INCOMPATIBLE')
  })
})

describe('Mission 6 · profils 4 et 5 — overnight et annonces', () => {
  it('overnight : tout programme où il est confirmé interdit est exclu ; aucun « compatible » sans confirmation', () => {
    for (const { p, e } of run(P.overnight)) {
      const forb = (['evaluation', 'funded'] as const).some((s) => p.restrictions.overnight[s].status === 'confirmed' && p.restrictions.overnight[s].value === 'forbidden')
      if (forb && !isCfd(p)) expect(e.status, p.id).toBe('INCOMPATIBLE')
      const unk = (['evaluation', 'funded'] as const).some((s) => p.restrictions.overnight[s].status === 'unconfirmed')
      if (unk) expect(e.status, p.id).not.toBe('COMPATIBLE')
    }
  })
  it('annonces : une règle « sous conditions » ou inconnue ne donne jamais « compatible »', () => {
    for (const { p, e } of run(P.news)) {
      const soft = (['evaluation', 'funded'] as const).some((s) => ['conditional'].includes(String(p.restrictions.news[s].value)) || p.restrictions.news[s].status === 'unconfirmed')
      if (soft) expect(e.status, p.id).not.toBe('COMPATIBLE')
    }
  })
})

describe('Mission 6 · profils 6, 7, 8 — deux étapes, retraits, sans préférence', () => {
  it('deux étapes : seuls les programmes à deux étapes survivent', () => {
    for (const { p, e } of run(P.deux)) {
      const n = p.evaluation.steps.value
      if (n === 2) expect(e.category, p.id).toBe('A')
      else expect(e.category, p.id).toBe('B') // préférence : les autres types restent visibles comme alternatives
    }
    for (const { p, e } of run({ ...P.deux, locks: { steps: 'required' } })) {
      const n = p.evaluation.steps.value
      if (n === 2) expect(e.status, p.id).not.toBe('INCOMPATIBLE')
      else if (p.evaluation.steps.status === 'confirmed') expect(e.status, p.id).toBe('INCOMPATIBLE')
    }
  })
  it('retraits : un programme avec des conditions de retrait incomplètes affiche toujours l’avertissement', () => {
    for (const { p, e } of run(P.retraits)) {
      if (e.withdrawal.gaps.length > 0) expect(e.withdrawal.summary, p.id).toBeTruthy()
    }
  })
  it('sans préférence : aucun programme futures n’est exclu pour une raison autre que le marché', () => {
    for (const { p, e } of run(P.libre)) if (!isCfd(p)) expect(e.status, p.id).not.toBe('INCOMPATIBLE')
  })
})

describe('Mission 6 · avertissement avant tout lien vers une prop firm', () => {
  const OPEN = (hash: string) => {
    window.location.hash = hash
    return render(<App dataset={ds} errors={[]} now={NOW} />)
  }
  const check = (root: HTMLElement) => {
    const links = [...root.querySelectorAll('a[target="_blank"]')]
    expect(links.length).toBeGreaterThan(0)
    const warnings = [...root.querySelectorAll('.official-warning')]
    expect(warnings.length).toBeGreaterThan(0)
    for (const w of warnings) expect(w.textContent).toContain(OFFICIAL_WARNING)
    for (const l of links) {
      const before = warnings.some((w) => !!(w.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING))
      expect(before, l.getAttribute('href') ?? '').toBe(true)
    }
  }
  it('texte exact', () => {
    expect(OFFICIAL_WARNING).toBe('Vérifie les prix, les règles et ton admissibilité directement auprès de l’entreprise avant d’acheter un challenge.')
  })
  it('page de détail : chaque lien externe est précédé de l’avertissement', () => {
    for (const id of ['topstep-trading-combine', 'ftmo-2step-standard', 'fundingpips-zero']) {
      const { container, unmount } = OPEN(`#/programme/${id}`)
      check(container)
      unmount()
    }
  })
  it('explorateur : chaque carte avec lien officiel porte l’avertissement avant le lien', () => {
    const { container } = OPEN('#/explorer')
    const cards = [...container.querySelectorAll('article')]
    expect(cards.length).toBe(ds.programs.length)
    for (const c of cards) check(c as HTMLElement)
  })
  it('la carte indique le type de contrats et les règles connues de retrait', () => {
    const { container } = OPEN('#/explorer')
    expect(container.textContent).toContain('Contrats futures (pas de CFD)')
    expect(container.textContent).toContain('CFD / marge, comptes simulés (pas de futures)')
    expect(container.textContent).toContain('Règles connues pouvant bloquer un retrait')
    expect(screen.queryAllByText(/DÉMO/).length).toBe(0)
  })
})

import { collectSourced } from '../src/data/sourced'
import { normPath } from '../src/engine/coverage'
import { ALPHA, demo as demoProgram, fullCtx, profile } from './helpers'

describe('Mission 6 · données incomplètes (117 lacunes essentielles) : aucune conclusion injustifiée', () => {
  const essential = new Set(ds.scoring.essential_fields)
  const gapsOf = (p: (typeof ds.programs)[number]) => {
    const gaps = new Set<string>()
    for (const f of collectSourced(p)) {
      const np = normPath(f.path)
      if (essential.has(np) && f.sv.status === 'unconfirmed') gaps.add(np)
    }
    return gaps
  }
  it('le registre compte bien les lacunes essentielles (≥ 100) sur les programmes réels', () => {
    expect(ds.programs.reduce((n, p) => n + gapsOf(p).size, 0)).toBeGreaterThanOrEqual(100)
  })
  it('aucun programme présentant une lacune essentielle n’est jamais « COMPATIBLE », quel que soit le profil ou le pays', () => {
    for (const country of ['FR', 'US', 'CA']) {
      for (const mk of ['futures_index', 'forex', 'cfd_index']) {
        for (const { p, e } of run(base({ markets: [mk], residence: { country, region: country === 'CA' ? 'ON' : null } }))) {
          if (gapsOf(p).size > 0) expect(e.status, `${p.id}/${country}/${mk}`).not.toBe('COMPATIBLE')
        }
      }
    }
  })
  it('chaque programme avec une lacune sur les retraits l’affiche (résumé non vide)', () => {
    for (const p of ds.programs) {
      const e = evaluateProgram(p, base({ markets: [p.contract_types.value?.includes('futures') ? 'futures_index' : 'forex'] }), ctx)
      if ([...gapsOf(p)].some((g) => g.startsWith('funded.min_withdrawal') || g.startsWith('funded.withdrawal'))) expect(e.withdrawal.summary, p.id).toBeTruthy()
    }
  })
  it('un prix rendu inconnu sur un programme par ailleurs complet empêche « COMPATIBLE » et le budget « ok »', () => {
    const a = profile({ markets: ['futures_index'], budget: '50_100', residence: { country: 'FR', region: null } })
    const p = demoProgram(ALPHA)
    expect(evaluateProgram(p, a, fullCtx).status).toBe('COMPATIBLE')
    for (const v of p.variants) {
      v.pricing.one_time = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
      v.pricing.monthly = { status: 'unconfirmed', value: null, sources: [], verified_at: null }
    }
    const e = evaluateProgram(p, a, fullCtx)
    expect(crit(e, 'budget')?.state).toBe('unknown')
    expect(e.status).not.toBe('COMPATIBLE')
  })
})
