import { z } from 'zod'
import {
  FirmSchema,
  GlossaryEntrySchema,
  InstrumentSchema,
  MarketSchema,
  PlatformSchema,
  ProgramSchema,
  RESTRICTION_KEYS,
  ScoringConfigSchema,
  SourceSchema,
  type Dataset,
  type Program,
} from './schema'
import { collectSourced } from './sourced'

export type RawData = {
  firms: unknown
  sources: unknown
  instruments: unknown
  markets: unknown
  platforms: unknown
  glossary: unknown
  countries: unknown
  scoring: unknown
  /** clé = nom de fichier (sans dossier), ex. "demo-alpha-eod-50k.json" */
  programs: Record<string, unknown>
}

export type DataError = { file: string; path: string; message: string }

function zodErrors(file: string, err: z.ZodError): DataError[] {
  return err.issues.map((i) => ({ file, path: i.path.join('.'), message: i.message }))
}

function parseList<T extends z.ZodType>(file: string, schema: T, raw: unknown, errors: DataError[]): z.infer<T>[] {
  const res = z.array(schema).safeParse(raw)
  if (!res.success) {
    errors.push(...zodErrors(file, res.error))
    return []
  }
  return res.data
}

function dupes(ids: string[]): string[] {
  return ids.filter((id, i) => ids.indexOf(id) !== i)
}

/**
 * Valide l'ensemble des données : schémas + cohérence croisée.
 * Retourne la liste exhaustive des erreurs ; `dataset` est défini seulement s'il n'y en a aucune.
 */
