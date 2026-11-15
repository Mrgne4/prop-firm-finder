import { useMemo } from 'react'
import type { Answers, CriterionKey } from '../engine/answers'
import { bottleneck, funnelCounts, type Counts } from '../engine/funnel'
import type { Dataset } from '../data/schema'

export const UNIT_NOTE = 'Un programme = une offre d’une entreprise (ex. un type de challenge), quel que soit le nombre de tailles de compte. Chaque programme n’est compté qu’une fois.'

/** Bandeau du questionnaire : combien de programmes restent possibles, et ce qui restreint le plus. */
export function FunnelBar({ ds, answers, now, trail, onSoften }: { ds: Dataset; answers: Answers; now: Date; trail: number[]; onSoften: (k: CriterionKey) => void }) {
  const counts: Counts = useMemo(() => funnelCounts(ds, answers, now), [ds, answers, now])
  const neck = useMemo(() => (answers.markets.length > 0 && counts.a <= 5 ? bottleneck(ds, answers, now, counts) : null), [ds, answers, now, counts])
  const path = trail.filter((n, i) => i === 0 || n !== trail[i - 1])
  return (
    <div className="funnel" role="status" aria-live="polite" data-testid="funnel">
      <p className="funnel-main">
        <strong data-testid="funnel-count">{counts.a}</strong> programme{counts.a > 1 ? 's' : ''} possible{counts.a > 1 ? 's' : ''}
        {counts.a > 0 && <span className="muted"> · {counts.firmsA} entreprise{counts.firmsA > 1 ? 's' : ''}</span>}
        {counts.b > 0 && <span className="muted"> · + {counts.b} alternative{counts.b > 1 ? 's' : ''} proche{counts.b > 1 ? 's' : ''}</span>}
        {counts.u > 0 && <span className="muted"> · + {counts.u} à confirmer (prix observé au-dessus de ton budget)</span>}
      </p>
      {path.length > 1 && <p className="funnel-trail" aria-label="Évolution">{path.join(' → ')}</p>}
      {counts.a > 0 && counts.aToVerify > 0 && <p className="funnel-sub">dont {counts.aToVerify} avec au moins un point à vérifier (rien n’est écarté sur une information inconnue)</p>}
      {counts.a === 0 && answers.markets.length > 0 && (
        <p className="funnel-warn" role="note">
          Aucun programme ne correspond à tout ce que tu as indiqué. Tu peux continuer : à la fin, on te montrera les alternatives les plus proches.
        </p>
      )}
      {neck && (
        <p className="funnel-neck">
          « {neck.label} » est ce qui restreint le plus tes choix : sans lui, {neck.gain} programme{neck.gain > 1 ? 's' : ''} de plus {neck.gain > 1 ? 'seraient' : 'serait'} possible{neck.gain > 1 ? 's' : ''}.{' '}
          <button type="button" className="linklike" onClick={() => onSoften(neck.key)}>
            Le rendre seulement souhaitable
          </button>
        </p>
      )}
      <details className="funnel-unit">
        <summary>Comment on compte ?</summary>
        <p>{UNIT_NOTE}</p>
      </details>
    </div>
  )
}

/** Cadenas discret : une préférence peut être déclarée indispensable. */
export function LockSwitch({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: string }) {
  return (
    <label className="lock-switch">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span aria-hidden="true">🔒</span> {children}
    </label>
  )
}
