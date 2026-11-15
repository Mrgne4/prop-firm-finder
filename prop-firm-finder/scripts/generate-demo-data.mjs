/**
 * Génère les 3 programmes FICTIFS de démonstration (data/programs/demo-*.json), leurs entreprises
 * fictives et la source « demo ».
 *
 *   node scripts/generate-demo-data.mjs [AAAA-MM-JJ]
 *
 * La date passée (par défaut 2026-11-15) sert de « date de vérification » fictive : relance la
 * commande pour rafraîchir les dates des démos. Ces fichiers disparaîtront avant la mise en ligne
 * des données réelles (supprimer data/programs/demo-*.json et les entrées demo-* de firms.json / sources.json).
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'data')
const REF = process.argv[2] ?? '2026-11-15'
const day = (offset = 0) => {
  const d = new Date(`${REF}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - offset)
  return d.toISOString().slice(0, 10)
}
const SRC = ['demo-fiction']

const conf = (value, o = {}) => ({ status: 'confirmed', value, sources: SRC, verified_at: day(o.age ?? 0), ...(o.note ? { note: o.note } : {}) })
const unc = () => ({ status: 'unconfirmed', value: null, sources: [], verified_at: null })
const na = () => ({ status: 'not_applicable', value: null, sources: [], verified_at: null })
/** Restriction : null → non confirmée ; 'na' → sans objet ; sinon valeur (+ note pour « conditional »). */
const rs = (v, note) => (v === null ? unc() : v === 'na' ? na() : conf(v, { note }))
const restriction = (ev, fu, note) => ({ evaluation: Array.isArray(ev) ? rs(ev[0], ev[1]) : rs(ev, note), funded: Array.isArray(fu) ? rs(fu[0], fu[1]) : rs(fu, note) })

const variant = (id, size, o) => ({
  id,
  account_size_usd: size,
  option: null,
  pricing: {
    one_time: o.one === undefined ? na() : o.one === null ? unc() : conf(o.one),
    monthly: o.monthly === undefined ? na() : o.monthly === null ? unc() : conf(o.monthly),
    activation_fee: o.act === undefined ? unc() : o.act === 'na' ? na() : conf(o.act),
    reset_fee: o.reset === undefined ? unc() : conf(o.reset),
    conditional_fees: o.fees ? conf(o.fees) : unc(),
  },
  evaluation: {
    profit_target_usd: conf(o.target),
    max_drawdown_usd: conf(o.dd),
    daily_loss_limit_usd: o.dll === null ? na() : conf(o.dll),
    min_trading_days: o.days === null ? na() : conf(o.days),
    max_contracts: conf(o.contracts),
  },
  funded: {
    max_drawdown_usd: conf(o.dd),
    daily_loss_limit_usd: o.dll === null ? na() : conf(o.dll),
    max_contracts: conf(o.contracts),
    max_payout_usd: unc(),
  },
})

const firms = [
  { id: 'demo-alpha', name: 'DÉMO Alpha', website: null, demo: true, description: "Entreprise FICTIVE créée uniquement pour tester l'outil. Elle n'existe pas et ses programmes ne sont pas une offre réelle." },
  { id: 'demo-beta', name: 'DÉMO Bêta', website: null, demo: true, description: "Entreprise FICTIVE créée uniquement pour tester l'outil. Elle n'existe pas et ses programmes ne sont pas une offre réelle." },
  { id: 'demo-gamma', name: 'DÉMO Gamma', website: null, demo: true, description: "Entreprise FICTIVE créée uniquement pour tester l'outil. Elle n'existe pas et ses programmes ne sont pas une offre réelle." },
]