export function validateRaw(raw: RawData, today: Date = new Date()): { errors: DataError[]; dataset: Dataset | null } {
  const errors: DataError[] = []
  const E = (file: string, path: string, message: string) => errors.push({ file, path, message })

  const firms = parseList('firms.json', FirmSchema, raw.firms, errors)
  const sources = parseList('sources.json', SourceSchema, raw.sources, errors)
  const instruments = parseList('instruments.json', InstrumentSchema, raw.instruments, errors)
  const markets = parseList('markets.json', MarketSchema, raw.markets, errors)
  const platforms = parseList('platforms.json', PlatformSchema, raw.platforms, errors)
  const glossary = parseList('glossary.json', GlossaryEntrySchema, raw.glossary, errors)
  const countriesRes = z.array(z.string().regex(/^[A-Z]{2}$/)).safeParse(raw.countries)
  const countries = countriesRes.success ? countriesRes.data : []
  if (!countriesRes.success) errors.push(...zodErrors('countries.json', countriesRes.error))
  const scoringRes = ScoringConfigSchema.safeParse(raw.scoring)
  if (!scoringRes.success) errors.push(...zodErrors('scoring.json', scoringRes.error))

  const programs: Program[] = []
  for (const [file, content] of Object.entries(raw.programs)) {
    const res = ProgramSchema.safeParse(content)
    if (!res.success) errors.push(...zodErrors(`programs/${file}`, res.error))
    else {
      programs.push(res.data)
      if (file !== `${res.data.id}.json`) E(`programs/${file}`, 'id', `Le nom du fichier doit être « ${res.data.id}.json »`)
    }
  }

  // Unicité des identifiants
  for (const [file, ids] of [
    ['firms.json', firms.map((f) => f.id)],
    ['sources.json', sources.map((s) => s.id)],
    ['instruments.json', instruments.map((i) => i.id)],
    ['markets.json', markets.map((m) => m.id)],
    ['platforms.json', platforms.map((p) => p.id)],
    ['glossary.json', glossary.map((g) => g.id)],
    ['programs/', programs.map((p) => p.id)],
  ] as const) {
    for (const d of dupes([...ids])) E(file, 'id', `Identifiant en double : « ${d} »`)
  }

  const firmById = new Map(firms.map((f) => [f.id, f]))
  const sourceById = new Map(sources.map((s) => [s.id, s]))
  const instrumentById = new Map(instruments.map((i) => [i.id, i]))
  const marketIds = new Set(markets.map((m) => m.id))
  const platformIds = new Set(platforms.map((p) => p.id))
  const countrySet = new Set(countries)

  for (const ins of instruments) {
    if (!marketIds.has(ins.market)) E('instruments.json', ins.id, `Marché inconnu : « ${ins.market} »`)
  }

  if (scoringRes.success) {
    const s = scoringRes.data
    const sortedAsc = (arr: (number | null)[]) =>
      arr.every((v, i) => i === 0 || (v !== null && (arr[i - 1] as number) < v) || (v === null && i === arr.length - 1))
    if (s.cost_scale.at(-1)?.up_to_usd !== null) E('scoring.json', 'cost_scale', 'La dernière tranche doit avoir up_to_usd = null')
    if (!sortedAsc(s.cost_scale.map((c) => c.up_to_usd))) E('scoring.json', 'cost_scale', 'Tranches à classer par ordre croissant')
    if (s.min_withdrawal_scale.at(-1)?.up_to_usd !== null) E('scoring.json', 'min_withdrawal_scale', 'La dernière tranche doit avoir up_to_usd = null')
    if (!sortedAsc(s.min_withdrawal_scale.map((c) => c.up_to_usd))) E('scoring.json', 'min_withdrawal_scale', 'Tranches à classer par ordre croissant')
    const w = Object.values(s.weights).reduce((a, b) => a + b, 0)
    if (w <= 0) E('scoring.json', 'weights', 'La somme des pondérations doit être positive')
  }

  for (const p of programs) {
    const file = `programs/${p.id}.json`
    const firm = firmById.get(p.firm_id)
    if (!firm) E(file, 'firm_id', `Entreprise inconnue : « ${p.firm_id} »`)
    if (firm && firm.demo !== p.demo) E(file, 'demo', 'Le drapeau « demo » du programme doit être identique à celui de son entreprise')
    if (!p.demo && !p.official_url) E(file, 'official_url', 'Un programme réel doit avoir un lien officiel')

    const found = collectSourced(p)
    for (const { path, sv } of found) {
      const where = path
      if (sv.status === 'confirmed') {
        if (sv.value === null) E(file, where, 'Valeur confirmée mais vide')
        if (sv.sources.length === 0) E(file, where, 'Valeur confirmée sans source')
        if (sv.verified_at === null) E(file, where, 'Valeur confirmée sans date de vérification')
        else if (Date.parse(`${sv.verified_at}T00:00:00Z`) > today.getTime() + 24 * 3600 * 1000)
          E(file, where, `Date de vérification dans le futur : ${sv.verified_at}`)
      } else if (sv.value !== null) {
        E(file, where, `Statut « ${sv.status} » incompatible avec une valeur renseignée (utiliser null)`)
      }
      for (const sid of sv.sources) {
        const src = sourceById.get(sid)
        if (!src) E(file, where, `Source inconnue : « ${sid} »`)
        else if (p.demo && src.type !== 'demo') E(file, where, `Un programme de démonstration ne peut citer que des sources de type « demo » (« ${sid} »)`)
        else if (!p.demo && src.type === 'demo') E(file, where, `Un programme réel ne peut pas citer une source de démonstration (« ${sid} »)`)
      }
      if (sv.status === 'confirmed' && !p.demo) {
        const hasOfficial = sv.sources.some((sid) => sourceById.get(sid)?.type === 'official')
        if (!hasOfficial) E(file, where, 'Une valeur confirmée doit s’appuyer sur au moins une source officielle (un comparateur tiers ne suffit pas)')
      }
    }

    // Instruments / plateformes
    if (p.instruments.value) {
      for (const id of p.instruments.value) {
        if (!instrumentById.has(id)) E(file, 'instruments', `Instrument inconnu : « ${id} »`)
      }
      for (const d of dupes(p.instruments.value)) E(file, 'instruments', `Instrument en double : « ${d} »`)
    }
    for (const id of p.instruments_excluded.value ?? []) {
      if (!instrumentById.has(id)) E(file, 'instruments_excluded', `Instrument inconnu : « ${id} »`)
      if (p.instruments.value?.includes(id)) E(file, 'instruments_excluded', `« ${id} » ne peut pas être à la fois présent et exclu`)
      if (p.instruments_scope !== 'exhaustive') E(file, 'instruments_excluded', 'Une exclusion vérifiée exige une liste officielle exhaustive')
    }
    for (const o of p.dynamic_observations ?? []) {
      if (!sourceById.has(o.source)) E(file, 'dynamic_observations', `Source inconnue : « ${o.source} »`)
      if (o.durable) E(file, 'dynamic_observations', 'Une observation dynamique ne peut pas être déclarée durable')
    }
    for (const op of p.observed_prices ?? []) {
      const src = sourceById.get(op.source)
      if (!src) E(file, 'observed_prices', `Source inconnue : « ${op.source} »`)
      else if (!p.demo && src.type !== 'official') E(file, 'observed_prices', `Un prix observé doit venir du site officiel (« ${op.source} »)`)
      if (op.variant_id !== null && !p.variants.some((v) => v.id === op.variant_id)) E(file, 'observed_prices', `Variante inconnue : « ${op.variant_id} »`)
    }
    for (const q of p.quebec_by_stage ?? []) {
      if (q.state !== 'a_verifier') {
        const official = q.sources.some((sid) => sourceById.get(sid)?.type === 'official')
        if (!official && !p.demo) E(file, `quebec_by_stage.${q.stage}`, 'Un statut Québec « restreint » ou « admis » exige une source officielle')
      }
      for (const sid of q.sources) if (!sourceById.has(sid)) E(file, `quebec_by_stage.${q.stage}`, `Source inconnue : « ${sid} »`)
    }
    p.platforms.value?.forEach((id) => {
      if (!platformIds.has(id)) E(file, 'platforms', `Plateforme inconnue : « ${id} »`)
    })

    // Éligibilité
    const checkCode = (code: string, path: string) => {
      const base = code.split('-')[0]
      if (!countrySet.has(base)) E(file, path, `Code pays inconnu : « ${code} »`)
    }
    const el = p.eligibility.value
    if (el) {
      for (const list of ['eligible', 'excluded', 'unconfirmed'] as const) el[list].forEach((c) => checkCode(c, `eligibility.${list}`))
      const seen = new Map<string, string>()
      for (const list of ['eligible', 'excluded', 'unconfirmed'] as const) {
        for (const c of el[list]) {
          const prev = seen.get(c)
          if (prev) E(file, 'eligibility', `« ${c} » figure à la fois dans « ${prev} » et dans « ${list} »`)
          else seen.set(c, list)
        }
      }
      // « unlisted » ≠ unconfirmed n'est admis que si la source officielle l'énonce : la phrase est recopiée dans « note ».
      if (el.unlisted !== 'unconfirmed' && !p.eligibility.note)
        E(file, 'eligibility.unlisted', `« unlisted: ${el.unlisted} » exige de recopier dans « note » la phrase de la source officielle qui l'énonce`)
    }

    // Restrictions conditionnelles : condition obligatoire
    for (const key of RESTRICTION_KEYS) {
      for (const scope of ['evaluation', 'funded'] as const) {
        const sv = p.restrictions[key][scope]
        if (sv.value === 'conditional' && !sv.note) E(file, `restrictions.${key}.${scope}`, 'Une restriction « conditional » doit préciser ses conditions dans « note »')
      }
    }

    // Cohérence « sans challenge »
    if (p.evaluation.steps.value === 0) {
      if (p.evaluation.drawdown_type.status !== 'not_applicable') E(file, 'evaluation.drawdown_type', 'Programme sans challenge : drawdown d’évaluation doit être « not_applicable »')
      for (const key of RESTRICTION_KEYS) {
        if (p.restrictions[key].evaluation.status !== 'not_applicable') E(file, `restrictions.${key}.evaluation`, 'Programme sans challenge : restriction d’évaluation doit être « not_applicable »')
      }
    }

    // Variantes
    for (const d of dupes(p.variants.map((v) => v.id))) E(file, 'variants', `Variante en double : « ${d} »`)
    for (const v of p.variants) {
      const { one_time, monthly } = v.pricing
      if (one_time.status === 'not_applicable' && monthly.status === 'not_applicable')
        E(file, `variants.${v.id}.pricing`, 'Aucun modèle de prix : renseigner one_time ou monthly')
      if (one_time.status === 'confirmed' && monthly.status === 'confirmed')
        E(file, `variants.${v.id}.pricing`, 'one_time et monthly ne peuvent pas être tous deux confirmés pour une même variante')
    }

    for (const d of dupes(p.variants.map((v) => `${v.account_size_usd}|${v.option ?? ''}`)))
      E(file, 'variants', `Deux variantes de même taille et de même option (« ${d.replace('|', ' / ')} ») : préciser « option »`)

    // Limites par instrument
    const listed = new Set(p.instruments.value ?? [])
    for (const lim of p.instrument_limits.value ?? []) {
      if (!instrumentById.has(lim.instrument)) E(file, 'instrument_limits', `Instrument inconnu : « ${lim.instrument} »`)
      else if (!listed.has(lim.instrument)) E(file, 'instrument_limits', `« ${lim.instrument} » a une limite mais ne figure pas dans « instruments »`)
      if (!lim.note.trim()) E(file, 'instrument_limits', `« ${lim.instrument} » : la note est obligatoire`)
    }
    for (const d of dupes((p.instrument_limits.value ?? []).map((l) => l.instrument))) E(file, 'instrument_limits', `Limite en double : « ${d} »`)

    // Promotions
    for (const promo of p.promos) {
      if (!sourceById.has(promo.source)) E(file, 'promos', `Source de promotion inconnue : « ${promo.source} »`)
    }
  }

  const dataset: Dataset | null =
    errors.length === 0 && scoringRes.success
      ? { firms, programs, sources, instruments, markets, platforms, glossary, countries, scoring: scoringRes.data }
      : null
  return { errors, dataset }
}

export function formatErrors(errors: DataError[]): string {
  return errors.map((e) => `  ✗ ${e.file}${e.path ? ` › ${e.path}` : ''} — ${e.message}`).join('\n')
}
