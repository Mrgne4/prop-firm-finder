import { describe, expect, it } from 'vitest'
import { readRawFromDisk } from '../scripts/read-raw'
import { validateRaw, type RawData } from '../src/data/validate'
import { ALPHA, BETA, GAMMA, NOW, conf, unc } from './helpers'
import { decodeShare, encodeShare } from '../src/engine/share'
import { emptyAnswers } from '../src/engine/answers'

const raw = (): RawData => structuredClone(readRawFromDisk())
const prog = (r: RawData, id: string) => r.programs[`${id}.json`] as any
const errs = (r: RawData) => validateRaw(r, NOW).errors.map((e) => `${e.file} ${e.path} ${e.message}`)
const hasErr = (r: RawData, text: string) => expect(errs(r).some((e) => e.includes(text))).toBe(true)

describe('Validation des données', () => {
  it('les données du dépôt sont valides', () => {
    expect(errs(raw())).toEqual([])
  })

  it('refuse une valeur confirmée sans source', () => {
    const r = raw()
    prog(r, ALPHA).platforms.sources = []
    hasErr(r, 'sans source')
  })

  it('refuse une valeur confirmée sans date de vérification', () => {
    const r = raw()
    prog(r, ALPHA).platforms.verified_at = null
    hasErr(r, 'sans date de vérification')
  })

  it('refuse une date de vérification dans le futur', () => {
    const r = raw()
    prog(r, ALPHA).platforms.verified_at = '2027-01-01'
    hasErr(r, 'dans le futur')
  })

  it('refuse une valeur renseignée avec le statut « non confirmé » (pas de valeur par défaut trompeuse)', () => {
    const r = raw()
    prog(r, BETA).eligibility.value = { eligible: [], excluded: [], unconfirmed: [], unlisted: 'unconfirmed' }
    hasErr(r, 'incompatible avec une valeur renseignée')
  })

  it('refuse une source inconnue', () => {
    const r = raw()
    prog(r, ALPHA).platforms.sources = ['inexistante']
    hasErr(r, 'Source inconnue')
  })

  it('refuse un champ manquant (schéma)', () => {
    const r = raw()
    delete prog(r, ALPHA).instruments
    expect(errs(r).length).toBeGreaterThan(0)
  })

  it('refuse un instrument inconnu', () => {
    const r = raw()
    prog(r, ALPHA).instruments.value = ['NQ', 'ZZZ']
    hasErr(r, 'Instrument inconnu')
  })

  it('refuse un code pays inconnu', () => {
    const r = raw()
    prog(r, ALPHA).eligibility.value.excluded = ['XX-YY']
    hasErr(r, 'Code pays inconnu')
  })

  it('refuse une restriction « conditional » sans condition', () => {
    const r = raw()
    delete prog(r, BETA).restrictions.news.evaluation.note
    hasErr(r, 'doit préciser ses conditions')
  })

  it('refuse deux programmes de même identifiant', () => {
    const r = raw()
    r.programs['copie.json'] = structuredClone(prog(r, ALPHA))
    hasErr(r, 'en double')
  })

  it('refuse un nom de fichier différent de l’identifiant', () => {
    const r = raw()
    r.programs['autre.json'] = r.programs[`${GAMMA}.json`]
    delete r.programs[`${GAMMA}.json`]
    hasErr(r, 'Le nom du fichier')
  })

  it('refuse une entreprise inconnue', () => {
    const r = raw()
    prog(r, ALPHA).firm_id = 'nulle-part'
    hasErr(r, 'Entreprise inconnue')
  })

  it('un programme réel ne peut pas citer une source de démonstration', () => {
    const r = raw()
    const p = prog(r, ALPHA)
    p.demo = false
    p.official_url = 'https://exemple.test'
    ;(r.firms as any[]).find((f) => f.id === 'demo-alpha').demo = false
    hasErr(r, 'ne peut pas citer une source de démonstration')
  })

  it('un programme de démonstration doit appartenir à une entreprise de démonstration', () => {
    const r = raw()
    ;(r.firms as any[]).find((f) => f.id === 'demo-alpha').demo = false
    hasErr(r, 'identique à celui de son entreprise')
  })

  it('une valeur réelle confirmée doit citer une source officielle (un tiers ne suffit pas)', () => {
    const r = raw()
    ;(r.sources as any[]).push({ id: 'comparateur', label: 'Comparateur tiers', url: 'https://tiers.test', type: 'third_party' })
    const p = prog(r, ALPHA)
    p.demo = false
    p.official_url = 'https://exemple.test'
    ;(r.firms as any[]).find((f) => f.id === 'demo-alpha').demo = false
    p.platforms.sources = ['comparateur']
    hasErr(r, 'source officielle')
  })

  it('programme sans challenge : l’évaluation doit être « not_applicable »', () => {
    const r = raw()
    prog(r, ALPHA).evaluation.steps = conf(0)
    hasErr(r, 'sans challenge')
  })

  it('refuse deux modèles de prix confirmés pour une même variante', () => {
    const r = raw()
    prog(r, ALPHA).variants[0].pricing.one_time = conf(100)
    hasErr(r, 'ne peuvent pas être tous deux confirmés')
  })

  it('refuse un barème de coût mal ordonné', () => {
    const r = raw()
    ;(r.scoring as any).cost_scale = [{ up_to_usd: 100, score: 1 }, { up_to_usd: 50, score: 0.5 }, { up_to_usd: null, score: 0.1 }]
    hasErr(r, 'ordre croissant')
  })

  it('le gabarit de programme est ignoré mais le JSON non valide est signalé', () => {
    const r = raw()
    ;(r.programs as any)['x.json'] = { id: 'x' }
    expect(errs(r).length).toBeGreaterThan(0)
  })

  it('Alpha, Bêta, Gamma restent des démos explicites', () => {
    const d = validateRaw(raw(), NOW).dataset!
    const demos = d.programs.filter((p) => p.demo)
    expect(demos).toHaveLength(3)
    expect(demos.every((p) => p.name.startsWith('DÉMO'))).toBe(true)
    // aucun programme réel ne se fait passer pour une démo, et inversement
    expect(d.programs.filter((p) => !p.demo).every((p) => !p.name.startsWith('DÉMO'))).toBe(true)
    expect(unc().status).toBe('unconfirmed')
  })
})