/* --------------------------- Alpha : cas « COMPATIBLE » --------------------------- */
const alpha = {
  id: 'demo-alpha-futures-eod',
  firm_id: 'demo-alpha',
  name: 'DÉMO Alpha — Futures EOD',
  demo: true,
  official_url: null,
  summary: "Programme FICTIF de futures, à une étape, avec drawdown trailing de fin de journée. Toutes ses données sont inventées et complètes : il sert à tester le statut COMPATIBLE.",
  instruments: conf(['NQ', 'MNQ', 'ES', 'MES', 'YM', 'MYM', 'GC', 'MGC', 'CL', 'MCL']),
  instruments_scope: 'exhaustive',
  instruments_excluded: conf(null),
  contract_types: unc(),
  instrument_limits: conf([]),
  platforms: conf(['tradovate', 'ninjatrader', 'tradingview']),
  evaluation: {
    steps: conf(1),
    drawdown_type: conf('eod_trailing'),
    time_limit_days: na(),
    description: conf("(Démo) Une seule étape : atteindre l'objectif de profit sans toucher le seuil de drawdown, en respectant un minimum de jours de trading."),
    consistency_rule: conf({ exists: true, detail: "(Démo) Aucun jour ne doit dépasser 40 % du profit total au moment du retrait." }),
  },
  funded: {
    account_nature: conf('simulated'),
    drawdown_type: conf('eod_trailing'),
    profit_split_pct: conf(90),
    min_withdrawal_usd: conf(100),
    payout_cap: conf({ has_cap: false, amount_usd: null }),
    safety_net: conf({ exists: true, detail: "(Démo) Un solde minimal doit être conservé sur le compte après un retrait." }),
    withdrawal_conditions: conf("(Démo) Retraits possibles après un nombre minimal de jours gagnants, sous réserve de la règle de consistance."),
  },
  restrictions: {
    news: restriction('allowed', 'allowed'),
    overnight: restriction('forbidden', 'forbidden'),
    weekend: restriction('forbidden', 'forbidden'),
    asian_session: restriction('allowed', 'allowed'),
    scalping: restriction('allowed', 'allowed'),
    automated: restriction('allowed', 'forbidden'),
    copy_trading: restriction('forbidden', 'forbidden'),
  },
  eligibility: conf({ eligible: ['CA', 'FR', 'BE', 'CH', 'US'], excluded: ['IR', 'KP', 'SY', 'CU'], unconfirmed: [], unlisted: 'unconfirmed' }),
  variants: [
    variant('25k', 25000, { monthly: 49, act: 0, reset: 49, target: 1500, dd: 1500, dll: null, days: 2, contracts: 3 }),
    variant('50k', 50000, { monthly: 79, act: 0, reset: 79, target: 3000, dd: 2000, dll: null, days: 2, contracts: 5 }),
    variant('100k', 100000, { monthly: 129, act: 0, reset: 129, target: 6000, dd: 3000, dll: null, days: 2, contracts: 10 }),
  ],
  promos: [
    { label: 'Promotion fictive −20 %', description: "(Démo) Exemple de promotion temporaire : elle est affichée à part et n'est jamais utilisée pour le filtre budget ni pour le score.", observed_on: day(5), valid_until: day(-9), source: 'demo-fiction' },
  ],
  watch_points: conf(["(Démo) Les positions ne peuvent pas être conservées la nuit ni pendant la fin de semaine.", "(Démo) Le trading automatisé est autorisé pendant l'évaluation mais interdit sur le compte funded."]),
}

/* --------------------------- Bêta : cas « À VÉRIFIER » --------------------------- */
const beta = {
  id: 'demo-beta-futures-intraday',
  firm_id: 'demo-beta',
  name: 'DÉMO Bêta — Futures Intraday',
  demo: true,
  official_url: null,
  summary: "Programme FICTIF de futures sur indices, à deux étapes, avec drawdown trailing intraday. Plusieurs informations y sont volontairement non confirmées, conditionnelles ou anciennes : il sert à tester le statut À VÉRIFIER.",
  instruments: conf(['NQ', 'MNQ', 'ES', 'MES']),
  instruments_scope: 'exhaustive',
  instruments_excluded: conf(null),
  contract_types: unc(),
  instrument_limits: conf([]),
  platforms: conf(['rithmic', 'ninjatrader']),
  evaluation: {
    steps: conf(2),
    drawdown_type: conf('intraday_trailing'),
    time_limit_days: na(),
    description: conf("(Démo) Deux étapes successives, chacune avec son objectif de profit.", { age: 87 }),
    consistency_rule: unc(),
  },
  funded: {
    account_nature: conf('simulated'),
    drawdown_type: conf('intraday_trailing'),
    profit_split_pct: conf(80, { age: 87 }),
    min_withdrawal_usd: unc(),
    payout_cap: unc(),
    safety_net: unc(),
    withdrawal_conditions: unc(),
  },
  restrictions: {
    news: restriction('conditional', 'conditional', "(Démo) Interdit 2 minutes avant et après certaines annonces"),
    overnight: restriction('allowed', ['conditional', "(Démo) Autorisé seulement avec une marge minimale"]),
    weekend: restriction('forbidden', 'forbidden'),
    asian_session: restriction('allowed', 'allowed'),
    scalping: restriction(null, null),
    automated: restriction('forbidden', 'forbidden'),
    copy_trading: restriction('forbidden', 'forbidden'),
  },
  eligibility: unc(),
  variants: [
    variant('50k', 50000, { one: 59, act: undefined, reset: 40, target: 3000, dd: 2500, dll: 1100, days: 5, contracts: 5 }),
    variant('100k', 100000, { one: 99, act: undefined, reset: 70, target: 6000, dd: 3500, dll: 2200, days: 5, contracts: 10 }),
  ],
  promos: [],
  watch_points: conf(["(Démo) Plusieurs règles du compte funded ne sont pas confirmées."], { age: 87 }),
}

