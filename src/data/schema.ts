import { z } from 'zod'

/**
 * SCHÉMAS DES DONNÉES
 * -------------------
 * Toute information importante est une « valeur sourcée » (Sourced) :
 *   - status "confirmed"      → value renseignée, ≥ 1 source, date de vérification
 *   - status "unconfirmed"    → value = null (« Non confirmé »), jamais de valeur par défaut
 *   - status "not_applicable" → value = null, la notion n'existe pas pour ce programme
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')

export const sourced = <T extends z.ZodType>(inner: T) =>
  z.object({
    status: z.enum(['confirmed', 'unconfirmed', 'not_applicable']),
    value: inner.nullable(),
    sources: z.array(z.string()),
    verified_at: isoDate.nullable(),
    note: z.string().optional(),
  })

export type Sourced<T> = {
  status: 'confirmed' | 'unconfirmed' | 'not_applicable'
  value: T | null
  sources: string[]
  verified_at: string | null
  note?: string
}

export const DrawdownTypeSchema = z.enum(['static', 'eod_trailing', 'intraday_trailing'])
export type DrawdownType = z.infer<typeof DrawdownTypeSchema>

export const ContractSchema = z.enum(['futures', 'cfd', 'spot', 'perpetual', 'other'])
export type Contract = z.infer<typeof ContractSchema>

export const RestrictionValueSchema = z.enum(['allowed', 'forbidden', 'conditional'])
export type RestrictionValue = z.infer<typeof RestrictionValueSchema>

export const RESTRICTION_KEYS = [
  'news',
  'overnight',
  'weekend',
  'asian_session',
  'scalping',
  'automated',
  'copy_trading',
] as const
export type RestrictionKey = (typeof RESTRICTION_KEYS)[number]

const RestrictionSchema = z.object({
  evaluation: sourced(RestrictionValueSchema),
  funded: sourced(RestrictionValueSchema),
})

const num = sourced(z.number())

const ConditionalFeeSchema = z.object({
  label: z.string(),
  amount_usd: z.number().nullable(),
  condition: z.string(),
})

export type ConditionalFee = z.infer<typeof ConditionalFeeSchema>

const VariantSchema = z.object({
  id: z.string(),
  account_size_usd: z.number().positive(),
  /**
   * Option d'achat de cette taille quand une même taille existe en plusieurs versions
   * (ex. « Sans frais d'activation »). null = version standard. Deux variantes de même taille
   * et de même option sont interdites : chaque variante a ses propres frais et règles.
   */
  option: z.string().nullable(),
  pricing: z.object({
    /** Paiement unique pour l'évaluation (status not_applicable si le programme est mensuel). */
    one_time: num,
    /** Abonnement mensuel (status not_applicable si paiement unique). */
    monthly: num,
    /** Frais d'activation obligatoires du compte funded (0 si confirmés gratuits). */
    activation_fee: num,
    reset_fee: num,
    /** Frais possibles selon conditions : jamais additionnés au coût certain. */
    conditional_fees: sourced(z.array(ConditionalFeeSchema)),
  }),
  evaluation: z.object({
    /** Objectif de la 1re étape (ou de l'unique étape). */
    profit_target_usd: num,
    /** Objectifs des étapes suivantes pour les programmes à 2 ou 3 étapes (absent = programme à une étape). */
    profit_target_phase2_usd: num.optional(),
    profit_target_phase3_usd: num.optional(),
    max_drawdown_usd: num,
    daily_loss_limit_usd: num,
    min_trading_days: num,
    max_contracts: num,
  }),
  funded: z.object({
    max_drawdown_usd: num,
    daily_loss_limit_usd: num,
    max_contracts: num,
    /** Plafond de retrait par demande pour cette taille (USD), quand il dépend de la taille. */
    max_payout_usd: num,
    /** Plafonds par numéro de retrait (index 0 = 1er retrait) quand ils varient ; null = montant non lu. */
    payout_caps_by_number: sourced(z.array(z.number().nullable())).optional(),
  }),
})

const PayoutPathSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Jours requis avant une demande (gagnants ou de trading selon la note). */
  min_days: z.number().int().nullable(),
  /** Profit net minimal d'un jour qualifiant (USD) ; null si variable selon la taille ou non lu. */
  min_day_profit_usd: z.number().nullable(),
  /** Plus gros jour ≤ ce pourcentage du profit (règle de consistance) ; null = aucune. */
  consistency_max_day_pct: z.number().nullable(),
  /** Part du solde demandable par retrait (%), plafonnée par taille. */
  request_limit_pct_of_balance: z.number().nullable(),
  note: z.string(),
})

const InstrumentLimitSchema = z.object({
  instrument: z.string(),
  /**
   *  - limited     : disponible, avec une limite (nombre de contrats, annonces…) décrite dans « note »
   *  - unconfirmed : figure dans la liste mais sa disponibilité actuelle est contestée ou non confirmée
   *  - suspended   : suspendu (seulement si une source OFFICIELLE le dit)
   */
  state: z.enum(['limited', 'unconfirmed', 'suspended']),
  note: z.string(),
})
export type InstrumentLimit = z.infer<typeof InstrumentLimitSchema>

const PromoSchema = z.object({
  label: z.string(),
  description: z.string(),
  observed_on: isoDate,
  valid_until: isoDate.nullable(),
  source: z.string(),
})

