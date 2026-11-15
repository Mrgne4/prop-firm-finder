import type { CriterionResult, Evaluation } from '../engine/evaluate'

const short = (c: CriterionResult) => c.label

/** « Pourquoi ici ? » : explique la catégorie en mots simples (critères respectés / non respectés / à vérifier / ajustement). */
export function Why({ evaluation }: { evaluation: Evaluation }) {
  const { category, met, missed, unconfirmed, adjustments, uncertainBudget } = evaluation
  const requiredMissed = missed.filter((c) => c.weight === 'required')
  const preferredMissed = missed.filter((c) => c.weight === 'preferred')
  const toCheck = unconfirmed.filter((c) => c.weight !== 'info' || c.key === 'essential_info' || c.key === 'freshness')
  return (
    <div className={`why why-${category}`} aria-label="Pourquoi ce programme est ici">
      <p className="why-title">
        {category === 'A' && <strong>Pourquoi ici : aucun de tes critères n’est confirmé en échec.</strong>}
        {category === 'B' && (
          <strong>
            Pourquoi ici : {adjustments.length} ajustement{adjustments.length > 1 ? 's' : ''} nécessaire{adjustments.length > 1 ? 's' : ''}, aucune contrainte indispensable en échec.
          </strong>
        )}
        {category === 'C' && <strong>Pourquoi écarté : {requiredMissed.map(short).join(' · ') || 'critère indispensable en échec'}.</strong>}
      </p>
      {uncertainBudget && (
        <p className="why-warn" role="note">
          ⚠ Budget indispensable : le prix observé semble au-dessus de ton plafond. Ce n’est pas un prix confirmé : vérifie-le sur le site officiel avant de retenir ce programme.
        </p>
      )}
      <ul className="why-list">
        {met.length > 0 && (
          <li className="why-ok">
            <span aria-hidden="true">✓</span> <strong>Respecté :</strong> {met.map(short).join(', ')}
          </li>
        )}
        {(category === 'B' ? preferredMissed : missed).length > 0 && (
          <li className="why-bad">
            <span aria-hidden="true">✕</span> <strong>Non respecté (confirmé) :</strong> {(category === 'B' ? preferredMissed : missed).map(short).join(', ')}
          </li>
        )}
        {toCheck.length > 0 && category !== 'C' && (
          <li className="why-unk">
            <span aria-hidden="true">?</span> <strong>À vérifier :</strong> {toCheck.map(short).join(', ')}
          </li>
        )}
        {category === 'B' && adjustments.map((x) => (
          <li key={x.key} className="why-adj">
            <span aria-hidden="true">→</span> <strong>Ajustement :</strong> {x.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