/* --------------------------- Gamma : cas « INCOMPATIBLE » --------------------------- */
const gamma = {
  id: 'demo-gamma-cfd-forex',
  firm_id: 'demo-gamma',
  name: 'DÉMO Gamma — Forex & CFD',
  demo: true,
  official_url: null,
  summary: "Programme FICTIF de forex et de CFD, à deux étapes, avec drawdown statique. Il ne propose aucun contrat future et exclut le Québec et les États-Unis : il sert à tester le statut INCOMPATIBLE.",
  instruments: conf(['FOREX', 'NAS100', 'US30', 'SPX500', 'XAUUSD', 'USOIL', 'BTCUSD_CFD', 'ETHUSD_CFD']),
  instruments_scope: 'exhaustive',
  instruments_excluded: conf(null),
  contract_types: unc(),
  instrument_limits: conf([]),
  platforms: conf(['metatrader5', 'ctrader']),
  evaluation: {
    steps: conf(2),
    drawdown_type: conf('static'),
    time_limit_days: na(),
    description: conf("(Démo) Deux étapes avec objectif de profit et limite de perte quotidienne."),
    consistency_rule: conf({ exists: false, detail: null }),
  },
  funded: {
    account_nature: conf('simulated'),
    drawdown_type: conf('static'),
    profit_split_pct: conf(80),
    min_withdrawal_usd: conf(50),
    payout_cap: conf({ has_cap: false, amount_usd: null }),
    safety_net: conf({ exists: false, detail: null }),
    withdrawal_conditions: conf("(Démo) Retraits possibles à intervalles réguliers après le premier profit."),
  },
  restrictions: {
    news: restriction('allowed', 'allowed'),
    overnight: restriction('allowed', 'allowed'),
    weekend: restriction('allowed', 'allowed'),
    asian_session: restriction('allowed', 'allowed'),
    scalping: restriction('allowed', 'allowed'),
    automated: restriction('allowed', 'allowed'),
    copy_trading: restriction('forbidden', 'forbidden'),
  },
  eligibility: conf({ eligible: ['CA', 'FR', 'BE', 'CH', 'GB'], excluded: ['US', 'CA-QC', 'IR', 'KP'], unconfirmed: ['CN'], unlisted: 'unconfirmed' }),
  variants: [
    variant('25k', 25000, { one: 155, act: 0, reset: 155, target: 2500, dd: 2500, dll: 1250, days: 4, contracts: 30 }),
    variant('100k', 100000, { one: 540, act: 0, reset: 540, target: 10000, dd: 10000, dll: 5000, days: 4, contracts: 100 }),
  ],
  promos: [],
  watch_points: conf(["(Démo) Résidents du Québec et des États-Unis exclus."]),
}

const write = (rel, data) => writeFileSync(join(ROOT, rel), JSON.stringify(data, null, 2) + '\n')

// Entreprises et sources : on conserve les entrées non-démo existantes.
const readJson = (rel, fallback) => {
  try { return JSON.parse(readFileSync(join(ROOT, rel), 'utf8')) } catch { return fallback }
}
const keep = (list) => list.filter((x) => !String(x.id).startsWith('demo-'))
write('firms.json', [...keep(readJson('firms.json', [])), ...firms])
write('sources.json', [
  ...keep(readJson('sources.json', [])),
  { id: 'demo-fiction', label: 'Donnée fictive de démonstration (aucune source réelle)', url: null, type: 'demo' },
])
// Démo : les listes fictives sont exhaustives par construction ; tout instrument du catalogue absent de la liste est « vérifié absent ».
const catalog = readJson('instruments.json', []).map((i) => i.id)
for (const p of [alpha, beta, gamma]) {
  p.instruments_excluded = conf(catalog.filter((id) => !p.instruments.value.includes(id)))
}
for (const p of [alpha, beta, gamma]) write(`programs/${p.id}.json`, p)
console.log(`Données de démonstration générées (date de référence : ${REF}).`)
