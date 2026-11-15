// Mission 6 : simule huit profils d'étudiants sur la version ÉTUDIANTE (sans démos) et résume les résultats.
import { validateRaw } from '../src/data/validate'
import { emptyAnswers, type Answers } from '../src/engine/answers'
import { evaluateProgram, makeContext } from '../src/engine/evaluate'
import { readRawFromDisk } from './read-raw'

const NOW = new Date('2026-11-15T12:00:00Z')
// Même filtre que studentView (src/data/load.ts, non importable hors Vite).
const raw = readRawFromDisk() as any
const demo = (x: any) => x?.demo === true
const demoFirms = new Set((raw.firms as any[]).filter(demo).map((f) => f.id))
const student = { ...raw, programs: Object.fromEntries(Object.entries(raw.programs).filter(([, v]) => !demo(v))), firms: (raw.firms as any[]).filter((f) => !demoFirms.has(f.id)), sources: (raw.sources as any[]).filter((x) => x.type !== 'demo') }
const { dataset } = validateRaw(student, NOW)
if (!dataset) throw new Error('données invalides')
const ctx = makeContext(dataset, NOW)
const base = (o: Partial<Answers>): Answers => ({ ...emptyAnswers(), style: 'day', when: ['regular'], drawdown: 'any', budget: 'none', steps: 'any', priority: 'none', residence: { country: 'CA', region: 'QC' }, ...o })
export const PROFILES: Record<string, Answers> = {
  '1 Débutant québécois, budget < 100 $': base({ markets: ['futures_index'], style: 'unsure', budget: '50_100', priority: 'low_cost' }),
  '2 MNQ exclusivement': base({ markets: ['futures_index'], instruments: ['MNQ'] }),
  '3 NAS100 CFD exclusivement': base({ markets: ['cfd_index'], instruments: ['NAS100'], marketForms: { cfd_index: 'cfd' } }),
  '4 Positions overnight': base({ markets: ['futures_index'], when: ['regular', 'overnight'] }),
  '5 Annonces économiques': base({ markets: ['futures_index'], when: ['regular', 'news'] }),
  '6 Challenge à deux étapes': base({ markets: ['forex'], steps: 'two' }),
  '7 Privilégie les retraits': base({ markets: ['futures_index'], priority: 'withdrawals' }),
  '8 Sans préférence': base({ markets: ['futures_index'], style: 'unsure', when: ['none'], priority: 'none' }),
}
if (process.argv[1]?.endsWith('profiles-report.ts')) {
  for (const [name, a] of Object.entries(PROFILES)) {
    console.log(`\n=== ${name}`)
    const rows = dataset.programs.map((p) => ({ p, e: evaluateProgram(p, a, ctx) }))
    for (const st of ['COMPATIBLE', 'A_VERIFIER', 'PARTIEL', 'INCOMPATIBLE'] as const) {
      const g = rows.filter((r) => r.e.status === st)
      console.log(`-- ${st} (${g.length})`)
      for (const { p, e } of g) {
        const why = e.criteria.filter((c) => (st === 'INCOMPATIBLE' ? c.state === 'fail' : st === 'COMPATIBLE' ? false : c.state === 'unknown')).map((c) => `${c.key}:${c.message.slice(0, 70)}`)
        console.log(`   ${p.id}${st === 'COMPATIBLE' ? '' : ' ← ' + why.slice(0, 3).join(' | ')}`)
      }
    }
  }
}
if (process.argv.includes('--budget')) {
  const a = { ...PROFILES['1 Débutant québécois, budget < 100 $'] }
  for (const [mk, label] of [[['futures_index'], 'futures'], [['forex'], 'forex']] as const) {
    console.log('\n## budget < 100 $ —', label)
    for (const b of ['lt50', '50_100'] as const) {
      for (const p of dataset.programs) {
        const e = evaluateProgram(p, { ...a, markets: [...mk], budget: b }, ctx)
        const c = e.criteria.find((x) => x.key === 'budget')
        const priceKnown = p.variants.some((v) => v.pricing.one_time.status === 'confirmed' || v.pricing.monthly.status === 'confirmed')
        if (c && c.state === 'ok' && !priceKnown) console.log('ANOMALIE budget ok sans prix confirmé', p.id)
        if (e.status !== 'INCOMPATIBLE' || c?.state === 'fail') console.log(b, p.id.padEnd(30), e.status.padEnd(12), c ? `${c.state}: ${c.message.slice(0, 110)}` : '(pas de critère budget)')
      }
    }
  }
}
if (process.argv.includes('--counts')) {
  for (const [name, a] of Object.entries(PROFILES)) {
    const c: Record<string, number> = { COMPATIBLE: 0, A_VERIFIER: 0, PARTIEL: 0, INCOMPATIBLE: 0 }
    for (const p of dataset.programs) c[evaluateProgram(p, a, ctx).status]++
    console.log(`${name} | ${c.COMPATIBLE} | ${c.A_VERIFIER} | ${c.INCOMPATIBLE}`)
  }
}
