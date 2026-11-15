import type { Contract, Dataset } from '../data/schema'
import type { Answers } from '../engine/answers'

export type StepId =
  | 'markets'
  | 'forms'
  | 'instruments'
  | 'style'
  | 'when'
  | 'drawdown'
  | 'budget'
  | 'steps'
  | 'priority'
  | 'platform'
  | 'residence'

/** Marchés pour lesquels plusieurs types d'instruments existent dans les données (ex. or : futures ou CFD). */
export function multiFormMarkets(ds: Dataset, selected: string[]): { market: string; forms: Contract[] }[] {
  return selected
    .map((m) => {
      const forms = [...new Set(ds.instruments.filter((i) => i.market === m).map((i) => i.contract))]
      return { market: m, forms }
    })
    .filter((x) => x.forms.length > 1)
}

/** Étapes actives selon les réponses : les sous-questions n'apparaissent que si elles sont utiles. */
export function activeSteps(a: Answers, ds: Dataset): StepId[] {
  // Ordre pensé pour guider : d'abord ce qui élimine de façon certaine (marché, forme, résidence), puis le style de trading,
  // puis les préférences. La résidence est en 3ᵉ position : c'est la contrainte la moins négociable.
  const s: StepId[] = ['markets']
  if (multiFormMarkets(ds, a.markets).length > 0) s.push('forms')
  s.push('residence', 'instruments', 'style', 'when', 'budget', 'steps', 'drawdown', 'priority')
  if (a.priority === 'platform') s.push('platform')
  return s
}

export function stepIsValid(id: StepId, a: Answers, ds: Dataset): boolean {
  switch (id) {
    case 'markets':
      return a.markets.length > 0
    case 'forms':
      return multiFormMarkets(ds, a.markets).every((x) => !!a.marketForms[x.market])
    case 'instruments':
      return true
    case 'style':
      return a.style !== null
    case 'when':
      return a.when.length > 0
    case 'drawdown':
      return a.drawdown !== null
    case 'budget':
      return a.budget !== null
    case 'steps':
      return a.steps !== null
    case 'priority':
      return a.priority !== null
    case 'platform':
      return true
    case 'residence':
      return a.residence.country !== null
  }
}

export const STEP_TITLES: Record<StepId, string> = {
  markets: 'Quels marchés veux-tu trader ?',
  forms: 'Sous quelle forme ?',
  instruments: 'Des instruments précis à vérifier ? (facultatif)',
  style: 'Quel est ton style de trading ?',
  when: 'Quand souhaites-tu trader ?',
  drawdown: 'Quel type de drawdown préfères-tu ?',
  budget: 'Quel budget veux-tu y consacrer ?',
  steps: "Quel type d'évaluation veux-tu ?",
  priority: 'Quelle est ta priorité ?',
  platform: 'Quelle plateforme utilises-tu ?',
  residence: 'Où résides-tu ?',
}

export const STYLE_OPTIONS = [
  { id: 'scalping', label: 'Scalping', help: 'Des trades très courts (de quelques secondes à quelques minutes), souvent nombreux dans la journée.' },
  { id: 'day', label: 'Day trading', help: 'Tu ouvres et fermes tes positions dans la même journée, sans rien garder pour la nuit.' },
  { id: 'swing', label: 'Swing trading', help: 'Tu gardes tes positions plusieurs jours, parfois plusieurs semaines.' },
  { id: 'unsure', label: 'Je débute et je ne sais pas encore', help: "Aucun problème : on te montrera les règles qui comptent le plus pour commencer." },
] as const

export const WHEN_OPTIONS = [
  { id: 'regular', label: 'Pendant les heures normales de marché', help: null },
  { id: 'asian', label: 'Pendant la session asiatique', help: null },
  { id: 'news', label: 'Pendant les annonces économiques importantes', help: 'Chiffres de l’emploi, décisions de taux, inflation… Certaines firmes limitent le trading autour de ces annonces.' },
  { id: 'overnight', label: 'Je souhaite conserver mes positions pendant la nuit', help: null },
  { id: 'weekend', label: 'Je souhaite conserver mes positions pendant la fin de semaine', help: null },
  { id: 'none', label: "Je n'ai pas de préférence", help: null },
] as const

export const DRAWDOWN_OPTIONS = [
  { id: 'static', label: 'Static', gloss: 'static_drawdown' },
  { id: 'eod_trailing', label: 'End-of-Day Trailing', gloss: 'eod_trailing' },
  { id: 'intraday_trailing', label: 'Intraday Trailing', gloss: 'intraday_trailing' },
  { id: 'any', label: 'Aucune préférence', gloss: null },
  { id: 'unknown', label: 'Je ne comprends pas encore les différences', gloss: null },
] as const

export const BUDGET_OPTIONS = [
  { id: 'lt50', label: "Jusqu'à 50 $" },
  { id: '50_100', label: "Jusqu'à 100 $" },
  { id: '100_200', label: "Jusqu'à 200 $" },
  { id: 'gt200', label: 'Plus de 200 $ (pas de plafond)' },
  { id: 'none', label: 'Aucun budget défini' },
] as const

export const STEPS_OPTIONS = [
  { id: 'one', label: 'Une étape' },
  { id: 'two', label: 'Deux étapes' },
  { id: 'none', label: 'Sans challenge' },
  { id: 'any', label: 'Peu importe' },
] as const

export const PRIORITY_OPTIONS = [
  { id: 'simple_drawdown', label: 'Règles de drawdown simples' },
  { id: 'low_cost', label: 'Coût total faible' },
  { id: 'withdrawals', label: 'Conditions de retrait accessibles' },
  { id: 'freedom', label: 'Liberté de trading' },
  { id: 'platform', label: 'Compatibilité avec ma plateforme' },
  { id: 'none', label: 'Aucune préférence particulière' },
] as const

export const CA_PROVINCES: [string, string][] = [
  ['AB', 'Alberta'],
  ['BC', 'Colombie-Britannique'],
  ['MB', 'Manitoba'],
  ['NB', 'Nouveau-Brunswick'],
  ['NL', 'Terre-Neuve-et-Labrador'],
  ['NS', 'Nouvelle-Écosse'],
  ['NT', 'Territoires du Nord-Ouest'],
  ['NU', 'Nunavut'],
  ['ON', 'Ontario'],
  ['PE', 'Île-du-Prince-Édouard'],
  ['SK', 'Saskatchewan'],
  ['YT', 'Yukon'],
]

export const US_STATES: [string, string][] = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'Californie'], ['CO', 'Colorado'],
  ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District de Columbia'], ['FL', 'Floride'], ['GA', 'Géorgie'],
  ['HI', 'Hawaï'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiane'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'],
  ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'],
  ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'Nouveau-Mexique'],
  ['NY', 'New York'], ['NC', 'Caroline du Nord'], ['ND', 'Dakota du Nord'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvanie'], ['RI', 'Rhode Island'], ['SC', 'Caroline du Sud'], ['SD', 'Dakota du Sud'],
  ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginie'], ['WA', 'Washington'],
  ['WV', 'Virginie-Occidentale'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
]