export const ProgramSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id en minuscules, chiffres et tirets'),
  firm_id: z.string(),
  name: z.string().min(1),
  demo: z.boolean(),
  official_url: z.string().url().nullable(),
  summary: z.string(),
  instruments: sourced(z.array(z.string()).min(1)),
  /**
   * Portée de la liste « instruments » :
   *  - exhaustive : la source énumère tout ce qui est permis ; un instrument du catalogue absent de la liste est NON disponible
   *  - partial    : la liste est un extrait ; un instrument absent est seulement NON CONFIRMÉ
   */
  /**
   * Portée de la liste OFFICIELLE du programme (≠ couverture de notre catalogue) :
   *  - exhaustive : la liste officielle complète a été lue ; elle peut contenir des produits hors catalogue.
   *  - partial    : seul un extrait officiel a été lu.
   * « instruments » = produits de NOTRE catalogue confirmés présents dans la liste officielle.
   */
  instruments_scope: z.enum(['exhaustive', 'partial']),
  /**
   * Produits de NOTRE catalogue dont l'ABSENCE de la liste officielle exhaustive a été vérifiée un par un.
   * Un instrument du catalogue absent à la fois de « instruments » et d'ici n'est jamais « interdit » : il reste « à vérifier ».
   */
  instruments_excluded: sourced(z.array(z.string())),
  /** Types de contrats que le programme accepte (ex. futures seulement). Un instrument d'un autre type est indisponible. */
  contract_types: sourced(z.array(ContractSchema).min(1)),
  /** Exceptions par instrument (limites, suspension, doute). */
  instrument_limits: sourced(z.array(InstrumentLimitSchema)),
  platforms: sourced(z.array(z.string()).min(1)),
  evaluation: z.object({
    /** 0 = sans challenge (compte financé direct), 1 ou 2 étapes, etc. */
    steps: sourced(z.number().int().min(0).max(4)),
    drawdown_type: sourced(DrawdownTypeSchema),
    /** Durée maximale de l'évaluation en jours (not_applicable = aucune limite de temps). */
    time_limit_days: sourced(z.number().int().positive()),
    description: sourced(z.string()),
    consistency_rule: sourced(z.object({ exists: z.boolean(), detail: z.string().nullable() })),
    /**
     * Conséquence d'un dépassement de la limite quotidienne : « breach » = échec / fermeture du compte ;
     * « pause » = arrêt de la journée seulement (le compte continue). Absent = non précisé.
     */
    daily_loss_behavior: sourced(z.enum(['breach', 'pause'])).optional(),
  }),
  funded: z.object({
    account_nature: sourced(z.enum(['simulated', 'real'])),
    drawdown_type: sourced(DrawdownTypeSchema),
    profit_split_pct: num,
    /** Conséquence d'un dépassement de la limite quotidienne du compte funded (voir évaluation). */
    daily_loss_behavior: sourced(z.enum(['breach', 'pause'])).optional(),
    min_withdrawal_usd: num,
    payout_cap: sourced(z.object({ has_cap: z.boolean(), amount_usd: z.number().nullable() })),
    safety_net: sourced(z.object({ exists: z.boolean(), detail: z.string().nullable() })),
    withdrawal_conditions: sourced(z.string()),
    /** Chemins de retrait structurés (ex. Standard / Consistency). Jamais mélangés avec les règles d'évaluation. */
    payout_paths: sourced(z.array(PayoutPathSchema)).optional(),
    /** Nombre maximal de retraits par compte financé (not_applicable = illimité selon la source ; unconfirmed = non énoncé). */
    max_payouts: sourced(z.number().int().positive()).optional(),
    /** Effet d'un retrait sur le drawdown / le seuil de perte. */
    drawdown_effect_of_payout: sourced(z.string()).optional(),
  }),
  restrictions: z.object({
    news: RestrictionSchema,
    overnight: RestrictionSchema,
    weekend: RestrictionSchema,
    asian_session: RestrictionSchema,
    scalping: RestrictionSchema,
    automated: RestrictionSchema,
    copy_trading: RestrictionSchema,
  }),
  /**
   * Admissibilité géographique, représentée explicitement :
   *  - eligible    : pays/régions dont l'admissibilité est confirmée par la source
   *  - excluded    : pays/régions explicitement exclus
   *  - unconfirmed : pays/régions examinés mais non confirmés
   *  - unlisted    : sort de tout pays absent des trois listes
   *      « unconfirmed » (défaut sûr : une absence d'exclusion n'est PAS une admissibilité),
   *      « eligible » ou « excluded » uniquement si la source officielle l'énonce explicitement
   *      (ex. « ouvert à tous sauf… ») ; la phrase de la source est alors recopiée dans « note ».
   * Codes : « FR », ou pays-région « CA-QC », « US-NY ». La région la plus précise l'emporte.
   */
  eligibility: sourced(
    z.object({
      eligible: z.array(z.string()),
      excluded: z.array(z.string()),
      unconfirmed: z.array(z.string()),
      unlisted: z.enum(['eligible', 'excluded', 'unconfirmed']),
    }),
  ),
  /**
   * Admissibilité des résidents du Québec, par type de compte (jamais extrapolée d'un type à l'autre) :
   *  - a_verifier : aucune source officielle ne tranche ; - restreint / admis : seulement si une source officielle l'énonce pour CE type.
   */
  quebec_by_stage: z
    .array(
      z.object({
        stage: z.enum(['evaluation', 'funded_sim', 'live']),
        state: z.enum(['a_verifier', 'canada_general', 'restreint', 'admis']),
        note: z.string(),
        sources: z.array(z.string()),
      }),
    )
    .optional(),
  /** Valeurs relevées sur une page dynamique : jamais des valeurs confirmées. */
  dynamic_observations: z
    .array(
      z.object({
        label: z.string(),
        source: z.string(),
        parameters: z.record(z.string(), z.string()),
        consulted_at: isoDate,
        evidence_file: z.string().nullable(),
        durable: z.boolean(),
        observed: z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
        note: z.string(),
      }),
    )
    .optional(),
  /** Prix relevés sur le site officiel : OBSERVATIONS datées, jamais des prix confirmés ni garantis. */
  observed_prices: z
    .array(
      z.object({
        variant_id: z.string().nullable(),
        label: z.string(),
        amount: z.number().nonnegative(),
        currency: z.enum(['USD', 'EUR']),
        kind: z.enum(['affiche', 'promo', 'a_partir_de', 'mensuel']),
        observed_on: isoDate,
        source: z.string(),
        note: z.string().nullable(),
      }),
    )
    .optional(),
  variants: z.array(VariantSchema).min(1),
  promos: z.array(PromoSchema),
  watch_points: sourced(z.array(z.string())),
})
export type Program = z.infer<typeof ProgramSchema>
export type Variant = z.infer<typeof VariantSchema>
export type Eligibility = NonNullable<Program['eligibility']['value']>

export const FirmSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  website: z.string().url().nullable(),
  demo: z.boolean(),
  description: z.string(),
})
export type Firm = z.infer<typeof FirmSchema>

