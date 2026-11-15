import type { ReactNode } from 'react'
import { Info } from './Glossary'

type Props = {
  selected: boolean
  onClick: () => void
  label: string
  help?: string | null
  /** Glossaire : ouvre une fenêtre explicative. */
  gloss?: string | null
  multi?: boolean
  children?: ReactNode
}

/** Grand bouton de choix (radio ou case à cocher), adapté au tactile. */
export function Option({ selected, onClick, label, help, gloss, multi, children }: Props) {
  return (
    <div className={`opt${selected ? ' selected' : ''}`}>
      <button type="button" className="opt-main" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} onClick={onClick}>
        <span className={`opt-mark ${multi ? 'square' : 'round'}`} aria-hidden="true">
          {selected ? '✓' : ''}
        </span>
        <span className="opt-text">
          <span className="opt-label">{label}</span>
          {help && <span className="opt-help">{help}</span>}
        </span>
      </button>
      {gloss && <Info ids={[gloss]} label={`Explication : ${label}`} />}
      {children}
    </div>
  )
}
