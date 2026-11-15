import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import type { GlossaryEntry } from '../data/schema'
import { useApp } from '../state/AppState'

type Ctx = { open: (ids: string[]) => void }
const GlossaryCtx = createContext<Ctx>({ open: () => {} })

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const { dataset } = useApp()
  const [ids, setIds] = useState<string[] | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const open = useCallback((i: string[]) => setIds(i), [])
  const entries = (ids ?? []).map((id) => dataset.glossary.find((g) => g.id === id)).filter((g): g is GlossaryEntry => !!g)

  useEffect(() => {
    if (!ids) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIds(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ids])

  return (
    <GlossaryCtx.Provider value={{ open }}>
      {children}
      {ids && (
        <div className="overlay" onClick={() => setIds(null)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Explication" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} className="modal-close" onClick={() => setIds(null)} aria-label="Fermer">
              ×
            </button>
            {entries.map((g) => (
              <GlossaryBody key={g.id} g={g} />
            ))}
          </div>
        </div>
      )}
    </GlossaryCtx.Provider>
  )
}

export function GlossaryBody({ g }: { g: GlossaryEntry }) {
  return (
    <section className="gloss">
      <h3>{g.title}</h3>
      <p>{g.short}</p>
      {g.example && (
        <p className="gloss-example">
          <strong>Exemple chiffré. </strong>
          {g.example}
        </p>
      )}
      {g.caution && (
        <p className="gloss-caution">
          <strong>À savoir. </strong>
          {g.caution}
        </p>
      )}
    </section>
  )
}

/** Petit bouton « i » ouvrant une fenêtre explicative. */
export function Info({ ids, label }: { ids: string[]; label?: string }) {
  const { open } = useContext(GlossaryCtx)
  return (
    <button
      type="button"
      className="info-btn"
      aria-label={label ?? 'Explication'}
      title={label ?? 'Explication'}
      onClick={(e) => {
        e.stopPropagation()
        open(ids)
      }}
    >
      i
    </button>
  )
}