export const SourceSchema = z.object({
  id: z.string(),
  label: z.string(),
  url: z.string().url().nullable(),
  type: z.enum(['official', 'third_party', 'demo']),
  /** false = page dynamique (tarifs, promotions) dont le contenu ne peut pas être revérifié durablement. */
  durable: z.boolean().optional(),
  /** Paramètres exacts qui produisent la valeur (ex. paramètres d'URL d'un sélecteur). */
  parameters: z.record(z.string(), z.string()).optional(),
  consulted_at: isoDate.optional(),
  /** Chemin (dans le dépôt) d'un fichier de preuve. */
  evidence_file: z.string().optional(),
})
export type Source = z.infer<typeof SourceSchema>

export const InstrumentSchema = z.object({
  id: z.string(),
  label: z.string(),
  market: z.string(),
  contract: ContractSchema,
  /** Sous-jacent commun (ex. « Bitcoin » pour MBT, BTC/USD CFD et BTC perpétuel) : sert à expliquer les différences de forme. */
  underlying: z.string(),
})
export type Instrument = z.infer<typeof InstrumentSchema>

export const MarketSchema = z.object({
  id: z.string(),
  label: z.string(),
  help: z.string(),
})
export type Market = z.infer<typeof MarketSchema>

export const PlatformSchema = z.object({ id: z.string(), label: z.string() })
export type Platform = z.infer<typeof PlatformSchema>

export const GlossaryEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  short: z.string(),
  example: z.string().nullable(),
  caution: z.string().nullable(),
})
export type GlossaryEntry = z.infer<typeof GlossaryEntrySchema>

export const ScoringConfigSchema = z.object({
  /** Chemins des champs « essentiels » (variants[] = n'importe quelle variante). Tout le reste est « secondaire ». */
  essential_fields: z.array(z.string()).min(1),
  /** Si true : une information essentielle manquante empêche le statut COMPATIBLE (→ À VÉRIFIER). */
  critical_gaps_block_compatible: z.boolean(),
  /** Au-delà de ce nombre de jours, une donnée confirmée devient « Vérification nécessaire ». */
  stale_after_days: z.number().int().positive(),
  weights: z.object({
    drawdown: z.number().nonnegative(),
    steps: z.number().nonnegative(),
    cost: z.number().nonnegative(),
    withdrawal: z.number().nonnegative(),
    freedom: z.number().nonnegative(),
    platform: z.number().nonnegative(),
  }),
  /** Multiplicateur appliqué au critère choisi comme priorité (Q7). */
  priority_multiplier: z.number().positive(),
  drawdown_simplicity: z.object({
    static: z.number().min(0).max(1),
    eod_trailing: z.number().min(0).max(1),
    intraday_trailing: z.number().min(0).max(1),
  }),
  /** Barème de coût de départ (USD) → score 0..1. Barème absolu, jamais lié à une promotion. */
  cost_scale: z.array(z.object({ up_to_usd: z.number().nullable(), score: z.number().min(0).max(1) })).min(1),
  profit_split_scale: z.array(z.object({ at_least_pct: z.number(), score: z.number().min(0).max(1) })).min(1),
  min_withdrawal_scale: z.array(z.object({ up_to_usd: z.number().nullable(), score: z.number().min(0).max(1) })).min(1),
  restriction_scores: z.object({ allowed: z.number(), conditional: z.number(), forbidden: z.number() }),
  /** Montant maximal retenu pour chaque tranche de budget (USD). null = pas de plafond. */
  budget_caps_usd: z.object({
    lt50: z.number().nullable(),
    '50_100': z.number().nullable(),
    '100_200': z.number().nullable(),
    gt200: z.number().nullable(),
    none: z.number().nullable(),
  }),
})
export type ScoringConfig = z.infer<typeof ScoringConfigSchema>

export type Dataset = {
  firms: Firm[]
  programs: Program[]
  sources: Source[]
  instruments: Instrument[]
  markets: Market[]
  platforms: Platform[]
  glossary: GlossaryEntry[]
  countries: string[]
  scoring: ScoringConfig
}
