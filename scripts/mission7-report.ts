// Mission 7 : résultats de plusieurs profils d'étudiants sur la version ÉTUDIANTE (sans démos), avec la nouvelle logique A/B/C.
import { validateRaw } from '../src/data/validate'
import { emptyAnswers, type Answers } from '../src/engine/answers'
import { budgetBrackets } from '../src/engine/budget'
import { evaluateAll } from '../src/engine/evaluate'
import { bottleneck, countsOf, funnelCounts, strategySuggestions } from '../src/engine/funnel'
import { readRawFromDisk } from './read-raw'

const NOW = new Date('2026-11-15T12:00:00Z')
const raw = readRawFromDisk() as any
const demo = (x: any) => x?.demo === true
const demoFirms = new Set((raw.firms as any[]).filter(demo).map((f) => f.id))
const student = { ...raw, programs: Object.fromEntries(Object.entries(raw.programs).filter(([, v]) => !demo(v))), firms: (raw.firms as any[]).filter((f) => !demoFirms.has(f.id)), sources: (raw.sources as any[]).filter((x) => x.type !== 'demo') }
const { dataset } = validateRaw(student, NOW)
if (!dataset) throw new Error('données invalides')
const QC = { country: 'CA', region: 'QC' }
const base = (o: Partial<Answers>): Answers => ({ ...emptyAnswers(), style: 'day', when: ['regular'], drawdown: 'any', budget: 'none', steps: 'any', priority: 'none', residence: QC, ...o })
export const PROFILES: Record<string, Answers> = {
  '1 Débutant québécois, budget ≤ 100 $ (futures)': base({ markets: ['futures_index'], style: 'unsure', budget: '50_100', priority: 'low_cost' }),
  '2 MNQ exclusivement': base({ markets: ['futures_index'], instruments: ['MNQ'] }),
  '3 NAS100 CFD exclusivement': base({ markets: ['cfd_index'], instruments: ['NAS100'], marketForms: { cfd_index: 'cfd' } }),
  '4 Positions overnight (futures)': base({ markets: ['futures_index'], when: ['regular', 'overnight'] }),
  '4b Overnight souhaitable seulement': base({ markets: ['futures_index'], when: ['regular', 'overnight'], locks: { overnight: 'preferred' } }),
  '5 Annonces économiques (futures)': base({ markets: ['futures_index'], when: ['regular', 'news'] }),
  '6 Forex, deux étapes (préférence)': base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'two' }),
  '6b Forex, deux étapes INDISPENSABLE': base({ markets: ['forex'], marketForms: { forex: 'spot' }, steps: 'two', locks: { steps: 'required' } }),
  '7 Privilégie les retraits': base({ markets: ['futures_index'], priority: 'withdrawals' }),
  '8 Sans préférence': base({ markets: ['futures_index'], style: 'unsure', when: ['none'], priority: 'none' }),
  'X Aucune combinaison : overnight + annonces + 2 étapes + ≤ 50 $ indispensables': base({ markets: ['futures_index'], when: ['regular', 'overnight', 'news'], steps: 'two', budget: 'lt50', locks: { steps: 'required', budget: 'required' } }),
  'Y Budget ≤ 50 $ indispensable (futures)': base({ markets: ['futures_index'], budget: 'lt50', locks: { budget: 'required' } }),
}
const name = (id: string) => dataset.programs.find((p) => p.id === id)?.name ?? id
if (process.argv[1]?.endsWith('mission7-report.ts')) {
  const none = funnelCounts(dataset, emptyAnswers(), NOW)
  console.log(`Catalogue : ${dataset.programs.length} programmes, ${new Set(dataset.programs.map((p) => p.firm_id)).size} entreprises, ${dataset.programs.reduce((n, p) => n + p.variants.length, 0)} variantes (tailles de compte, non comptées). Sans réponse : A=${none.a}`)
  for (const [label, a] of Object.entries(PROFILES)) {
    const ev = evaluateAll(dataset, a, { now: NOW })
    const c = countsOf(dataset, ev)
    console.log(`\n=== ${label}\nA=${c.a} (dont ${c.aToVerify} à vérifier, ${c.firmsA} entreprises) · à confirmer=${c.u} · B=${c.b} · C=${c.c} · total=${c.total}`)
    const A = ev.filter((e) => e.category === 'A')
    const B = ev.filter((e) => e.category === 'B')
    if (A.length) console.log('  A :', A.map((e) => `${name(e.programId)}${e.uncertainBudget ? ' [budget à confirmer]' : ''}`).join(' | '))
    if (B.length) console.log('  B :', B.map((e) => `${name(e.programId)} → ${e.adjustments.map((x) => x.key).join('+')}`).join(' | '))
    const reasons = new Map<string, number>()
    for (const e of ev.filter((x) => x.category === 'C')) {
      const k = e.missed.filter((m) => m.weight === 'required').map((m) => m.key).sort().join('+')
      reasons.set(k, (reasons.get(k) ?? 0) + 1)
    }
    console.log('  C par raison :', [...reasons.entries()].map(([k, n]) => `${k}: ${n}`).join(', '))
    const neck = bottleneck(dataset, a, NOW, c)
    if (neck) console.log(`  Goulot : ${neck.label} (+${neck.gain})`)
    for (const s of strategySuggestions(dataset, a, NOW, c)) console.log(`  Stratégie « ${s.label} » : +${s.programIds.length} (${s.programIds.map(name).join(', ')})`)
    if (label.startsWith('1 ') || label.startsWith('Y ')) {
      const bb = budgetBrackets(dataset, { ...a, budget: null }, NOW)
      console.log(`  Budget (${bb.possible} possibles) :`, bb.brackets.map((b) => `${b.label}=${b.count}`).join(', '))
    }
  }
}
