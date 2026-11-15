import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Dataset } from '../data/schema'
import { emptyAnswers, type Answers } from '../engine/answers'
import { makeContext, type EngineContext } from '../engine/evaluate'

const K_ANSWERS = 'pff.answers.v1'
const K_FAVS = 'pff.favorites.v1'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* stockage indisponible : on continue sans persistance */
  }
}

type State = {
  dataset: Dataset
  ctx: EngineContext
  answers: Answers
  setAnswers: (update: (a: Answers) => Answers) => void
  replaceAnswers: (a: Answers) => void
  resetAnswers: () => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  /** Colonnes du comparateur : « programme:variante » (une variante = une taille de compte). */
  compare: string[]
  setCompare: (keys: string[]) => void
  /** Ajoute / retire un programme (avec la variante indiquée) de la comparaison. */
  toggleCompare: (programId: string, variantId: string) => void
  isCompared: (programId: string) => boolean
}

const Ctx = createContext<State | null>(null)
export const MAX_COMPARE = 3
export const colKey = (programId: string, variantId: string) => `${programId}:${variantId}`
export const parseColKey = (k: string): { programId: string; variantId: string | null } => {
  const [programId, variantId] = k.split(':')
  return { programId, variantId: variantId ?? null }
}

export function AppStateProvider({ dataset, now, children }: { dataset: Dataset; now?: Date; children: ReactNode }) {
  const [answers, setAnswersState] = useState<Answers>(() => ({ ...emptyAnswers(), ...load<Partial<Answers>>(K_ANSWERS, {}) }))
  const [favorites, setFavorites] = useState<string[]>(() => {
    const f = load<{ ids: string[] }>(K_FAVS, { ids: [] })
    return Array.isArray(f.ids) ? f.ids.filter((id) => dataset.programs.some((p) => p.id === id)) : []
  })
  const [compare, setCompareState] = useState<string[]>([])

  useEffect(() => {
    save(K_ANSWERS, answers)
  }, [answers])
  useEffect(() => {
    save(K_FAVS, { ids: favorites })
  }, [favorites])

  const setAnswers = useCallback((update: (a: Answers) => Answers) => setAnswersState((a) => update(a)), [])
  const replaceAnswers = useCallback((a: Answers) => setAnswersState(a), [])
  const resetAnswers = useCallback(() => {
    setAnswersState(emptyAnswers())
  }, [])
  const toggleFavorite = useCallback((id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])), [])
  const setCompare = useCallback((keys: string[]) => setCompareState([...new Set(keys)].slice(0, MAX_COMPARE)), [])
  const toggleCompare = useCallback(
    (programId: string, variantId: string) =>
      setCompareState((c) => {
        if (c.some((k) => parseColKey(k).programId === programId)) return c.filter((k) => parseColKey(k).programId !== programId)
        return c.length >= MAX_COMPARE ? c : [...c, colKey(programId, variantId)]
      }),
    [],
  )
  const isCompared = useCallback((programId: string) => compare.some((k) => parseColKey(k).programId === programId), [compare])

  const ctx = useMemo(() => makeContext(dataset, now ?? new Date()), [dataset, now])

  const value: State = {
    dataset,
    ctx,
    answers,
    setAnswers,
    replaceAnswers,
    resetAnswers,
    favorites,
    toggleFavorite,
    compare,
    setCompare,
    toggleCompare,
    isCompared,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp(): State {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp doit être utilisé dans AppStateProvider')
  return v
}
