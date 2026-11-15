import type { Contract } from '../data/schema'
import { emptyAnswers, type Answers, type CriterionKey } from './answers'
import { RELAXABLE } from './answers'

/**
 * LIEN DE PARTAGE
 * Contient uniquement les critères du questionnaire. La résidence (pays, région)
 * n'est JAMAIS incluse : celui qui ouvre le lien indique la sienne.
 */
export type ShareState = { answers: Answers; relaxed: CriterionKey[] }

const enc = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const dec = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'))

export function encodeShare(state: ShareState): string {
  const a = state.answers
  const payload = {
    m: a.markets,
    i: a.instruments,
    f: a.marketForms,
    s: a.style,
    w: a.when,
    d: a.drawdown,
    b: a.budget,
    e: a.steps,
    p: a.priority,
    pl: a.platforms,
    x: state.relaxed,
  }
  return enc(JSON.stringify(payload))
}

const STYLE = ['scalping', 'day', 'swing', 'unsure']
const WHEN = ['regular', 'asian', 'news', 'overnight', 'weekend', 'none']
const DD = ['static', 'eod_trailing', 'intraday_trailing', 'any', 'unknown']
const BUDGET = ['lt50', '50_100', '100_200', 'gt200', 'none']
const STEPS = ['one', 'two', 'none', 'any']
const PRIORITY = ['simple_drawdown', 'low_cost', 'withdrawals', 'freedom', 'platform', 'none']
const CONTRACTS = ['any', 'futures', 'cfd', 'spot', 'perpetual', 'other']

const pick = <T extends string>(v: unknown, allowed: string[]): T | null => (typeof v === 'string' && allowed.includes(v) ? (v as T) : null)
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length < 40).slice(0, 30) : [])

/** Décode un lien de partage. Toute valeur inattendue est ignorée (jamais d'erreur). */
export function decodeShare(token: string): ShareState | null {
  try {
    const raw = JSON.parse(dec(token)) as Record<string, unknown>
    if (typeof raw !== 'object' || raw === null) return null
    const a = emptyAnswers()
    a.markets = strArr(raw.m)
    a.instruments = strArr(raw.i)
    const forms: Answers['marketForms'] = {}
    if (typeof raw.f === 'object' && raw.f !== null) {
      for (const [k, v] of Object.entries(raw.f as Record<string, unknown>)) {
        const c = pick<'any' | Contract>(v, CONTRACTS)
        if (c && k.length < 40) forms[k] = c
      }
    }
    a.marketForms = forms
    a.style = pick(raw.s, STYLE)
    a.when = strArr(raw.w).filter((w): w is Answers['when'][number] => WHEN.includes(w))
    a.drawdown = pick(raw.d, DD)
    a.budget = pick(raw.b, BUDGET)
    a.steps = pick(raw.e, STEPS)
    a.priority = pick(raw.p, PRIORITY)
    a.platforms = strArr(raw.pl)
    const relaxed = strArr(raw.x).filter((x): x is CriterionKey => (RELAXABLE as string[]).includes(x))
    return { answers: a, relaxed }
  } catch {
    return null
  }
}