describe('Lien de partage', () => {
  const answers = {
    ...emptyAnswers(),
    markets: ['futures_index', 'metals'],
    marketForms: { metals: 'futures' as const },
    style: 'day' as const,
    when: ['regular' as const, 'overnight' as const],
    drawdown: 'static' as const,
    budget: '50_100' as const,
    steps: 'two' as const,
    priority: 'platform' as const,
    platforms: ['tradovate'],
    residence: { country: 'CA', region: 'QC' },
  }

  it("n'inclut jamais la résidence", () => {
    const token = encodeShare({ answers, relaxed: ['markets'] })
    const json = atob(token.replace(/-/g, '+').replace(/_/g, '/'))
    expect(json).not.toContain('QC')
    expect(json).not.toContain('"CA"')
    expect(json.toLowerCase()).not.toContain('resid')
    const back = decodeShare(token)!
    expect(back.answers.residence).toEqual({ country: null, region: null })
  })

  it('restitue les critères', () => {
    const back = decodeShare(encodeShare({ answers, relaxed: ['markets', 'budget'] }))!
    expect(back.answers.markets).toEqual(['futures_index', 'metals'])
    expect(back.answers.marketForms).toEqual({ metals: 'futures' })
    expect(back.answers.when).toEqual(['regular', 'overnight'])
    expect(back.answers.budget).toBe('50_100')
    expect(back.relaxed).toEqual(['markets', 'budget'])
  })

  it('ignore les valeurs inattendues et les liens corrompus', () => {
    expect(decodeShare('!!pas-du-base64!!')).toBeNull()
    const evil = btoa(JSON.stringify({ b: 'gratuit', d: '<script>', w: ['x'], x: ['residence', 'markets'] }))
    const back = decodeShare(evil)!
    expect(back.answers.budget).toBeNull()
    expect(back.answers.drawdown).toBeNull()
    expect(back.answers.when).toEqual([])
    expect(back.relaxed).toEqual(['markets'])
  })
})
